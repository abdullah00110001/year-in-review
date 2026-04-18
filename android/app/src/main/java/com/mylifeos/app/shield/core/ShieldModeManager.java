package com.mylifeos.app.shield.core;

import android.content.Context;
import com.mylifeos.app.shield.ShieldPreferences;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class ShieldModeManager {
    private final ShieldPreferences preferences;
    
    private static final Set<String> FOCUS_MODE_APPS = new HashSet<>(Arrays.asList(
        "com.instagram.android",
        "com.facebook.katana",
        "com.zhiliaoapp.musically",
        "com.google.android.youtube"
    ));
    
    private static final Set<String> SLEEP_MODE_APPS = new HashSet<>(Arrays.asList(
        "com.instagram.android",
        "com.facebook.katana",
        "com.zhiliaoapp.musically",
        "com.google.android.youtube",
        "com.twitter.android",
        "com.reddit.frontpage"
    ));

    public ShieldModeManager(Context context) {
        this.preferences = new ShieldPreferences(context);
    }

    public void activateFocusMode() {
        Set<String> current = preferences.getBlockedApps();
        current.addAll(FOCUS_MODE_APPS);
        preferences.setBlockedApps(current);
        preferences.setCurrentMode("focus");
        preferences.setEnabled(true);
    }

    public void activateSleepMode() {
        Set<String> current = preferences.getBlockedApps();
        current.addAll(SLEEP_MODE_APPS);
        preferences.setBlockedApps(current);
        preferences.setCurrentMode("sleep");
        preferences.setEnabled(true);
    }

    public void activateStrictMode() {
        preferences.setStrictMode(true);
        preferences.setEnabled(true);
    }

    public void deactivateMode() {
        preferences.setCurrentMode("normal");
        preferences.setEnabled(false);
    }

    public String getCurrentMode() {
        return preferences.getCurrentMode();
    }

    public boolean isStrictMode() {
        return preferences.isStrictMode();
    }
}