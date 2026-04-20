package com.mylifeos.app;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.util.Log;
import android.widget.Toast;
import android.app.AppOpsManager;
import com.getcapacitor.BridgeActivity;
import com.mylifeos.app.plugins.RiseAlarmPlugin;
import com.mylifeos.app.plugins.AppUpdatePlugin;
import com.mylifeos.app.plugins.ShieldPlugin;
import com.mylifeos.app.shield.ShieldService;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "LifeOS";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register custom plugins before super.onCreate
        registerPlugin(AppUpdatePlugin.class);
        registerPlugin(RiseAlarmPlugin.class);
        registerPlugin(ShieldPlugin.class);

        super.onCreate(savedInstanceState);
        Log.d(TAG, "MainActivity onCreate");

        // Handle alarm intent if app was launched by alarm
        handleAlarmIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleAlarmIntent(intent);
    }

    private void handleAlarmIntent(Intent intent) {
        if (intent!= null && intent.getBooleanExtra("rise_alarm_trigger", false)) {
            String title = intent.getStringExtra("title");
            String body = intent.getStringExtra("body");
            String missionType = intent.getStringExtra("missionType");
            String dbId = intent.getStringExtra("dbId");
            Log.d(TAG, "Alarm triggered: " + title);

            getBridge().getWebView().post(() -> {
                getBridge().triggerJSEvent("riseAlarmTriggered", "{" +
                        "\"title\":\"" + title + "\"," +
                        "\"body\":\"" + body + "\"," +
                        "\"missionType\":\"" + missionType + "\"," +
                        "\"dbId\":\"" + dbId + "\"" +
                        "}");
            });
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        getWindow().getDecorView().post(() -> {
            try {
                if (getBridge() == null || getBridge().getWebView() == null) {
                    Log.w(TAG, "Bridge or WebView not ready yet");
                    return;
                }
                WebView webView = getBridge().getWebView();
                webView.getSettings().setJavaScriptEnabled(true);
                webView.getSettings().setDomStorageEnabled(true);
                webView.getSettings().setAllowFileAccess(true);
                webView.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        // পেজ লোড হওয়ার পর Shield চেক করো, আগে না
                        if (url.contains("app") || url.contains("dashboard")) {
                            checkAndStartShieldService();
                        }
                    }

                    @Override
                    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                        if (request!= null && request.isForMainFrame()) {
                            Log.e(TAG, "WebView main frame error: " + error.getDescription());
                            view.loadData(
                                    "<html><body style='background:#0f172a;color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;flex-direction:column'>" +
                                            "<h2>⏳ Loading Life OS...</h2>" +
                                            "<p>Check your internet connection</p>" +
                                            "<button onclick='location.reload()' style='margin-top:20px;padding:12px 24px;background:#0ea5e9;color:white;border:none;border-radius:8px;font-size:16px'>Retry</button>" +
                                            "</body></html>", "text/html", "UTF-8"
                            );
                        }
                    }
                });
                Log.d(TAG, "WebView hardened successfully");
            } catch (Exception e) {
                Log.e(TAG, "WebView setup error: " + e.getMessage());
            }
        });
    }

    // এই ফাংশনটা নতুন - লগিনের পর Shield চালু করার আগে পারমিশন চেক করবে
    private void checkAndStartShieldService() {
        AppOpsManager appOps = (AppOpsManager) getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(), getPackageName());

        if (mode == AppOpsManager.MODE_ALLOWED) {
            Log.d(TAG, "Usage Stats permission granted. Starting ShieldService.");
            Intent serviceIntent = new Intent(this, ShieldService.class);
            startService(serviceIntent);
        } else {
            Log.w(TAG, "Usage Stats permission NOT granted. Asking user.");
            Toast.makeText(this, "Please enable Usage Access for Shield to work", Toast.LENGTH_LONG).show();
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            startActivity(intent);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "App resumed");
    }
}