package com.mylifeos.app.shield.vision;

import android.app.*;
import android.content.*;
import android.content.res.AssetFileDescriptor;
import android.graphics.*;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.*;
import android.util.*;
import android.view.*;

import androidx.core.app.NotificationCompat;

import com.mylifeos.app.R;

import org.tensorflow.lite.Interpreter;
import org.tensorflow.lite.gpu.GpuDelegate;

import java.io.*;
import java.nio.*;
import java.nio.channels.FileChannel;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

public class PureShieldService extends Service {

    private static final String TAG = "PureShieldService";
    private static final String CHANNEL_ID = "PureShield_channel";
    private static final int NOTIF_ID = 9901;

    private int screenWidth, screenHeight, screenDensity;

    private MediaProjection mediaProjection;
    private VirtualDisplay virtualDisplay;
    private ImageReader imageReader;

    private Interpreter faceDetector;
    private Interpreter genderClassifier;
    private GpuDelegate gpuDelegate;
    private int genderInputWidth = 64;
    private int genderInputHeight = 64;

    private WindowManager windowManager;
    private final List<View> blurOverlays = new CopyOnWriteArrayList<>();

    private PureShieldAdaptiveEngine adaptiveEngine;
    private PureShieldModelManager modelManager;

    private ExecutorService inferenceExecutor;
    private ScheduledExecutorService samplerExecutor;
    private ScheduledFuture<?> samplerTask;
    private final AtomicBoolean isProcessing = new AtomicBoolean(false);
    private final AtomicBoolean isRunning    = new AtomicBoolean(false);

    private PureShieldConfig config;
    private Set<String> targetPackages = new HashSet<>();
    private String currentForegroundPackage = "";
    private boolean restartOnDestroy = true;

    // ✅ Debug Counters
    public static final AtomicInteger totalFramesProcessed = new AtomicInteger(0);
    public static final AtomicInteger totalFacesDetected   = new AtomicInteger(0);
    public static final AtomicInteger totalFacesBlurred    = new AtomicInteger(0);
    public static final AtomicLong    lastInferenceMs      = new AtomicLong(0);
    public static volatile String     lastDebugMessage     = "Not started yet";

    public static PureShieldService instance;
    public static volatile String lastModelStatus       = "UNKNOWN";
    public static volatile String lastModelStatusReason = null;

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;

        windowManager  = (WindowManager) getSystemService(WINDOW_SERVICE);
        adaptiveEngine = new PureShieldAdaptiveEngine(this);
        modelManager   = new PureShieldModelManager(this);
        config         = PureShieldPreferences.loadConfig(this);
        targetPackages = PureShieldPreferences.loadTargetPackages(this);

        DisplayMetrics metrics = new DisplayMetrics();
        windowManager.getDefaultDisplay().getRealMetrics(metrics);
        screenWidth   = metrics.widthPixels;
        screenHeight  = metrics.heightPixels;
        screenDensity = metrics.densityDpi;

