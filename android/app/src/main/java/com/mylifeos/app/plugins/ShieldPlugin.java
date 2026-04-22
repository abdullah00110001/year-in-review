package com.mylifeos.app.plugins;

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
}