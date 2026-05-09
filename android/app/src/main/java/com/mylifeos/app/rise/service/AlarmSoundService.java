package com.mylifeos.app.rise.service;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.mylifeos.app.MainActivity;
import com.mylifeos.app.rise.core.AlarmConstants;
import com.mylifeos.app.rise.recovery.AlarmRecoveryReceiver;
import com.mylifeos.app.rise.state.AlarmStateManager;

/**
 * AlarmSoundService — Alarmy-level foreground sound service।
 *
 * Architecture:
 * ──────────────────────────────────────────────────────────────
 * ✅ START_STICKY       → system kill করলে restart
 * ✅ WakeLock           → screen + CPU জাগিয়ে রাখে
 * ✅ Audio focus        → DND bypass, অন্য app mute
 * ✅ Volume force max   → alarm stream max করে
 * ✅ MediaPlayer recovery → error হলে 2s এ restart
 * ✅ Vibration          → hardware vibrator (continuous)
 * ✅ Auto-stop          → 30 min পরে battery protect
 * ✅ null intent recovery → system restart এ state থেকে recover
 * ✅ stopWithTask=false  → app swipe এ মরে না
 * ──────────────────────────────────────────────────────────────
 */
public class AlarmSoundService extends Service {

    private static final String TAG = "AlarmSoundService";

    // Public flag — RecoveryReceiver check করে
    public static volatile boolean isRunning = false;

    private MediaPlayer     mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private AudioManager    audioManager;
    private Vibrator        vibrator;
    private Handler         recoveryHandler;
    private Runnable        recoveryRunnable;
    private Handler         autoStopHandler;

    // API 26+ audio focus
    private AudioFocusRequest audioFocusRequest;

    // Current alarm info (recovery এর জন্য)
    private int    currentAlarmId;
    private String currentUuid;
    private String currentTitle;
    private String currentBody;

    // ──────────────────────────────────────────
    @Override
    public void onCreate() {
        super.onCreate();
        audioManager    = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        vibrator        = (Vibrator)     getSystemService(Context.VIBRATOR_SERVICE);
        recoveryHandler = new Handler(Looper.getMainLooper());
        autoStopHandler = new Handler(Looper.getMainLooper());
        Log.d(TAG, "Service created");
    }

    // ──────────────────────────────────────────
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {

        // null intent = system restarted service after kill
        if (intent == null) {
            Log.w(TAG, "Null intent — recovering from state");
            recoverFromState();
            return START_STICKY;
        }

        currentAlarmId = intent.getIntExtra(AlarmConstants.EXTRA_ALARM_ID, 0);
        currentUuid    = intent.getStringExtra(AlarmConstants.EXTRA_ALARM_UUID);
        currentTitle   = intent.getStringExtra(AlarmConstants.EXTRA_ALARM_TITLE);
        currentBody    = intent.getStringExtra(AlarmConstants.EXTRA_ALARM_BODY);

        if (currentUuid  == null) currentUuid  = String.valueOf(currentAlarmId);
        if (currentTitle == null) currentTitle = "Rise Alarm";
        if (currentBody  == null) currentBody  = "Time to wake up!";

        Log.d(TAG, "Starting: id=" + currentAlarmId + " uuid=" + currentUuid);

        // Foreground দিয়ে start করো (required)
        startForeground(AlarmConstants.NOTIF_ID_SOUND_SERVICE,
                        buildNotification(currentTitle, currentBody, currentUuid, currentAlarmId));

        // সব setup
        acquireWakeLock();
        requestAudioFocus();
        forceMaxVolume();
        startSound();
        startVibration();
        scheduleAutoStop();

        // Recovery watchdog schedule
        AlarmRecoveryReceiver.schedule(this);

        isRunning = true;
        Log.d(TAG, "✅ Service fully started");
        return START_STICKY;
    }

    // ──────────────────────────────────────────
    // NULL INTENT RECOVERY
    // ──────────────────────────────────────────
    private void recoverFromState() {
        // Alarm আর active না থাকলে বন্ধ হও
        if (!AlarmStateManager.isRinging(this)) {
            Log.d(TAG, "No active alarm in state — stopping");
            stopSelf();
            return;
        }

        // 30 min check
        if (AlarmStateManager.shouldAutoStop(this)) {
            Log.w(TAG, "Auto-stop on recovery");
            AlarmStateManager.clearRinging(this);
            stopSelf();
            return;
        }

        currentAlarmId = AlarmStateManager.getActiveId(this);
        currentUuid    = AlarmStateManager.getActiveUuid(this);
        currentTitle   = AlarmStateManager.getAlarmTitle(this);
        currentBody    = AlarmStateManager.getAlarmBody(this);

        Log.d(TAG, "Recovered: id=" + currentAlarmId + " uuid=" + currentUuid);

        startForeground(AlarmConstants.NOTIF_ID_SOUND_SERVICE,
                        buildNotification(currentTitle, currentBody, currentUuid, currentAlarmId));
        acquireWakeLock();
        requestAudioFocus();
        forceMaxVolume();
        startSound();
        startVibration();
        scheduleAutoStop();

        isRunning = true;
    }

