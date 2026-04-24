package com.mylifeos.app.plugins;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;

public class RiseAlarmReceiver extends BroadcastReceiver {

    private static final String CHANNEL_ID = "rise_alarm_channel";

    @Override
    public void onReceive(Context context, Intent intent) {
        int id = intent.getIntExtra("ALARM_ID", 0);
        String title = intent.getStringExtra("ALARM_TITLE");
        String body = intent.getStringExtra("ALARM_BODY");

        if (title == null) title = "Rise Alarm";
        if (body == null) body = "Time to wake up and conquer!";

        // ==========================================
        // ১. স্ক্রিন অন করার লজিক (WakeLock)
        // ==========================================
        PowerManager powerManager = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
                PowerManager.FULL_WAKE_LOCK |
                PowerManager.ACQUIRE_CAUSES_WAKEUP |
                PowerManager.ON_AFTER_RELEASE,
                "LifeOS:RiseAlarmWakeLock"
        );
        
        // ১০ মিনিটের জন্য ওয়েক-লক অ্যাক্টিভ রাখা, যাতে অ্যালার্ম বাজার সময় স্ক্রিন অফ না হয়ে যায়
        wakeLock.acquire(10 * 60 * 1000L);

        // ==========================================
        // ২. নোটিফিকেশন চ্যানেল তৈরি (Android 8+ এর জন্য বাধ্যতামূলক)
        // ==========================================
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Rise Alarms",
                    NotificationManager.IMPORTANCE_HIGH // হাই প্রায়োরিটি না দিলে সাউন্ড হবে না
            );
            channel.setDescription("Channel for Rise alarm notifications");
            notificationManager.createNotificationChannel(channel);
        }

        // ==========================================
        // ৩. অ্যাপ ওপেন করার ইন্টেন্ট (ক্লিক করলে যা হবে)
        // ==========================================
        Intent appIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (appIntent != null) {
            appIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        }

        // Android 12+ Crash Fix
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(context, id, appIntent, flags);

        // ==========================================
        // ৪. ফুল-স্ক্রিন নোটিফিকেশন বিল্ড ও ফায়ার করা
        // ==========================================
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(context.getApplicationInfo().icon) // অ্যাপের ডিফল্ট আইকন
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setFullScreenIntent(pendingIntent, true) // ফোন লক থাকলেও স্ক্রিনে ভেসে উঠবে
                .setContentIntent(pendingIntent);

        notificationManager.notify(id, builder.build());

        // কাজ শেষ, ওয়েক-লক রিলিজ করে দেওয়া
        if (wakeLock.isHeld()) {
            wakeLock.release();
        }
    }
}
