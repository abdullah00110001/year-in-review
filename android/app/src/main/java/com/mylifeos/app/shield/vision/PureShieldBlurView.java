package com.mylifeos.app.shield.vision;

import android.content.Context;
import android.graphics.*;
import android.view.View;

/**
 * PureShieldBlurView — Face blur overlay
 * Styles: PIXELATE, SMUDGE, DOTS, BLUR, FROSTED, SOLID, MOSAIC
 */
public class PureShieldBlurView extends View {

    public enum BlurStyle {
        PIXELATE,   // pixel blocks (skin-tone)
        SMUDGE,     // smudge / swirl lines
        DOTS,       // dot grid pattern
        BLUR,       // gaussian-style soft blur
        FROSTED,    // frosted glass
        SOLID,      // dark solid oval
        MOSAIC      // colorful mosaic tiles
    }

    private BlurStyle blurStyle = BlurStyle.BLUR;
    private int overlayAlpha    = 255;
    private boolean debugOverlay = false;

    private final Paint paint;
    private final Paint edgePaint;
    private final Paint pixelPaint;

    private static final int PIXEL_BLOCK = 10;

    public PureShieldBlurView(Context context) {
        super(context);
        setWillNotDraw(false);
        setLayerType(LAYER_TYPE_SOFTWARE, null);

        paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setStyle(Paint.Style.FILL);

        edgePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        edgePaint.setStyle(Paint.Style.FILL);

        pixelPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        pixelPaint.setStyle(Paint.Style.FILL);
        pixelPaint.setFilterBitmap(false);
    }

    public void setBlurStyle(BlurStyle style) {
        this.blurStyle = style;
        invalidate();
    }

    public void setOverlayOpacity(int opacityPercent) {
        overlayAlpha = Math.round(255f * Math.max(20, Math.min(100, opacityPercent)) / 100f);
        invalidate();
    }

