package com.myfileos.app.shield;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Intent;
import android.view.accessibility.AccessibilityEvent;
import java.util.HashSet;
import java.util.Set;

public class ShieldAccessibilityService extends AccessibilityService {
    private ShieldPreferences preferences;
    
    // এই প্যাকেজগুলা কখনো ব্লক করবো না
    private static final Set<String> WHITELIST = new HashSet<String>() {{
        add("com.android.systemui");
        add("com.android.launcher");
        add("com.android.launcher3");
        add("com.google.android.apps.nexuslauncher");
        add("com.mi.android.globallauncher");
        add("com.sec.android.app.launcher");
        add("com.android.settings");
        add("com.android.phone");
        add("com.android.incallui");
    }};

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        preferences = new ShieldPreferences(this);
        
        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        // ফিক্স 1: FLAG_INCLUDE_NOT_IMPORTANT_VIEWS অ্যাড করলাম। সব অ্যাপ ধরা পড়বে
        info.flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS | AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS;
        info.notificationTimeout = 100;
        setServiceInfo(info);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (preferences == null || !preferences.isEnabled()) return;
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;
        if (event.getPackageName() == null) return;

        String currentPackage = event.getPackageName().toString();
        String myPackage = getPackageName();

        // ফিক্স 2: হোয়াইটলিস্ট চেক
        if (currentPackage.equals(myPackage) || WHITELIST.contains(currentPackage)) {
            return;
        }

        Set<String> blockedApps = preferences.getBlockedApps();
        if (blockedApps != null && blockedApps.contains(currentPackage)) {
            // ফিক্স 3: ব্লকড অ্যাপে ঢুকলেই ব্যাক চাপো + ব্লক স্ক্রিন দেখাও
            performGlobalAction(GLOBAL_ACTION_BACK);
            launchBlockScreen(currentPackage, "blocked");
        }
    }

    private void launchBlockScreen(String packageName, String reason) {
        try {
            Intent intent = new Intent(this, ShieldBlockActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            intent.putExtra("blocked_package", packageName);
            intent.putExtra("reason", reason);
            startActivity(intent);
        } catch (Exception e) {
            // ফিক্স 4: ক্র্যাশ হলে লগ করো, সার্ভিস যাতে না মরে
            android.util.Log.e("ShieldAccessibility", "Failed to launch block screen: " + e.getMessage());
        }
    }

    @Override
    public void onInterrupt() {
        // সার্ভিস ইন্টারাপ্ট হলে কিছু করার নাই
    }
}