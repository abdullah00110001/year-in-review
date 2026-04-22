package com.mylifeos.app;

import android.Manifest;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class MainActivity extends BridgeActivity {

    private ActivityResultLauncher<String[]> runtimePermissionLauncher;
    private int currentSpecialPermissionIndex = 0;

    // 1. নরমাল Runtime পারমিশন যেগুলা ডায়ালগে আসবে
    private final String[] RUNTIME_PERMISSIONS = {
            Manifest.permission.CAMERA,
            Manifest.permission.READ_EXTERNAL_STORAGE
    };

    // 2. Special পারমিশন যেগুলা Settings এ নিয়ে যাওয়া লাগবে
    private enum SpecialPermission {
        POST_NOTIFICATIONS,
        OVERLAY,
        USAGE_STATS,
        BATTERY_OPTIMIZATION,
        EXACT_ALARM,
        INSTALL_PACKAGES
    }
    private final SpecialPermission[] SPECIAL_PERMISSIONS = SpecialPermission.values();

    private boolean permissionFlowStarted = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Runtime permission result handler
        runtimePermissionLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestMultiplePermissions(),
            result -> {
                // After runtime permissions, run special-permission flow ONCE.
                checkAndRequestSpecialPermissions();
            }
        );
    }

    @Override
    public void onResume() {
        super.onResume();
        // Run the permission flow only once per process to avoid recursive
        // dialog loops on every resume (which previously froze the app).
        if (!permissionFlowStarted) {
            permissionFlowStarted = true;
            try {
                checkAndRequestRuntimePermissions();
            } catch (Throwable t) {
                android.util.Log.e("MainActivity", "Permission flow failed safely", t);
            }
        }
    }

    private void checkAndRequestRuntimePermissions() {
        List<String> permissionsToRequest = new ArrayList<>();

        // Android 13+ : POST_NOTIFICATIONS is a runtime permission
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS);
            }
        }

        for (String permission : RUNTIME_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission);
            }
        }

        if (!permissionsToRequest.isEmpty()) {
            runtimePermissionLauncher.launch(permissionsToRequest.toArray(new String[0]));
        } else {
            checkAndRequestSpecialPermissions();
        }
    }

    private void checkAndRequestSpecialPermissions() {
        if (currentSpecialPermissionIndex >= SPECIAL_PERMISSIONS.length) {
            currentSpecialPermissionIndex = 0; // সব শেষ, রিসেট করে দাও
            return;
        }

        SpecialPermission permission = SPECIAL_PERMISSIONS[currentSpecialPermissionIndex];
        boolean needRequest = false;
        String title = "";
        String message = "";
        Runnable requestAction = null;

        switch (permission) {
            case OVERLAY:
                if (!Settings.canDrawOverlays(this)) {
                    needRequest = true;
                    title = "Display over other apps";
                    message = "Shield ফিচারের জন্য অন্য অ্যাপের উপর দেখানোর পারমিশন দিন।";
                    requestAction = () -> {
                        Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName()));
                        startActivity(intent);
                    };
                }
                break;
            case USAGE_STATS:
                if (!hasUsageStatsPermission()) {
                    needRequest = true;
                    title = "Usage Access";
                    message = "Shield এর জন্য অ্যাপ ইউসেজ দেখার পারমিশন দিন।";
                    requestAction = () -> startActivity(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS));
                }
                break;
            case BATTERY_OPTIMIZATION:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    if (!((android.os.PowerManager) getSystemService(POWER_SERVICE)).isIgnoringBatteryOptimizations(getPackageName())) {
                        needRequest = true;
                        title = "Battery Optimization";
                        message = "ব্যাকগ্রাউন্ডে অ্যালার্ম ঠিকমতো কাজ করার জন্য ব্যাটারি অপটিমাইজেশন বন্ধ করুন।";
                        requestAction = () -> {
                            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getPackageName()));
                            startActivity(intent);
                        };
                    }
                }
                break;
            case EXACT_ALARM:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (!((android.app.AlarmManager) getSystemService(ALARM_SERVICE)).canScheduleExactAlarms()) {
                        needRequest = true;
                        title = "Alarms & Reminders";
                        message = "সঠিক সময়ে অ্যালার্ম বাজানোর জন্য পারমিশন দিন।";
                        requestAction = () -> startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM));
                    }
                }
                break;
            case INSTALL_PACKAGES:
                 if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    if (!getPackageManager().canRequestPackageInstalls()) {
                        needRequest = true;
                        title = "Install Unknown Apps";
                        message = "OTA আপডেটের জন্য অ্যাপ ইনস্টল করার পারমিশন দিন।";
                        requestAction = () -> {
                            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getPackageName()));
                            startActivity(intent);
                        };
                    }
                }
                break;
        }

        if (needRequest) {
            final Runnable finalRequestAction = requestAction;
            new AlertDialog.Builder(this)
                   .setTitle(title)
                   .setMessage(message)
                   .setPositiveButton("Settings এ যান", (dialog, which) -> finalRequestAction.run())
                   .setNegativeButton("পরে", (dialog, which) -> {
                        currentSpecialPermissionIndex++;
                        checkAndRequestSpecialPermissions(); // পরেরটা চেক করো
                    })
                   .setOnCancelListener(dialog -> {
                        currentSpecialPermissionIndex++;
                        checkAndRequestSpecialPermissions();
                    })
                   .show();
        } else {
            // এটা লাগবে না, পরেরটা চেক করো
            currentSpecialPermissionIndex++;
            checkAndRequestSpecialPermissions();
        }
    }

    private boolean hasUsageStatsPermission() {
        try {
            android.app.usage.UsageStatsManager usageStatsManager = (android.app.usage.UsageStatsManager) getSystemService(USAGE_STATS_SERVICE);
            long time = System.currentTimeMillis();
            List<android.app.usage.UsageStats> stats = usageStatsManager.queryUsageStats(android.app.usage.UsageStatsManager.INTERVAL_DAILY, time - 1000 * 60, time);
            return stats!= null &&!stats.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }
}