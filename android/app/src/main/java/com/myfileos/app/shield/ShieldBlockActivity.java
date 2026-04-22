package com.myfileos.app.shield;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import com.myfileos.app.R;

public class ShieldBlockActivity extends Activity {
    private String blockedPackage;
    private String reason;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_shield_block);

        Intent intent = getIntent();
        blockedPackage = intent.getStringExtra("blocked_package");
        reason = intent.getStringExtra("reason");

        // ফিক্স 1: blockedPackage null হলে অ্যাক্টিভিটি বন্ধ করে দাও
        if (blockedPackage == null || blockedPackage.isEmpty()) {
            goToHome();
            return;
        }

        setupUI();
    }

    private void setupUI() {
        ImageView iconView = findViewById(R.id.block_icon);
        TextView appNameView = findViewById(R.id.block_app_name);
        TextView reasonView = findViewById(R.id.block_reason);
        Button homeBtn = findViewById(R.id.block_home_btn);
        Button closeBtn = findViewById(R.id.block_close_btn);

        try {
            PackageManager pm = getPackageManager();
            ApplicationInfo appInfo = pm.getApplicationInfo(blockedPackage, 0);
            iconView.setImageDrawable(pm.getApplicationIcon(appInfo));
            appNameView.setText(pm.getApplicationLabel(appInfo));
        } catch (Exception e) {
            // ফিক্স 2: অ্যাপ না পাইলে প্যাকেজ নামই দেখাও
            iconView.setImageResource(android.R.drawable.ic_lock_lock);
            appNameView.setText(blockedPackage);
        }

        if ("time_limit".equals(reason)) {
            reasonView.setText("You have reached your time limit for this app today.\nTake a break and come back tomorrow.");
        } else {
            reasonView.setText("This app is blocked by Shield to protect your focus.\nStay on track with your goals.");
        }

        View.OnClickListener goHome = v -> goToHome();
        homeBtn.setOnClickListener(goHome);
        closeBtn.setOnClickListener(goHome);
    }

    private void goToHome() {
        // ফিক্স 3: finishAffinity() দিয়ে সব অ্যাক্টিভিটি ক্লিয়ার করো
        Intent startMain = new Intent(Intent.ACTION_MAIN);
        startMain.addCategory(Intent.CATEGORY_HOME);
        startMain.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(startMain);
        finishAffinity();
    }

    @Override
    public void onBackPressed() {
        // ব্যাক বাটন দিয়েও যাতে ব্লকড অ্যাপে যাওয়া না যায়
        goToHome();
    }

    @Override
    protected void onPause() {
        super.onPause();
        // ফিক্স 4: ইউজার Recent বাটন চেপে বের হলে এই স্ক্রিন সামনে আনো
        if (!isFinishing()) {
            Intent intent = new Intent(this, ShieldBlockActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
            intent.putExtra("blocked_package", blockedPackage);
            intent.putExtra("reason", reason);
            startActivity(intent);
        }
    }
}