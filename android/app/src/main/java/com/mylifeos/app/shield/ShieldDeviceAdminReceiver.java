package com.mylifeos.app.shield;

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
        Toast.makeText(context, "🛡️ Shield Protection Activated!", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        super.onDisabled(context, intent);
        Toast.makeText(context, "⚠️ Shield Protection Disabled!", Toast.LENGTH_SHORT).show();
        
        ShieldPreferences prefs = new ShieldPreferences(context);
        prefs.setStrictMode(false);
        prefs.setPreventUninstall(false); // আনইনস্টল প্রোটেকশন অফ করে দেওয়া
        prefs.setCurrentMode("normal");
    }

    @Override
    public CharSequence onDisableRequested(Context context, Intent intent) {
        ShieldPreferences prefs = new ShieldPreferences(context);
        
        // যদি স্ট্রিক্ট মোড অন থাকে অথবা ইউজার সেটিংসে "Prevent Uninstall" অন করে রাখে
        if (prefs.isStrictMode() || prefs.isPreventUninstallEnabled()) {
            
            // এই মেসেজটা ইউজার যখন সেটিংস থেকে Device Admin অফ করতে যাবে তখন পপআপ হিসেবে আসবে
            return "🛑 ACCESS DENIED! \n\nShield Protection is locked. You cannot disable or uninstall the app while in focus mode or if Uninstall Protection is ON.";
        }
        
        return "Disabling Shield will stop all blocking services.";
    }

    // অতিরিক্ত প্রোটেকশন: কেউ যদি জোর করে অ্যাডমিন অফ করতে চায়, অ্যাপ অটোমেটিক ওপেন হবে
    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        // এখানে চাইলে আরও কাস্টম লজিক দেওয়া যায়
    }
}
