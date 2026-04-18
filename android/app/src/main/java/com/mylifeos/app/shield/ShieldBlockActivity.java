package com.mylifeos.app.shield;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import com.mylifeos.app.R;

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
            appNameView.setText(blockedPackage);
        }

        if ("time_limit".equals(reason)) {
            reasonView.setText("You have reached your time limit for this app today.");
        } else {
            reasonView.setText("This app is blocked by Shield to protect your focus.");
        }

        View.OnClickListener goHome = v -> {
            Intent startMain = new Intent(Intent.ACTION_MAIN);
            startMain.addCategory(Intent.CATEGORY_HOME);
            startMain.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(startMain);
            finish();
        };

        homeBtn.setOnClickListener(goHome);
        closeBtn.setOnClickListener(goHome);
    }

    @Override
    public void onBackPressed() {
        Intent startMain = new Intent(Intent.ACTION_MAIN);
        startMain.addCategory(Intent.CATEGORY_HOME);
        startMain.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(startMain);
        finish();
    }
}