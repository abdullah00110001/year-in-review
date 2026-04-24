package com.mylifeos.app.shield;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.accessibility.AccessibilityEvent;
import android.util.Log;
import java.util.Set;

public class ShieldAccessibilityService extends AccessibilityService {
    private static final String TAG = "ShieldAccessibility";
    private ShieldPreferences preferences;
    private String lastBlockedPackage = "";

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        // রিয়েক্ট ফ্রন্টএন্ড যেখানে ডাটা সেভ করে, সেইম ডাটাবেস (Preferences) ইনিশিয়ালাইজ করা হলো
        preferences = new ShieldPreferences(this);
        Log.d(TAG, "Shield Accessibility Service Connected & Ready!");
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // যখনই ইউজার কোনো নতুন অ্যাপের উইন্ডো ওপেন করে, তখন এই ইভেন্ট ফায়ার হয়
        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            if (event.getPackageName() != null) {
                String packageName = event.getPackageName().toString();

                // ১. শিল্ড যদি মেইন সুইচ থেকে অফ থাকে, তবে কোনো কাজ করবে না
                if (!preferences.isEnabled()) {
                    return;
                }

                // ২. আমাদের নিজেদের অ্যাপ (LifeOS) কে ভুলে ব্লক করা থেকে বিরত রাখা
                if (packageName.equals(getPackageName())) {
                    return;
                }

                // ৩. চেক করা হচ্ছে এই অ্যাপটা ব্লক লিস্টে আছে কিনা
                Set<String> blockedApps = preferences.getBlockedApps();
                if (blockedApps.contains(packageName)) {
                    Log.d(TAG, "🚨 Blocked App Launched: " + packageName);

                    // ৪. Infinite Loop ঠেকানোর লজিক
                    if (!packageName.equals(lastBlockedPackage)) {
                        lastBlockedPackage = packageName;
                        showBlockScreen(packageName);
                    }
                } else {
                    // সাধারণ কোনো অ্যাপ ওপেন করলে ব্লক হিস্ট্রি ক্লিয়ার করে দেওয়া
                    lastBlockedPackage = "";
                }
            }
        }
    }

    private void showBlockScreen(String packageName) {
        // ব্লক স্ক্রিন (Activity) ওপেন করার কমান্ড
        Intent intent = new Intent(this, ShieldBlockActivity.class);
        intent.putExtra("BLOCKED_PACKAGE", packageName);
        
        // Background Service থেকে Activity ওপেন করতে এই ফ্ল্যাগগুলো ১০০% বাধ্যতামূলক
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | 
                        Intent.FLAG_ACTIVITY_CLEAR_TASK | 
                        Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS | 
                        Intent.FLAG_ACTIVITY_NO_ANIMATION);
                        
        startActivity(intent);
    }

    @Override
    public void onInterrupt() {
        Log.e(TAG, "Shield Accessibility Service Interrupted!");
    }
}
