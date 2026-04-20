package com.mylifeos.app.shield;

import android.app.Activity;
import android.app.AppOpsManager;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;
import android.view.accessibility.AccessibilityManager;
import android.accessibilityservice.AccessibilityServiceInfo;

import java.util.List;

public class ShieldPermissionHelper {

    private static final String TAG = "ShieldPermission";
    // তোমার AccessibilityService এর ফুল পাথ। AndroidManifest.xml এর সাথে মিলায় নিও।
    private static final String ACCESSIBILITY_SERVICE_NAME = "com.mylifeos.app/com.mylifeos.app.shield.ShieldAccessibilityService";

    // তোমার আগের কোডের সাথে মিলিয়ে static বানানো হলো

    public static boolean hasUsageStatsPermission(Context context) {
        if (context == null) return false;
        AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.getPackageName());
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    public static void requestUsageStats(Context context) {
        if (context == null) return;
        try {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open Usage Stats Settings: " + e.getMessage());
        }
    }

    public static boolean isAccessibilityEnabled(Context context) {
        if (context == null) return false;
        AccessibilityManager am = (AccessibilityManager) context.getSystemService(Context.ACCESSIBILITY_SERVICE);
        if (am == null) return false;
        try {
            List<AccessibilityServiceInfo> enabledServices = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
            for (AccessibilityServiceInfo service : enabledServices) {
                if (service.getId() != null && service.getId().equals(ACCESSIBILITY_SERVICE_NAME)) return true;
            }
            String enabledServicesSetting = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            if (enabledServicesSetting != null) {
                TextUtils.SimpleStringSplitter splitter = new TextUtils.SimpleStringSplitter(':');
                splitter.setString(enabledServicesSetting);
                while (splitter.hasNext()) {
                    if (splitter.next().equalsIgnoreCase(ACCESSIBILITY_SERVICE_NAME)) return true;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking accessibility: " + e.getMessage());
        }
        return false;
    }

    public static void requestAccessibility(Context context) {
        if (context == null) return;
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open Accessibility Settings: " + e.getMessage());
        }
    }

    public static boolean isDeviceAdminActive(Context context) {
        if (context == null) return false;
        DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName admin = new ComponentName(context, ShieldDeviceAdminReceiver.class);
        return dpm.isAdminActive(admin);
    }

    public static void requestDeviceAdmin(Context context) {
        if (context == null) return;
        try {
            ComponentName admin = new ComponentName(context, ShieldDeviceAdminReceiver.class);
            Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, admin);
            intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Enable Device Admin to prevent Shield from being uninstalled during Strict Mode");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open Device Admin Settings: " + e.getMessage());
        }
    }

    public static boolean canDrawOverlays(Context context) {
        if (context == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(context);
        }
        return true;
    }

    public static void requestOverlay(Context context) {
        if (context == null) return;
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + context.getPackageName()));
            } else {
                intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + context.getPackageName()));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open Overlay Settings: " + e.getMessage());
        }
    }

    public static boolean isIgnoringBatteryOptimizations(Context context) {
        if (context == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm == null) return false;
            return pm.isIgnoringBatteryOptimizations(context.getPackageName());
        }
        return true;
    }

    public static void requestIgnoreBattery(Context context) {
        if (context == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to open Battery Settings: " + e.getMessage());
        }
    }

    public static boolean hasAllPermissions(Context context) {
        return hasUsageStatsPermission(context) && isAccessibilityEnabled(context);
    }
}