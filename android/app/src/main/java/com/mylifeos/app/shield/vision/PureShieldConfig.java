package com.mylifeos.app.shield.vision;

import android.content.Context;
import android.content.SharedPreferences;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.util.HashSet;
import java.util.Set;

// ─────────────────────────────────────────────────────────────────────────────
// PureShieldConfig — All runtime settings for the vision feature
// ─────────────────────────────────────────────────────────────────────────────
class PureShieldConfig {

    public enum BlurGender { FEMALE, MALE, BOTH }

    private BlurGender blurGender         = BlurGender.FEMALE;
    private PureShieldBlurView.BlurStyle blurStyle = PureShieldBlurView.BlurStyle.PIXELATE;
    private float confidenceThreshold     = 0.72f;
    private boolean enabled               = true;
    private boolean pauseOnBatteryBelow20 = true;
    private boolean showShieldIcon        = true;

    public PureShieldConfig() {}

    public BlurGender getBlurGender()                          { return blurGender; }
    public PureShieldBlurView.BlurStyle getBlurStyle()         { return blurStyle; }
    public float getConfidenceThreshold()                      { return confidenceThreshold; }
    public boolean isEnabled()                                 { return enabled; }
    public boolean isPauseOnBatteryBelow20()                   { return pauseOnBatteryBelow20; }
    public boolean isShowShieldIcon()                          { return showShieldIcon; }

    public void setBlurGender(BlurGender g)                    { this.blurGender = g; }
    public void setBlurStyle(PureShieldBlurView.BlurStyle s)   { this.blurStyle = s; }
    public void setConfidenceThreshold(float t)                { this.confidenceThreshold = t; }
    public void setEnabled(boolean e)                          { this.enabled = e; }
    public void setPauseOnBatteryBelow20(boolean p)            { this.pauseOnBatteryBelow20 = p; }
    public void setShowShieldIcon(boolean s)                   { this.showShieldIcon = s; }
}

// ─────────────────────────────────────────────────────────────────────────────
// PureShieldPreferences — SharedPreferences persistence
// ─────────────────────────────────────────────────────────────────────────────
class PureShieldPreferences {

    private static final String PREFS_NAME     = "PureShield_prefs";
    private static final String KEY_CONFIG     = "config";
    private static final String KEY_PACKAGES   = "target_packages";

    private static final Gson gson = new Gson();

    public static PureShieldConfig loadConfig(Context ctx) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_CONFIG, null);
        if (json == null) return new PureShieldConfig();
        try {
            return gson.fromJson(json, PureShieldConfig.class);
        } catch (Exception e) {
            return new PureShieldConfig();
        }
    }

    public static void saveConfig(Context ctx, PureShieldConfig config) {
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_CONFIG, gson.toJson(config))
            .apply();
    }

    public static Set<String> loadTargetPackages(Context ctx) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY_PACKAGES, null);
        if (json == null) return new HashSet<>();
        try {
            Type type = new TypeToken<Set<String>>(){}.getType();
            Set<String> result = gson.fromJson(json, type);
            return result != null ? result : new HashSet<>();
        } catch (Exception e) {
            return new HashSet<>();
        }
    }

    public static void saveTargetPackages(Context ctx, Set<String> packages) {
        ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PACKAGES, gson.toJson(packages))
            .apply();
    }

    public static void addTargetPackage(Context ctx, String pkg) {
        Set<String> packages = loadTargetPackages(ctx);
        packages.add(pkg);
        saveTargetPackages(ctx, packages);
    }

    public static void removeTargetPackage(Context ctx, String pkg) {
        Set<String> packages = loadTargetPackages(ctx);
        packages.remove(pkg);
        saveTargetPackages(ctx, packages);
    }
}
