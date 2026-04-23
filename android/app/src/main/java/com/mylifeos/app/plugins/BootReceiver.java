package com.mylifeos.app.plugins;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Listens for BOOT_COMPLETED so that after a reboot we can hand control
 * back to the JS layer. The JS layer (nativeAlarm.ts) keeps the next
 * occurrence of every alarm in Capacitor Preferences and reschedules
 * them on the next App resume — see restoreAlarmsOnBoot().
 *
 * For an immediate fire we also re-arm the *next* RiseAlarm if its
 * timestamp is still stored (best-effort).
 */
public class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "RiseBoot";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
            || "android.intent.action.QUICKBOOT_POWERON".equals(action)
            || "com.htc.intent.action.QUICKBOOT_POWERON".equals(action)
            || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {

            Log.i(TAG, "Boot completed — opening app to reschedule alarms");
            try {
                Intent launch = context.getPackageManager()
                    .getLaunchIntentForPackage(context.getPackageName());
                if (launch != null) {
                    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    launch.putExtra("rise_boot_reschedule", true);
                    // Note: Android 10+ blocks background activity starts in many
                    // cases; the JS layer also re-runs reschedule on App resume.
                    context.startActivity(launch);
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to relaunch on boot: " + e.getMessage());
            }
        }
    }
}
