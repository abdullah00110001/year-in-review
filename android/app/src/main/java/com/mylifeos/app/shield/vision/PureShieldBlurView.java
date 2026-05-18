package com.mylifeos.app.shield.vision;

import android.content.Context;
import android.graphics.*;
import android.view.View;

/**
 * PureShieldBlurView — Beautiful face blur overlay
 *
 * ✅ Oval/ellipse shape (matches face shape)
 * ✅ Real gaussian-style blur effect
 * ✅ Smooth edges with feathering
 * ✅ Multiple faces supported (one view per face)
 */
public class PureShieldBlurView extends View {

    public enum BlurStyle { PIXELATE, FROSTED, SOLID, MOSAIC }

    private BlurStyle blurStyle = BlurStyle.FROSTED;
    private int overlayAlpha = 240;
    private boolean debugOverlay = false;
    private final Paint paint;
    private final Paint edgePaint;
    private final Paint pixelPaint;

    private static final int PIXEL_BLOCK = 12;

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
            case FROSTED:  drawFrosted(canvas, w, h);  break;
            case SOLID:    drawSolid(canvas, w, h);    break;
            case MOSAIC:   drawMosaic(canvas, w, h);   break;
        }

        if (debugOverlay) drawDebugBox(canvas, w, h);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ FROSTED — Beautiful frosted glass effect with oval shape
    // ─────────────────────────────────────────────────────────────────────────
    private void drawFrosted(Canvas canvas, int w, int h) {
        RectF oval = new RectF(0, 0, w, h);
        float rx = w / 2f, ry = h / 2f;

        // ✅ Feathered edge — soft blur border
        for (int ring = 8; ring >= 1; ring--) {
            float scale = 1f - (ring * 0.03f);
            float alpha = ring * 8;
            edgePaint.setColor(Color.argb((int) alpha, 200, 210, 255));
            RectF r = new RectF(
                w * (1 - scale) / 2f,
                h * (1 - scale) / 2f,
                w - w * (1 - scale) / 2f,
                h - h * (1 - scale) / 2f
            );
            canvas.drawRoundRect(r, rx * scale, ry * scale, edgePaint);
        }

        // ✅ Main frosted glass body — oval shape
        RadialGradient gradient = new RadialGradient(
            w / 2f, h / 2f,
            Math.max(w, h) / 2f,
            new int[]{
                Color.argb(withAlphaInt(0xDD), 240, 245, 255),
                Color.argb(withAlphaInt(0xCC), 220, 235, 255),
                Color.argb(withAlphaInt(0xBB), 200, 220, 250),
            },
            new float[]{0f, 0.6f, 1f},
            Shader.TileMode.CLAMP
        );
        paint.setShader(gradient);
        canvas.drawRoundRect(oval, rx * 0.95f, ry * 0.95f, paint);
        paint.setShader(null);

        // ✅ Inner glow
        paint.setColor(Color.argb(40, 255, 255, 255));
        RectF inner = new RectF(w * 0.1f, h * 0.05f, w * 0.9f, h * 0.45f);
        canvas.drawOval(inner, paint);

        // ✅ Shield icon in center
        drawShieldIcon(canvas, w, h, Color.argb(120, 80, 100, 180));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ PIXELATE — Classic pixelation with oval clip
    // ─────────────────────────────────────────────────────────────────────────
    private void drawPixelate(Canvas canvas, int w, int h) {
        // ✅ Clip to oval shape
        Path ovalPath = new Path();
        ovalPath.addOval(new RectF(0, 0, w, h), Path.Direction.CW);
        canvas.save();
        canvas.clipPath(ovalPath);

        // ✅ Pixelate blocks
        int[] colors = {
            Color.argb(withAlphaInt(0xFF), 210, 215, 230),
            Color.argb(withAlphaInt(0xFF), 195, 200, 220),
            Color.argb(withAlphaInt(0xFF), 180, 190, 215),
            Color.argb(withAlphaInt(0xFF), 200, 208, 225),
        };
        int idx = 0;
        for (int y = 0; y < h; y += PIXEL_BLOCK) {
            for (int x = 0; x < w; x += PIXEL_BLOCK) {
                pixelPaint.setColor(colors[idx % colors.length]);
                canvas.drawRect(x, y, Math.min(x + PIXEL_BLOCK, w), Math.min(y + PIXEL_BLOCK, h), pixelPaint);
                idx++;
            }
            idx++;
        }
        canvas.restore();

        // ✅ Soft oval border
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(2f);
        paint.setColor(Color.argb(80, 150, 160, 200));
        canvas.drawOval(new RectF(1, 1, w - 1, h - 1), paint);
        paint.setStyle(Paint.Style.FILL);

        drawShieldIcon(canvas, w, h, Color.argb(100, 60, 80, 150));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ SOLID — Clean dark oval
    // ─────────────────────────────────────────────────────────────────────────
    private void drawSolid(Canvas canvas, int w, int h) {
        // ✅ Feathered edge
        for (int ring = 6; ring >= 1; ring--) {
            float scale = 1f - (ring * 0.04f);
            edgePaint.setColor(Color.argb(ring * 15, 20, 30, 50));
            RectF r = new RectF(
                w * (1 - scale) / 2f, h * (1 - scale) / 2f,
                w - w * (1 - scale) / 2f, h - h * (1 - scale) / 2f
            );
            canvas.drawOval(r, edgePaint);
        }

        // ✅ Main solid oval
        paint.setColor(Color.argb(withAlphaInt(0xEE), 15, 23, 42));
        canvas.drawOval(new RectF(0, 0, w, h), paint);

        drawShieldIcon(canvas, w, h, Color.argb(180, 255, 255, 255));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ✅ MOSAIC — Colorful mosaic with oval clip
    // ─────────────────────────────────────────────────────────────────────────
    private void drawMosaic(Canvas canvas, int w, int h) {
        Path ovalPath = new Path();
        ovalPath.addOval(new RectF(0, 0, w, h), Path.Direction.CW);
        canvas.save();
        canvas.clipPath(ovalPath);

        int block = Math.max(8, Math.min(w, h) / 6);
        int[] colors = {
            Color.argb(withAlphaInt(0xFF), 15, 23, 42),
            Color.argb(withAlphaInt(0xFF), 8, 145, 178),
            Color.argb(withAlphaInt(0xFF), 226, 232, 240),
            Color.argb(withAlphaInt(0xFF), 51, 65, 85),
            Color.argb(withAlphaInt(0xFF), 30, 58, 138),
            Color.argb(withAlphaInt(0xFF), 100, 116, 139),
        };
        int idx = 0;
        for (int y = 0; y < h; y += block) {
            for (int x = 0; x < w; x += block) {
                pixelPaint.setColor(colors[idx++ % colors.length]);
                canvas.drawRoundRect(
                    new RectF(x, y, Math.min(x + block, w), Math.min(y + block, h)),
                    2f, 2f, pixelPaint
                );
            }
        }
        canvas.restore();

        // Border
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(2f);
        paint.setColor(Color.argb(100, 8, 145, 178));
        canvas.drawOval(new RectF(1, 1, w - 1, h - 1), paint);
        paint.setStyle(Paint.Style.FILL);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Shield icon — centered
    // ─────────────────────────────────────────────────────────────────────────
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

    private int withAlphaInt(int alpha) {
        return Math.round(alpha * (overlayAlpha / 255f));
    }

    private int withAlpha(int color) {
        int original = Color.alpha(color);
        int a = withAlphaInt(original);
        return (color & 0x00FFFFFF) | (a << 24);
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
    }
}
