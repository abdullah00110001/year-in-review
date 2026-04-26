package com.mylifeos.app.plugins;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.VpnService; // 🟢 Missing Import Fixed
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
import com.mylifeos.app.shield.ShieldVpnService; // 🟢 Missing Import Fixed
import com.mylifeos.app.shield.core.ShieldModeManager;

import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import android.app.admin.DevicePolicyManager; // 🟢 ফিক্স 1
import android.content.ComponentName; // 🟢 ফিক্স 2
import android.util.Log; // 🟢 ফিক্স 3
import com.mylifeos.app.shield.ShieldDeviceAdminReceiver; // 🟢 ফিক্স 4
import org.json.JSONObject; // 🟢 ফিক্স 5


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

        // যদি পিন সেট করা না থাকে
        if (savedPin.isEmpty()) {
            call.reject("No Emergency PIN set! Please set it in Advanced Settings first.");
            return;
        }

        // যদি ইউজারের দেওয়া পিন মিলে যায়
        if (savedPin.equals(inputPin)) {
            Log.d("ShieldPlugin", "🔓 EMERGENCY BYPASS ACTIVATED!");
            
            // জাদুকরী লজিক: স্ট্রিক্ট মোড, অ্যাপ ব্লক, এবং আনইনস্টল প্রোটেকশন সব ডিজেবল করে দেওয়া হলো
            preferences.setStrictMode(false);
            preferences.setEnabled(false);
            preferences.setPreventUninstall(false);
            preferences.setBypassActive(true);
            preferences.setCurrentMode("normal");
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } else {
            // পিন ভুল হলে লাথি দাও
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
    // 🌐 অ্যাডাল্ট ফিল্টার (VPN Service)
    // ==========================================

    @PluginMethod
    public void toggleAdultFilter(PluginCall call) {
        boolean enable = call.getBoolean("enable", false);
        
        Intent vpnIntent = VpnService.prepare(getContext());
        
        if (enable) {
            if (vpnIntent != null) {
                // ইউজারের পারমিশন লাগবে
                getActivity().startActivityForResult(vpnIntent, 1001);
            } else {
                // অলরেডি পারমিশন দেওয়া আছে, ডাইরেক্ট স্টার্ট করো
                Intent intent = new Intent(getContext(), ShieldVpnService.class);
                intent.setAction(ShieldVpnService.ACTION_START);
                getContext().startService(intent);
            }
        } else {
            // অফ করার কমান্ড
            Intent intent = new Intent(getContext(), ShieldVpnService.class);
            intent.setAction(ShieldVpnService.ACTION_STOP);
            getContext().startService(intent);
        }
        
        call.resolve();
    }
        // ==========================================
    // 🛡️ হার্ডকোর প্রোটেকশন সেটিংস (Power Off, Split Screen, Uninstall)
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

            // এই সেটিংগুলো ShieldPreferences এ সেভ করা হচ্ছে
            // যাতে Accessibility Service বা Device Admin Receiver এগুলো রিড করতে পারে
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
                    // আনইনস্টল ঠেকানোর লজিক আমরা আলাদা DeviceAdminReceiver এ লিখব
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
        
        // ১. চেক করা হচ্ছে স্ট্রিক্ট মোড অন কি না
        if (preferences.isStrictMode()) {
            call.reject("Cannot uninstall while Strict Mode is active!");
            return;
        }

        // ২. ডিভাইস অ্যাডমিন অফ করা (যদি অন থাকে)
        DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName adminComponent = new ComponentName(context, ShieldDeviceAdminReceiver.class);
        
        if (dpm.isAdminActive(adminComponent)) {
            dpm.removeActiveAdmin(adminComponent);
        }

        // ৩. আনইনস্টল ইন্টেন্ট কল করা
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
            ret.put("history", new JSONObject(historyJson)); // JSON স্ট্রিং পাঠিয়ে দেওয়া হলো
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to fetch history", e);
        }
    }

    @PluginMethod
    public void updateNotificationSettings(PluginCall call) {
        String key = call.getString("key");
        boolean value = call.getBoolean("value", false);
        
        if ("vibrate".equals(key)) preferences.setVibrationEnabled(value);
        if ("sound".equals(key)) preferences.setSoundEnabled(value);
        if ("lowTimeAlert".equals(key)) preferences.setLowTimeAlert(value);
        
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
            calendar.set(Calendar.MILLISECOND, 0); // 🟢 More accurate
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
                    
                    // 🟢 System Launcher ফিল্টার করা (Digital Wellbeing এর মতো একুরেট হতে)
                    boolean isSystemLauncher = pkgName.contains("launcher") || pkgName.contains("systemui") || pkgName.equals("android");
                    
                    if (timeInForeground > 0 && !isSystemLauncher) {
                        long minutes = timeInForeground / (1000 * 60);
                        if (minutes > 0) {
                            totalTimeMinutes += minutes;
                            
                            JSObject appObj = new JSObject();
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
        if (call.hasOption("opacity")) preferences.setFloatingTimerOpacity((float) call.getDouble("opacity"));
        if (call.hasOption("size")) preferences.setFloatingTimerSize(call.getInt("size"));
        if (call.hasOption("countdown")) preferences.setCountdownMode(call.getBoolean("countdown"));
        call.resolve();
    }

}
