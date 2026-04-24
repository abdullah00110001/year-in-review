package com.mylifeos.app.shield;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.HashSet;
import java.util.Set;

public class ShieldPreferences {
    private static final String TAG = "ShieldPreferences";
    private static final String PREFS_NAME = "ShieldPrefs";
    private static final String KEY_BLOCKED_APPS = "blocked_apps";
    private static final String KEY_IS_ENABLED = "shield_enabled";

    private SharedPreferences prefs;

    public ShieldPreferences(Context context) {
        // MODE_PRIVATE নিশ্চিত করে যে অন্য কোনো অ্যাপ এই ডাটা চুরি করতে পারবে না
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    // ==========================================
    // 🛡️ শিল্ড অন/অফ কন্ট্রোল
    // ==========================================

    public boolean isEnabled() {
        return prefs.getBoolean(KEY_IS_ENABLED, false);
    }

    public void setEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_IS_ENABLED, enabled).apply();
        Log.d(TAG, "Shield Master Switch is now: " + (enabled ? "ON" : "OFF"));
    }

    // ==========================================
    // 📱 অ্যাপ ব্লকিং ডাটাবেস (JSON Bridge)
    // ==========================================

    /**
     * ডাটাবেস থেকে ব্লক করা অ্যাপের লিস্ট নিয়ে আসবে।
     * রিয়েক্ট JSON হিসেবে সেভ করে, তাই আমরা JSON পার্স করে Set এ কনভার্ট করছি।
     */
    public Set<String> getBlockedApps() {
        Set<String> apps = new HashSet<>();
        String json = prefs.getString(KEY_BLOCKED_APPS, "[]");
        try {
            JSONArray array = new JSONArray(json);
            for (int i = 0; i < array.length(); i++) {
                apps.add(array.getString(i));
            }
        } catch (JSONException e) {
            Log.e(TAG, "Failed to parse blocked apps JSON", e);
        }
        return apps;
    }

    /**
     * জাভা বা নেটিভ সার্ভিস থেকে নতুন ব্লক লিস্ট সেভ করার মেথড।
     * এটা Set কে আবার JSON এ কনভার্ট করে সেভ করে যাতে রিয়েক্ট পড়তে পারে।
     */
    public void setBlockedApps(Set<String> apps) {
        JSONArray array = new JSONArray();
        for (String app : apps) {
            array.put(app);
        }
        // apply() ব্যাকগ্রাউন্ডে সেভ করে, তাই অ্যাপ ফ্রিজ হয় না
        prefs.edit().putString(KEY_BLOCKED_APPS, array.toString()).apply();
        Log.d(TAG, "Updated Blocked Apps List: " + apps.size() + " apps restricted.");
    }
}
