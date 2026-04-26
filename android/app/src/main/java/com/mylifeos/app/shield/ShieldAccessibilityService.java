package com.mylifeos.app.shield;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.util.Log;
import java.util.Set;

public class ShieldAccessibilityService extends AccessibilityService {
    private static final String TAG = "ShieldAccessibility";
    private ShieldPreferences preferences;
    private String lastBlockedPackage = "";
    private long lastActionTime = 0;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        preferences = new ShieldPreferences(this);
        Log.d(TAG, "🛡️ Shield Hardcore Engine Connected!");
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getPackageName() == null) return;
        String packageName = event.getPackageName().toString();

        // ১. শিল্ড অফ থাকলে বা নিজের অ্যাপ হলে ইগনোর করো
        if (!preferences.isEnabled()) return;
        if (packageName.equals(getPackageName())) return;

        int eventType = event.getEventType();

        // ==========================================
        // 🛑 ফিচার ১: ডাইরেক্ট অ্যাপ ব্লক (App Blocker)
        // ==========================================
        if (eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            Set<String> blockedApps = preferences.getBlockedApps();
            if (blockedApps != null && blockedApps.contains(packageName)) {
                if (!packageName.equals(lastBlockedPackage)) {
                    lastBlockedPackage = packageName;
                    showBlockScreen(packageName);
                }
                return;
            } else {
                lastBlockedPackage = "";
            }
        }

        // ==========================================
        // 🔒 হার্ডকোর প্রোটেকশন (Power Off, Recents, Split Screen)
        // ==========================================
        
        // ২. Block Recent Apps (রিসেন্ট বাটন চাপলে হোমে পাঠিয়ে দাও)
        if (preferences.isBlockRecentAppsEnabled() && isSystemUI(packageName)) {
            // অ্যান্ড্রয়েড ১০+ এ রিসেন্ট স্ক্রিন সাধারণত SystemUI বা Launcher থেকে আসে
            if (eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
                // কিছু ডিভাইসে এটা "com.android.systemui.recents" হিসেবে থাকে
                if (packageName.contains("recents") || packageName.contains("launcher")) {
                    triggerHomeAction("Recent Apps Blocked!");
                }
            }
        }

        // ৩. Block Split Screen
        if (preferences.isBlockSplitScreenEnabled() && eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            // স্প্লিট স্ক্রিন মুডে উইন্ডো অনেক সময় SystemUI এর আন্ডারে চলে যায়
            if (isSystemUI(packageName)) {
                AccessibilityNodeInfo root = getRootInActiveWindow();
                if (root != null && scanForText(root, "Split screen")) {
                    triggerBackAction("Split Screen Blocked!");
                }
            }
        }

        // ৪. Block Power Off (পাওয়ার মেনু আসলে কেটে দাও)
        if (preferences.isBlockPowerOffEnabled() && isSystemUI(packageName)) {
            AccessibilityNodeInfo root = getRootInActiveWindow();
            if (root != null) {
                // পাওয়ার মেনুতে সাধারণত "Power off" বা "Restart" লেখা থাকে
                if (scanForText(root, "Power off") || scanForText(root, "Restart") || scanForText(root, "Emergency")) {
                    triggerBackAction("Power Menu Blocked!");
                }
            }
        }

        // ==========================================
        // 🚫 রিলস এবং কিওয়ার্ড স্ক্যানার
        // ==========================================
        if (eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED || 
            eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            
            AccessibilityNodeInfo rootNode = getRootInActiveWindow();
            if (rootNode != null) {
                // Reels & Shorts ব্লকার
                if (preferences.isReelsBlockEnabled() && isSocialMediaApp(packageName)) {
                    if (scanForReels(rootNode)) {
                        triggerBackAction("Reels/Shorts Detected!");
                        return;
                    }
                }

                // Keyword ব্লকার
                Set<String> blockedKeywords = preferences.getBlockedKeywords();
                if (blockedKeywords != null && !blockedKeywords.isEmpty()) {
                    if (scanForKeywords(rootNode, blockedKeywords)) {
                        triggerBackAction("Forbidden Keyword Found!");
                    }
                }
            }
        }
    }

    // 🟢 হেল্পার ফাংশন: সাধারণ টেক্সট স্ক্যানার
    private boolean scanForText(AccessibilityNodeInfo node, String targetText) {
        if (node == null) return false;
        if (node.getText() != null && node.getText().toString().toLowerCase().contains(targetText.toLowerCase())) return true;
        if (node.getContentDescription() != null && node.getContentDescription().toString().toLowerCase().contains(targetText.toLowerCase())) return true;
        
        for (int i = 0; i < node.getChildCount(); i++) {
            if (scanForText(node.getChild(i), targetText)) return true;
        }
        return false;
    }

    // 🟢 হেল্পার ফাংশন: রিলস স্ক্যানার
    private boolean scanForReels(AccessibilityNodeInfo node) {
        if (node == null) return false;
        CharSequence text = node.getText();
        CharSequence desc = node.getContentDescription();
        if (text != null) {
            String t = text.toString().toLowerCase().trim();
            if (t.equals("shorts") || t.equals("reels")) return true;
        }
        if (desc != null) {
            String d = desc.toString().toLowerCase().trim();
            if (d.equals("shorts") || d.equals("reels")) return true;
        }
        for (int i = 0; i < node.getChildCount(); i++) {
            if (scanForReels(node.getChild(i))) return true;
        }
        return false;
    }

    private boolean scanForKeywords(AccessibilityNodeInfo node, Set<String> keywords) {
        if (node == null) return false;
        CharSequence text = node.getText();
        if (text != null) {
            String screenText = text.toString().toLowerCase();
            for (String keyword : keywords) {
                if (screenText.contains(keyword.toLowerCase())) return true;
            }
        }
        for (int i = 0; i < node.getChildCount(); i++) {
            if (scanForKeywords(node.getChild(i), keywords)) return true;
        }
        return false;
    }

    private boolean isSystemUI(String pkg) {
        return pkg.equals("com.android.systemui") || pkg.equals("android") || pkg.contains("launcher");
    }

    private boolean isSocialMediaApp(String pkg) {
        return pkg.contains("youtube") || pkg.contains("facebook") || pkg.contains("instagram") || pkg.contains("tiktok");
    }

    private void triggerBackAction(String reason) {
        long currentTime = System.currentTimeMillis();
        if (currentTime - lastActionTime > 1000) {
            Log.d(TAG, "🛑 Action: BACK | Reason: " + reason);
            performGlobalAction(GLOBAL_ACTION_BACK);
            lastActionTime = currentTime;
        }
    }

    private void triggerHomeAction(String reason) {
        long currentTime = System.currentTimeMillis();
        if (currentTime - lastActionTime > 1000) {
            Log.d(TAG, "🛑 Action: HOME | Reason: " + reason);
            performGlobalAction(GLOBAL_ACTION_HOME);
            lastActionTime = currentTime;
        }
    }

    private void showBlockScreen(String packageName) {
        Intent intent = new Intent(this, ShieldBlockActivity.class);
        intent.putExtra("BLOCKED_PACKAGE", packageName);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS | Intent.FLAG_ACTIVITY_NO_ANIMATION);
        startActivity(intent);
    }

    @Override
    public void onInterrupt() {}
}