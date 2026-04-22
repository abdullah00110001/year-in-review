package com.myfileos.app.shield;

import android.app.admin.DeviceAdminReceiver;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.UserHandle;
import android.widget.Toast;

public class ShieldDeviceAdminReceiver extends DeviceAdminReceiver {

    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Toast.makeText(context, "Shield Protection Activated", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        super.onDisabled(context, intent);
        Toast.makeText(context, "Shield Protection Disabled", Toast.LENGTH_SHORT).show();
        // ফিক্স 1: ডিসেবল হলে Strict Mode অফ করে দাও
        ShieldPreferences prefs = new ShieldPreferences(context);
        prefs.setStrictMode(false);
        prefs.setCurrentMode("normal");
    }

    @Override
    public CharSequence onDisableRequested(Context context, Intent intent) {
        ShieldPreferences prefs = new ShieldPreferences(context);
        if (prefs.isStrictMode()) {
            // ফিক্স 2: শুধু মেসেজ না, আসলেই ব্লক করো
            return "Strict Mode is active. You cannot disable Shield right now. Turn off Strict Mode first.";
        }
        return "Disabling Shield will stop app blocking and time limits.";
    }

    @Override
    public void onPasswordFailed(Context context, Intent intent, UserHandle user) {
        super.onPasswordFailed(context, intent, user);
        // ফিউচারের জন্য: ভুল পাসওয়ার্ড দিলে লগ করতে পারো
    }

    @Override
    public void onPasswordSucceeded(Context context, Intent intent, UserHandle user) {
        super.onPasswordSucceeded(context, intent, user);
    }
}