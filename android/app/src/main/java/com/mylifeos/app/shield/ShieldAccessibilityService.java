package com.mylifeos.app.shield;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.util.Log;
import android.widget.Toast;
import android.os.Handler;
import android.os.Looper;

import java.util.Set;
import java.util.List;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.util.HashSet;

import com.mylifeos.app.MainActivity; // 🟢 আপনার মেইন অ্যাক্টিভিটি ইম্পোর্ট করুন

public class ShieldAccessibilityService extends AccessibilityService {

    private static final String TAG = "ShieldAccessibility";

    private ShieldPreferences preferences;
    private String lastBlockedPackage = "";
    private String lastBlockedUrl = "";

    // 🟢 Throttling Variables to prevent phone from lagging
    private long lastActionTime = 0;
    private long lastScanTime = 0;
    private static final long SCAN_COOLDOWN_MS = 700;

    // 📂 ফাইল থেকে পড়া কিওয়ার্ড রাখার সেট
    private Set<String> adultKeywordsSet = new HashSet<>();

    private static final String[] BROWSER_PACKAGES = new String[]{
            "com.android.chrome",
            "com.chrome.beta",
            "com.chrome.dev",
            "org.mozilla.firefox",
            "com.brave.browser",
            "com.opera.browser",
            "com.microsoft.emmx",
            "com.sec.android.app.sbrowser",
            "com.duckgo.mobile.android"
    };

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        preferences = new ShieldPreferences(this);
        loadAdultKeywordsFromAssets();
        Log.d(TAG, "🛡️ Shield Fast Engine Connected with " + adultKeywordsSet.size() + " keywords!");
    }

    private void loadAdultKeywordsFromAssets() {
        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(getAssets().open("adult_keywords.txt")));
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim().toLowerCase();
                if (!trimmed.isEmpty()) {
                    adultKeywordsSet.add(trimmed);
                }
            }
            reader.close();
        } catch (IOException e) {
            Log.e(TAG, "Error loading adult keywords from assets", e);
        }
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getPackageName() == null) return;

        String packageName = event.getPackageName().toString();
        if (packageName.equals(getPackageName())) return;

        int type = event.getEventType();

        // ✅ PureShield notify FIRST — independent of Shield (app-blocker) enabled state.
        // PureShield works even when classic Shield is OFF.
        if (type == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            try {
                com.mylifeos.app.shield.vision.PureShieldService svc = com.mylifeos.app.shield.vision.PureShieldService.instance;
                if (svc != null && svc.isPureShieldRunning()) {
                    Intent pureShieldIntent = new Intent(this, com.mylifeos.app.shield.vision.PureShieldService.class);
                    pureShieldIntent.setAction("PureShield.FOREGROUND_APP_CHANGED");
                    pureShieldIntent.putExtra("package", packageName);
                    startService(pureShieldIntent);
                }
            } catch (Throwable ignored) {}
        }

        // Classic Shield features below require Shield to be enabled.
        if (preferences == null || !preferences.isEnabled()) return;

        // ==========================================
        // 🛑 ফিচার ১: ডাইরেক্ট অ্যাপ ব্লক (FAST)
        // ==========================================
        if (type == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            Set<String> blockedApps = preferences.getBlockedApps();
            if (blockedApps != null && blockedApps.contains(packageName)) {
                if (!packageName.equals(lastBlockedPackage)) {
                    lastBlockedPackage = packageName;
                    preferences.incrementBlockedAttempts();
                    showBlockScreen(packageName);
                }
                return;
            } else {
                lastBlockedPackage = "";
            }
        }

        // ==========================================
        // 🔒 ফিচার ২: হার্ডকোর প্রোটেকশন
        // ==========================================
        if (type == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED && isSystemUI(packageName)) {
            if (preferences.isBlockRecentAppsEnabled() && (packageName.contains("recents") || packageName.contains("launcher"))) {
                triggerHomeAction("Recent Apps Blocked!");
                return;
            }
            AccessibilityNodeInfo root = getRootInActiveWindow();
            if (root != null) {
                if (preferences.isBlockSplitScreenEnabled() && scanForTextFast(root, "Split screen", 0)) {
                    triggerBackAction("Split Screen Blocked!");
                    return;
                }
                if (preferences.isBlockPowerOffEnabled() && (scanForTextFast(root, "Power off", 0) || scanForTextFast(root, "Restart", 0))) {
                    triggerBackAction("Power Menu Blocked!");
                    return;
                }
            }
        }

        // ==========================================
        // 🌐 ফিচার ৩: URL ব্লকিং (Browser) + 🔞 অ্যাডাল্ট URL
        // ==========================================
        if (isBrowser(packageName) && type == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            String url = extractUrlFromBrowser(getRootInActiveWindow());
            if (url != null && !url.isEmpty() && !url.equals(lastBlockedUrl)) {
                String lowerUrl = url.toLowerCase();
                // 🔞 অ্যাডাল্ট URL ব্লকিং (সবসময় একটিভ)
                for (String kw : adultKeywordsSet) {
                    if (lowerUrl.contains(kw)) {
                        lastBlockedUrl = url;
                        triggerBackActionWithPopup("Adult URL", "ADULT");
                        return;
                    }
                }
                if (preferences.isReelsBlockEnabled() && (lowerUrl.contains("/shorts") || lowerUrl.contains("/reels"))) {
                    lastBlockedUrl = url;
                    triggerBackActionWithPopup("Browser Shorts", "REELS");
                    return;
                }
                Set<String> blockedSites = preferences.getBlockedSites();
                if (blockedSites != null) {
                    for (String site : blockedSites) {
                        if (urlMatches(url, site)) {
                            lastBlockedUrl = url;
                            preferences.incrementBlockedAttempts();
                            performGlobalAction(GLOBAL_ACTION_BACK);
                            return;
                        }
                    }
                }
            }
        }

        // ==========================================
        // 🚫 ফিচার ৪: রিলস এবং 🔞 অ্যাডাল্ট স্ক্রিন স্ক্যানার (THROTTLED)
        // ==========================================
        if (type == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            long currentTime = System.currentTimeMillis();
            if (currentTime - lastScanTime > SCAN_COOLDOWN_MS) {
                lastScanTime = currentTime;
                AccessibilityNodeInfo rootNode = getRootInActiveWindow();
                if (rootNode != null) {
                    if (scanForAdultContent(rootNode, 0)) {
                        triggerBackActionWithPopup("Adult Screen Content", "ADULT");
                        return;
                    }
                    if (preferences.isReelsBlockEnabled() && isSocialMediaApp(packageName) && scanForReelsFast(rootNode, 0)) {
                        triggerBackActionWithPopup("Reels/Shorts Detected", "REELS");
                        return;
                    }
                }
            }
        }

        // ==========================================
        // ⌨️ ফিচার ৫: Keyword ব্লকিং (Text Input - Everywhere)
        // ==========================================
        if (type == AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED) {
            CharSequence text = event.getText() != null && !event.getText().isEmpty() ? event.getText().get(0) : null;
            if (text != null && text.length() > 0) {
                String typed = text.toString().toLowerCase();
                // 🔞 ১. ফাইল থেকে আসা অ্যাডাল্ট কিওয়ার্ড চেক
                for (String kw : adultKeywordsSet) {
                    if (typed.contains(kw)) {
                        triggerBackActionWithPopup("Typed Adult Keyword", "ADULT");
                        return;
                    }
                }
                // 🚫 ২. ইউজারের নিজের সেট করা রেগুলার কিওয়ার্ড চেক
                Set<String> blockedKeywords = preferences.getBlockedKeywords();
                if (blockedKeywords != null) {
                    for (String kw : blockedKeywords) {
                        if (kw == null || kw.isEmpty()) continue;
                        if (typed.contains(kw.toLowerCase())) {
                            preferences.incrementBlockedAttempts();
                            performGlobalAction(GLOBAL_ACTION_BACK);
                            triggerBackActionWithPopup("Forbidden Keyword Typed", "NORMAL");
                            return;
                        }
                    }
                }
            }
        }
    }

    // ==========================================
    // 🛠️ কাস্টম পপ-আপ এবং ব্যাক অ্যাকশন
    // ==========================================
    private void triggerBackActionWithPopup(String reason, String popupType) {
        long currentTime = System.currentTimeMillis();
        if (currentTime - lastActionTime > 1500) {
            Log.d(TAG, "🛑 Action: BACK | Reason: " + reason);
            preferences.incrementBlockedAttempts();
            performGlobalAction(GLOBAL_ACTION_BACK);
            lastActionTime = currentTime;
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                if (popupType.equals("ADULT")) {
                    Intent intent = new Intent(this, MainActivity.class);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    intent.putExtra("SHIELD_EVENT", "SHOW_ADULT_WARNING");
                    startActivity(intent);
                } else if (popupType.equals("REELS")) {
                    Toast.makeText(getApplicationContext(), "Shorts / Reels Blocked 🚫", Toast.LENGTH_LONG).show();
                } else {
                    Toast.makeText(getApplicationContext(), "Blocked by Shield 🛡️", Toast.LENGTH_LONG).show();
                }
            }, 150);
        }
    }

    // ==========================================
    // 🛠️ হেল্পার ফাংশন
    // ==========================================
    private boolean scanForAdultContent(AccessibilityNodeInfo node, int depth) {
        if (node == null || depth > 10) return false;
        CharSequence text = node.getText();
        if (text != null) {
            String t = text.toString().toLowerCase();
            for (String kw : adultKeywordsSet) {
                if (t.contains(kw)) return true;
            }
        }
        for (int i = 0; i < node.getChildCount(); i++) {
            if (scanForAdultContent(node.getChild(i), depth + 1)) return true;
        }
        return false;
    }

    private boolean isBrowser(String pkg) {
        for (String b : BROWSER_PACKAGES)
            if (b.equals(pkg)) return true;
        return false;
    }

    private String extractUrlFromBrowser(AccessibilityNodeInfo root) {
        if (root == null) return null;
        try {
            List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByViewId("com.android.chrome:id/url_bar");
            if (nodes != null && !nodes.isEmpty() && nodes.get(0).getText() != null) {
                return nodes.get(0).getText().toString();
            }
        } catch (Exception e) {
        }
        return null;
    }

    private boolean urlMatches(String url, String pattern) {
        if (url == null || pattern == null) return false;
        return url.toLowerCase().contains(pattern.toLowerCase().replace("https://", "").replace("http://", "").replace("www.", ""));
    }

    private boolean scanForTextFast(AccessibilityNodeInfo node, String targetText, int depth) {
        if (node == null || depth > 10) return false;
        CharSequence text = node.getText();
        if (text != null && text.toString().toLowerCase().contains(targetText.toLowerCase()))
            return true;
        for (int i = 0; i < node.getChildCount(); i++) {
            if (scanForTextFast(node.getChild(i), targetText, depth + 1)) return true;
        }
        return false;
    }

    private boolean scanForReelsFast(AccessibilityNodeInfo node, int depth) {
        if (node == null || depth > 10) return false;
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
            if (scanForReelsFast(node.getChild(i), depth + 1)) return true;
        }
        return false;
    }

    private boolean isSystemUI(String pkg) {
        return pkg.equals("com.android.systemui") || pkg.equals("android") || pkg.contains("launcher");
    }

    private boolean isSocialMediaApp(String pkg) {
        return pkg.contains("youtube") || pkg.contains("facebook") || pkg.contains("instagram") || pkg.contains("tiktok") || pkg.contains("orca") || // Messenger
                pkg.contains("telegram") || // Telegram
                pkg.contains("whatsapp"); // WhatsApp
    }

    private void triggerBackAction(String reason) {
        long currentTime = System.currentTimeMillis();
        if (currentTime - lastActionTime > 1000) {
            Log.d(TAG, "🛑 Action: BACK | Reason: " + reason);
            preferences.incrementBlockedAttempts();
            performGlobalAction(GLOBAL_ACTION_BACK);
            lastActionTime = currentTime;
        }
    }

    private void triggerHomeAction(String reason) {
        long currentTime = System.currentTimeMillis();
        if (currentTime - lastActionTime > 1000) {
            Log.d(TAG, "🛑 Action: HOME | Reason: " + reason);
            preferences.incrementBlockedAttempts();
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
    public void onInterrupt() {
        Log.e(TAG, "Shield Accessibility Service Interrupted");
    }
}