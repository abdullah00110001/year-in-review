package com.mylifeos.app.shield;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

public class ShieldDeviceAdminReceiver extends DeviceAdminReceiver {

    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        Toast.makeText(context, "Shield Device Admin enabled", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        super.onDisabled(context, intent);
        Toast.makeText(context, "Shield Device Admin disabled", Toast.LENGTH_SHORT).show();
    }

    @Override
    public CharSequence onDisableRequested(Context context, Intent intent) {
        ShieldPreferences prefs = new ShieldPreferences(context);
        if (prefs.isStrictMode()) {
            return "Strict Mode is active. You cannot disable Shield right now.";
        }
        return "Disabling Shield will stop app blocking protection.";
    }
}