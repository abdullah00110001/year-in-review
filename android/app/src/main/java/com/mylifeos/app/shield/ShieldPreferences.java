package com.mylifeos.app.shield;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

public class ShieldPreferences {
    private static final String PREF_NAME = "ShieldPrefs";
    private SharedPreferences prefs;

    public ShieldPreferences(Context context) {
        prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    // ==========================================
    // 🛡️ Basic Shield Toggles
    // ==========================================
    public boolean isEnabled() {
        return prefs.getBoolean("is_enabled", false);
    }

    public void setEnabled(boolean enabled) {
        prefs.edit().putBoolean("is_enabled", enabled).apply();
    }

    public Set<String> getBlockedApps() {
        return prefs.getStringSet("blocked_apps", new HashSet<>());
    }

    public void setBlockedApps(Set<String> apps) {
        prefs.edit().putStringSet("blocked_apps", apps).apply();
    }

    // ==========================================
    // 🧠 Modes & Strict Mode
    // ==========================================
    public boolean isStrictMode() {
        return prefs.getBoolean("strict_mode", false);
    }

    public void setStrictMode(boolean strictMode) {
        prefs.edit().putBoolean("strict_mode", strictMode).apply();
    }

    public String getCurrentMode() {
        return prefs.getString("current_mode", "normal");
    }

    public void setCurrentMode(String mode) {
        prefs.edit().putString("current_mode", mode).apply();
    }

    // ==========================================
    // ⏱️ Time Limits
    // ==========================================
    public Map<String, Integer> getTimeLimits() {
        Map<String, Integer> map = new HashMap<>();
        String jsonString = prefs.getString("time_limits", "{}");
        try {
            JSONObject json = new JSONObject(jsonString);
            Iterator<String> keys = json.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                map.put(key, json.getInt(key));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return map;
    }

    public void setTimeLimits(Map<String, Integer> limits) {
        try {
            JSONObject json = new JSONObject();
            for (Map.Entry<String, Integer> entry : limits.entrySet()) {
                json.put(entry.getKey(), entry.getValue());
            }
            prefs.edit().putString("time_limits", json.toString()).apply();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ==========================================
    // 📅 Reset Dates
    // ==========================================
    public String getLastResetDate() {
        return prefs.getString("last_reset_date", "");
    }

    public void setLastResetDate(String date) {
        prefs.edit().putString("last_reset_date", date).apply();
    }

    // ✅ ShieldService.java এর রিকোয়েস্ট অনুযায়ী এই মেথডটি যোগ করা হলো
    public void updateLastResetDate(String date) {
        prefs.edit().putString("last_reset_date", date).apply();
    }
}
