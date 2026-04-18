package com.mylifeos.app.shield;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Intent;
import android.view.accessibility.AccessibilityEvent;
import java.util.Set;

public class ShieldAccessibilityService extends AccessibilityService {
    private ShieldPreferences preferences;

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        preferences = new ShieldPreferences(this);
        
        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS;
        info.notificationTimeout = 100;
        setServiceInfo(info);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (!preferences.isEnabled()) return;
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;
        if (event.getPackageName() == null) return;

        String currentPackage = event.getPackageName().toString();
        String myPackage = getPackageName();
        
        if (currentPackage.equals(myPackage)) return;
        if (currentPackage.equals("com.android.systemui")) return;
        if (currentPackage.equals("com.android.launcher")) return;

        Set<String> blockedApps = preferences.getBlockedApps();
        
        if (blockedApps.contains(currentPackage)) {
            launchBlockScreen(currentPackage, "blocked");
        }
    }

    private void launchBlockScreen(String packageName, String reason) {
        Intent intent = new Intent(this, ShieldBlockActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("blocked_package", packageName);
        intent.putExtra("reason", reason);
        startActivity(intent);
    }

    @Override
    public void onInterrupt() {}
}