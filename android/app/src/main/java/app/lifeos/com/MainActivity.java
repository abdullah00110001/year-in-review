package app.lifeos.com;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "SukoonOS";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d(TAG, "MainActivity onCreate");
    }

    // IMPORTANT: Do NOT override onStart() with a custom WebViewClient.
    // Capacitor uses its own BridgeWebViewClient internally.
    // Replacing it breaks the JS-native bridge, causing plugin failures and app crashes.

    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "App resumed");
    }
}
