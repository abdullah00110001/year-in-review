package com.mylifeos.app.shield.vision;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.*;
import android.util.Log;

import java.io.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * PureShieldAdaptiveEngine
 *
 * Dynamically adjusts all performance parameters based on:
 *  - Device RAM tier (low / mid / high)
 *  - CPU/GPU thermal state
 *  - Battery level and charging state
 *  - Current app (some apps need faster sampling)
 *  - Processing history (dropped frames)
 *
 * Goal: Never cause lag, never drain battery aggressively.
 */
public class PureShieldAdaptiveEngine {

    private static final String TAG = "PureShield.Adaptive";

    // ── Device tier ───────────────────────────────────────────────────────────
    public enum DeviceTier { LOW, MID, HIGH }
    private final DeviceTier deviceTier;

    // ── Context ───────────────────────────────────────────────────────────────
    private final Context context;
    private PureShieldConfig config;

    // ── Thermal tracking ──────────────────────────────────────────────────────
    private PowerManager.OnThermalStatusChangedListener thermalListener;
    private volatile int currentThermalStatus = PowerManager.THERMAL_STATUS_NONE;

    // ── Processing stats ──────────────────────────────────────────────────────
    private final AtomicInteger consecutiveSkips   = new AtomicInteger(0);
    private final AtomicInteger consecutiveSlowMs  = new AtomicInteger(0);
    private final AtomicLong    lastInferenceMs     = new AtomicLong(0);

    // ── Adaptive interval ─────────────────────────────────────────────────────
    private volatile long currentIntervalMs;
    private static final long INTERVAL_FAST   = 400;   // ~2.5fps capture
    private static final long INTERVAL_NORMAL = 700;   // ~1.4fps
    private static final long INTERVAL_SLOW   = 1200;  // ~0.8fps
    private static final long INTERVAL_IDLE   = 2000;  // 0.5fps — low activity

    // ─────────────────────────────────────────────────────────────────────────

