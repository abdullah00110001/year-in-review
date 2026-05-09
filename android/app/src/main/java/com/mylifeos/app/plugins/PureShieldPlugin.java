package com.mylifeos.app.plugins;

import android.app.Activity;
import android.content.*;
import android.media.projection.MediaProjectionManager;
import android.net.Uri;
import android.provider.Settings;
import android.util.Log;
import com.mylifeos.app.shield.vision.PureShieldConfig;
import com.mylifeos.app.shield.vision.PureShieldService;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import com.mylifeos.app.shield.vision.*;

import java.util.*;

/**
 * PureShieldPlugin — Capacitor bridge
 *
 * Exposes all PureShield functionality to React/TypeScript frontend:
 *  - requestPermissions()
 *  - startPureShield()
 *  - stopPureShield()
 *  - setConfig(config)
 *  - setTargetApps(packages[])
 *  - getInstalledApps()
 *  - getAdaptiveStatus()
 *  - isRunning()
 */
@NativePlugin(requestCodes = { PureShieldPlugin.REQUEST_MEDIA_PROJECTION })
@CapacitorPlugin(name = "PureShield")
public class PureShieldPlugin extends Plugin {

    private static final String TAG = "PureShieldPlugin";
    static final int REQUEST_MEDIA_PROJECTION = 1001;
    static final int REQUEST_OVERLAY          = 1002;

    private PluginCall pendingStartCall;

