package com.mylifeos.app.plugins;

import com.mylifeos.app.shield.ShieldFloatingService;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.VpnService;
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
import com.getcapacitor.annotation.ActivityCallback; // 🟢 ফিক্স 1: Activity রেজাল্টের জন্য

import com.mylifeos.app.shield.ShieldPreferences;
import com.mylifeos.app.shield.ShieldPermissionHelper;
import com.mylifeos.app.shield.ShieldVpnService;
import com.mylifeos.app.shield.core.ShieldModeManager;

import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.util.Log;
import com.mylifeos.app.shield.ShieldDeviceAdminReceiver;
import org.json.JSONObject;
import androidx.activity.result.ActivityResult; // 🟢 ফিক্স 1

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
        if (modeManager.isStrictMode() && !preferences.isBypassActive()) { // 🟢 ফিক্স 2: Bypass চেক
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
    // 🔑 Emergency Bypass Logic
    // ==========================================

    @PluginMethod
    public void setEmergencyPin(PluginCall call) {
        String pin = call.getString("pin");
        if (pin == null || pin.length() < 4) {
            call.reject("PIN must be at least 4 digits");
            return;
        }
        preferences.setEmergencyPin(pin);
        call.resolve();
    }

    @PluginMethod
    public void triggerEmergencyBypass(PluginCall call) {
        String inputPin = call.getString("pin");
        String savedPin = preferences.getEmergencyPin();

        if (savedPin.isEmpty()) {
            call.reject("No Emergency PIN set! Please set it in Advanced Settings first.");
            return;
        }

        if (savedPin.equals(inputPin)) {
            Log.d("ShieldPlugin", "🔓 EMERGENCY BYPASS ACTIVATED!");
            
            preferences.setStrictMode(false);
            preferences.setEnabled(false);
            preferences.setPreventUninstall(false);
            preferences.setBypassActive(true);
            preferences.setCurrentMode("normal");
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } else {
            call.reject("Incorrect Emergency PIN!");
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
        if (modeManager.isStrictMode() && !preferences.isBypassActive()) { // 🟢 ফিক্স 2
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
    // 🌐 অ্যাডাল্ট ফিল্টার (VPN Service)
    // ==========================================

    @PluginMethod
    public void toggleAdultFilter(PluginCall call) {
        boolean enable = call.getBoolean("enable", false);
        Intent vpnIntent = VpnService.prepare(getContext());
        
        if (enable) {
            if (vpnIntent != null) {
                // 🟢 ফিক্স 1: Capacitor এর ActivityCallback ইউজ করো
                startActivityForResult(call, vpnIntent, "vpnCallback");
            } else {
                Intent intent = new Intent(getContext(), ShieldVpnService.class);
                intent.setAction(ShieldVpnService.ACTION_START);
                getContext().startService(intent);
                call.resolve();
            }
        } else {
            Intent intent = new Intent(getContext(), ShieldVpnService.class);
            intent.setAction(ShieldVpnService.ACTION_STOP);
            getContext().startService(intent);
            call.resolve();
        }
    }

    // 🟢 ফিক্স 1: VPN পারমিশন রেজাল্ট হ্যান্ডেল
    @ActivityCallback
    private void vpnCallback(PluginCall call, ActivityResult result) {
        if (result.getResultCode() == android.app.Activity.RESULT_OK) {
            Intent intent = new Intent(getContext(), ShieldVpnService.class);
            intent.setAction(ShieldVpnService.ACTION_START);
            getContext().startService(intent);
            call.resolve();
        } else {
            call.reject("VPN permission denied");
        }
    }

    // ==========================================
    // 🛡️ হার্ডকোর প্রোটেকশন সেটিংস
    // ==========================================
    @PluginMethod
    public void updateHardcoreSettings(PluginCall call) {
        try {
            String key = call.getString("key");
            boolean value = call.getBoolean("value", false);

            if (key == null) {
                call.reject("Must provide a key");
                return;
            }

            switch (key) {
                case "blockSplitScreen":
                    preferences.setBlockSplitScreen(value);
                    break;
                case "blockPowerOff":
                    preferences.setBlockPowerOff(value);
                    break;
                case "blockRecentApps":
                    preferences.setBlockRecentApps(value);
                    break;
                case "preventUninstall":
                    preferences.setPreventUninstall(value);
                    break;
                default:
                    call.reject("Unknown settings key: " + key);
                    return;
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Error updating hardcore settings", e);
        }
    }

    @PluginMethod
    public void requestUninstall(PluginCall call) {
        Context context = getContext();
        
        // 🟢 ফিক্স 2: Bypass Active হলে uninstall করতে দেও
        if (preferences.isStrictMode() && !preferences.isBypassActive()) {
            call.reject("Cannot uninstall while Strict Mode is active!");
            return;
        }

        DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName adminComponent = new ComponentName(context, ShieldDeviceAdminReceiver.class);
        
        if (dpm.isAdminActive(adminComponent)) {
            dpm.removeActiveAdmin(adminComponent);
        }

        Intent intent = new Intent(Intent.ACTION_DELETE);
        intent.setData(Uri.parse("package:" + context.getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);

        call.resolve();
    }
    
    @PluginMethod
    public void getDailyHistory(PluginCall call) {
        try {
            ShieldPreferences prefs = new ShieldPreferences(getContext());
            String historyJson = prefs.getFullHistory();
            
            JSObject ret = new JSObject();
            ret.put("history", new JSONObject(historyJson));
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to fetch history", e);
        }
    }

    @PluginMethod
    public void updateNotificationSettings(PluginCall call) {
        String key = call.getString("key");
        
        // 🟢 ফিক্স 4: null চেক
        if (key == null) {
            call.reject("Key cannot be null");
            return;
        }
        
        boolean value = call.getBoolean("value", false);
        
        if ("vibrate".equals(key)) preferences.setVibrationEnabled(value);
        else if ("sound".equals(key)) preferences.setSoundEnabled(value);
        else if ("lowTimeAlert".equals(key)) preferences.setLowTimeAlert(value);
        
        call.resolve();
    }

    // ==========================================
    // ⏱️ স্ক্রিন টাইম স্ট্যাটাস
    // ==========================================

    @PluginMethod
    public void getScreenTimeStats(PluginCall call) {
        // 🟢 ফিক্স 3: পারমিশন চেক
        if (!permissionHelper.hasUsageStatsPermission()) {
            call.reject("Usage Stats permission not granted");
            return;
        }

        try {
            UsageStatsManager usageStatsManager = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
            
            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            long startTime = calendar.getTimeInMillis();
            long endTime = System.currentTimeMillis();

            List<UsageStats> usageStatsList = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime);
            PackageManager pm = getContext().getPackageManager();
            
            JSArray appsArray = new JSArray();
            long totalTimeMinutes = 0;

            if (usageStatsList != null) {
                for (UsageStats stats : usageStatsList) {
                    long timeInForeground = stats.getTotalTimeInForeground();
                    String pkgName = stats.getPackageName();
                    
                    boolean isSystemLauncher = pkgName.contains("launcher") || pkgName.contains("systemui") || pkgName.equals("android");
                    
                    if (timeInForeground > 0 && !isSystemLauncher) {
                        long minutes = timeInForeground / (1000 * 60);
                        if (minutes > 0) {
                            totalTimeMinutes += minutes;
                            
                            JSObject appObj = new JSObject();
                            appObj.put("packageName", pkgName);
                            appObj.put("usageMinutes", minutes);
                            
                            try {
                                ApplicationInfo appInfo = pm.getApplicationInfo(pkgName, 0);
                                appObj.put("appName", pm.getApplicationLabel(appInfo).toString());
                            } catch (Exception e) {
                                appObj.put("appName", pkgName);
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
    
    @PluginMethod
    public void toggleFloatingTimer(PluginCall call) {
        boolean enable = call.getBoolean("enable", false);
        preferences.setFloatingTimerEnabled(enable);
        
        Intent intent = new Intent(getContext(), ShieldFloatingService.class);
        if (enable) {
            getContext().startService(intent);
        } else {
            getContext().stopService(intent);
        }
        
        call.resolve();
    }

    @PluginMethod
    public void updateFloatingTimerStyle(PluginCall call) {
      if (call.hasOption("opacity")) preferences.setFloatingTimerOpacity(call.getFloat("opacity", 1.0f));
     if (call.hasOption("size")) preferences.setFloatingTimerSize(call.getInt("size"));
     if (call.hasOption("countdown")) preferences.setCountdownMode(call.getBoolean("countdown"));
     call.resolve();
}
}