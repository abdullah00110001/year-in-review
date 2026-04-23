package com.mylifeos.app.plugins;

import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.mylifeos.app.shield.core.ShieldModeManager;
import com.mylifeos.app.shield.core.ShieldStatsManager;
import com.mylifeos.app.shield.ShieldPreferences;
import com.mylifeos.app.shield.ShieldPermissionHelper;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@CapacitorPlugin(name = "Shield")
public class ShieldPlugin extends Plugin {

    private ShieldPreferences preferences;
    private ShieldModeManager modeManager;
    private ShieldStatsManager statsManager;

    @Override
    public void load() {
        preferences = new ShieldPreferences(getContext());
        modeManager = new ShieldModeManager(getContext());
        statsManager = new ShieldStatsManager(getContext());
    }

    @PluginMethod
    public void enable(PluginCall call) {
        preferences.setEnabled(true);
        call.resolve();
    }

    @PluginMethod
    public void disable(PluginCall call) {
        preferences.setEnabled(false);
        call.resolve();
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("enabled", preferences.isEnabled());
        call.resolve(ret);
    }

    @PluginMethod
    public void blockApps(PluginCall call) {
        JSArray apps = call.getArray("apps");
        if (apps == null) {
            call.reject("apps array is required");
            return;
        }
        try {
            List<String> appList = apps.toList();
            Set<String> appSet = new HashSet<>(appList);
            preferences.setBlockedApps(appSet);
            preferences.setEnabled(true);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to block apps", e);
        }
    }

    @PluginMethod
    public void getBlockedApps(PluginCall call) {
        Set<String> blocked = preferences.getBlockedApps();
        JSObject ret = new JSObject();
        ret.put("apps", new JSArray(blocked));
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
        modeManager.deactivateMode();
        call.resolve();
    }

    @PluginMethod
    public void getCurrentMode(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("mode", modeManager.getCurrentMode());
        ret.put("strict", modeManager.isStrictMode());
        call.resolve(ret);
    }

    @PluginMethod
    public void getStats(PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null) {
            call.reject("packageName is required");
            return;
        }
        JSObject ret = new JSObject();
        ret.put("blockCount", statsManager.getBlockCount(packageName));
        ret.put("timeSaved", statsManager.getTimeSaved(packageName));
        call.resolve(ret);
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("accessibility", ShieldPermissionHelper.isAccessibilityEnabled(getContext()));
        ret.put("usageStats", ShieldPermissionHelper.hasUsageStatsPermission(getContext()));
        ret.put("overlay", ShieldPermissionHelper.canDrawOverlays(getContext()));
        ret.put("battery", ShieldPermissionHelper.isIgnoringBatteryOptimizations(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void requestAccessibility(PluginCall call) {
        ShieldPermissionHelper.requestAccessibility(getContext());
        call.resolve();
    }

    @PluginMethod
    public void requestUsageStats(PluginCall call) {
        ShieldPermissionHelper.requestUsageStats(getContext());
        call.resolve();
    }

    @PluginMethod
    public void requestOverlay(PluginCall call) {
        ShieldPermissionHelper.requestOverlay(getContext());
        call.resolve();
    }

    @PluginMethod
    public void requestBattery(PluginCall call) {
        ShieldPermissionHelper.requestIgnoreBattery(getContext());
        call.resolve();
    }

    /**
     * Returns real device usage stats for today via UsageStatsManager.
     * Requires PACKAGE_USAGE_STATS permission (granted via Settings).
     *
     * Response shape: {
     *   totalMinutes: number,
     *   totalLaunches: number,
     *   apps: [{ packageName, appName, usageMinutes, launchCount, lastUsed }, ...]
     * }
     */
    @PluginMethod
    public void getScreenTimeStats(PluginCall call) {
        Context context = getContext();
        JSObject ret = new JSObject();

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            ret.put("totalMinutes", 0);
            ret.put("totalLaunches", 0);
            ret.put("apps", new JSArray());
            ret.put("error", "API level too low");
            call.resolve(ret);
            return;
        }

        if (!ShieldPermissionHelper.hasUsageStatsPermission(context)) {
            ret.put("totalMinutes", 0);
            ret.put("totalLaunches", 0);
            ret.put("apps", new JSArray());
            ret.put("error", "PACKAGE_USAGE_STATS not granted");
            call.resolve(ret);
            return;
        }

        try {
            UsageStatsManager usm = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) {
                ret.put("totalMinutes", 0);
                ret.put("totalLaunches", 0);
                ret.put("apps", new JSArray());
                call.resolve(ret);
                return;
            }

            // Start of today (local midnight)
            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);
            long startMs = cal.getTimeInMillis();
            long endMs = System.currentTimeMillis();

            List<UsageStats> stats = usm.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY, startMs, endMs);

            PackageManager pm = context.getPackageManager();
            long totalMs = 0;
            int totalLaunches = 0;
            JSArray apps = new JSArray();

            if (stats != null) {
                // Aggregate by package (queryUsageStats can return multiple rows per pkg)
                java.util.Map<String, long[]> agg = new java.util.HashMap<>();
                for (UsageStats s : stats) {
                    if (s == null || s.getPackageName() == null) continue;
                    long t = s.getTotalTimeInForeground();
                    if (t <= 0) continue;
                    long[] existing = agg.get(s.getPackageName());
                    if (existing == null) {
                        existing = new long[]{0, s.getLastTimeUsed()};
                        agg.put(s.getPackageName(), existing);
                    }
                    existing[0] += t;
                    if (s.getLastTimeUsed() > existing[1]) existing[1] = s.getLastTimeUsed();
                }

                List<java.util.Map.Entry<String, long[]>> sorted = new ArrayList<>(agg.entrySet());
                sorted.sort((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]));

                for (java.util.Map.Entry<String, long[]> e : sorted) {
                    String pkg = e.getKey();
                    long timeMs = e.getValue()[0];
                    long lastUsed = e.getValue()[1];
                    if (timeMs < 60 * 1000) continue; // skip <1 minute
                    totalMs += timeMs;

                    String appName = pkg;
                    try {
                        ApplicationInfo ai = pm.getApplicationInfo(pkg, 0);
                        appName = pm.getApplicationLabel(ai).toString();
                    } catch (Exception ignored) {}

                    JSObject app = new JSObject();
                    app.put("packageName", pkg);
                    app.put("appName", appName);
                    app.put("usageMinutes", (int) (timeMs / 60000));
                    app.put("launchCount", 0); // not directly available without events query
                    app.put("lastUsed", lastUsed);
                    apps.put(app);
                }
            }

            ret.put("totalMinutes", (int) (totalMs / 60000));
            ret.put("totalLaunches", totalLaunches);
            ret.put("apps", apps);
            call.resolve(ret);
        } catch (Exception ex) {
            ret.put("totalMinutes", 0);
            ret.put("totalLaunches", 0);
            ret.put("apps", new JSArray());
            ret.put("error", ex.getMessage());
            call.resolve(ret);
        }
    }
}