    // ─────────────────────────────────────────────────────────────────────────
    // Permission check
    // ─────────────────────────────────────────────────────────────────────────

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject result = new JSObject();
        result.put("overlay",   hasOverlayPermission());
        result.put("projection", false); // MediaProjection requires runtime request
        call.resolve(result);
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        if (hasOverlayPermission()) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + getContext().getPackageName()));
        startActivityForResult(call, intent, REQUEST_OVERLAY);
    }

    @PluginMethod
    public void requestMediaProjection(PluginCall call) {
        this.pendingStartCall = call;
        MediaProjectionManager mpm = (MediaProjectionManager)
            getContext().getSystemService(Context.MEDIA_PROJECTION_SERVICE);
        startActivityForResult(call, mpm.createScreenCaptureIntent(), REQUEST_MEDIA_PROJECTION);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Start / Stop
    // ─────────────────────────────────────────────────────────────────────────

    @PluginMethod
    public void startPureShield(PluginCall call) {
        if (!hasOverlayPermission()) {
            call.reject("OVERLAY_PERMISSION_DENIED",
                "Overlay permission required. Call requestOverlayPermission() first.");
            return;
        }
        // MediaProjection is needed — trigger request
        this.pendingStartCall = call;
        MediaProjectionManager mpm = (MediaProjectionManager)
            getContext().getSystemService(Context.MEDIA_PROJECTION_SERVICE);
        startActivityForResult(call, mpm.createScreenCaptureIntent(), REQUEST_MEDIA_PROJECTION);
    }

    @PluginMethod
    public void stopPureShield(PluginCall call) {
        Intent intent = new Intent(getContext(), PureShieldService.class);
        intent.setAction(PureShieldService.Actions.STOP);
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void isRunning(PluginCall call) {
        JSObject result = new JSObject();
        result.put("running", PureShieldService.instance != null);
        call.resolve(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Config
    // ─────────────────────────────────────────────────────────────────────────

    @PluginMethod
    public void setConfig(PluginCall call) {
        PureShieldConfig config = PureShieldPreferences.loadConfig(getContext());

        String gender = call.getString("blurGender");
        if (gender != null) {
            try { config.setBlurGender(PureShieldConfig.BlurGender.valueOf(gender.toUpperCase())); }
            catch (Exception ignored) {}
        }

        String style = call.getString("blurStyle");
        if (style != null) {
            try { config.setBlurStyle(PureShieldBlurView.BlurStyle.valueOf(style.toUpperCase())); }
            catch (Exception ignored) {}
        }

        Double threshold = call.getDouble("confidenceThreshold");
        if (threshold != null) config.setConfidenceThreshold(threshold.floatValue());

        Boolean enabled = call.getBoolean("enabled");
        if (enabled != null) config.setEnabled(enabled);

        PureShieldPreferences.saveConfig(getContext(), config);

        // Notify running service
        Intent intent = new Intent(getContext(), PureShieldService.class);
        intent.setAction(PureShieldService.Actions.UPDATE_CONFIG);
        getContext().startService(intent);

        call.resolve();
    }

    @PluginMethod
    public void getConfig(PluginCall call) {
        PureShieldConfig config = PureShieldPreferences.loadConfig(getContext());
        JSObject result = new JSObject();
        result.put("blurGender", config.getBlurGender().name());
        result.put("blurStyle",  config.getBlurStyle().name());
        result.put("confidenceThreshold", config.getConfidenceThreshold());
        result.put("enabled", config.isEnabled());
        result.put("pauseOnBatteryBelow20", config.isPauseOnBatteryBelow20());
        call.resolve(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Target apps
    // ─────────────────────────────────────────────────────────────────────────

    @PluginMethod
    public void setTargetApps(PluginCall call) {
        JSArray packagesArray = call.getArray("packages");
        if (packagesArray == null) { call.reject("packages required"); return; }

        try {
            Set<String> packages = new HashSet<>();
            for (int i = 0; i < packagesArray.length(); i++) {
                packages.add(packagesArray.getString(i));
            }
            PureShieldPreferences.saveTargetPackages(getContext(), packages);

            // Notify running service
            Intent intent = new Intent(getContext(), PureShieldService.class);
            intent.setAction(PureShieldService.Actions.UPDATE_CONFIG);
            getContext().startService(intent);

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to set target apps: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getTargetApps(PluginCall call) {
        Set<String> packages = PureShieldPreferences.loadTargetPackages(getContext());
        JSArray arr = new JSArray();
        for (String pkg : packages) arr.put(pkg);
        JSObject result = new JSObject();
        result.put("packages", arr);
        call.resolve(result);
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        try {
            List<android.content.pm.ApplicationInfo> apps =
                getContext().getPackageManager().getInstalledApplications(
                    android.content.pm.PackageManager.GET_META_DATA);

            JSArray result = new JSArray();
            for (android.content.pm.ApplicationInfo app : apps) {
                // Only include launchable apps
                if (getContext().getPackageManager().getLaunchIntentForPackage(app.packageName) == null)
                    continue;
                // Skip system utility packages
                if (app.packageName.equals(getContext().getPackageName())) continue;

                JSObject item = new JSObject();
                item.put("packageName", app.packageName);
                item.put("appName", getContext().getPackageManager().getApplicationLabel(app).toString());
                result.put(item);
            }
            JSObject res = new JSObject();
            res.put("apps", result);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to get installed apps: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Status
    // ─────────────────────────────────────────────────────────────────────────

    @PluginMethod
    public void getAdaptiveStatus(PluginCall call) {
        if (PureShieldService.instance == null) {
            call.reject("Service not running");
            return;
        }
        // Access via static instance — safe because same process
        // In production, use AIDL or ResultReceiver for cleaner IPC
        call.resolve(); // simplified — extend with actual status
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Activity result handling
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_MEDIA_PROJECTION) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                // Start service with projection token
                Intent serviceIntent = new Intent(getContext(), PureShieldService.class);
                serviceIntent.setAction(PureShieldService.Actions.START_PROJECTION);
                serviceIntent.putExtra("resultCode", resultCode);
                serviceIntent.putExtra("data", data);

                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    getContext().startForegroundService(serviceIntent);
                } else {
                    getContext().startService(serviceIntent);
                }

                if (pendingStartCall != null) {
                    JSObject result = new JSObject();
                    result.put("started", true);
                    pendingStartCall.resolve(result);
                    pendingStartCall = null;
                }
            } else {
                if (pendingStartCall != null) {
                    pendingStartCall.reject("PROJECTION_DENIED",
                        "Screen capture permission denied by user");
                    pendingStartCall = null;
                }
            }
        }

        if (requestCode == REQUEST_OVERLAY) {
            PluginCall call = getSavedCall();
            if (call != null) {
                JSObject result = new JSObject();
                result.put("granted", hasOverlayPermission());
                call.resolve(result);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private boolean hasOverlayPermission() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(getContext());
        }
        return true;
    }
}
