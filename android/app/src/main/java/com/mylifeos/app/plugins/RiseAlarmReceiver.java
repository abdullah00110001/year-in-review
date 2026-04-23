package com.mylifeos.app.plugins;

import android.app.KeyguardManager;
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

import com.mylifeos.app.MainActivity;

public class RiseAlarmReceiver extends BroadcastReceiver {

    private static MediaPlayer activeMediaPlayer;

    @Override
    public void onReceive(Context context, Intent intent) {
        // 1. Wake the device
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wl = pm.newWakeLock(
            PowerManager.FULL_WAKE_LOCK |
            PowerManager.ACQUIRE_CAUSES_WAKEUP |
            PowerManager.ON_AFTER_RELEASE,
            "mylifeos:rise_alarm"
        );
        wl.acquire(60_000L);

        // 2. Play system alarm sound on the ALARM audio stream
        try {
            stopAlarmSoundSafely();
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }
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

        // 3. Vibrate
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

        // 4. Launch MainActivity over the lockscreen with full-screen flags
        Intent i = new Intent(context, MainActivity.class);
        i.putExtra("rise_alarm_trigger", true);
        i.putExtra("title", intent.getStringExtra("title"));
        i.putExtra("body", intent.getStringExtra("body"));
        i.putExtra("missionType", intent.getStringExtra("missionType"));
        i.putExtra("dbId", intent.getStringExtra("dbId"));
        i.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK
            | Intent.FLAG_ACTIVITY_CLEAR_TOP
            | Intent.FLAG_ACTIVITY_SINGLE_TOP
            | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
        );
        context.startActivity(i);

        // 5. Try to dismiss the keyguard for older devices
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