    public PureShieldAdaptiveEngine(Context context) {
        this.context = context;
        this.deviceTier = detectDeviceTier();
        this.currentIntervalMs = getBaseInterval();
        this.config = new PureShieldConfig(); // defaults

        registerThermalListener();
        Log.i(TAG, "Device tier: " + deviceTier + " | base interval: " + currentIntervalMs + "ms");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Device tier detection
    // ─────────────────────────────────────────────────────────────────────────

    private DeviceTier detectDeviceTier() {
        ActivityManager am = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        am.getMemoryInfo(mi);

        long totalRamMb = mi.totalMem / (1024 * 1024);

        // Also check CPU core count
        int cores = Runtime.getRuntime().availableProcessors();

        if (totalRamMb >= 6000 && cores >= 8) return DeviceTier.HIGH;
        if (totalRamMb >= 3000 && cores >= 4) return DeviceTier.MID;
        return DeviceTier.LOW;
    }

    private long getBaseInterval() {
        switch (deviceTier) {
            case HIGH: return INTERVAL_FAST;
            case MID:  return INTERVAL_NORMAL;
            case LOW:  return INTERVAL_SLOW;
            default:   return INTERVAL_NORMAL;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Thermal listener
    // ─────────────────────────────────────────────────────────────────────────

    private void registerThermalListener() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            thermalListener = status -> {
                currentThermalStatus = status;
                onThermalChanged(status);
            };
            pm.addThermalStatusListener(thermalListener);
        }
    }

    private void onThermalChanged(int status) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return;
        switch (status) {
            case PowerManager.THERMAL_STATUS_NONE:
            case PowerManager.THERMAL_STATUS_LIGHT:
                currentIntervalMs = getBaseInterval();
                break;
            case PowerManager.THERMAL_STATUS_MODERATE:
                currentIntervalMs = INTERVAL_SLOW;
                Log.w(TAG, "Thermal MODERATE — reducing to slow mode");
                break;
            case PowerManager.THERMAL_STATUS_SEVERE:
            case PowerManager.THERMAL_STATUS_CRITICAL:
            case PowerManager.THERMAL_STATUS_EMERGENCY:
            case PowerManager.THERMAL_STATUS_SHUTDOWN:
                currentIntervalMs = INTERVAL_IDLE;
                Log.w(TAG, "Thermal SEVERE — entering idle sampling");
                break;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Frame skip decision
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns true if this frame should be skipped entirely.
     * Called before every capture attempt.
     */
    public boolean shouldSkipFrame() {
        // Skip if battery is critically low
        int battery = getBatteryLevel();
        if (battery < 10) return true;
        if (battery < 20 && deviceTier == DeviceTier.LOW) return true;

        // Skip if thermal is critical
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (currentThermalStatus >= PowerManager.THERMAL_STATUS_SEVERE) return true;
        }

        // Skip if last inference was very slow (means device is struggling)
        long lastMs = lastInferenceMs.get();
        if (lastMs > 0 && lastMs > currentIntervalMs * 2) {
            consecutiveSlowMs.incrementAndGet();
            if (consecutiveSlowMs.get() > 3) {
                // Too many slow frames — back off
                currentIntervalMs = Math.min(currentIntervalMs * 2, INTERVAL_IDLE);
                consecutiveSlowMs.set(0);
                Log.w(TAG, "Inference too slow — backed off to " + currentIntervalMs + "ms");
            }
            return true;
        } else if (lastMs > 0 && lastMs < currentIntervalMs / 2) {
            // Processing fast — can speed up slightly
            consecutiveSlowMs.set(0);
            if (deviceTier != DeviceTier.LOW) {
                currentIntervalMs = Math.max(getBaseInterval(), currentIntervalMs - 50);
            }
        }

        return false;
    }

    /**
     * Called by inference executor to record actual inference time.
     */
    public void recordInferenceTime(long durationMs) {
        lastInferenceMs.set(durationMs);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Capture resolution
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns capture width — lower than screen to reduce processing load.
     * BlazeFace only needs 128px anyway, but we capture slightly more
     * for overlay accuracy.
     */
    public int getCaptureWidth(int screenWidth) {
        switch (deviceTier) {
            case HIGH: return Math.min(screenWidth, 720);
            case MID:  return Math.min(screenWidth, 540);
            case LOW:  return Math.min(screenWidth, 360);
            default:   return 540;
        }
    }

    public int getCaptureHeight(int screenHeight) {
        switch (deviceTier) {
            case HIGH: return Math.min(screenHeight, 1280);
            case MID:  return Math.min(screenHeight, 960);
            case LOW:  return Math.min(screenHeight, 640);
            default:   return 960;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Inference thread config
    // ─────────────────────────────────────────────────────────────────────────

    public int getInferenceThreadCount() {
        switch (deviceTier) {
            case HIGH: return 4;
            case MID:  return 2;
            case LOW:  return 1;
            default:   return 2;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Interval
    // ─────────────────────────────────────────────────────────────────────────

    public long getSampleIntervalMs() {
        return currentIntervalMs;
    }

    public void onTargetAppResumed() {
        // When user opens a target app, temporarily use fast sampling
        // then fall back to base interval after a few seconds
        currentIntervalMs = getBaseInterval();
        consecutiveSlowMs.set(0);
    }

    public void onConfigChanged(PureShieldConfig newConfig) {
        this.config = newConfig;
        currentIntervalMs = getBaseInterval();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Battery
    // ─────────────────────────────────────────────────────────────────────────

    private int getBatteryLevel() {
        try {
            IntentFilter iFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = context.registerReceiver(null, iFilter);
            if (batteryStatus == null) return 100;
            int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, 100);
            int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
            return (int) ((level / (float) scale) * 100);
        } catch (Exception e) {
            return 100;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Summary for debug/UI
    // ─────────────────────────────────────────────────────────────────────────

    public AdaptiveStatus getStatus() {
        return new AdaptiveStatus(
            deviceTier.name(),
            currentIntervalMs,
            getBatteryLevel(),
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q ? currentThermalStatus : -1,
            lastInferenceMs.get()
        );
    }

    public static class AdaptiveStatus {
        public final String deviceTier;
        public final long sampleIntervalMs;
        public final int batteryLevel;
        public final int thermalStatus;
        public final long lastInferenceMs;

        AdaptiveStatus(String tier, long interval, int battery, int thermal, long lastMs) {
            this.deviceTier       = tier;
            this.sampleIntervalMs = interval;
            this.batteryLevel     = battery;
            this.thermalStatus    = thermal;
            this.lastInferenceMs  = lastMs;
        }
    }
}
