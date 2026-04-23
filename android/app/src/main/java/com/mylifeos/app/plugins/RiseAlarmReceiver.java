package com.mylifeos.app.plugins;

import android.app.KeyguardManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;

import androidx.core.app.NotificationCompat;

import com.mylifeos.app.MainActivity;
import com.mylifeos.app.R;

public class RiseAlarmReceiver extends BroadcastReceiver {

    private static final String CHANNEL_ID = "rise_alarm_native_v2";
    private static final int NOTIF_ID = 73422;

    private static MediaPlayer activeMediaPlayer;

    @Override
    public void onReceive(Context context, Intent intent) {
        // 1. Wake the device for ~60s so the screen turns on
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wl = pm.newWakeLock(
            PowerManager.FULL_WAKE_LOCK |
            PowerManager.ACQUIRE_CAUSES_WAKEUP |
            PowerManager.ON_AFTER_RELEASE,
            "mylifeos:rise_alarm"
        );
        wl.acquire(60_000L);

        ensureChannel(context);

        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        if (title == null) title = "Rise Alarm";
        if (body == null) body = "Time to wake up!";

        // 2. Build the full-screen-intent that Android 10+ REQUIRES
        //    in order to launch an Activity from a background broadcast.
        Intent fullScreen = new Intent(context, MainActivity.class);
        fullScreen.putExtra("rise_alarm_trigger", true);
        fullScreen.putExtra("title", title);
        fullScreen.putExtra("body", body);
        fullScreen.putExtra("missionType", intent.getStringExtra("missionType"));
        fullScreen.putExtra("dbId", intent.getStringExtra("dbId"));
        fullScreen.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK
            | Intent.FLAG_ACTIVITY_CLEAR_TOP
            | Intent.FLAG_ACTIVITY_SINGLE_TOP
        );

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent fullScreenPi = PendingIntent.getActivity(
            context, 1042, fullScreen, piFlags
        );

        Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (alarmUri == null) alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        // 3. Post a high-priority notification with full-screen intent so
        //    the lockscreen lights up and the activity launches.
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setSound(alarmUri, AudioManager.STREAM_ALARM)
            .setFullScreenIntent(fullScreenPi, true)
            .setContentIntent(fullScreenPi);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(NOTIF_ID, builder.build());
        }

        // 4. Play looping alarm sound on the ALARM stream
        try {
            stopAlarmSoundSafely();
            MediaPlayer player = new MediaPlayer();
            player.setDataSource(context, alarmUri);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                player.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            } else {
                player.setAudioStreamType(AudioManager.STREAM_ALARM);
            }
            player.setLooping(true);
            player.prepare();
            player.start();
            activeMediaPlayer = player;
        } catch (Exception ignored) { }

        // 5. Vibrate
        try {
            Vibrator v = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null) {
                long[] pattern = {0, 800, 400, 800, 400, 800, 400};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    v.vibrate(pattern, 0);
                }
            }
        } catch (Exception ignored) { }

        // 6. Best-effort direct Activity start (works on <Q, ignored on Q+)
        try {
            context.startActivity(fullScreen);
        } catch (Exception ignored) { }

        // 7. Try to dismiss the keyguard for older devices
        try {
            KeyguardManager km = (KeyguardManager) context.getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null && Build.VERSION.SDK_INT < Build.VERSION_CODES.O_MR1) {
                @SuppressWarnings("deprecation")
                KeyguardManager.KeyguardLock lock = km.newKeyguardLock("mylifeos:rise_alarm");
                lock.disableKeyguard();
            }
        } catch (Exception ignored) { }

        wl.release();
    }

    private void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel existing = nm.getNotificationChannel(CHANNEL_ID);
        if (existing != null) return;

        Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (alarmUri == null) alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        AudioAttributes attrs = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();
        NotificationChannel ch = new NotificationChannel(
            CHANNEL_ID, "Rise Alarms", NotificationManager.IMPORTANCE_HIGH
        );
        ch.setDescription("Wake-up alarms that ring on the lockscreen");
        ch.enableVibration(true);
        ch.enableLights(true);
        ch.setBypassDnd(true);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        ch.setSound(alarmUri, attrs);
        nm.createNotificationChannel(ch);
    }

    public static void stopAlarmSoundSafely() {
        try {
            if (activeMediaPlayer != null) {
                if (activeMediaPlayer.isPlaying()) {
                    activeMediaPlayer.stop();
                }
                activeMediaPlayer.release();
            }
        } catch (Exception ignored) { }
        activeMediaPlayer = null;
    }
}
