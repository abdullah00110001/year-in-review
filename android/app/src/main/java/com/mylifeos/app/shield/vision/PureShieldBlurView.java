package com.mylifeos.app.shield.vision;

import android.content.Context;
import android.graphics.*;
import android.renderscript.*;
import android.view.View;

/**
 * PureShieldBlurView
 *
 * A transparent overlay View drawn on top of detected face regions.
 * Supports 3 visual blur styles:
 *  - PIXELATE  : classic pixelation mosaic
 *  - FROSTED   : RenderScript Gaussian blur (frosted glass)
 *  - SOLID     : solid colored rectangle (most performant)
 *
 * The view is NOT_FOCUSABLE and NOT_TOUCHABLE — it is purely visual.
 */
public class PureShieldBlurView extends View {

    public enum BlurStyle { PIXELATE, FROSTED, SOLID }

    private BlurStyle blurStyle = BlurStyle.PIXELATE;
    private final Paint paint;
    private final Paint pixelPaint;

    // For FROSTED style (RenderScript — API 26+)
    private RenderScript rs;
    private ScriptIntrinsicBlur blurScript;

    // Pixelation block size
    private static final int PIXEL_BLOCK = 16;

    public PureShieldBlurView(Context context) {
        super(context);
        setWillNotDraw(false);
        setLayerType(LAYER_TYPE_HARDWARE, null);

        paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setStyle(Paint.Style.FILL);

        pixelPaint = new Paint();
        pixelPaint.setStyle(Paint.Style.FILL);
        pixelPaint.setFilterBitmap(false); // Disable filtering for sharp pixels
    }

    public void setBlurStyle(BlurStyle style) {
        this.blurStyle = style;
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        switch (blurStyle) {
            case PIXELATE: drawPixelate(canvas); break;
            case FROSTED:  drawFrosted(canvas);  break;
            case SOLID:    drawSolid(canvas);    break;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PIXELATE style
    // Creates a mosaic effect by drawing large colored blocks.
    // Very CPU-cheap because it doesn't need the actual pixel content.
    // ─────────────────────────────────────────────────────────────────────────
    private void drawPixelate(Canvas canvas) {
        int w = getWidth(), h = getHeight();
        if (w <= 0 || h <= 0) return;

        // Draw semi-transparent mosaic pattern
        int[] colors = {
            0xFFE0E0E0, 0xFFD0D0D0, 0xFFC8C8C8, 0xFFD8D8D8
        };
        int idx = 0;
        for (int y = 0; y < h; y += PIXEL_BLOCK) {
            for (int x = 0; x < w; x += PIXEL_BLOCK) {
                pixelPaint.setColor(colors[idx % colors.length]);
                canvas.drawRect(x, y,
                    Math.min(x + PIXEL_BLOCK, w),
                    Math.min(y + PIXEL_BLOCK, h),
                    pixelPaint);
                idx++;
            }
            idx++;
        }

        // Add a subtle icon indicator
        paint.setColor(0x88000000);
        paint.setTextSize(Math.min(w, h) * 0.35f);
        paint.setTextAlign(Paint.Align.CENTER);
        canvas.drawText("🛡", w / 2f, h / 2f + paint.getTextSize() * 0.35f, paint);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FROSTED style
    // Semi-transparent white overlay that mimics frosted glass.
    // Most visually polished. Uses no RenderScript on the overlay itself
    // (true behind-content blur isn't possible without root/system priv).
    // ─────────────────────────────────────────────────────────────────────────
    private void drawFrosted(Canvas canvas) {
        int w = getWidth(), h = getHeight();
        if (w <= 0 || h <= 0) return;

        // Frosted glass gradient
        LinearGradient gradient = new LinearGradient(
            0, 0, w, h,
            new int[]{ 0xCCFFFFFF, 0xAAE8E8FF, 0xCCFFFFFF },
            null,
            Shader.TileMode.CLAMP
        );

        paint.setShader(gradient);
        RectF rect = new RectF(0, 0, w, h);
        canvas.drawRoundRect(rect, 8f, 8f, paint);
        paint.setShader(null);

        // Border
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1.5f);
        paint.setColor(0x55FFFFFF);
        canvas.drawRoundRect(rect, 8f, 8f, paint);
        paint.setStyle(Paint.Style.FILL);

        // Icon
        paint.setColor(0x99334155);
        paint.setTextSize(Math.min(w, h) * 0.3f);
        paint.setTextAlign(Paint.Align.CENTER);
        canvas.drawText("🛡", w / 2f, h / 2f + paint.getTextSize() * 0.35f, paint);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SOLID style
    // Pure dark overlay. Most performant — zero computation.
    // ─────────────────────────────────────────────────────────────────────────
    private void drawSolid(Canvas canvas) {
        int w = getWidth(), h = getHeight();
        if (w <= 0 || h <= 0) return;

        paint.setColor(0xFF1E293B);
        canvas.drawRect(0, 0, w, h, paint);

        paint.setColor(0xFFFFFFFF);
        paint.setTextSize(Math.min(w, h) * 0.3f);
        paint.setTextAlign(Paint.Align.CENTER);
        canvas.drawText("🛡", w / 2f, h / 2f + paint.getTextSize() * 0.35f, paint);
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        if (rs != null) { rs.destroy(); rs = null; }
    }
}