    // ──────────────────────────────────────────
    // 🔊 AUDIO FOCUS — DND bypass
    // ──────────────────────────────────────────
    private void requestAudioFocus() {
        if (audioManager == null) return;
        try {
            AudioManager.OnAudioFocusChangeListener focusListener = focusChange -> {
                // অন্য app audio নিতে চাইলেও ছাড়বো না
                if (focusChange == AudioManager.AUDIOFOCUS_LOSS ||
                    focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                    Log.w(TAG, "Audio focus lost — re-acquiring in 1s");
                    recoveryHandler.postDelayed(this::requestAudioFocus, 1000);
                }
            };

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();

                audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(attrs)
                    .setAcceptsDelayedFocusGain(false)
                    .setWillPauseWhenDucked(false)  // volume কমতে দেবো না
                    .setOnAudioFocusChangeListener(focusListener)
                    .build();

                audioManager.requestAudioFocus(audioFocusRequest);
            } else {
                //noinspection deprecation
                audioManager.requestAudioFocus(focusListener,
                    AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN);
            }

            Log.d(TAG, "Audio focus acquired");
        } catch (Exception e) {
            Log.e(TAG, "requestAudioFocus failed", e);
        }
    }

    // ──────────────────────────────────────────
    // 🔊 FORCE MAX VOLUME — Alarmy style
    // ──────────────────────────────────────────
    private void forceMaxVolume() {
        if (audioManager == null) return;
        try {
            // Alarm stream max
            int maxAlarm = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM);
            audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxAlarm, 0);

            // Ring stream max (silent mode bypass attempt)
            int maxRing = audioManager.getStreamMaxVolume(AudioManager.STREAM_RING);
            audioManager.setStreamVolume(AudioManager.STREAM_RING, maxRing, 0);

            // Ringer mode NORMAL (DND bypass — might be blocked by policy)
            try {
                audioManager.setRingerMode(AudioManager.RINGER_MODE_NORMAL);
            } catch (SecurityException e) {
                Log.w(TAG, "Cannot change ringer mode (DND policy) — alarm stream still max");
            }

            Log.d(TAG, "Volume forced to max");
        } catch (Exception e) {
            Log.e(TAG, "forceMaxVolume failed", e);
        }
    }

    // ──────────────────────────────────────────
    // 🎵 SOUND — with error recovery
    // ──────────────────────────────────────────
    private void startSound() {
        try {
            releaseMediaPlayer();

            // Alarm sound URI
            Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (sound == null) sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            if (sound == null) sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

            mediaPlayer = new MediaPlayer();

            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED) // DND bypass flag
                .build()
            );

            mediaPlayer.setDataSource(this, sound);
            mediaPlayer.setLooping(true);      // infinite loop
            mediaPlayer.setVolume(1.0f, 1.0f); // max volume

            mediaPlayer.setOnPreparedListener(mp -> {
                mp.start();
                Log.d(TAG, "🔊 Sound playing");
            });

            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.e(TAG, "MediaPlayer error what=" + what + " extra=" + extra);
                scheduleMediaPlayerRecovery();
                return true;
            });

            // looping=true তে সাধারণত আসে না, কিন্তু safety
            mediaPlayer.setOnCompletionListener(mp -> {
                Log.w(TAG, "MediaPlayer completed unexpectedly — restarting");
                scheduleMediaPlayerRecovery();
            });

            mediaPlayer.prepareAsync(); // non-blocking

        } catch (Exception e) {
            Log.e(TAG, "startSound failed", e);
            scheduleMediaPlayerRecovery();
        }
    }

    private void scheduleMediaPlayerRecovery() {
        if (recoveryRunnable != null) recoveryHandler.removeCallbacks(recoveryRunnable);
        recoveryRunnable = () -> {
            if (isRunning && AlarmStateManager.isRinging(this)) {
                Log.d(TAG, "🔄 Recovering MediaPlayer");
                forceMaxVolume();
                startSound();
            }
        };
        recoveryHandler.postDelayed(recoveryRunnable, AlarmConstants.MEDIA_RECOVERY_DELAY_MS);
    }

    private void releaseMediaPlayer() {
        try {
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
                mediaPlayer.reset();
                mediaPlayer.release();
                mediaPlayer = null;
            }
        } catch (Exception e) {
            Log.e(TAG, "releaseMediaPlayer error", e);
        }
    }

    // ──────────────────────────────────────────
    // 📳 VIBRATION — continuous pattern
    // ──────────────────────────────────────────
    private void startVibration() {
        if (vibrator == null || !vibrator.hasVibrator()) return;
        try {
            // 600ms on, 400ms off — repeat
            long[] pattern = {0, 600, 400, 600, 600};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
            } else {
                //noinspection deprecation
                vibrator.vibrate(pattern, 0);
            }
            Log.d(TAG, "Vibration started");
        } catch (Exception e) {
            Log.e(TAG, "startVibration failed", e);
        }
    }

    // ──────────────────────────────────────────
    // 💡 WAKE LOCK
    // ──────────────────────────────────────────
    private void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm == null) return;

            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();

            wakeLock = pm.newWakeLock(
                PowerManager.FULL_WAKE_LOCK       |
                PowerManager.ACQUIRE_CAUSES_WAKEUP |
                PowerManager.ON_AFTER_RELEASE,
                AlarmConstants.WAKELOCK_SERVICE
            );
            wakeLock.acquire(AlarmConstants.MAX_ALARM_DURATION_MS);
            Log.d(TAG, "WakeLock acquired (30 min)");
        } catch (Exception e) {
            Log.e(TAG, "acquireWakeLock failed", e);
        }
    }

    // ──────────────────────────────────────────
    // ⏰ AUTO-STOP after 30 min
    // ──────────────────────────────────────────
    private void scheduleAutoStop() {
        autoStopHandler.postDelayed(() -> {
            Log.w(TAG, "⏰ Auto-stop triggered after 30 minutes");
            AlarmStateManager.clearRinging(this);
            AlarmRecoveryReceiver.cancel(this);
            stopSelf();
        }, AlarmConstants.MAX_ALARM_DURATION_MS);
    }

    // ──────────────────────────────────────────
    // 📢 FOREGROUND NOTIFICATION
    // ──────────────────────────────────────────
    private Notification buildNotification(String title, String body,
                                            String uuid, int alarmId) {
        createSoundChannel();

        Intent tapIntent = new Intent(this, MainActivity.class);
        tapIntent.setAction(Intent.ACTION_VIEW);
        tapIntent.setData(android.net.Uri.parse(AlarmConstants.DEEP_LINK_BASE + uuid));
        tapIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK |
                           Intent.FLAG_ACTIVITY_SINGLE_TOP |
                           Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT |
                      (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ?
                       PendingIntent.FLAG_IMMUTABLE : 0);

        PendingIntent tapPi = PendingIntent.getActivity(this, alarmId, tapIntent, piFlags);

        return new NotificationCompat.Builder(this, AlarmConstants.CHANNEL_ALARM_SOUND)
            .setSmallIcon(getApplicationInfo().icon)
            .setContentTitle("⏰ " + title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)          // swipe dismiss করা যাবে না
            .setAutoCancel(false)
            .setFullScreenIntent(tapPi, true) // lockscreen ভেদ করে
            .setContentIntent(tapPi)
            .build();
    }

    private void createSoundChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        NotificationChannel ch = new NotificationChannel(
            AlarmConstants.CHANNEL_ALARM_SOUND,
            "Rise Alarm Sound",
            NotificationManager.IMPORTANCE_HIGH
        );
        ch.setBypassDnd(true);
        ch.setSound(null, null);        // MediaPlayer নিজেই বাজাচ্ছে
        ch.enableVibration(false);      // Service নিজেই vibrate করছে
        ch.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(ch);
    }

    // ──────────────────────────────────────────
    // 🛑 STATIC STOP (plugin/receiver থেকে call)
    // ──────────────────────────────────────────
    public static void stop(Context context) {
        context.stopService(new Intent(context, AlarmSoundService.class));
        Log.d(TAG, "Static stop called");
    }

    // ──────────────────────────────────────────
    // 🧹 CLEANUP
    // ──────────────────────────────────────────
    @Override
    public void onDestroy() {
        super.onDestroy();
        isRunning = false;
        Log.d(TAG, "onDestroy — cleaning up");

        // Handlers
        if (recoveryRunnable != null) recoveryHandler.removeCallbacks(recoveryRunnable);
        autoStopHandler.removeCallbacksAndMessages(null);

        // MediaPlayer
        releaseMediaPlayer();

        // Vibrator
        try { if (vibrator != null) vibrator.cancel(); } catch (Exception ignored) {}

        // WakeLock
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
                wakeLock = null;
            }
        } catch (Exception ignored) {}

        // Audio focus
        try {
            if (audioManager != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
                    audioManager.abandonAudioFocusRequest(audioFocusRequest);
                }
            }
        } catch (Exception ignored) {}
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