    public void setDebugOverlay(boolean enabled) {
        this.debugOverlay = enabled;
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        int w = getWidth(), h = getHeight();
        if (w <= 0 || h <= 0) return;

        switch (blurStyle) {
            case PIXELATE: drawPixelate(canvas, w, h); break;
            case SMUDGE:   drawSmudge(canvas, w, h);   break;
            case DOTS:     drawDots(canvas, w, h);     break;
            case BLUR:     drawBlur(canvas, w, h);     break;
            case FROSTED:  drawFrosted(canvas, w, h);  break;
            case SOLID:    drawSolid(canvas, w, h);    break;
            case MOSAIC:   drawMosaic(canvas, w, h);   break;
        }

        if (debugOverlay) drawDebugBox(canvas, w, h);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. BLUR — soft gaussian-style radial blur (ছবির Blur style)
    // ─────────────────────────────────────────────────────────────────────────
    private void drawBlur(Canvas canvas, int w, int h) {
        // Base: semi-opaque white fill
        paint.setColor(Color.argb(200, 255, 255, 255));
        canvas.drawOval(new RectF(0, 0, w, h), paint);

        // Multiple layered radial gradients to simulate gaussian blur
        float cx = w / 2f, cy = h / 2f;
        float radius = Math.max(w, h) / 1.4f;

        // Layer 1 — core bright
        RadialGradient g1 = new RadialGradient(cx, cy, radius * 0.4f,
            new int[]{
                Color.argb(200, 255, 255, 255),
                Color.argb(150, 240, 245, 255),
                Color.argb(0,   240, 245, 255),
            },
            new float[]{0f, 0.6f, 1f},
            Shader.TileMode.CLAMP);
        paint.setShader(g1);
        canvas.drawOval(new RectF(0, 0, w, h), paint);
        paint.setShader(null);

        // Layer 2 — mid haze
        RadialGradient g2 = new RadialGradient(cx, cy * 0.7f, radius * 0.65f,
            new int[]{
                Color.argb(120, 255, 255, 255),
                Color.argb(60,  230, 235, 248),
                Color.argb(0,   230, 235, 248),
            },
            new float[]{0f, 0.55f, 1f},
            Shader.TileMode.CLAMP);
        paint.setShader(g2);
        canvas.drawOval(new RectF(0, 0, w, h), paint);
        paint.setShader(null);

        // Layer 3 — outer soft haze
        RadialGradient g3 = new RadialGradient(cx, cy, radius,
            new int[]{
                Color.argb(0,  255, 255, 255),
                Color.argb(80, 200, 215, 240),
                Color.argb(180, 180, 200, 230),
            },
            new float[]{0.3f, 0.7f, 1f},
            Shader.TileMode.CLAMP);
        paint.setShader(g3);
        canvas.drawOval(new RectF(0, 0, w, h), paint);
        paint.setShader(null);

        // Feathered oval border
        drawFeatheredOvalEdge(canvas, w, h, Color.argb(60, 180, 200, 235));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. SMUDGE — smear/swirl lines effect (ছবির Smudge style)
    // ─────────────────────────────────────────────────────────────────────────
    private void drawSmudge(Canvas canvas, int w, int h) {
        // Clip to oval
        Path ovalPath = new Path();
        ovalPath.addOval(new RectF(0, 0, w, h), Path.Direction.CW);
        canvas.save();
        canvas.clipPath(ovalPath);

        // Background — light grey-white base
        paint.setColor(Color.argb(240, 248, 250, 255));
        canvas.drawRect(0, 0, w, h, paint);

        // Draw smudge strokes — diagonal & curved lines
        Paint strokePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        strokePaint.setStyle(Paint.Style.STROKE);
        strokePaint.setStrokeCap(Paint.Cap.ROUND);
        strokePaint.setStrokeJoin(Paint.Join.ROUND);
        strokePaint.setMaskFilter(new BlurMaskFilter(8f, BlurMaskFilter.Blur.NORMAL));

        // Light grey smudge strokes at different angles
        int[][] smudgeColors = {
            {160, 165, 175, 80},
            {140, 148, 165, 70},
            {175, 180, 190, 60},
            {130, 138, 155, 75},
            {190, 194, 200, 55},
            {155, 160, 172, 85},
        };

        // Horizontal wave strokes
        for (int i = 0; i < 8; i++) {
            int[] c = smudgeColors[i % smudgeColors.length];
            strokePaint.setColor(Color.argb(c[3], c[0], c[1], c[2]));
            strokePaint.setStrokeWidth(w * 0.08f + i * 2);

            float yPos = h * (0.1f + i * 0.11f);
            float waveAmp = h * 0.06f;
            float phase = i * 0.7f;

            Path wavePath = new Path();
            wavePath.moveTo(-w * 0.1f, yPos);
            for (float x = 0; x <= w * 1.1f; x += w * 0.15f) {
                float y = yPos + (float)(Math.sin(x / (w * 0.3f) + phase) * waveAmp);
                wavePath.lineTo(x, y);
            }
            canvas.drawPath(wavePath, strokePaint);
        }

        // Diagonal smear strokes
        for (int i = 0; i < 5; i++) {
            int[] c = smudgeColors[i % smudgeColors.length];
            strokePaint.setColor(Color.argb(c[3] - 10, c[0], c[1], c[2]));
            strokePaint.setStrokeWidth(w * 0.06f);

            float startX = w * (0.05f + i * 0.2f);
            Path diagPath = new Path();
            diagPath.moveTo(startX, 0);
            diagPath.cubicTo(
                startX + w * 0.15f, h * 0.3f,
                startX - w * 0.1f,  h * 0.65f,
                startX + w * 0.1f,  h
            );
            canvas.drawPath(diagPath, strokePaint);
        }

        canvas.restore();

        // Oval border
        drawFeatheredOvalEdge(canvas, w, h, Color.argb(70, 140, 150, 170));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. DOTS — dot grid pattern (ছবির Dots style)
    // ─────────────────────────────────────────────────────────────────────────
    private void drawDots(Canvas canvas, int w, int h) {
        // Clip to oval
        Path ovalPath = new Path();
        ovalPath.addOval(new RectF(0, 0, w, h), Path.Direction.CW);
        canvas.save();
        canvas.clipPath(ovalPath);

        // Background
        paint.setColor(Color.argb(230, 245, 247, 255));
        canvas.drawRect(0, 0, w, h, paint);

        // Dot grid
        int dotSpacing = Math.max(8, Math.min(w, h) / 9);
        float dotRadius = dotSpacing * 0.32f;

        // Dot colors — varied for visual depth
        int[] dotColors = {
            Color.argb(200, 60,  80, 120),
            Color.argb(180, 80, 100, 150),
            Color.argb(160, 40,  60, 100),
            Color.argb(190, 70,  90, 135),
        };

        for (int y = dotSpacing / 2; y < h; y += dotSpacing) {
            for (int x = dotSpacing / 2; x < w; x += dotSpacing) {
                int hash = Math.abs(x / dotSpacing * 7 + y / dotSpacing * 13) % dotColors.length;
                pixelPaint.setColor(dotColors[hash]);

                // Slight size variation for organic feel
                float sizeVar = ((x / dotSpacing + y / dotSpacing) % 3 == 0) ? dotRadius * 1.2f : dotRadius;
                canvas.drawCircle(x, y, sizeVar, pixelPaint);
            }
        }

        canvas.restore();

        // Border
        drawFeatheredOvalEdge(canvas, w, h, Color.argb(80, 60, 80, 140));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. PIXELATE — skin-tone pixel blocks (ছবির Pixel style)
    // ─────────────────────────────────────────────────────────────────────────
    private void drawPixelate(Canvas canvas, int w, int h) {
        Path ovalPath = new Path();
        ovalPath.addOval(new RectF(0, 0, w, h), Path.Direction.CW);
        canvas.save();
        canvas.clipPath(ovalPath);

        // Skin-tone + neutral palette
        int[] colors = {
            Color.rgb(210, 170, 130),
            Color.rgb(185, 145, 105),
            Color.rgb(230, 195, 160),
            Color.rgb(160, 120,  85),
            Color.rgb(240, 210, 175),
            Color.rgb(120,  90,  70),
            Color.rgb(195, 160, 125),
            Color.rgb( 80,  60,  50),
        };

        for (int y = 0; y < h; y += PIXEL_BLOCK) {
            for (int x = 0; x < w; x += PIXEL_BLOCK) {
                int hash = Math.abs(x / PIXEL_BLOCK * 31 + y / PIXEL_BLOCK * 17) % colors.length;
                pixelPaint.setColor(colors[hash]);
                canvas.drawRect(x, y,
                    Math.min(x + PIXEL_BLOCK, w),
                    Math.min(y + PIXEL_BLOCK, h), pixelPaint);
            }
        }
        canvas.restore();

        drawFeatheredOvalEdge(canvas, w, h, Color.argb(80, 100, 70, 50));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. FROSTED — frosted glass oval
    // ─────────────────────────────────────────────────────────────────────────
    private void drawFrosted(Canvas canvas, int w, int h) {
        RectF oval = new RectF(0, 0, w, h);

        // Outer glow rings
        for (int ring = 8; ring >= 1; ring--) {
            float s = 1f + ring * 0.025f;
            edgePaint.setColor(Color.argb(ring * 8, 180, 200, 240));
            float cx = w / 2f, cy = h / 2f;
            canvas.drawOval(new RectF(cx - (w/2f)*s, cy - (h/2f)*s,
                cx + (w/2f)*s, cy + (h/2f)*s), edgePaint);
        }

        // Main glass body
        RadialGradient gradient = new RadialGradient(
            w / 2f, h * 0.38f,
            Math.max(w, h) / 1.5f,
            new int[]{
                Color.argb(240, 250, 252, 255),
                Color.argb(245, 225, 235, 252),
                Color.argb(248, 195, 210, 240),
                Color.argb(250, 160, 178, 220),
            },
            new float[]{0f, 0.40f, 0.72f, 1f},
            Shader.TileMode.CLAMP);
        paint.setShader(gradient);
        canvas.drawOval(oval, paint);
        paint.setShader(null);

        // Shimmer
        RadialGradient shimmer = new RadialGradient(
            w * 0.38f, h * 0.22f, w * 0.45f,
            new int[]{Color.argb(120, 255, 255, 255), Color.argb(0, 255, 255, 255)},
            null, Shader.TileMode.CLAMP);
        paint.setShader(shimmer);
        canvas.drawOval(oval, paint);
        paint.setShader(null);

        drawFeatheredOvalEdge(canvas, w, h, Color.argb(90, 120, 150, 200));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. SOLID — dark oval
    // ─────────────────────────────────────────────────────────────────────────
    private void drawSolid(Canvas canvas, int w, int h) {
        for (int ring = 6; ring >= 1; ring--) {
            float scale = 1f - (ring * 0.04f);
            edgePaint.setColor(Color.argb(ring * 12, 20, 30, 50));
            float cx = w / 2f, cy = h / 2f;
            float hw = (w / 2f) * scale, hh = (h / 2f) * scale;
            canvas.drawOval(new RectF(cx - hw, cy - hh, cx + hw, cy + hh), edgePaint);
        }

        RadialGradient gradient = new RadialGradient(
            w / 2f, h / 3f, Math.max(w, h) * 0.7f,
            new int[]{Color.argb(240, 30, 42, 68), Color.argb(250, 10, 16, 35)},
            null, Shader.TileMode.CLAMP);
        paint.setShader(gradient);
        canvas.drawOval(new RectF(0, 0, w, h), paint);
        paint.setShader(null);

        drawShieldIcon(canvas, w, h, Color.argb(180, 255, 255, 255));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. MOSAIC — colorful tiled mosaic
    // ─────────────────────────────────────────────────────────────────────────
    private void drawMosaic(Canvas canvas, int w, int h) {
        Path ovalPath = new Path();
        ovalPath.addOval(new RectF(0, 0, w, h), Path.Direction.CW);
        canvas.save();
        canvas.clipPath(ovalPath);

        int block = Math.max(10, Math.min(w, h) / 7);
        int[] colors = {
            Color.rgb(15, 23, 42),
            Color.rgb(8, 145, 178),
            Color.rgb(226, 232, 240),
            Color.rgb(51, 65, 85),
            Color.rgb(30, 58, 138),
            Color.rgb(100, 116, 139),
            Color.rgb(14, 116, 144),
            Color.rgb(71, 85, 105),
        };

        for (int y = 0; y < h; y += block) {
            for (int x = 0; x < w; x += block) {
                int hash = Math.abs(x / block * 13 + y / block * 7) % colors.length;
                pixelPaint.setColor(colors[hash]);
                canvas.drawRoundRect(
                    new RectF(x + 1f, y + 1f,
                        Math.min(x + block, w) - 1f,
                        Math.min(y + block, h) - 1f),
                    3f, 3f, pixelPaint);
            }
        }
        canvas.restore();

        drawFeatheredOvalEdge(canvas, w, h, Color.argb(100, 8, 145, 178));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Shared helpers
    // ─────────────────────────────────────────────────────────────────────────

    private void drawFeatheredOvalEdge(Canvas canvas, int w, int h, int color) {
        for (int ring = 4; ring >= 1; ring--) {
            float s = 1f - ring * 0.03f;
            edgePaint.setColor(Color.argb(ring * 18,
                Color.red(color), Color.green(color), Color.blue(color)));
            float cx = w / 2f, cy = h / 2f;
            canvas.drawOval(new RectF(
                cx - (w/2f)*s, cy - (h/2f)*s,
                cx + (w/2f)*s, cy + (h/2f)*s), edgePaint);
        }
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1.8f);
        paint.setColor(color);
        canvas.drawOval(new RectF(1f, 1f, w - 1f, h - 1f), paint);
        paint.setStyle(Paint.Style.FILL);
    }

    private void drawShieldIcon(Canvas canvas, int w, int h, int color) {
        float size = Math.min(w, h) * 0.28f;
        if (size < 8f) return;
        paint.setColor(color);
        paint.setTextSize(size);
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setTypeface(Typeface.DEFAULT);
        canvas.drawText("🛡", w / 2f, h / 2f + size * 0.38f, paint);
    }

    private void drawDebugBox(Canvas canvas, int w, int h) {
        paint.setShader(null);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(3f);
        paint.setColor(0xFF22C55E);
        canvas.drawRect(1, 1, w - 1, h - 1, paint);
        paint.setStyle(Paint.Style.FILL);
    }
}
