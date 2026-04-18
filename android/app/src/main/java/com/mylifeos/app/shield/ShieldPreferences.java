package com.mylifeos.app.shield;

import android.content.Context;
import android.content.SharedPreferences;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class ShieldPreferences {
    private static final String PREF_NAME = "shield_prefs";
    private static final String KEY_IS_ENABLED = "is_enabled";
    private static final String KEY_BLOCKED_APPS = "blocked_apps";
    private static final String KEY_CURRENT_MODE = "current_mode";
    private static final String KEY_TIME_LIMITS = "time_limits";
    private static final String KEY_STATS_CACHE = "stats_cache";
    private static final String KEY_LAST_RESET = "last_reset_date";
    private static final String KEY_STRICT_MODE = "strict_mode";

    private final SharedPreferences prefs;
    private final Gson gson;

    public ShieldPreferences(Context context) {
        prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        gson = new Gson();
    }

    public boolean isEnabled() {
        return prefs.getBoolean(KEY_IS_ENABLED, false);
    }

    public void setEnabled(boolean enabled) {
        prefs.edit().putBoolean(KEY_IS_ENABLED, enabled).apply();
    }

    public Set<String> getBlockedApps() {
        return prefs.getStringSet(KEY_BLOCKED_APPS, new HashSet<>());
    }

    public void setBlockedApps(Set<String> packages) {
        prefs.edit().putStringSet(KEY_BLOCKED_APPS, packages).apply();
    }

    public String getCurrentMode() {
        return prefs.getString(KEY_CURRENT_MODE, "normal");
    }

    public void setCurrentMode(String mode) {
        prefs.edit().putString(KEY_CURRENT_MODE, mode).apply();
    }

    public Map<String, Integer> getTimeLimits() {
        String json = prefs.getString(KEY_TIME_LIMITS, "{}");
        Type type = new TypeToken<HashMap<String, Integer>>(){}.getType();
        Map<String, Integer> map = gson.fromJson(json, type);
        return map != null ? map : new HashMap<>();
    }

    public void setTimeLimits(Map<String, Integer> limits) {
        String json = gson.toJson(limits);
        prefs.edit().putString(KEY_TIME_LIMITS, json).apply();
    }

    public boolean isStrictMode() {
        return prefs.getBoolean(KEY_STRICT_MODE, false);
    }

    public void setStrictMode(boolean strict) {
        prefs.edit().putBoolean(KEY_STRICT_MODE, strict).apply();
    }

    public String getLastResetDate() {
        return prefs.getString(KEY_LAST_RESET, "");
    }

    public void updateLastResetDate(String date) {
        prefs.edit().putString(KEY_LAST_RESET, date).apply();
    }

    public void clearAll() {
        prefs.edit().clear().apply();
    }
}