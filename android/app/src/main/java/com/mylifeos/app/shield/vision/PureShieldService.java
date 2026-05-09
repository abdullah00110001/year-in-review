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
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityManager;

import androidx.core.app.NotificationCompat;

import com.mylifeos.app.R;

import org.tensorflow.lite.Interpreter;
import org.tensorflow.lite.gpu.GpuDelegate;
import org.tensorflow.lite.nnapi.NnApiDelegate;

import java.io.*;
import java.nio.*;
import java.nio.channels.FileChannel;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

/**
 * PureShieldService — System-wide Gender Blur Engine
 *
 * Architecture:
 *  1. MediaProjection → captures screen frames
 *  2. AccessibilityService event → triggers re-scan on app/screen change
 *  3. Adaptive Frame Sampler → throttles based on device tier + battery
 *  4. TFLite BlazeFace → detects face bounding boxes
 *  5. TFLite MobileNetV3 Gender Classifier → classifies each face
 *  6. Overlay Engine → draws blur rectangles over matched gender faces
 *
 * Runs only when user-selected target apps are in foreground.
 */
public class PureShieldService extends Service {

    private static final String TAG = "PureShieldService";
    private static final String CHANNEL_ID = "PureShield_channel";
    private static final int NOTIF_ID = 9901;

    // ── Virtual display dimensions ────────────────────────────────────────────
    private int screenWidth;
    private int screenHeight;
    private int screenDensity;

    // ── MediaProjection ───────────────────────────────────────────────────────
    private MediaProjection mediaProjection;
    private VirtualDisplay virtualDisplay;
    private ImageReader imageReader;

    // ── TFLite models ─────────────────────────────────────────────────────────
    private Interpreter faceDetector;      // BlazeFace 400KB
    private Interpreter genderClassifier;  // MobileNetV3-Small ~2MB
    private GpuDelegate gpuDelegate;
    private NnApiDelegate nnapiDelegate;

    // ── Overlay window ────────────────────────────────────────────────────────
    private WindowManager windowManager;
    private final List<View> blurOverlays = new CopyOnWriteArrayList<>();

    // ── Adaptive quality ──────────────────────────────────────────────────────
    private PureShieldAdaptiveEngine adaptiveEngine;

    // ── Threading ─────────────────────────────────────────────────────────────
    private ExecutorService inferenceExecutor;
    private ScheduledExecutorService samplerExecutor;
    private ScheduledFuture<?> samplerTask;
    private final AtomicBoolean isProcessing = new AtomicBoolean(false);
    private final AtomicBoolean isRunning    = new AtomicBoolean(false);

    // ── Config ────────────────────────────────────────────────────────────────
    private PureShieldConfig config;
    private Set<String> targetPackages = new HashSet<>();
    private String currentForegroundPackage = "";

    // ── Static instance for IPC ───────────────────────────────────────────────
    public static PureShieldService instance;

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;

        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        adaptiveEngine = new PureShieldAdaptiveEngine(this);
        config = PureShieldPreferences.loadConfig(this);
        targetPackages = PureShieldPreferences.loadTargetPackages(this);

        DisplayMetrics metrics = new DisplayMetrics();
        windowManager.getDefaultDisplay().getRealMetrics(metrics);
        screenWidth   = metrics.widthPixels;
        screenHeight  = metrics.heightPixels;
        screenDensity = metrics.densityDpi;

