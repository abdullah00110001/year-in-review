package app.lifeos.com;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "LifeOS";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "MainActivity onCreate");
    }

    @Override
    public void onStart() {
        super.onStart();
        
        // Prevent auto-exit on WebView errors
        try {
            WebView webView = getBridge().getWebView();
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                    Log.e(TAG, "WebView error: " + description + " url: " + failingUrl);
                    // Show retry page instead of crashing
                    view.loadData(
                        "<html><body style='background:#0f172a;color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;flex-direction:column'>" +
                        "<h2>⏳ Loading Life OS...</h2>" +
                        "<p>Check your internet connection</p>" +
                        "<button onclick='location.reload()' style='margin-top:20px;padding:12px 24px;background:#0ea5e9;color:white;border:none;border-radius:8px;font-size:16px'>Retry</button>" +
                        "</body></html>",
                        "text/html", "UTF-8"
                    );
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "WebView setup error: " + e.getMessage());
        }
    }
}
