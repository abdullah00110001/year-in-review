package com.mylifeos.app.shield;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.util.Base64;
import android.view.Gravity;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.util.Log;

public class ShieldBlockActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ফুল স্ক্রিন এবং স্ট্যাটাস বার ট্রান্সপারেন্ট করা (Premium Look)
        Window w = getWindow();
        w.setFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS, WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        w.setStatusBarColor(Color.TRANSPARENT);

        // সার্ভিস থেকে পাঠানো ব্লকড অ্যাপের নাম রিসিভ করা
        String pkgName = getIntent().getStringExtra("BLOCKED_PACKAGE");
        if (pkgName == null) pkgName = "this distracted app";
        
        // প্যাকেজ নাম থেকে সুন্দর নাম বের করা (e.g., com.facebook.katana -> Facebook)
        String appName = extractAppName(pkgName);

        // ==========================================
        // 💾 রিঅ্যাক্ট থেকে ইউজারের কাস্টম ডেটা পড়া
        // ==========================================
        // মনে রাখবেন, রিঅ্যাক্টের localStorage জাভাতে "CapacitorStorage" নামে সেভ হয়
        SharedPreferences prefs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
        
        // ১. থিম আইডি পড়া
        String selectedTheme = prefs.getString("shield_block_screen_theme", "default");
        
        // ২. কাস্টম টেক্সট পড়া
        String customQuote = prefs.getString("shield_block_screen_text", 
            "Stay Focused on your GOALS,\nyour PEACE & your HAPPINESS...");
            
        // ৩. কাস্টম ইমেজ পড়া (Base64)
        String base64Image = prefs.getString("shield_block_screen_image", null);

        // মেইন লেআউট
        LinearLayout mainLayout = new LinearLayout(this);
        mainLayout.setOrientation(LinearLayout.VERTICAL);
        mainLayout.setGravity(Gravity.CENTER);
        mainLayout.setPadding(60, 100, 60, 100);

        // ==========================================
        // 🖼️ ব্যাকগ্রাউন্ড সেট করা (Image vs Gradient)
        // ==========================================
        if ("custom".equals(selectedTheme) && base64Image != null && !base64Image.isEmpty()) {
            try {
                // Base64 স্ট্রিংয়ের সামনের ডেটা ট্যাগ "data:image/jpeg;base64," কেটে ফেলা
                String pureBase64 = base64Image;
                if (base64Image.contains(",")) {
                    pureBase64 = base64Image.substring(base64Image.indexOf(",") + 1);
                }
                
                // ডিকোড করে ব্যাকগ্রাউন্ডে বসানো
                byte[] decodedString = Base64.decode(pureBase64, Base64.DEFAULT);
                Bitmap decodedByte = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);
                mainLayout.setBackground(new BitmapDrawable(getResources(), decodedByte));
            } catch (Exception e) {
                Log.e("ShieldBlockActivity", "Failed to decode image", e);
                mainLayout.setBackground(getThemeGradient("default")); // ফেইল করলে ডিফল্ট
            }
        } else {
            // যদি কাস্টম ইমেজ না থাকে, তাহলে থিমের গ্রেডিয়েন্ট বসাও
            mainLayout.setBackground(getThemeGradient(selectedTheme));
        }

        // ==========================================
        // 🛡️ Glassmorphism (গ্লাস ইফেক্ট) কার্ড ডিজাইন
        // ==========================================
        LinearLayout glassCard = new LinearLayout(this);
        glassCard.setOrientation(LinearLayout.VERTICAL);
        glassCard.setGravity(Gravity.CENTER);
        glassCard.setPadding(80, 100, 80, 100);
        
        // কার্ডের ব্যাকগ্রাউন্ড (কাস্টম ইমেজের ওপর টেক্সট পড়ার সুবিধার জন্য একটু ডার্ক ওভারলে)
        GradientDrawable cardBg = new GradientDrawable();
        if ("custom".equals(selectedTheme) && base64Image != null) {
            cardBg.setColor(Color.parseColor("#80000000")); // 50% Black
        } else {
            cardBg.setColor(Color.parseColor("#33FFFFFF")); // 20% White
        }
        cardBg.setCornerRadius(60f); // রাউন্ডেড কর্নার
        cardBg.setStroke(3, Color.parseColor("#4DFFFFFF")); // হালকা বর্ডার
        glassCard.setBackground(cardBg);

        // 🛡️ আইকন
        TextView shieldIcon = new TextView(this);
        shieldIcon.setText("🛡️");
        shieldIcon.setTextSize(60);
        shieldIcon.setGravity(Gravity.CENTER);
        shieldIcon.setPadding(0, 0, 0, 40);

        // 📝 মোটিভেশনাল কোট (ডাইনামিক)
        TextView quoteText = new TextView(this);
        quoteText.setText(customQuote);
        quoteText.setTextSize(18);
        quoteText.setTextColor(Color.WHITE);
        quoteText.setTypeface(null, Typeface.BOLD);
        quoteText.setGravity(Gravity.CENTER);
        quoteText.setLineSpacing(0, 1.2f);
        quoteText.setPadding(0, 0, 0, 60);

        // 🛑 ব্লকড অ্যাপের নাম
        TextView blockedAppText = new TextView(this);
        blockedAppText.setText(appName + " is currently blocked.");
        blockedAppText.setTextSize(14);
        blockedAppText.setTextColor(Color.parseColor("#E2E8F0")); // slate-200
        blockedAppText.setGravity(Gravity.CENTER);
        blockedAppText.setPadding(0, 0, 0, 80);

        // 🚪 গো হোম বাটন (Force Exit)
        Button homeBtn = new Button(this);
        homeBtn.setText("Go Back Home");
        homeBtn.setAllCaps(false);
        homeBtn.setTextSize(16);
        homeBtn.setTextColor(Color.parseColor("#1E293B")); // slate-800
        homeBtn.setTypeface(null, Typeface.BOLD);
        homeBtn.setPadding(60, 40, 60, 40);
        
        // বাটনের রাউন্ডেড ব্যাকগ্রাউন্ড
        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setColor(Color.WHITE);
        btnBg.setCornerRadius(100f); // পিল শেপ বাটন
        homeBtn.setBackground(btnBg);
        
        // বাটন ক্লিক ইফেক্ট
        homeBtn.setOnClickListener(v -> forceUserToHome());

        // সবকিছু কার্ডে যুক্ত করা
        glassCard.addView(shieldIcon);
        glassCard.addView(quoteText);
        glassCard.addView(blockedAppText);
        glassCard.addView(homeBtn);

        // কার্ড মেইন লেআউটে যুক্ত করা
        mainLayout.addView(glassCard);

        setContentView(mainLayout);
    }

    // ==========================================
    // 🎨 থিম গ্রেডিয়েন্ট লজিক
    // ==========================================
    private GradientDrawable getThemeGradient(String themeId) {
        int[] colors;
        switch (themeId) {
            case "ocean":
                colors = new int[]{Color.parseColor("#22D3EE"), Color.parseColor("#3B82F6")}; // cyan-400 to blue-500
                break;
            case "sunset":
                colors = new int[]{Color.parseColor("#67E8F9"), Color.parseColor("#F472B6")}; // cyan-300 to pink-400
                break;
            case "nature":
                colors = new int[]{Color.parseColor("#DDD6FE"), Color.parseColor("#C4B5FD")}; // violet-200 to violet-300
                break;
            case "minimal":
                colors = new int[]{Color.parseColor("#F9A8D4"), Color.parseColor("#FB7185")}; // pink-300 to rose-400
                break;
            default: // "default"
                colors = new int[]{Color.parseColor("#D8B4FE"), Color.parseColor("#A78BFA")}; // violet-300 to violet-400
                break;
        }
        return new GradientDrawable(GradientDrawable.Orientation.TL_BR, colors);
    }

    // প্যাকেজ নাম সুন্দর করার লজিক
    private String extractAppName(String pkgName) {
        if (pkgName.contains("facebook")) return "Facebook";
        if (pkgName.contains("instagram")) return "Instagram";
        if (pkgName.contains("youtube")) return "YouTube";
        if (pkgName.contains("tiktok")) return "TikTok";
        
        // যদি না মিলে, শেষের নামটা বড় হাতের করে দেখাবে
        String[] parts = pkgName.split("\\.");
        String name = parts[parts.length - 1];
        return name.substring(0, 1).toUpperCase() + name.substring(1);
    }

    // ==========================================
    // 🔒 ব্লাক-প্রুফ সিকিউরিটি লজিক
    // ==========================================
    private void forceUserToHome() {
        Intent startMain = new Intent(Intent.ACTION_MAIN);
        startMain.addCategory(Intent.CATEGORY_HOME);
        startMain.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(startMain);
        finish();
    }

    @Override
    public void onBackPressed() {
        // ব্যাক বাটন চাপলে বের হতে পারবে না
        forceUserToHome();
    }
    
    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        // রিসেন্ট বাটন চাপলে অ্যাপ থেকে বের করে দেবে
        finish();
    }
}
