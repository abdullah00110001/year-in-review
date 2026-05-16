package com.mylifeos.app.shield.vision;

import android.app.ActivityManager;
import android.content.Context;
import android.os.Build;
import android.util.Log;

/**
 * PureShieldModelManager - Hybrid AI Model Selection System
 *
 * Uses different models for each tier:
 * HIGH: BlazeFace (detection) + Gender Model
 * MID:  YOLOv5n-face (all-in-one)
 * LOW:  MediaPipe Face (ultra-light)
 */
public class PureShieldModelManager {

    private static final String TAG = "PureShieldModelManager";

    public enum ModelTier {
        HIGH,   // BlazeFace + Gender = Best accuracy
        MID,    // YOLOv5n-face = Balanced
        LOW     // MediaPipe = Ultra-fast
    }

    public enum DevicePerformance {
        HIGH,   // 6GB+ RAM, 8+ cores, GPU
        MID,    // 4-6GB RAM, 4-8 cores
        LOW     // 2-4GB RAM, 4 cores, no GPU
    }

    private final Context context;
    private ModelTier selectedTier;
    private DevicePerformance devicePerf;

    public PureShieldModelManager(Context context) {
        this.context = context;
        // ⚠️ LAZY: do NOT touch TensorFlow Lite here.
        // Loading GpuDelegate on app startup crashes devices without GPU support
        // (UnsatisfiedLinkError on libtensorflowlite_gpu_jni.so). Detection is
        // deferred until the user actually starts PureShield.
        this.devicePerf = detectDevicePerformanceLight();

        ModelTier saved = PureShieldPreferences.loadSelectedModelTier(context);
        this.selectedTier = saved != null ? saved : getTierForDevice(devicePerf);

        Log.i(TAG, "Device Performance (lazy/no-GPU-probe): " + devicePerf);
        Log.i(TAG, "Selected Model Tier: " + selectedTier);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Auto-Detection (LIGHT — no native library loading)
    // ─────────────────────────────────────────────────────────────────────────

    private DevicePerformance detectDevicePerformanceLight() {
        try {
            ActivityManager am = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
            am.getMemoryInfo(mi);

            long totalRamMb = mi.totalMem / (1024 * 1024);
            int cores = Runtime.getRuntime().availableProcessors();

            Log.d(TAG, "RAM: " + totalRamMb + "MB, Cores: " + cores + " (GPU probe deferred)");

            // RAM + cores based heuristic only. GPU availability is checked
            // safely later inside PureShieldService.buildInterpreterOptions()
            // with try/catch fallback to CPU.
            if (totalRamMb >= 6000 && cores >= 8) {
                return DevicePerformance.HIGH;
            } else if (totalRamMb >= 4000 && cores >= 4) {
                return DevicePerformance.MID;
            } else {
                return DevicePerformance.LOW;
            }
        } catch (Throwable t) {
            Log.w(TAG, "detectDevicePerformanceLight failed, defaulting LOW", t);
            return DevicePerformance.LOW;
        }
    }

    /**
     * GPU support probe — ONLY call this from a worker thread AFTER the user
     * has started PureShield. Never call from plugin load() or app startup.
     */
    private boolean hasGpuSupport() {
        try {
            org.tensorflow.lite.gpu.GpuDelegate probe = new org.tensorflow.lite.gpu.GpuDelegate();
            try { probe.close(); } catch (Throwable ignored) {}
            return true;
        } catch (Throwable e) {
            return false;
        }
    }

    private ModelTier getTierForDevice(DevicePerformance perf) {
        switch (perf) {
            case HIGH: return ModelTier.HIGH;
            case MID:  return ModelTier.MID;
            case LOW:  return ModelTier.LOW;
            default:   return ModelTier.MID;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Model Configuration
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get face detector model file based on tier
     * HIGH: blazeface.tflite (400KB)
     * MID:  yolov5n_face.tflite (4.2MB)
     * LOW:  mediapipe_face.tflite (224KB)
     */
    public String getFaceDetectorModel() {
        switch (selectedTier) {
            case HIGH:
                return "blazeface.tflite";
            case MID:
                return "blaze_face_short_range.tflite";
            case LOW:
                return "mediapipe_face.tflite";
            default:
                return "mediapipe_face.tflite";
        }
    }

    /**
     * Get gender classifier model (only for HIGH tier)
     * MID and LOW have gender detection built-in
     */
    public String getGenderClassifierModel() {
        if (selectedTier == ModelTier.HIGH) {
            return "gender_mobilenet.tflite";  // 2MB
        }
        return null;  // MID and LOW have gender built-in
    }

    public int getFaceDetectionInputSize() {
        switch (selectedTier) {
            case HIGH: return 128;  // BlazeFace
            case MID:  return 416;  // YOLOv5n
            case LOW:  return 128;  // MediaPipe
            default:   return 128;
        }
    }

    public int getGenderClassificationInputSize() {
        if (selectedTier == ModelTier.HIGH) {
            return 96;  // MobileNetV3
        }
        return 0;  // Not used for MID/LOW
    }

    /**
     * Expected inference time per frame (ms)
     */
    public long getExpectedInferenceTimeMs() {
        switch (selectedTier) {
            case HIGH: return 100;  // BlazeFace (~50ms) + Gender (~50ms)
            case MID:  return 80;   // YOLOv5n (~80ms on CPU)
            case LOW:  return 20;   // MediaPipe ultra-light (~20ms)
            default:   return 60;
        }
    }

    /**
     * Frame sampling interval (ms)
     */
    public long getSamplingIntervalMs() {
        switch (selectedTier) {
            case HIGH: return 300;  // ~3 fps
            case MID:  return 500;  // ~2 fps
            case LOW:  return 700;  // ~1.4 fps
            default:   return 500;
        }
    }

    /**
     * Expected FPS
     */
    public int getExpectedFps() {
        switch (selectedTier) {
            case HIGH: return 10;   // Real-time
            case MID:  return 5;    // Good
            case LOW:  return 2;    // Acceptable
            default:   return 5;
        }
    }

    /**
     * Expected battery drain per hour (%)
     */
    public float getExpectedBatteryDrainPerHour() {
        switch (selectedTier) {
            case HIGH: return 8f;   // GPU intensive
            case MID:  return 4f;   // Moderate
            case LOW:  return 1.5f; // Light
            default:   return 4f;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // User Override
    // ─────────────────────────────────────────────────────────────────────────

    public void setSelectedTier(ModelTier tier) {
        this.selectedTier = tier;
        PureShieldPreferences.saveSelectedModelTier(context, tier);
        Log.i(TAG, "Model tier changed to: " + tier);
    }

    public ModelTier getSelectedTier() {
        return selectedTier;
    }

    public ModelTier getAutoDetectedTier() {
        return getTierForDevice(devicePerf);
    }

    public DevicePerformance getDevicePerformance() {
        return devicePerf;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Device Info for UI
    // ─────────────────────────────────────────────────────────────────────────

    public String getTierName() {
        switch (selectedTier) {
            case HIGH: return "High Quality";
            case MID:  return "Balanced";
            case LOW:  return "Battery Saver";
            default:   return "Unknown";
        }
    }

    public String getTierDescription() {
        switch (selectedTier) {
            case HIGH: return "Best accuracy, BlazeFace + Gender model (uses more GPU)";
            case MID:  return "Good balance, BlazeFace short-range model";
            case LOW:  return "Fastest, MediaPipe ultra-light model (minimal battery)";
            default:   return "Unknown";
        }
    }

    public String getDeviceInfo() {
        ActivityManager am = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        am.getMemoryInfo(mi);
        
        long ramGb = mi.totalMem / (1024 * 1024 * 1024);
        int cores = Runtime.getRuntime().availableProcessors();
        // GPU probe intentionally skipped here — only run after PureShield starts
        return String.format(
            "RAM: %dGB | Cores: %d | Device: %s",
            ramGb, cores, Build.MODEL
        );
    }
}
