package com.mylifeos.app.plugins;

import android.app.KeyguardManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import androidx.core.app.NotificationCompat;
import com.mylifeos.app.MainActivity;
import com.mylifeos.app.R;

public class RiseAlarmReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "rise_alarm_native_v2";
    private static final int NOTIF_ID = 73422;
    private static MediaPlayer activeMediaPlayer;
    private static Vibrator activeVibrator;

    @Override
    public void onReceive(Context context, Intent intent) {
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wl = pm.newWakeLock(
            PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
            "mylifeos:rise_alarm"
        );
        wl.acquire(10*60*1000L);

        ensureChannel(context);

        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        if (title == null) title = "Rise Alarm";
        if (body == null) body = "Time to wake up!";

        Intent fullScreen = new Intent(context, MainActivity.class);
        fullScreen.putExtra("rise_alarm_trigger", true);
        fullScreen.putExtra("title", title);
        fullScreen.putExtra("body", body);
        fullScreen.putExtra("missionType", intent.getStringExtra("missionType"));
        fullScreen.putExtra("dbId", intent.getStringExtra("dbId"));
        fullScreen.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_CLEAR_TOP |
            Intent.FLAG_ACTIVITY_SINGLE_TOP
        );

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent fullScreenPi = PendingIntent.getActivity(context, 1042, fullScreen, piFlags);

        Uri alarmUri = Uri.parse("android.resource://" + context.getPackageName() + "/" + R.raw.tonton);

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
           .setVibrate(new long[]{0, 1000, 500, 1000, 500, 1000}) // FIX: নোটিফিকেশনেও ভাইব্রেট
           .setFullScreenIntent(fullScreenPi, true)
           .setContentIntent(fullScreenPi);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm!= null) {
            nm.notify(NOTIF_ID, builder.build());
        }

        // FIX 1: সাউন্ড বাজাও
        try {
            stopAlarmSoundSafely();
            MediaPlayer player = MediaPlayer.create(context, R.raw.tonton);
            if (player != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    player.setAudioAttributes(new AudioAttributes.Builder()
                       .setUsage(AudioAttributes.USAGE_ALARM)
                       .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                       .build());
                } else {
                    player.setAudioStreamType(AudioManager.STREAM_ALARM);
                }
                player.setLooping(true);
                player.setVolume(1.0f, 1.0f);
                player.start();
                activeMediaPlayer = player;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // FIX 2: ভাইব্রেট - Android 12+ এর জন্য আপডেটেড কোড
        try {
            stopVibrationSafely();
            Vibrator v;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vm = (VibratorManager) context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                v = vm.getDefaultVibrator();
            } else {
                v = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            }
            
            if (v != null && v.hasVibrator()) {
                activeVibrator = v;
                long[] pattern = {0, 1000, 500, 1000, 500, 1000, 500, 1000};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    v.vibrate(pattern, 0);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        try {
            context.startActivity(fullScreen);
        } catch (Exception ignored) {}

        wl.release();
    }

    private void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;
        
        nm.deleteNotificationChannel(CHANNEL_ID);

        Uri alarmUri = Uri.parse("android.resource://" + ctx.getPackageName() + "/" + R.raw.tonton);

        AudioAttributes attrs = new AudioAttributes.Builder()
           .setUsage(AudioAttributes.USAGE_ALARM)
           .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
           .build();

        NotificationChannel ch = new NotificationChannel(
            CHANNEL_ID,
            "Rise Alarms",
            NotificationManager.IMPORTANCE_HIGH
        );
        ch.setDescription("Wake-up alarms that ring on the lockscreen");
        ch.enableVibration(true); // FIX: চ্যানেলে ভাইব্রেট অন
        ch.setVibrationPattern(new long[]{0, 1000, 500, 1000, 500, 1000});
        ch.enableLights(true);
        ch.setBypassDnd(true);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        ch.setSound(alarmUri, attrs);
        nm.createNotificationChannel(ch);
    }

    public static void stopAlarmSoundSafely() {
        try {
            if (activeMediaPlayer!= null) {
                if (activeMediaPlayer.isPlaying()) {
                    activeMediaPlayer.stop();
                }
                activeMediaPlayer.release();
            }
        } catch (Exception ignored) {}
        activeMediaPlayer = null;
    }

    public static void stopVibrationSafely() {
        try {
            if (activeVibrator != null) {
                activeVibrator.cancel();
            }
        } catch (Exception ignored) {}
        activeVibrator = null;
    }
}