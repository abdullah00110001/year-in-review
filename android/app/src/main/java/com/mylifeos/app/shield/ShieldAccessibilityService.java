package com.mylifeos.app.shield;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.util.Log;
import java.util.Set;
import java.util.List;

public class ShieldAccessibilityService extends AccessibilityService {
    private static final String TAG = "ShieldAccessibility";
    private ShieldPreferences preferences;
    private String lastBlockedPackage = "";
    private String lastBlockedUrl = "";
    private long lastActionTime = 0;

    // Common browser packages where we watch the address bar
    private static final String[] BROWSER_PACKAGES = new String[] {
        "com.android.chrome", "com.chrome.beta", "com.chrome.dev",
        "org.mozilla.firefox", "com.brave.browser", "com.opera.browser",
        "com.microsoft.emmx", "com.sec.android.app.sbrowser", "com.duckduckgo.mobile.android"
    };

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        preferences = new ShieldPreferences(this);
        Log.d(TAG, "🛡️ Shield Hardcore Engine Connected!");
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (preferences == null || !preferences.isEnabled()) return;
        if (event.getPackageName() == null) return;

        String packageName = event.getPackageName().toString();
        if (packageName.equals(getPackageName())) return;

        int type = event.getEventType();

        // ==========================================
        // 🛑 ফিচার ১: ডাইরেক্ট অ্যাপ ব্লক (App Blocker)
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
        // 🔒 ফিচার ২: হার্ডকোর প্রোটেকশন (Power Off, Recents, Split Screen)
        // ==========================================
        
        // ২.১ Block Recent Apps
        if (preferences.isBlockRecentAppsEnabled() && isSystemUI(packageName)) {
            if (type == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
                if (packageName.contains("recents") || packageName.contains("launcher")) {
                    triggerHomeAction("Recent Apps Blocked!");
                    return;
                }
            }
        }

        // ২.২ Block Split Screen
        if (preferences.isBlockSplitScreenEnabled() && type == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            if (isSystemUI(packageName)) {
                AccessibilityNodeInfo root = getRootInActiveWindow();
                if (root != null && scanForText(root, "Split screen")) {
                    triggerBackAction("Split Screen Blocked!");
                    return;
                }
            }
        }

        // ২.৩ Block Power Off
        if (preferences.isBlockPowerOffEnabled() && isSystemUI(packageName)) {
            AccessibilityNodeInfo root = getRootInActiveWindow();
            if (root != null) {
                if (scanForText(root, "Power off") || scanForText(root, "Restart") || scanForText(root, "Emergency")) {
                    triggerBackAction("Power Menu Blocked!");
                    return;
                }
            }
        }

        // ==========================================
        // 🌐 ফিচার ৩: URL ব্লকিং (Browser)
        // ==========================================
        if (isBrowser(packageName)) {
            String url = extractUrlFromBrowser(getRootInActiveWindow());
            if (url != null && !url.isEmpty() && !url.equals(lastBlockedUrl)) {
                Set<String> blockedSites = preferences.getBlockedSites();
                if (blockedSites != null) {
                    for (String site : blockedSites) {
                        if (urlMatches(url, site)) {
                            lastBlockedUrl = url;
                            preferences.incrementBlockedAttempts();
                            performGlobalAction(GLOBAL_ACTION_BACK);
                            Log.d(TAG, "Blocked URL: " + url + " (matched " + site + ")");
                            return;
                        }
                    }
                }
            }
        }

        // ==========================================
        // 🚫 ফিচার ৪: রিলস এবং কিওয়ার্ড স্ক্যানার
        // ==========================================
        if (type == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED || 
            type == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            
            AccessibilityNodeInfo rootNode = getRootInActiveWindow();
            if (rootNode != null) {
                // ৪.১ Reels & Shorts ব্লকার
                if (preferences.isReelsBlockEnabled() && isSocialMediaApp(packageName)) {
                    if (scanForReels(rootNode)) {
                        triggerBackAction("Reels/Shorts Detected!");
                        return;
                    }
                }

                // ৪.২ Keyword ব্লকার (স্ক্রিন টেক্সট স্ক্যান)
                Set<String> blockedKeywords = preferences.getBlockedKeywords();
                if (blockedKeywords != null && !blockedKeywords.isEmpty()) {
                    if (scanForKeywords(rootNode, blockedKeywords)) {
                        triggerBackAction("Forbidden Keyword Found!");
                        return;
                    }
                }
            }
        }

        // ==========================================
        // ⌨️ ফিচার ৫: Keyword ব্লকিং (Text Input)
        // ==========================================
        if (type == AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED) {
            CharSequence text = event.getText() != null && !event.getText().isEmpty()
                ? event.getText().get(0) : null;
            if (text != null && text.length() > 0) {
                String typed = text.toString().toLowerCase();
                Set<String> blockedKeywords = preferences.getBlockedKeywords();
                if (blockedKeywords != null) {
                    for (String kw : blockedKeywords) {
                        if (kw == null || kw.isEmpty()) continue;
                        if (typed.contains(kw.toLowerCase())) {
                            preferences.incrementBlockedAttempts();
                            performGlobalAction(GLOBAL_ACTION_BACK);
                            Log.d(TAG, "Blocked keyword: " + kw + " in " + packageName);
                            return;
                        }
                    }
                }
            }
        }
    }

    // ==========================================
    // 🛠️ হেল্পার ফাংশন
    // ==========================================

    private boolean isBrowser(String pkg) {
        for (String b : BROWSER_PACKAGES) if (b.equals(pkg)) return true;
        return false;
    }

    private String extractUrlFromBrowser(AccessibilityNodeInfo root) {
        if (root == null) return null;
        try {
            List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByViewId("com.android.chrome:id/url_bar");
            if (nodes != null && !nodes.isEmpty() && nodes.get(0).getText() != null) {
                return nodes.get(0).getText().toString();
            }
            nodes = root.findAccessibilityNodeInfosByViewId("com.brave.browser:id/url_bar");
            if (nodes != null && !nodes.isEmpty() && nodes.get(0).getText() != null) {
                return nodes.get(0).getText().toString();
            }
        } catch (Exception e) {}
        return null;
    }

    private boolean urlMatches(String url, String pattern) {
        if (url == null || pattern == null) return false;
        return url.toLowerCase().contains(pattern.toLowerCase().replace("https://", "").replace("http://", "").replace("www.", ""));
    }

    private boolean scanForText(AccessibilityNodeInfo node, String targetText) {
        if (node == null) return false;
        if (node.getText() != null && node.getText().toString().toLowerCase().contains(targetText.toLowerCase())) return true;
        if (node.getContentDescription() != null && node.getContentDescription().toString().toLowerCase().contains(targetText.toLowerCase())) return true;
        
        for (int i = 0; i < node.getChildCount(); i++) {
            if (scanForText(node.getChild(i), targetText)) return true;
        }
        return false;
    }

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
                if (keyword != null && !keyword.isEmpty() && screenText.contains(keyword.toLowerCase())) return true;
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
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_CLEAR_TASK |
                        Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS |
                        Intent.FLAG_ACTIVITY_NO_ANIMATION);
        startActivity(intent);
    }

    @Override
    public void onInterrupt() { 
        Log.e(TAG, "Shield Accessibility Service Interrupted"); 
    }
}