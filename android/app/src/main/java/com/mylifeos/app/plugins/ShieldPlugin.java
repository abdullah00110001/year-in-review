package com.mylifeos.app.plugins;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.provider.Settings;
import android.os.Build;
import android.net.Uri;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.mylifeos.app.shield.ShieldPreferences;
import com.mylifeos.app.shield.ShieldPermissionHelper;
import com.mylifeos.app.shield.core.ShieldModeManager;

import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@CapacitorPlugin(name = "Shield")
public class ShieldPlugin extends Plugin {

    private ShieldPreferences preferences;
    private ShieldModeManager modeManager;
    private ShieldPermissionHelper permissionHelper;

    @Override
    public void load() {
        preferences = new ShieldPreferences(getContext());
        modeManager = new ShieldModeManager(getContext());
        permissionHelper = new ShieldPermissionHelper(getContext());
    }

    // ==========================================
    // 🛡️ মাস্টার কন্ট্রোল (Enable / Disable)
    // ==========================================

    @PluginMethod
    public void isEnabled(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("enabled", preferences.isEnabled());
        call.resolve(ret);
    }

    @PluginMethod
    public void enable(PluginCall call) {
        preferences.setEnabled(true);
        call.resolve();
    }

    @PluginMethod
    public void disable(PluginCall call) {
        if (modeManager.isStrictMode()) {
            call.reject("Cannot disable during Strict Mode!");
            return;
        }
        preferences.setEnabled(false);
        call.resolve();
    }

    // ==========================================
    // 📱 অ্যাপ ব্লকিং (Block / Unblock)
    // ==========================================

    @PluginMethod
    public void getBlockedApps(PluginCall call) {
        JSObject ret = new JSObject();
        JSArray appsArray = new JSArray();
        for (String app : preferences.getBlockedApps()) {
            appsArray.put(app);
        }
        ret.put("apps", appsArray);
        call.resolve(ret);
    }

    @PluginMethod
    public void blockApps(PluginCall call) {
        try {
            JSArray appsArray = call.getArray("apps");
            Set<String> apps = new HashSet<>();
            for (int i = 0; i < appsArray.length(); i++) {
                apps.add(appsArray.getString(i));
            }
            preferences.setBlockedApps(apps);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to update block list", e);
        }
    }

    // ==========================================
    // 🧠 শিল্ড মোডস (Focus / Sleep / Strict)
    // ==========================================

    @PluginMethod
    public void getCurrentMode(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("mode", modeManager.getCurrentMode());
        ret.put("strict", modeManager.isStrictMode());
        call.resolve(ret);
    }

    @PluginMethod
    public void activateFocusMode(PluginCall call) {
        modeManager.activateFocusMode();
        call.resolve();
    }

    @PluginMethod
    public void activateSleepMode(PluginCall call) {
        modeManager.activateSleepMode();
        call.resolve();
    }

    @PluginMethod
    public void activateStrictMode(PluginCall call) {
        modeManager.activateStrictMode();
        call.resolve();
    }

    @PluginMethod
    public void deactivateMode(PluginCall call) {
        if (modeManager.isStrictMode()) {
            call.reject("Strict mode is active!");
            return;
        }
        modeManager.deactivateMode();
        call.resolve();
    }

    // ==========================================
    // 📊 স্ট্যাটাস ও পারমিশন (Stats & Permissions)
    // ==========================================

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("accessibility", permissionHelper.hasAccessibilityPermission());
        ret.put("usageStats", permissionHelper.hasUsageStatsPermission());
        ret.put("overlay", permissionHelper.hasOverlayPermission());
        ret.put("battery", true); 
        call.resolve(ret);
    }

    @PluginMethod
    public void requestAccessibility(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void requestUsageStats(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void requestOverlay(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void requestBattery(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }
    
    // ==========================================
    // ⏱️ স্ক্রিন টাইম স্ট্যাটাস (Full Ready Code)
    // ==========================================

    @PluginMethod
    public void getScreenTimeStats(PluginCall call) {
        try {
            UsageStatsManager usageStatsManager = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
            
            // আজকের দিনের শুরু থেকে এখন পর্যন্ত সময় সেট করা
            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            long startTime = calendar.getTimeInMillis();
            long endTime = System.currentTimeMillis();

            List<UsageStats> usageStatsList = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime);
            PackageManager pm = getContext().getPackageManager();
            
            JSArray appsArray = new JSArray();
            long totalTimeMinutes = 0;

            if (usageStatsList != null) {
                for (UsageStats stats : usageStatsList) {
                    long timeInForeground = stats.getTotalTimeInForeground();
                    if (timeInForeground > 0) {
                        long minutes = timeInForeground / (1000 * 60);
                        if (minutes > 0) {
                            totalTimeMinutes += minutes;
                            
                            JSObject appObj = new JSObject();
                            String pkgName = stats.getPackageName();
                            appObj.put("packageName", pkgName);
                            appObj.put("usageMinutes", minutes);
                            
                            // অ্যাপের আসল নাম বের করা (যেমন com.facebook.katana থেকে Facebook)
                            try {
                                ApplicationInfo appInfo = pm.getApplicationInfo(pkgName, 0);
                                appObj.put("appName", pm.getApplicationLabel(appInfo).toString());
                            } catch (Exception e) {
                                appObj.put("appName", pkgName); // নাম না পেলে প্যাকেজের নামই দেখাবে
                            }
                            
                            appsArray.put(appObj);
                        }
                    }
                }
            }

            JSObject ret = new JSObject();
            ret.put("apps", appsArray);
            ret.put("totalMinutes", totalTimeMinutes);
            call.resolve(ret);
            
        } catch (Exception e) {
            call.reject("Failed to get screen time stats", e);
        }
    }
}
