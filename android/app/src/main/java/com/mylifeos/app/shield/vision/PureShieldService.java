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
    private static final String DETECT_CHANNEL_ID = "PureShield_detect";
    private static final int NOTIF_ID = 9901;
    private static final int DETECT_NOTIF_ID = 9902;
    private long lastDetectNotifMs = 0;

    private int screenWidth, screenHeight, screenDensity;

    private MediaProjection mediaProjection;
    private VirtualDisplay virtualDisplay;
    private ImageReader imageReader;

    private Interpreter faceDetector;
    private Interpreter genderClassifier;
    private GpuDelegate gpuDelegate;

    // ✅ Model metadata cached at load time
    private int   modelInputW = 128;
    private int   modelInputH = 128;
    private int   modelNumOutputs = 0;
    private int   regressorsOutIdx = 0;   // which output is the box regressors
    private int   classifiersOutIdx = 1;  // which output is the scores
    private int   numAnchors = 896;       // detected from output shape
    private int   regressorVectorSize = 16;
    private String activeModelName = "(none)";
    private ModelKind modelKind = ModelKind.BLAZEFACE;

    private enum ModelKind { BLAZEFACE, YOLO, UNKNOWN }

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

        // ✅ Use real BlazeFace models
        String faceModel = modelManager.getFaceDetectorModel();

        // Fallback chain: tier model → blaze_face_short_range → mediapipe
        if (!assetExists(faceModel)) {
            Log.w(TAG, "⚠️ " + faceModel + " missing, trying blaze_face_short_range");
            faceModel = "blaze_face_short_range.tflite";
        }
        if (!assetExists(faceModel)) {
            Log.w(TAG, "⚠️ blaze_face_short_range missing, trying mediapipe_face");
            faceModel = "mediapipe_face.tflite";
        }
        if (!assetExists(faceModel)) {
            broadcastModelStatus("MODEL_EMPTY", "No face model found");
            return false;
        }

        try {
            Log.i(TAG, "📂 Loading face model: " + faceModel);
            faceDetector = new Interpreter(loadModelFile(faceModel), options);
            activeModelName = faceModel;

            // ✅ Inspect input
            int[] inputShape = faceDetector.getInputTensor(0).shape();
            modelInputH = inputShape.length >= 4 ? inputShape[1] : 128;
            modelInputW = inputShape.length >= 4 ? inputShape[2] : 128;
            Log.i(TAG, "✅ Input shape: " + Arrays.toString(inputShape)
                + " → using " + modelInputW + "x" + modelInputH);

            // ✅ Inspect outputs and decide model kind + index assignment
            modelNumOutputs = faceDetector.getOutputTensorCount();
            Log.i(TAG, "✅ Output tensor count: " + modelNumOutputs);

            for (int i = 0; i < modelNumOutputs; i++) {
                int[] s = faceDetector.getOutputTensor(i).shape();
                Log.i(TAG, "   ↳ output[" + i + "] shape=" + Arrays.toString(s));
            }

            if (faceModel.contains("yolo")) {
                modelKind = ModelKind.YOLO;
                int[] s = faceDetector.getOutputTensor(0).shape();
                // YOLO output: [1, N, 6] (x,y,w,h,conf,cls) or [1, N, 16] etc.
                numAnchors = s.length >= 3 ? s[1] : 25200;
                regressorVectorSize = s.length >= 3 ? s[2] : 6;
                regressorsOutIdx = 0;
                classifiersOutIdx = -1;
                Log.i(TAG, "🟢 YOLO model — anchors=" + numAnchors + " vecSize=" + regressorVectorSize);
            } else {
                modelKind = ModelKind.BLAZEFACE;
                // BlazeFace: 2 outputs. One is [1,N,16] (regressors), other [1,N,1] (scores).
                // Detect which is which by last-dim size.
                if (modelNumOutputs >= 2) {
                    int[] s0 = faceDetector.getOutputTensor(0).shape();
                    int[] s1 = faceDetector.getOutputTensor(1).shape();
                    int last0 = s0[s0.length - 1];
                    int last1 = s1[s1.length - 1];
                    if (last0 == 1 && last1 > 1) {
                        classifiersOutIdx = 0;
                        regressorsOutIdx  = 1;
                        numAnchors = s1[1];
                        regressorVectorSize = last1;
                    } else {
                        regressorsOutIdx = 0;
                        classifiersOutIdx = 1;
                        numAnchors = s0[1];
                        regressorVectorSize = last0;
                    }
                    Log.i(TAG, "🟢 BlazeFace — regOut=" + regressorsOutIdx
                        + " clsOut=" + classifiersOutIdx
                        + " anchors=" + numAnchors
                        + " vecSize=" + regressorVectorSize);
                } else {
                    Log.w(TAG, "⚠️ BlazeFace expected 2 outputs, got " + modelNumOutputs);
                }
            }

            broadcastModelStatus("OK", faceModel);
            lastDebugMessage = "Model: " + faceModel + " | " + modelKind
                + " | " + modelInputW + "x" + modelInputH
                + " | anchors=" + numAnchors;
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

        // 🔔 Dev-mode detection notification (heads-up)
        if (toBlur.size() > 0) {
            notifyDetection(faceCount, toBlur.size());
        }

        new Handler(Looper.getMainLooper()).post(() -> updateOverlays(toBlur));
    }

    private void notifyDetection(int detected, int blurred) {
        long now = System.currentTimeMillis();
        if (now - lastDetectNotifMs < 3000) return; // throttle 3s
        lastDetectNotifMs = now;
        try {
            String genderLabel;
            switch (config.getBlurGender()) {
                case FEMALE: genderLabel = "FEMALE"; break;
                case MALE:   genderLabel = "MALE";   break;
                default:     genderLabel = "BOTH";   break;
            }
            String app = (currentForegroundPackage == null || currentForegroundPackage.isEmpty())
                ? "screen" : currentForegroundPackage;
            String text = "Blurred " + blurred + "/" + detected + " " + genderLabel + " face(s) in " + app;

            Notification n = new NotificationCompat.Builder(this, DETECT_CHANNEL_ID)
                .setContentTitle("🛡️ PureShield detected a face")
                .setContentText(text)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(text))
                .setSmallIcon(R.drawable.ic_shield)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_STATUS)
                .setAutoCancel(true)
                .setTimeoutAfter(5000)
                .build();
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) nm.notify(DETECT_NOTIF_ID, n);
        } catch (Throwable ignored) {}
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

        boolean isYolo = (modelKind == ModelKind.YOLO);

        // ✅ YOLO uses [0,1] normalization, BlazeFace uses [-1,1]
        for (int i = 0; i < pixels.length; i++) {
            int p = pixels[i];
            int y = i / inputW, x = i % inputW;
            float r = ((p >> 16) & 0xFF);
            float g = ((p >> 8)  & 0xFF);
            float b = (p & 0xFF);
            if (isYolo) {
                input[0][y][x][0] = r / 255f;
                input[0][y][x][1] = g / 255f;
                input[0][y][x][2] = b / 255f;
            } else {
                input[0][y][x][0] = (r / 127.5f) - 1f;
                input[0][y][x][1] = (g / 127.5f) - 1f;
                input[0][y][x][2] = (b / 127.5f) - 1f;
            }
        }

        try {
            if (isYolo) {
                float[][][] out = new float[1][numAnchors][regressorVectorSize];
                faceDetector.run(input, out);
                return decodeYolo(out, inputW, inputH);
            } else {
                float[][][] regressors  = new float[1][numAnchors][regressorVectorSize];
                float[][][] classifiers = new float[1][numAnchors][1];
                Map<Integer, Object> outputs = new HashMap<>();
                outputs.put(regressorsOutIdx,  regressors);
                outputs.put(classifiersOutIdx, classifiers);
                faceDetector.runForMultipleInputsOutputs(new Object[]{input}, outputs);
                return decodeBlazeFace(regressors, classifiers, inputW, inputH);
            }
        } catch (Throwable t) {
            Log.e(TAG, "❌ Detection inference failed: " + t.getMessage(), t);
            lastDebugMessage = "❌ Inference: " + t.getMessage();
            return Collections.emptyList();
        }
    }

    private static final float DETECT_THRESHOLD = 0.30f;
    private static final float NMS_IOU_THRESHOLD = 0.30f;

    private List<RectF> decodeBlazeFace(float[][][] regressors, float[][][] classifiers,
                                         int inputW, int inputH) {
        List<RectF> boxes = new ArrayList<>();
        float[] anchorX = PureShieldAnchors.X_CENTER;
        float[] anchorY = PureShieldAnchors.Y_CENTER;
        int count = Math.min(numAnchors, anchorX.length);

        float maxScore = -999f, minScore = 999f;
        int abovePoint1 = 0, abovePoint3 = 0, abovePoint5 = 0;

        for (int i = 0; i < count; i++) {
            float raw = classifiers[0][i][0];
            if (raw < -100f) raw = -100f;
            if (raw >  100f) raw =  100f;
            float score = sigmoid(raw);
            if (score > maxScore) maxScore = score;
            if (score < minScore) minScore = score;
            if (score > 0.1f) abovePoint1++;
            if (score > 0.3f) abovePoint3++;
            if (score > 0.5f) abovePoint5++;

            if (score < DETECT_THRESHOLD) continue;

            float cx = regressors[0][i][0] / inputW + anchorX[i];
            float cy = regressors[0][i][1] / inputH + anchorY[i];
            float w  = regressors[0][i][2] / inputW;
            float h  = regressors[0][i][3] / inputH;

            if (w < 0.02f || h < 0.02f) continue;

            boxes.add(new RectF(
                Math.max(0f, cx - w/2),
                Math.max(0f, cy - h/2),
                Math.min(1f, cx + w/2),
                Math.min(1f, cy + h/2)
            ));
        }

        Log.d(TAG, String.format(
            "📊 BlazeFace scores: max=%.3f min=%.3f >0.1=%d >0.3=%d >0.5=%d | raw boxes=%d",
            maxScore, minScore, abovePoint1, abovePoint3, abovePoint5, boxes.size()));

        return nonMaxSuppression(boxes, NMS_IOU_THRESHOLD);
    }

    private List<RectF> decodeYolo(float[][][] output, int inputW, int inputH) {
        List<RectF> boxes = new ArrayList<>();
        int n = output[0].length;
        int vec = output[0][0].length;
        float maxConf = 0f;
        int kept = 0;

        for (int i = 0; i < n; i++) {
            float[] det = output[0][i];
            if (det.length < 5) continue;
            float objConf = det[4];
            if (objConf > maxConf) maxConf = objConf;
            float clsConf = (vec >= 6) ? det[5] : 1f;
            float conf = objConf * clsConf;
            if (conf < DETECT_THRESHOLD) continue;

            float cx = det[0] / inputW;
            float cy = det[1] / inputH;
            float w  = det[2] / inputW;
            float h  = det[3] / inputH;

            if (w < 0.02f || h < 0.02f) continue;

            boxes.add(new RectF(
                Math.max(0f, cx - w/2),
                Math.max(0f, cy - h/2),
                Math.min(1f, cx + w/2),
                Math.min(1f, cy + h/2)
            ));
            kept++;
        }
        Log.d(TAG, String.format("📊 YOLO: maxConf=%.3f kept=%d/%d", maxConf, kept, n));
        return nonMaxSuppression(boxes, NMS_IOU_THRESHOLD);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Gender
    // ─────────────────────────────────────────────────────────────────────────

    private GenderResult estimateGender(Bitmap src, RectF faceBox) {
        if (config.getBlurGender() == PureShieldConfig.BlurGender.BOTH) {
            return new GenderResult(0.9f, 0.9f);
        }

        int bw = src.getWidth(), bh = src.getHeight();
        int left   = (int) Math.max(0,  faceBox.left   * bw);
        int top    = (int) Math.max(0,  faceBox.top    * bh);
        int right  = (int) Math.min(bw, faceBox.right  * bw);
        int bottom = (int) Math.min(bh, faceBox.bottom * bh);
        if (right <= left || bottom <= top) return new GenderResult(0.5f, 0.5f);

        Bitmap face  = Bitmap.createBitmap(src, left, top, right-left, bottom-top);
        Bitmap small = Bitmap.createScaledBitmap(face, 8, 8, true);
        face.recycle();

        int[] pixels = new int[64];
        small.getPixels(pixels, 0, 8, 0, 0, 8, 8);
        small.recycle();

        float rSum = 0, gSum = 0, bSum = 0;
        for (int p : pixels) {
            rSum += (p >> 16) & 0xFF;
            gSum += (p >> 8)  & 0xFF;
            bSum += p & 0xFF;
        }
        rSum /= 64f; gSum /= 64f; bSum /= 64f;

        float warmth  = (rSum - bSum) / 255f;
        float softness = gSum / 255f;
        float femaleProbability = Math.min(1f, Math.max(0f, 0.45f + warmth * 0.4f + softness * 0.15f));

        return new GenderResult(femaleProbability, 1f - femaleProbability);
    }

    // ✅ নতুন
private boolean shouldBlur(GenderResult result) {
    float raw = config.getConfidenceThreshold();
    // Real gender model থাকলে user threshold use করো
    // না থাকলে 0.45 cap করো (heuristic max ~0.65)
    float threshold = (genderClassifier == null) ? Math.min(raw, 0.45f) : raw;
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
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "PureShield Active", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Filtering visual content in background");
            ch.setShowBadge(false);
            ch.setSound(null, null);
            nm.createNotificationChannel(ch);

            NotificationChannel detect = new NotificationChannel(
                DETECT_CHANNEL_ID, "PureShield Detections", NotificationManager.IMPORTANCE_HIGH);
            detect.setDescription("Heads-up alerts when a face is detected & blurred");
            detect.enableVibration(true);
            nm.createNotificationChannel(detect);
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
