package com.mylifeos.app.shield;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.GradientDrawable;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Base64;
import android.util.Log;
import android.view.Gravity;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class ShieldBlockActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ============ 🟢 VIBRATION PART 🟢 ============
        try {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= 26) {
                    v.vibrate(VibrationEffect.createWaveform(new long[]{0, 200, 100, 200}, -1));
                } else {
                    v.vibrate(new long[]{0, 200, 100, 200}, -1);
                }
            }
        } catch (Exception ignored) {}
        
        // ============ 🟢 SOUND PART 🟢 ============
        try {
            Uri notif = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            Ringtone r = RingtoneManager.getRingtone(getApplicationContext(), notif);
            if (r != null) r.play();
        } catch (Exception ignored) {}

        // ফুল স্ক্রিন এবং স্ট্যাটাস বার ট্রান্সপারেন্ট করা
        Window w = getWindow();
        w.setFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        w.setStatusBarColor(Color.TRANSPARENT);

        // সার্ভিস থেকে পাঠানো ব্লকড অ্যাপের নাম রিসিভ করা
        String pkgName = getIntent().getStringExtra("BLOCKED_PACKAGE");
        if (pkgName == null) pkgName = "this distracted app";
        
        String appName = extractAppName(pkgName);

        // ==========================================
        // 💾 রিঅ্যাক্ট থেকে ইউজারের কাস্টম ডেটা পড়া
        // ==========================================
        SharedPreferences prefs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
        String selectedTheme = prefs.getString("shield_block_screen_theme", "default");
        String customQuote = prefs.getString("shield_block_screen_text", 
            "Stay Focused on your GOALS,\nyour PEACE & your HAPPINESS...");
        String base64Image = prefs.getString("shield_block_screen_image", null);

        // মেইন লেআউট
        LinearLayout mainLayout = new LinearLayout(this);
        mainLayout.setOrientation(LinearLayout.VERTICAL);
        mainLayout.setGravity(Gravity.CENTER);
        mainLayout.setPadding(60, 100, 60, 100);

        // ==========================================
        // 🖼️ ব্যাকগ্রাউন্ড সেট করা
        // ==========================================
        if ("custom".equals(selectedTheme) && base64Image != null && !base64Image.isEmpty()) {
            try {
                String pureBase64 = base64Image;
                if (base64Image.contains(",")) {
                    pureBase64 = base64Image.substring(base64Image.indexOf(",") + 1);
                }
                byte[] decodedString = Base64.decode(pureBase64, Base64.DEFAULT);
                Bitmap decodedByte = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);
                mainLayout.setBackground(new BitmapDrawable(getResources(), decodedByte));
            } catch (Exception e) {
                Log.e("ShieldBlockActivity", "Failed to decode image", e);
                mainLayout.setBackground(getThemeGradient("default"));
            }
        } else {
            mainLayout.setBackground(getThemeGradient(selectedTheme));
        }

        // ==========================================
        // 🛡️ Glassmorphism কার্ড ডিজাইন
        // ==========================================
        LinearLayout glassCard = new LinearLayout(this);
        glassCard.setOrientation(LinearLayout.VERTICAL);
        glassCard.setGravity(Gravity.CENTER);
        glassCard.setPadding(80, 100, 80, 100);
        
        GradientDrawable cardBg = new GradientDrawable();
        if ("custom".equals(selectedTheme) && base64Image != null) {
            cardBg.setColor(Color.parseColor("#80000000"));
        } else {
            cardBg.setColor(Color.parseColor("#33FFFFFF"));
        }
        cardBg.setCornerRadius(60f);
        cardBg.setStroke(3, Color.parseColor("#4DFFFFFF"));
        glassCard.setBackground(cardBg);

        TextView shieldIcon = new TextView(this);
        shieldIcon.setText("🛡️");
        shieldIcon.setTextSize(60);
        shieldIcon.setGravity(Gravity.CENTER);
        shieldIcon.setPadding(0, 0, 0, 40);

        TextView quoteText = new TextView(this);
        quoteText.setText(customQuote);
        quoteText.setTextSize(18);
        quoteText.setTextColor(Color.WHITE);
        quoteText.setTypeface(null, Typeface.BOLD);
        quoteText.setGravity(Gravity.CENTER);
        quoteText.setLineSpacing(0, 1.2f);
        quoteText.setPadding(0, 0, 0, 60);

        TextView blockedAppText = new TextView(this);
        blockedAppText.setText(appName + " is currently blocked.");
        blockedAppText.setTextSize(14);
        blockedAppText.setTextColor(Color.parseColor("#E2E8F0"));
        blockedAppText.setGravity(Gravity.CENTER);
        blockedAppText.setPadding(0, 0, 0, 80);

        Button homeBtn = new Button(this);
        homeBtn.setText("Go Back Home");
        homeBtn.setAllCaps(false);
        homeBtn.setTextSize(16);
        homeBtn.setTextColor(Color.parseColor("#1E293B"));
        homeBtn.setTypeface(null, Typeface.BOLD);
        homeBtn.setPadding(60, 40, 60, 40);
        
        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setColor(Color.WHITE);
        btnBg.setCornerRadius(100f);
        homeBtn.setBackground(btnBg);
        homeBtn.setOnClickListener(v -> forceUserToHome());

        glassCard.addView(shieldIcon);
        glassCard.addView(quoteText);
        glassCard.addView(blockedAppText);
        glassCard.addView(homeBtn);

        mainLayout.addView(glassCard);
        setContentView(mainLayout);
    }

    private GradientDrawable getThemeGradient(String themeId) {
        int[] colors;
        switch (themeId) {
            case "ocean":
                colors = new int[]{Color.parseColor("#22D3EE"), Color.parseColor("#3B82F6")};
                break;
            case "sunset":
                colors = new int[]{Color.parseColor("#67E8F9"), Color.parseColor("#F472B6")};
                break;
            case "nature":
                colors = new int[]{Color.parseColor("#DDD6FE"), Color.parseColor("#C4B5FD")};
                break;
            case "minimal":
                colors = new int[]{Color.parseColor("#F9A8D4"), Color.parseColor("#FB7185")};
                break;
            default:
                colors = new int[]{Color.parseColor("#D8B4FE"), Color.parseColor("#A78BFA")};
                break;
        }
        return new GradientDrawable(GradientDrawable.Orientation.TL_BR, colors);
    }

    private String extractAppName(String pkgName) {
        if (pkgName.contains("facebook")) return "Facebook";
        if (pkgName.contains("instagram")) return "Instagram";
        if (pkgName.contains("youtube")) return "YouTube";
        if (pkgName.contains("tiktok")) return "TikTok";
        
        String[] parts = pkgName.split("\\.");
        String name = parts[parts.length - 1];
        return name.substring(0, 1).toUpperCase() + name.substring(1);
    }

    private void forceUserToHome() {
        Intent startMain = new Intent(Intent.ACTION_MAIN);
        startMain.addCategory(Intent.CATEGORY_HOME);
        startMain.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(startMain);
        finish();
    }

    @Override
    public void onBackPressed() {
        forceUserToHome();
    }
    
    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        finish();
    }
}