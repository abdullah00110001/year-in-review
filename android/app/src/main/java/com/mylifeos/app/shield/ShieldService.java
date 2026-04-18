package com.mylifeos.app.shield;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import androidx.core.app.NotificationCompat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public class ShieldService extends Service {
    private static final String CHANNEL_ID = "shield_service_channel";
    private static final int NOTIFICATION_ID = 1001;
    
    private ShieldPreferences preferences;
    private Handler handler;
    private Runnable checkRunnable;
    private Map<String, Integer> dailyUsage; // package -> seconds used today
    
    @Override
    public void onCreate() {
        super.onCreate();
        preferences = new ShieldPreferences(this);
        handler = new Handler(Looper.getMainLooper());
        createNotificationChannel();
        resetDailyUsageIfNeeded();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIFICATION_ID, createNotification());
        startMonitoring();
        return START_STICKY;
    }

    private void startMonitoring() {
        checkRunnable = new Runnable() {
            @Override
            public void run() {
                if (preferences.isEnabled()) {
                    checkCurrentApp();
                }
                handler.postDelayed(this, 2000);
            }
        };
        handler.post(checkRunnable);
    }

    private void checkCurrentApp() {
        String currentPackage = getCurrentForegroundApp();
        if (currentPackage == null || currentPackage.equals(getPackageName())) return;

        Set<String> blockedApps = preferences.getBlockedApps();
        Map<String, Integer> timeLimits = preferences.getTimeLimits();

        if (blockedApps.contains(currentPackage)) {
            launchBlockScreen(currentPackage, "blocked");
            return;
        }

        if (timeLimits.containsKey(currentPackage)) {
            int limitSeconds = timeLimits.get(currentPackage) * 60;
            int usedSeconds = dailyUsage.getOrDefault(currentPackage, 0);
            
            if (usedSeconds >= limitSeconds) {
                launchBlockScreen(currentPackage, "time_limit");
            } else {
                dailyUsage.put(currentPackage, usedSeconds + 2);
            }
        }
    }

    private String getCurrentForegroundApp() {
        // Note: Real implementation needs UsageStatsManager
        // For now return null. AccessibilityService will handle detection
        return null;
    }

    private void launchBlockScreen(String packageName, String reason) {
        Intent intent = new Intent(this, ShieldBlockActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("blocked_package", packageName);
        intent.putExtra("reason", reason);
        startActivity(intent);
    }

    private void resetDailyUsageIfNeeded() {
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        String lastReset = preferences.getLastResetDate();
        
        if (!today.equals(lastReset)) {
            dailyUsage.clear();
            preferences.updateLastResetDate(today);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Shield Protection",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shield is actively protecting you");
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification() {
        Intent intent = new Intent(this, getMainActivityClass());
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Shield Active")
            .setContentText("Protecting your focus")
            .setSmallIcon(android.R.drawable.ic_lock)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build();
    }

    private Class<?> getMainActivityClass() {
        try {
            return Class.forName("com.mylifeos.app.MainActivity");
        } catch (ClassNotFoundException e) {
            return null;
        }
    }

    @Override
    public void onDestroy() {
        if (handler != null && checkRunnable != null) {
            handler.removeCallbacks(checkRunnable);
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}