        inferenceExecutor = Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "PureShield-Inference");
            t.setPriority(Thread.NORM_PRIORITY - 1); // slightly below UI
            return t;
        });

        samplerExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "PureShield-Sampler");
            t.setPriority(Thread.MIN_PRIORITY);
            return t;
        });

        createNotificationChannel();
        startForeground(NOTIF_ID, buildNotification());

        Log.i(TAG, "PureShieldService created");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_STICKY;

        String action = intent.getAction();
        if (action == null) return START_STICKY;

        switch (action) {
            case Actions.START_PROJECTION:
                int resultCode = intent.getIntExtra("resultCode", Activity.RESULT_CANCELED);
                Intent data   = intent.getParcelableExtra("data");
                startProjection(resultCode, data);
                break;

            case Actions.STOP:
                stopSelf();
                break;

            case Actions.UPDATE_CONFIG:
                config = PureShieldPreferences.loadConfig(this);
                targetPackages = PureShieldPreferences.loadTargetPackages(this);
                adaptiveEngine.onConfigChanged(config);
                break;

            case Actions.FOREGROUND_APP_CHANGED:
                String pkg = intent.getStringExtra("package");
                onForegroundAppChanged(pkg);
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
        inferenceExecutor.shutdownNow();
        samplerExecutor.shutdownNow();
        instance = null;
        super.onDestroy();

        // Self-restart via AlarmManager
        scheduleRestart();
        Log.i(TAG, "PureShieldService destroyed — restart scheduled");
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    // ─────────────────────────────────────────────────────────────────────────
    // MediaProjection setup
    // ─────────────────────────────────────────────────────────────────────────

    private void startProjection(int resultCode, Intent data) {
        MediaProjectionManager mpm =
            (MediaProjectionManager) getSystemService(MEDIA_PROJECTION_SERVICE);
        mediaProjection = mpm.getMediaProjection(resultCode, data);

        mediaProjection.registerCallback(new MediaProjection.Callback() {
            @Override
            public void onStop() {
                Log.w(TAG, "MediaProjection stopped — attempting restart");
                releaseProjection();
                scheduleRestart();
            }
        }, new Handler(Looper.getMainLooper()));

        // ImageReader with low resolution for performance
        int captureW = adaptiveEngine.getCaptureWidth(screenWidth);
        int captureH = adaptiveEngine.getCaptureHeight(screenHeight);

        imageReader = ImageReader.newInstance(
            captureW, captureH,
            PixelFormat.RGBA_8888,
            2 // maxImages buffer
        );

        virtualDisplay = mediaProjection.createVirtualDisplay(
            "PureShieldCapture",
            captureW, captureH, screenDensity,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader.getSurface(),
            null, null
        );

        loadModels();
        isRunning.set(true);
        startSampler();

        Log.i(TAG, "Projection started — capture size: " + captureW + "x" + captureH);
    }

    private void releaseProjection() {
        if (virtualDisplay != null) { virtualDisplay.release(); virtualDisplay = null; }
        if (imageReader   != null) { imageReader.close();      imageReader = null;    }
        if (mediaProjection != null) { mediaProjection.stop(); mediaProjection = null; }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TFLite model loading
    // ─────────────────────────────────────────────────────────────────────────

    private void loadModels() {
        try {
            Interpreter.Options options = buildInterpreterOptions();
            faceDetector    = new Interpreter(loadModelFile("blazeface.tflite"),   options);
            genderClassifier = new Interpreter(loadModelFile("gender_mobilenet.tflite"), options);
            Log.i(TAG, "TFLite models loaded successfully");
        } catch (Exception e) {
            Log.e(TAG, "Failed to load models: " + e.getMessage());
        }
    }

    private Interpreter.Options buildInterpreterOptions() {
        Interpreter.Options options = new Interpreter.Options();
        options.setNumThreads(adaptiveEngine.getInferenceThreadCount());

        // Try NNAPI (NPU/DSP) first — fastest
        try {
            NnApiDelegate.Options nnapiOptions = new NnApiDelegate.Options();
            nnapiOptions.setExecutionPreference(
                NnApiDelegate.Options.EXECUTION_PREFERENCE_SUSTAINED_SPEED);
            nnapiDelegate = new NnApiDelegate(nnapiOptions);
            options.addDelegate(nnapiDelegate);
            Log.i(TAG, "Using NNAPI delegate");
            return options;
        } catch (Exception e) {
            Log.w(TAG, "NNAPI unavailable: " + e.getMessage());
        }

        // Fallback to GPU
        try {
            GpuDelegate.Options gpuOptions = new GpuDelegate.Options();
            gpuOptions.setPrecisionLossAllowed(true); // fp16 for speed
            gpuDelegate = new GpuDelegate(gpuOptions);
            options.addDelegate(gpuDelegate);
            Log.i(TAG, "Using GPU delegate");
            return options;
        } catch (Exception e) {
            Log.w(TAG, "GPU delegate unavailable: " + e.getMessage());
        }

        // CPU fallback
        Log.i(TAG, "Using CPU inference");
        return options;
    }

    private MappedByteBuffer loadModelFile(String filename) throws IOException {
        AssetFileDescriptor fd = getAssets().openFd(filename);
        FileInputStream fis    = new FileInputStream(fd.getFileDescriptor());
        FileChannel fc         = fis.getChannel();
        return fc.map(FileChannel.MapMode.READ_ONLY, fd.getStartOffset(), fd.getDeclaredLength());
    }

    private void releaseModels() {
        if (faceDetector != null)    { faceDetector.close();    faceDetector = null;    }
        if (genderClassifier != null){ genderClassifier.close(); genderClassifier = null; }
        if (gpuDelegate != null)     { gpuDelegate.close();      gpuDelegate = null;     }
        if (nnapiDelegate != null)   { nnapiDelegate.close();    nnapiDelegate = null;   }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Frame sampling loop
    // ─────────────────────────────────────────────────────────────────────────

    private void startSampler() {
        long intervalMs = adaptiveEngine.getSampleIntervalMs();
        samplerTask = samplerExecutor.scheduleAtFixedRate(
            this::captureAndProcess,
            500, intervalMs, TimeUnit.MILLISECONDS
        );
        Log.i(TAG, "Sampler started — interval: " + intervalMs + "ms");
    }

    private void stopSampler() {
        if (samplerTask != null) { samplerTask.cancel(true); samplerTask = null; }
    }

    private void rescheduleSampler() {
        stopSampler();
        if (isRunning.get()) startSampler();
    }

    private void captureAndProcess() {
        if (!isRunning.get())         return;
        if (isProcessing.get())       return; // skip frame — still processing
        if (!isTargetAppInForeground()) {
            clearAllOverlays();
            return;
        }

        // Adaptive: check thermal/battery state
        if (adaptiveEngine.shouldSkipFrame()) return;

        Image image = null;
        try {
            image = imageReader.acquireLatestImage();
            if (image == null) return;

            isProcessing.set(true);
            Bitmap bitmap = imageToBitmap(image);
            image.close();
            image = null;

            if (bitmap == null) { isProcessing.set(false); return; }

            inferenceExecutor.submit(() -> {
                try {
                    processFrame(bitmap);
                } catch (Exception e) {
                    Log.e(TAG, "Inference error: " + e.getMessage());
                } finally {
                    bitmap.recycle();
                    isProcessing.set(false);
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "Capture error: " + e.getMessage());
            if (image != null) image.close();
            isProcessing.set(false);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Core inference pipeline
    // ─────────────────────────────────────────────────────────────────────────

    private void processFrame(Bitmap bitmap) {
        if (faceDetector == null || genderClassifier == null) return;

        // Step 1: Detect faces
        List<RectF> faces = detectFaces(bitmap);
        if (faces.isEmpty()) {
            clearAllOverlays();
            return;
        }

        // Step 2: Classify gender for each face
        List<RectF> toBlur = new ArrayList<>();
        for (RectF face : faces) {
            GenderResult result = classifyGender(bitmap, face);
            if (shouldBlur(result)) {
                toBlur.add(scaleToScreenCoords(face, bitmap.getWidth(), bitmap.getHeight()));
            }
        }

        // Step 3: Update overlays on main thread
        Handler mainHandler = new Handler(Looper.getMainLooper());
        mainHandler.post(() -> updateOverlays(toBlur));
    }

    /**
     * BlazeFace detection.
     * Input: 128x128 RGB normalized [-1, 1]
     * Output: [1][896][16] anchors + [1][896][1] scores
     * Returns: list of face bounding boxes in [0,1] coordinates
     */
    private List<RectF> detectFaces(Bitmap src) {
        int inputSize = 128;
        Bitmap resized = Bitmap.createScaledBitmap(src, inputSize, inputSize, false);

        float[][][][] input = new float[1][inputSize][inputSize][3];
        int[] pixels = new int[inputSize * inputSize];
        resized.getPixels(pixels, 0, inputSize, 0, 0, inputSize, inputSize);
        resized.recycle();

        for (int i = 0; i < pixels.length; i++) {
            int p = pixels[i];
            int y = i / inputSize, x = i % inputSize;
            input[0][y][x][0] = (((p >> 16) & 0xFF) / 127.5f) - 1f; // R
            input[0][y][x][1] = (((p >> 8)  & 0xFF) / 127.5f) - 1f; // G
            input[0][y][x][2] = ((p & 0xFF)          / 127.5f) - 1f; // B
        }

        // BlazeFace outputs
        float[][][] regressors = new float[1][896][16];
        float[][][] classifiers = new float[1][896][1];
        Map<Integer, Object> outputs = new HashMap<>();
        outputs.put(0, regressors);
        outputs.put(1, classifiers);

        faceDetector.runForMultipleInputsOutputs(new Object[]{input}, outputs);

        return decodeBlazeFaceAnchors(regressors, classifiers, 0.65f);
    }

    /**
     * Decode BlazeFace anchor predictions into bounding boxes.
     */
    private List<RectF> decodeBlazeFaceAnchors(float[][][] regressors,
                                                float[][][] classifiers,
                                                float scoreThreshold) {
        List<RectF> boxes = new ArrayList<>();
        // Pre-computed BlazeFace anchors (128x128 model)
        float[] anchorW = PureShieldAnchors.WIDTH;
        float[] anchorH = PureShieldAnchors.HEIGHT;
        float[] anchorX = PureShieldAnchors.X_CENTER;
        float[] anchorY = PureShieldAnchors.Y_CENTER;

        for (int i = 0; i < 896; i++) {
            float score = sigmoid(classifiers[0][i][0]);
            if (score < scoreThreshold) continue;

            float cx = regressors[0][i][0] / 128f + anchorX[i];
            float cy = regressors[0][i][1] / 128f + anchorY[i];
            float w  = regressors[0][i][2] / 128f * anchorW[i];
            float h  = regressors[0][i][3] / 128f * anchorH[i];

            RectF box = new RectF(cx - w/2, cy - h/2, cx + w/2, cy + h/2);
            box.left   = Math.max(0f, box.left);
            box.top    = Math.max(0f, box.top);
            box.right  = Math.min(1f, box.right);
            box.bottom = Math.min(1f, box.bottom);

            boxes.add(box);
        }

        return nonMaxSuppression(boxes, 0.3f);
    }

    /**
     * MobileNetV3-Small gender classification.
     * Input: 96x96 RGB normalized [0,1]
     * Output: [1][2] — [female_prob, male_prob]
     */
    private GenderResult classifyGender(Bitmap src, RectF faceBox) {
        int inputSize = 96;

        // Crop face region with padding
        int bw = src.getWidth(), bh = src.getHeight();
        float padX = (faceBox.width()  * bw) * 0.2f;
        float padY = (faceBox.height() * bh) * 0.2f;

        int left   = (int) Math.max(0, faceBox.left   * bw - padX);
        int top    = (int) Math.max(0, faceBox.top    * bh - padY);
        int right  = (int) Math.min(bw, faceBox.right  * bw + padX);
        int bottom = (int) Math.min(bh, faceBox.bottom * bh + padY);

        if (right <= left || bottom <= top) return new GenderResult(0.5f, 0.5f);

        Bitmap face = Bitmap.createBitmap(src, left, top, right - left, bottom - top);
        Bitmap resized = Bitmap.createScaledBitmap(face, inputSize, inputSize, true);
        face.recycle();

        float[][][][] input = new float[1][inputSize][inputSize][3];
        int[] pixels = new int[inputSize * inputSize];
        resized.getPixels(pixels, 0, inputSize, 0, 0, inputSize, inputSize);
        resized.recycle();

        for (int i = 0; i < pixels.length; i++) {
            int p = pixels[i];
            int y = i / inputSize, x = i % inputSize;
            input[0][y][x][0] = ((p >> 16) & 0xFF) / 255f;
            input[0][y][x][1] = ((p >> 8)  & 0xFF) / 255f;
            input[0][y][x][2] = (p & 0xFF)          / 255f;
        }

        float[][] output = new float[1][2];
        genderClassifier.run(input, output);

        return new GenderResult(output[0][0], output[0][1]); // female, male
    }

    private boolean shouldBlur(GenderResult result) {
        float threshold = config.getConfidenceThreshold(); // default 0.72
        switch (config.getBlurGender()) {
            case FEMALE: return result.femaleProbability > threshold;
            case MALE:   return result.maleProbability   > threshold;
            case BOTH:   return result.femaleProbability > threshold
                             || result.maleProbability   > threshold;
            default: return false;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Overlay management
    // ─────────────────────────────────────────────────────────────────────────

    private void updateOverlays(List<RectF> regions) {
        // Remove extra overlays
        while (blurOverlays.size() > regions.size()) {
            View v = blurOverlays.remove(blurOverlays.size() - 1);
            try { windowManager.removeView(v); } catch (Exception ignored) {}
        }

        // Add new overlays
        while (blurOverlays.size() < regions.size()) {
            blurOverlays.add(createBlurOverlayView());
        }

        // Position overlays
        for (int i = 0; i < regions.size(); i++) {
            positionOverlay(blurOverlays.get(i), regions.get(i));
        }
    }

    private View createBlurOverlayView() {
        PureShieldBlurView view = new PureShieldBlurView(this);
        view.setBlurStyle(config.getBlurStyle()); // PIXELATE, FROSTED, SOLID

        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            0, 0, 0, 0,
            type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP | Gravity.LEFT;

        windowManager.addView(view, params);
        return view;
    }

    private void positionOverlay(View view, RectF screenRect) {
        WindowManager.LayoutParams params =
            (WindowManager.LayoutParams) view.getLayoutParams();
        params.x      = (int) screenRect.left;
        params.y      = (int) screenRect.top;
        params.width  = (int) screenRect.width();
        params.height = (int) screenRect.height();
        try {
            windowManager.updateViewLayout(view, params);
        } catch (Exception e) {
            Log.w(TAG, "Failed to update overlay: " + e.getMessage());
        }
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
    // Coordinate scaling
    // ─────────────────────────────────────────────────────────────────────────

    /** Scale from capture-space [0,1] to real screen pixels */
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
    // App foreground tracking
    // ─────────────────────────────────────────────────────────────────────────

    public void onForegroundAppChanged(String packageName) {
        currentForegroundPackage = packageName != null ? packageName : "";
        if (!isTargetAppInForeground()) {
            clearAllOverlays();
        } else {
            // Adjust sample rate per app
            adaptiveEngine.onTargetAppResumed();
            rescheduleSampler();
        }
    }

    private boolean isTargetAppInForeground() {
        return targetPackages.contains(currentForegroundPackage);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Self-restart via AlarmManager
    // ─────────────────────────────────────────────────────────────────────────

    private void scheduleRestart() {
        Intent restartIntent = new Intent(this, PureShieldRestartReceiver.class);
        PendingIntent pi = PendingIntent.getBroadcast(
            this, 0, restartIntent,
            PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );
        AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
        if (am != null) {
            am.set(AlarmManager.ELAPSED_REALTIME_WAKEUP,
                SystemClock.elapsedRealtime() + 3000, pi);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Bitmap conversion
    // ─────────────────────────────────────────────────────────────────────────

    private Bitmap imageToBitmap(Image image) {
        Image.Plane[] planes = image.getPlanes();
        ByteBuffer buffer    = planes[0].getBuffer();
        int pixelStride      = planes[0].getPixelStride();
        int rowStride        = planes[0].getRowStride();
        int rowPadding       = rowStride - pixelStride * imageReader.getWidth();

        Bitmap bitmap = Bitmap.createBitmap(
            imageReader.getWidth() + rowPadding / pixelStride,
            imageReader.getHeight(),
            Bitmap.Config.ARGB_8888
        );
        bitmap.copyPixelsFromBuffer(buffer);

        // Trim padding if any
        if (rowPadding > 0) {
            Bitmap trimmed = Bitmap.createBitmap(
                bitmap, 0, 0, imageReader.getWidth(), imageReader.getHeight());
            bitmap.recycle();
            return trimmed;
        }
        return bitmap;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Math utils
    // ─────────────────────────────────────────────────────────────────────────

    private float sigmoid(float x) { return 1f / (1f + (float) Math.exp(-x)); }

    private List<RectF> nonMaxSuppression(List<RectF> boxes, float iouThreshold) {
        if (boxes.isEmpty()) return boxes;
        List<RectF> result = new ArrayList<>();
        List<RectF> sorted = new ArrayList<>(boxes);
        // Sort by area descending (larger face = higher confidence)
        sorted.sort((a, b) -> Float.compare(b.width() * b.height(), a.width() * a.height()));

        boolean[] suppressed = new boolean[sorted.size()];
        for (int i = 0; i < sorted.size(); i++) {
            if (suppressed[i]) continue;
            result.add(sorted.get(i));
            for (int j = i + 1; j < sorted.size(); j++) {
                if (!suppressed[j] && iou(sorted.get(i), sorted.get(j)) > iouThreshold) {
                    suppressed[j] = true;
                }
            }
        }
        return result;
    }

    private float iou(RectF a, RectF b) {
        float interLeft   = Math.max(a.left, b.left);
        float interTop    = Math.max(a.top,  b.top);
        float interRight  = Math.min(a.right, b.right);
        float interBottom = Math.min(a.bottom, b.bottom);
        if (interRight <= interLeft || interBottom <= interTop) return 0f;
        float inter = (interRight - interLeft) * (interBottom - interTop);
        float aArea = a.width() * a.height();
        float bArea = b.width() * b.height();
        return inter / (aArea + bArea - inter);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Notification
    // ─────────────────────────────────────────────────────────────────────────

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "PureShield Active",
                NotificationManager.IMPORTANCE_LOW
            );
            ch.setDescription("Filtering visual content in background");
            ch.setShowBadge(false);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
    }

    private Notification buildNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("PureShield Active")
            .setContentText("Visual content filtering is running")
            .setSmallIcon(R.drawable.ic_shield)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    public static final class Actions {
        public static final String START_PROJECTION      = "PureShield.START_PROJECTION";
        public static final String STOP                  = "PureShield.STOP";
        public static final String UPDATE_CONFIG         = "PureShield.UPDATE_CONFIG";
        public static final String FOREGROUND_APP_CHANGED = "PureShield.FOREGROUND_APP_CHANGED";
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Inner data classes
    // ─────────────────────────────────────────────────────────────────────────

    public static class GenderResult {
        public final float femaleProbability;
        public final float maleProbability;
        GenderResult(float f, float m) {
            this.femaleProbability = f;
            this.maleProbability   = m;
        }
    }
}