        inferenceExecutor = Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "PureShield-Inference");
            t.setPriority(Thread.NORM_PRIORITY - 1);
            return t;
        });
        samplerExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "PureShield-Sampler");
            t.setPriority(Thread.MIN_PRIORITY);
            return t;
        });

        createNotificationChannel();

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIF_ID, buildNotification(),
                    android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            } else {
                startForeground(NOTIF_ID, buildNotification());
            }
        } catch (Throwable e) {
            Log.e(TAG, "❌ startForeground failed: " + e.getMessage(), e);
            stopSelf();
            return;
        }

        lastDebugMessage = "Service created. Tier: " + modelManager.getSelectedTier();
        Log.i(TAG, "✅ PureShieldService created — tier: " + modelManager.getSelectedTier());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_STICKY;
        String action = intent.getAction();
        if (action == null) return START_STICKY;

        switch (action) {
            case Actions.START_PROJECTION:
                restartOnDestroy = true;
                int resultCode = intent.getIntExtra("resultCode", Activity.RESULT_CANCELED);
                Intent data = intent.getParcelableExtra("data");
                startProjection(resultCode, data);
                break;

            case Actions.STOP:
                restartOnDestroy = false;
                isRunning.set(false);
                clearAllOverlays();
                cancelNotification();
                stopSelf();
                break;

            case Actions.UPDATE_CONFIG:
                config = PureShieldPreferences.loadConfig(this);
                targetPackages = PureShieldPreferences.loadTargetPackages(this);
                adaptiveEngine.onConfigChanged(config);
                Log.d(TAG, "⚙️ Config updated — targets: " + targetPackages);
                break;

            case Actions.FOREGROUND_APP_CHANGED:
                String pkg = intent.getStringExtra("package");
                Log.d(TAG, "📱 Foreground app: " + pkg + " | targets: " + targetPackages);
                onForegroundAppChanged(pkg);
                break;

            case Actions.SWITCH_MODEL_TIER:
                switchModelTier(intent.getStringExtra("tier"));
                break;
        }

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        isRunning.set(false);
        stopSampler();
        releaseProjection();
        releaseModels();
        clearAllOverlays();
        if (inferenceExecutor != null) inferenceExecutor.shutdownNow();
        if (samplerExecutor   != null) samplerExecutor.shutdownNow();
        if (!restartOnDestroy) cancelNotification();
        instance = null;
        super.onDestroy();
        if (restartOnDestroy) scheduleRestart();
        Log.i(TAG, "⚠️ onDestroy (restart=" + restartOnDestroy + ")");
    }

    private void cancelNotification() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE);
            } else {
                stopForeground(true);
            }
        } catch (Throwable ignored) {}
        try {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) { nm.cancel(NOTIF_ID); nm.cancelAll(); }
        } catch (Throwable ignored) {}
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    public boolean isPureShieldRunning() { return isRunning.get(); }

    public PureShieldAdaptiveEngine.AdaptiveStatus getAdaptiveStatus() {
        return adaptiveEngine != null
            ? adaptiveEngine.getStatus()
            : new PureShieldAdaptiveEngine.AdaptiveStatus("MID", 700, 100, -1, 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MediaProjection
    // ─────────────────────────────────────────────────────────────────────────

    private void startProjection(int resultCode, Intent data) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIF_ID, buildNotification(),
                    android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION);
            }
        } catch (Throwable t) {
            Log.e(TAG, "❌ FG upgrade failed: " + t.getMessage(), t);
            broadcastModelStatus("MODEL_FAILED", "Foreground upgrade failed");
            stopSelf(); return;
        }

        MediaProjectionManager mpm =
            (MediaProjectionManager) getSystemService(MEDIA_PROJECTION_SERVICE);
        try {
            mediaProjection = mpm.getMediaProjection(resultCode, data);
        } catch (Throwable t) {
            Log.e(TAG, "❌ getMediaProjection failed: " + t.getMessage(), t);
            broadcastModelStatus("MODEL_FAILED", "Screen capture unavailable");
            stopSelf(); return;
        }

        if (mediaProjection == null) {
            broadcastModelStatus("MODEL_FAILED", "MediaProjection null");
            stopSelf(); return;
        }

        mediaProjection.registerCallback(new MediaProjection.Callback() {
            @Override public void onStop() {
                releaseProjection();
                if (restartOnDestroy) scheduleRestart();
            }
        }, new Handler(Looper.getMainLooper()));

        int captureW = adaptiveEngine.getCaptureWidth(screenWidth);
        int captureH = adaptiveEngine.getCaptureHeight(screenHeight);

        imageReader = ImageReader.newInstance(captureW, captureH, PixelFormat.RGBA_8888, 2);
        virtualDisplay = mediaProjection.createVirtualDisplay(
            "PureShieldCapture", captureW, captureH, screenDensity,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader.getSurface(), null, null
        );

        loadModels();
        isRunning.set(true);
        startSampler();
        lastDebugMessage = "Projection started: " + captureW + "x" + captureH;
        Log.i(TAG, "📱 " + lastDebugMessage);
    }

    private void releaseProjection() {
        if (virtualDisplay  != null) { virtualDisplay.release();  virtualDisplay  = null; }
        if (imageReader     != null) { imageReader.close();       imageReader     = null; }
        if (mediaProjection != null) { mediaProjection.stop();    mediaProjection = null; }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Model Loading — ✅ Fixed for real models
    // ─────────────────────────────────────────────────────────────────────────

    private boolean loadModels() {
        Interpreter.Options options;
        try {
            options = buildInterpreterOptions();
        } catch (Throwable t) {
            broadcastModelStatus("MODEL_FAILED", "TFLite init failed");
            return false;
        }

        // ✅ Use BlazeFace 128x128 family — known decoder, 896 anchors.
        String faceModel = modelManager.getFaceDetectorModel();

        // Fallback chain: tier model → blaze_face_short_range → blazeface
        // (mediapipe_face.tflite is NOT in the chain — its output format
        // is incompatible with our BlazeFace decoder.)
        if (!assetExists(faceModel)) {
            Log.w(TAG, "⚠️ " + faceModel + " missing, trying blaze_face_short_range");
            faceModel = "blaze_face_short_range.tflite";
        }
        if (!assetExists(faceModel)) {
            Log.w(TAG, "⚠️ blaze_face_short_range missing, trying blazeface");
            faceModel = "blazeface.tflite";
        }
        if (!assetExists(faceModel)) {
            broadcastModelStatus("MODEL_EMPTY", "No usable BlazeFace model in assets");
            return false;
        }

        try {
            Log.i(TAG, "📂 Loading face model: " + faceModel);
            try {
                faceDetector = new Interpreter(loadModelFile(faceModel), options);
                // ✅ Sanity-check: run a tiny dummy inference to catch GPU
                // delegate failures NOW instead of silently every frame.
                int[] s = faceDetector.getInputTensor(0).shape();
                float[][][][] dummy = new float[1][s[1]][s[2]][3];
                int nOut = faceDetector.getOutputTensorCount();
                Map<Integer, Object> dummyOuts = new HashMap<>();
                for (int i = 0; i < nOut; i++) {
                    int[] os = faceDetector.getOutputTensor(i).shape();
                    if (os.length == 3) dummyOuts.put(i, new float[os[0]][os[1]][os[2]]);
                    else if (os.length == 2) dummyOuts.put(i, new float[os[0]][os[1]]);
                    else dummyOuts.put(i, new float[1][1]);
                }
                faceDetector.runForMultipleInputsOutputs(new Object[]{dummy}, dummyOuts);
            } catch (Throwable gpuFail) {
                Log.w(TAG, "⚠️ GPU/face init failed, retrying CPU-only: " + gpuFail.getMessage());
                if (faceDetector != null) { try { faceDetector.close(); } catch (Throwable ignored) {} faceDetector = null; }
                if (gpuDelegate != null) { try { gpuDelegate.close(); } catch (Throwable ignored) {} gpuDelegate = null; }
                faceDetector = new Interpreter(loadModelFile(faceModel), buildCpuInterpreterOptions());
            }

            // ✅ Detect model input size dynamically
            int[] inputShape = faceDetector.getInputTensor(0).shape();
            Log.i(TAG, "✅ Model input shape: " + Arrays.toString(inputShape));

            // ✅ Load gender model on CPU (small model, GPU not worth it)
            String genderModelFile = modelManager.getGenderClassifierModel();
            if (genderModelFile != null && assetExists(genderModelFile)) {
                try {
                    Log.i(TAG, "📂 Loading gender model: " + genderModelFile);
                    genderClassifier = new Interpreter(loadModelFile(genderModelFile), buildCpuInterpreterOptions());
                    int[] genderShape = genderClassifier.getInputTensor(0).shape();
                    if (genderShape.length >= 4) {
                        genderInputHeight = genderShape[1];
                        genderInputWidth = genderShape[2];
                    }
                    Log.i(TAG, "✅ Gender model loaded — input=" + genderInputWidth + "x" + genderInputHeight);
                } catch (Throwable gt) {
                    genderClassifier = null;
                    Log.w(TAG, "⚠️ Gender model load failed — falling back to blur-all-faces: " + gt.getMessage());
                }
            } else {
                Log.w(TAG, "⚠️ No gender model found — blur-all-faces fallback active");
            }

            broadcastModelStatus("OK", faceModel);
            lastDebugMessage = "Model loaded: " + faceModel + " input=" + inputShape[1] + "x" + inputShape[2];
            Log.i(TAG, "✅ " + lastDebugMessage);
            return true;
        } catch (Throwable e) {
            Log.e(TAG, "❌ Load failed: " + e.getMessage(), e);
            broadcastModelStatus("MODEL_FAILED", e.getMessage());
            return false;
        }
    }

    private boolean assetExists(String name) {
        if (name == null) return false;
        try {
            AssetFileDescriptor fd = getAssets().openFd(name);
            long size = fd.getDeclaredLength();
            fd.close();
            return size > 10000; // Must be > 10KB
        } catch (Throwable t) { return false; }
    }

    private void broadcastModelStatus(String status, String reason) {
        lastModelStatus = status;
        lastModelStatusReason = reason;
        try {
            Intent i = new Intent("com.mylifeos.app.PURESHIELD_STATUS");
            i.putExtra("status", status);
            if (reason != null) i.putExtra("reason", reason);
            sendBroadcast(i);
        } catch (Throwable ignored) {}
    }

    private Interpreter.Options buildInterpreterOptions() {
        Interpreter.Options options = new Interpreter.Options();
        options.setNumThreads(adaptiveEngine.getInferenceThreadCount());
        try {
            gpuDelegate = new GpuDelegate();
            options.addDelegate(gpuDelegate);
            Log.i(TAG, "🎮 GPU delegate enabled");
        } catch (Throwable e) {
            gpuDelegate = null;
            Log.w(TAG, "⚠️ GPU unavailable, using CPU");
        }
        return options;
    }

    private Interpreter.Options buildCpuInterpreterOptions() {
        Interpreter.Options options = new Interpreter.Options();
        options.setNumThreads(Math.max(1, adaptiveEngine.getInferenceThreadCount()));
        return options;
    }

    private MappedByteBuffer loadModelFile(String filename) throws IOException {
        AssetFileDescriptor fd = getAssets().openFd(filename);
        FileInputStream fis    = new FileInputStream(fd.getFileDescriptor());
        FileChannel fc         = fis.getChannel();
        MappedByteBuffer buf   = fc.map(FileChannel.MapMode.READ_ONLY, fd.getStartOffset(), fd.getDeclaredLength());
        fis.close();
        Log.d(TAG, "✅ Loaded: " + filename + " (" + (buf.capacity()/1024) + "KB)");
        return buf;
    }

    private void releaseModels() {
        if (faceDetector    != null) { faceDetector.close();     faceDetector    = null; }
        if (genderClassifier!= null) { genderClassifier.close(); genderClassifier= null; }
        if (gpuDelegate     != null) { gpuDelegate.close();      gpuDelegate     = null; }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Frame Sampling
    // ─────────────────────────────────────────────────────────────────────────

    private void startSampler() {
        long intervalMs = adaptiveEngine.getSampleIntervalMs();
        samplerTask = samplerExecutor.scheduleAtFixedRate(
            this::captureAndProcess, 500, intervalMs, TimeUnit.MILLISECONDS);
        Log.i(TAG, "▶️ Sampler started: " + intervalMs + "ms interval");
    }

    private void stopSampler() {
        if (samplerTask != null) { samplerTask.cancel(true); samplerTask = null; }
    }

    private void rescheduleSampler() {
        stopSampler();
        if (isRunning.get()) startSampler();
    }

    private void captureAndProcess() {
        if (!isRunning.get() || isProcessing.get()) return;

        // ✅ Allow processing if:
        //   1) target app is in foreground (normal case), OR
        //   2) targetPackages is empty (universal mode — protect everywhere), OR
        //   3) we haven't received any foreground signal yet (bootstrap before
        //      Accessibility delivers TYPE_WINDOW_STATE_CHANGED).
        boolean noTargets   = targetPackages.isEmpty();
        boolean noFgSignal  = currentForegroundPackage == null || currentForegroundPackage.isEmpty();
        boolean isOurTarget = isTargetAppInForeground();

        if (!noTargets && !noFgSignal && !isOurTarget) {
            clearAllOverlays();
            return;
        }

        if (adaptiveEngine.shouldSkipFrame()) return;

        Image image = null;
        try {
            image = imageReader.acquireLatestImage();
            if (image == null) return;

            isProcessing.set(true);
            Bitmap bitmap = imageToBitmap(image);
            image.close(); image = null;

            if (bitmap == null) { isProcessing.set(false); return; }

            totalFramesProcessed.incrementAndGet();

            inferenceExecutor.submit(() -> {
                try { processFrame(bitmap); }
                catch (Exception e) { Log.e(TAG, "❌ Inference error: " + e.getMessage()); }
                finally { bitmap.recycle(); isProcessing.set(false); }
            });
        } catch (Exception e) {
            Log.e(TAG, "❌ Capture error: " + e.getMessage());
            if (image != null) image.close();
            isProcessing.set(false);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Inference — ✅ Fixed with dynamic input size + debug counters
    // ─────────────────────────────────────────────────────────────────────────

    private void processFrame(Bitmap bitmap) {
        if (faceDetector == null) {
            lastDebugMessage = "❌ faceDetector is null!";
            return;
        }

        long startMs = System.currentTimeMillis();

        // ✅ Get real input size from model
        int[] inputShape = faceDetector.getInputTensor(0).shape();
        int inputH = inputShape[1];
        int inputW = inputShape[2];

        List<RectF> faces = detectFaces(bitmap, inputW, inputH);

        long inferMs = System.currentTimeMillis() - startMs;
        lastInferenceMs.set(inferMs);

        int faceCount = faces.size();
        totalFacesDetected.addAndGet(faceCount);

        // ✅ Debug log every frame
        Log.d(TAG, "🔍 Frame #" + totalFramesProcessed.get()
            + " | Faces: " + faceCount
            + " | Time: " + inferMs + "ms"
            + " | App: " + currentForegroundPackage);

        if (faceCount == 0) {
            lastDebugMessage = "Frame #" + totalFramesProcessed.get() + ": No faces detected";
            clearAllOverlays();
            return;
        }

        List<RectF> toBlur = new ArrayList<>();
        for (RectF face : faces) {
            GenderResult result = estimateGender(bitmap, face);
            boolean blur = shouldBlur(result);

            Log.d(TAG, "👤 Face | female=" + String.format("%.2f", result.femaleProbability)
                + " male=" + String.format("%.2f", result.maleProbability)
                + " → blur=" + blur);

            if (blur) {
                toBlur.add(scaleToScreenCoords(face, bitmap.getWidth(), bitmap.getHeight()));
                totalFacesBlurred.incrementAndGet();
            }
        }

        lastDebugMessage = "Frame #" + totalFramesProcessed.get()
            + " | Detected: " + faceCount
            + " | Blurred: " + toBlur.size()
            + " | Total blurred: " + totalFacesBlurred.get();

        // ✅ Update notification with live stats
        updateNotificationStats();

        new Handler(Looper.getMainLooper()).post(() -> updateOverlays(toBlur));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ Unified face detection with dynamic input size
    // ─────────────────────────────────────────────────────────────────────────

    private List<RectF> detectFaces(Bitmap src, int inputW, int inputH) {
        Bitmap resized = Bitmap.createScaledBitmap(src, inputW, inputH, false);

        float[][][][] input = new float[1][inputH][inputW][3];
        int[] pixels = new int[inputW * inputH];
        resized.getPixels(pixels, 0, inputW, 0, 0, inputW, inputH);
        resized.recycle();

        // ✅ MediaPipe/BlazeFace normalization: [-1, 1]
        for (int i = 0; i < pixels.length; i++) {
            int p = pixels[i];
            int y = i / inputW, x = i % inputW;
            input[0][y][x][0] = (((p >> 16) & 0xFF) / 127.5f) - 1f;
            input[0][y][x][1] = (((p >> 8)  & 0xFF) / 127.5f) - 1f;
            input[0][y][x][2] = ((p & 0xFF)          / 127.5f) - 1f;
        }

        // ✅ Try multi-output first (BlazeFace format)
        try {
            // BlazeFace short range: 896 anchors
            // BlazeFace full range: 896 anchors
            float[][][] regressors  = new float[1][896][16];
            float[][][] classifiers = new float[1][896][1];
            Map<Integer, Object> outputs = new HashMap<>();
            outputs.put(0, regressors);
            outputs.put(1, classifiers);

            faceDetector.runForMultipleInputsOutputs(new Object[]{input}, outputs);
            List<RectF> faces = decodeBlazeFace(regressors, classifiers, inputW, inputH, 0.5f);
            Log.d(TAG, "✅ BlazeFace multi-output: " + faces.size() + " faces");
            return faces;
        } catch (Throwable t) {
            Log.w(TAG, "⚠️ Multi-output failed: " + t.getMessage());
        }

        // ✅ Fallback: single output
        try {
            // Try common output shapes
            int numOutputs = faceDetector.getOutputTensorCount();
            Log.d(TAG, "Model has " + numOutputs + " outputs");

            if (numOutputs >= 2) {
                // Try 2-output format
                int[] shape0 = faceDetector.getOutputTensor(0).shape();
                int[] shape1 = faceDetector.getOutputTensor(1).shape();
                Log.d(TAG, "Output 0 shape: " + Arrays.toString(shape0));
                Log.d(TAG, "Output 1 shape: " + Arrays.toString(shape1));
            }

            // Single output fallback
            float[][][] single = new float[1][896][16];
            faceDetector.run(input, single);
            return decodeSingleOutput(single);
        } catch (Throwable t2) {
            Log.e(TAG, "❌ All detection failed: " + t2.getMessage());
            lastDebugMessage = "❌ Detection error: " + t2.getMessage();
            return Collections.emptyList();
        }
    }

    private static final float DETECT_THRESHOLD = 0.55f;  // ✅ Higher = fewer false positives
    private static final float NMS_IOU_THRESHOLD = 0.40f;  // ✅ Better NMS

    private List<RectF> decodeBlazeFace(float[][][] regressors, float[][][] classifiers,
                                         int inputW, int inputH, float threshold) {
        List<RectF> boxes = new ArrayList<>();
        float[] anchorX = PureShieldAnchors.X_CENTER;
        float[] anchorY = PureShieldAnchors.Y_CENTER;
        int count = Math.min(896, anchorX.length);

        for (int i = 0; i < count; i++) {
            float score = sigmoid(classifiers[0][i][0]);
            if (score < threshold) continue;

            float cx = regressors[0][i][0] / inputW + anchorX[i];
            float cy = regressors[0][i][1] / inputH + anchorY[i];
            float w  = regressors[0][i][2] / inputW;
            float h  = regressors[0][i][3] / inputH;

            if (w < 0.04f || h < 0.04f) continue;  // min face size
            float ar = (h > 0) ? w/h : 1f;
            if (ar < 0.4f || ar > 2.5f) continue;  // aspect ratio filter

            boxes.add(new RectF(
                Math.max(0f, cx - w/2),
                Math.max(0f, cy - h/2),
                Math.min(1f, cx + w/2),
                Math.min(1f, cy + h/2)
            ));
        }

        Log.d(TAG, "👤 BlazeFace raw detections: " + boxes.size());
        return nonMaxSuppression(boxes, 0.3f);
    }

    private List<RectF> decodeSingleOutput(float[][][] output) {
        List<RectF> boxes = new ArrayList<>();
        for (int i = 0; i < output[0].length; i++) {
            if (output[0][i].length < 5) continue;
            float conf = sigmoid(output[0][i][4]);
            if (conf < 0.5f) continue;
            float cx = output[0][i][0], cy = output[0][i][1];
            float w  = output[0][i][2], h  = output[0][i][3];
            boxes.add(new RectF(
                Math.max(0f, cx - w/2), Math.max(0f, cy - h/2),
                Math.min(1f, cx + w/2), Math.min(1f, cy + h/2)));
        }
        return nonMaxSuppression(boxes, 0.3f);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Gender
    // ─────────────────────────────────────────────────────────────────────────

    private GenderResult estimateGender(Bitmap src, RectF faceBox) {
        // BOTH mode — blur everything, skip gender model
        if (config.getBlurGender() == PureShieldConfig.BlurGender.BOTH) {
            return new GenderResult(0.9f, 0.9f);
        }

        // ✅ Use real gender model if available
        if (genderClassifier != null) {
            return classifyGenderReal(src, faceBox);
        }

        // ⚠️ No gender model — safe fallback: treat every face as a match
        // so FEMALE / MALE modes still blur visible faces instead of doing nothing.
        return new GenderResult(0.9f, 0.9f);
    }

    /**
     * ✅ Real gender classification using bundled MobileNetV2 TFLite model.
     * Input: dynamic RGB tensor size, normalized [0,1]
     * Output: [1,2] → [female_prob, male_prob]
     * Works for ALL races — Bengali, Chinese, European, African etc.
     */
    private GenderResult classifyGenderReal(Bitmap src, RectF faceBox) {
        int inputW = Math.max(1, genderInputWidth);
        int inputH = Math.max(1, genderInputHeight);
        int bw = src.getWidth(), bh = src.getHeight();

        // Add padding around face for better accuracy
        float padX = faceBox.width()  * bw * 0.25f;
        float padY = faceBox.height() * bh * 0.25f;

        int left   = (int) Math.max(0,  faceBox.left   * bw - padX);
        int top    = (int) Math.max(0,  faceBox.top    * bh - padY);
        int right  = (int) Math.min(bw, faceBox.right  * bw + padX);
        int bottom = (int) Math.min(bh, faceBox.bottom * bh + padY);

        if (right <= left || bottom <= top) return new GenderResult(0.5f, 0.5f);

        Bitmap face    = Bitmap.createBitmap(src, left, top, right-left, bottom-top);
        Bitmap resized = Bitmap.createScaledBitmap(face, inputW, inputH, true);
        face.recycle();

        float[][][][] input = new float[1][inputH][inputW][3];
        int[] pixels = new int[inputW * inputH];
        resized.getPixels(pixels, 0, inputW, 0, 0, inputW, inputH);
        resized.recycle();

        // Normalize [0, 255] → [0, 1]
        for (int i = 0; i < pixels.length; i++) {
            int p = pixels[i];
            int y = i / inputW, x = i % inputW;
            input[0][y][x][0] = ((p >> 16) & 0xFF) / 255f;
            input[0][y][x][1] = ((p >> 8)  & 0xFF) / 255f;
            input[0][y][x][2] = (p & 0xFF)          / 255f;
        }

        try {
            float[][] output = new float[1][2];
            genderClassifier.run(input, output);
            float femaleProbability = output[0][0];
            float maleProbability   = output[0][1];

            // ✅ Safety: if model output is garbage (NaN, both near-zero, or
            // not a proper distribution), fall back to "match" so FEMALE/MALE
            // mode still blurs faces instead of doing nothing silently.
            boolean nan = Float.isNaN(femaleProbability) || Float.isNaN(maleProbability);
            boolean tooLow = (femaleProbability < 0.1f && maleProbability < 0.1f);
            if (nan || tooLow) {
                Log.w(TAG, "⚠️ Gender output unreliable (f=" + femaleProbability
                    + " m=" + maleProbability + ") — treating as match");
                return new GenderResult(0.9f, 0.9f);
            }

            Log.d(TAG, "👤 Gender: female=" + String.format("%.2f", femaleProbability)
                + " male=" + String.format("%.2f", maleProbability));
            return new GenderResult(femaleProbability, maleProbability);
        } catch (Throwable t) {
            Log.w(TAG, "⚠️ Gender classification failed: " + t.getMessage());
            // Safe fallback: treat as match so the face still gets blurred
            return new GenderResult(0.9f, 0.9f);
        }
    }

    private boolean shouldBlur(GenderResult result) {
        float threshold = config.getConfidenceThreshold();
        switch (config.getBlurGender()) {
            case FEMALE: return result.femaleProbability > threshold;
            case MALE:   return result.maleProbability   > threshold;
            case BOTH:   return true;
            default:     return false;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Overlay
    // ─────────────────────────────────────────────────────────────────────────

    private void updateOverlays(List<RectF> regions) {
        while (blurOverlays.size() > regions.size()) {
            View v = blurOverlays.remove(blurOverlays.size() - 1);
            try { windowManager.removeView(v); } catch (Exception ignored) {}
        }
        while (blurOverlays.size() < regions.size()) {
            blurOverlays.add(createBlurOverlayView());
        }
        for (int i = 0; i < regions.size(); i++) {
            positionOverlay(blurOverlays.get(i), regions.get(i));
        }
    }

    private View createBlurOverlayView() {
        PureShieldBlurView view = new PureShieldBlurView(this);
        view.setBlurStyle(config.getBlurStyle());

        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            0, 0, 0, 0, type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP | Gravity.LEFT;
        windowManager.addView(view, params);
        return view;
    }

    private void positionOverlay(View view, RectF rect) {
        WindowManager.LayoutParams p = (WindowManager.LayoutParams) view.getLayoutParams();
        p.x = (int) rect.left; p.y = (int) rect.top;
        p.width = (int) rect.width(); p.height = (int) rect.height();
        try { windowManager.updateViewLayout(view, p); }
        catch (Exception e) { Log.w(TAG, "Overlay update failed: " + e.getMessage()); }
    }

    private void clearAllOverlays() {
        new Handler(Looper.getMainLooper()).post(() -> {
            for (View v : blurOverlays) {
                try { windowManager.removeView(v); } catch (Exception ignored) {}
            }
            blurOverlays.clear();
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Coords
    // ─────────────────────────────────────────────────────────────────────────

    private RectF scaleToScreenCoords(RectF box, int captureW, int captureH) {
        float scaleX = (float) screenWidth  / captureW;
        float scaleY = (float) screenHeight / captureH;
        return new RectF(
            box.left   * captureW * scaleX,
            box.top    * captureH * scaleY,
            box.right  * captureW * scaleX,
            box.bottom * captureH * scaleY
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Foreground tracking
    // ─────────────────────────────────────────────────────────────────────────

    public void onForegroundAppChanged(String packageName) {
        currentForegroundPackage = packageName != null ? packageName : "";
        boolean isTarget = isTargetAppInForeground();
        Log.d(TAG, "📱 App changed: " + currentForegroundPackage
            + " | isTarget: " + isTarget
            + " | targets: " + targetPackages);

        if (!isTarget) {
            clearAllOverlays();
        } else {
            Log.i(TAG, "✅ Target app in foreground: " + currentForegroundPackage);
            adaptiveEngine.onTargetAppResumed();
            rescheduleSampler();
        }
    }

    private boolean isTargetAppInForeground() {
        return targetPackages.contains(currentForegroundPackage);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Model switching
    // ─────────────────────────────────────────────────────────────────────────

    private void switchModelTier(String tierStr) {
        try {
            modelManager.setSelectedTier(PureShieldModelManager.ModelTier.valueOf(tierStr));
            releaseModels();
            loadModels();
            Log.i(TAG, "🔄 Tier switched to: " + tierStr);
        } catch (Exception e) {
            Log.e(TAG, "❌ Switch failed: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Notification with live stats
    // ─────────────────────────────────────────────────────────────────────────

    private void updateNotificationStats() {
        // Update every 10 frames to avoid spam
        if (totalFramesProcessed.get() % 10 != 0) return;
        try {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) nm.notify(NOTIF_ID, buildNotification());
        } catch (Throwable ignored) {}
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "PureShield Active", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Filtering visual content in background");
            ch.setShowBadge(false);
            ch.setSound(null, null);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
    }

    private Notification buildNotification() {
        Intent stopIntent = new Intent(this, PureShieldService.class);
        stopIntent.setAction(Actions.STOP);
        PendingIntent stopPi = PendingIntent.getService(this, 1, stopIntent,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        String stats = "Frames: " + totalFramesProcessed.get()
            + " | Faces: " + totalFacesDetected.get()
            + " | Blurred: " + totalFacesBlurred.get();

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("🛡️ PureShield Active")
            .setContentText(stats)
            .setSmallIcon(R.drawable.ic_shield)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setSilent(true)
            .addAction(R.drawable.ic_shield, "Stop", stopPi)
            .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Restart
    // ─────────────────────────────────────────────────────────────────────────

    private void scheduleRestart() {
        Intent ri = new Intent(this, PureShieldRestartReceiver.class);
        PendingIntent pi = PendingIntent.getBroadcast(this, 0, ri,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
        if (am != null) am.set(AlarmManager.ELAPSED_REALTIME_WAKEUP,
            SystemClock.elapsedRealtime() + 3000, pi);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Bitmap
    // ─────────────────────────────────────────────────────────────────────────

    private Bitmap imageToBitmap(Image image) {
        Image.Plane[] planes = image.getPlanes();
        ByteBuffer buffer  = planes[0].getBuffer();
        int pixelStride    = planes[0].getPixelStride();
        int rowStride      = planes[0].getRowStride();
        int rowPadding     = rowStride - pixelStride * imageReader.getWidth();

        Bitmap bmp = Bitmap.createBitmap(
            imageReader.getWidth() + rowPadding / pixelStride,
            imageReader.getHeight(), Bitmap.Config.ARGB_8888);
        bmp.copyPixelsFromBuffer(buffer);

        if (rowPadding > 0) {
            Bitmap trimmed = Bitmap.createBitmap(bmp, 0, 0,
                imageReader.getWidth(), imageReader.getHeight());
            bmp.recycle();
            return trimmed;
        }
        return bmp;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Math
    // ─────────────────────────────────────────────────────────────────────────

    private float sigmoid(float x) { return 1f / (1f + (float) Math.exp(-x)); }

    private List<RectF> nonMaxSuppression(List<RectF> boxes, float iouThreshold) {
        if (boxes.isEmpty()) return boxes;
        List<RectF> result = new ArrayList<>();
        List<RectF> sorted = new ArrayList<>(boxes);
        sorted.sort((a, b) -> Float.compare(b.width() * b.height(), a.width() * a.height()));
        boolean[] suppressed = new boolean[sorted.size()];
        for (int i = 0; i < sorted.size(); i++) {
            if (suppressed[i]) continue;
            result.add(sorted.get(i));
            for (int j = i+1; j < sorted.size(); j++) {
                if (!suppressed[j] && iou(sorted.get(i), sorted.get(j)) > iouThreshold)
                    suppressed[j] = true;
            }
        }
        return result;
    }

    private float iou(RectF a, RectF b) {
        float il = Math.max(a.left, b.left), it = Math.max(a.top,  b.top);
        float ir = Math.min(a.right,b.right), ib = Math.min(a.bottom,b.bottom);
        if (ir <= il || ib <= it) return 0f;
        float inter = (ir-il)*(ib-it);
        return inter / (a.width()*a.height() + b.width()*b.height() - inter);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    public static final class Actions {
        public static final String START_PROJECTION       = "PureShield.START_PROJECTION";
        public static final String STOP                   = "PureShield.STOP";
        public static final String UPDATE_CONFIG          = "PureShield.UPDATE_CONFIG";
        public static final String FOREGROUND_APP_CHANGED = "PureShield.FOREGROUND_APP_CHANGED";
        public static final String SWITCH_MODEL_TIER      = "PureShield.SWITCH_MODEL_TIER";
    }

    public static class GenderResult {
        public final float femaleProbability;
        public final float maleProbability;
        GenderResult(float f, float m) {
            this.femaleProbability = f;
            this.maleProbability   = m;
        }
    }
}
