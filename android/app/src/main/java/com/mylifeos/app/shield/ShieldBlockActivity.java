package com.mylifeos.app.shield;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class ShieldBlockActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // সার্ভিস থেকে পাঠানো ব্লকড অ্যাপের নাম রিসিভ করা
        String pkgName = getIntent().getStringExtra("BLOCKED_PACKAGE");
        if (pkgName == null) {
            pkgName = "this restricted app";
        }

        // ==========================================
        // 🎨 ডাইনামিক UI ডিজাইন (কোনো XML লাগবে না)
        // ==========================================
        
        // মেইন ব্যাকগ্রাউন্ড (Dark Slate Color)
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setBackgroundColor(Color.parseColor("#0F172A")); // bg-slate-900
        layout.setPadding(80, 80, 80, 80);

        // 🛡️ টাইটেল টেক্সট
        TextView title = new TextView(this);
        title.setText("🛡️ SHIELD IS ACTIVE");
        title.setTextSize(28);
        title.setTextColor(Color.WHITE);
        title.setTypeface(null, Typeface.BOLD);
        title.setGravity(Gravity.CENTER);

        // 📝 সাবটাইটেল (কোন অ্যাপ ব্লকড)
        TextView subtitle = new TextView(this);
        subtitle.setText("Stay Focused!\nYou are restricted from using:\n\n" + pkgName);
        subtitle.setTextSize(16);
        subtitle.setTextColor(Color.parseColor("#94A3B8")); // text-slate-400
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setPadding(0, 40, 0, 100);

        // 🚪 গো হোম বাটন (Force Exit)
        Button homeBtn = new Button(this);
        homeBtn.setText("Go Back Home");
        homeBtn.setBackgroundColor(Color.parseColor("#6366F1")); // bg-indigo-500
        homeBtn.setTextColor(Color.WHITE);
        homeBtn.setTextSize(16);
        homeBtn.setPadding(40, 30, 40, 30);
        homeBtn.setOnClickListener(v -> forceUserToHome());

        // সবকিছু লেআউটে যুক্ত করা
        layout.addView(title);
        layout.addView(subtitle);
        layout.addView(homeBtn);

        setContentView(layout);
    }

    // ==========================================
    // 🔒 ব্লাক-প্রুফ সিকিউরিটি লজিক
    // ==========================================

    private void forceUserToHome() {
        // এই ইন্টেন্টটা ইউজারকে সোজা ফোনের লঞ্চারে (হোম স্ক্রিন) পাঠিয়ে দেবে
        Intent startMain = new Intent(Intent.ACTION_MAIN);
        startMain.addCategory(Intent.CATEGORY_HOME);
        startMain.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(startMain);
        finish(); // ব্লক স্ক্রিন বন্ধ করে দেওয়া (যেহেতু ইউজার অলরেডি হোমে চলে গেছে)
    }

    @Override
    public void onBackPressed() {
        // ইউজার ব্যাক বাটন চাপলে ব্লক স্ক্রিন সরবে না, বরং তাকে সোজা হোমে পাঠিয়ে দেবে!
        forceUserToHome();
    }
    
    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        // ইউজার যদি হোম বাটন বা রিসেন্ট অ্যাপস বাটন চাপে, তবে আমরা অ্যাক্টিভিটি ক্লোজ করে দেব
        finish();
    }
}
