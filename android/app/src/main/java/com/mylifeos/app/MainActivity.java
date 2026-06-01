/* package com.mylifeos.app;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;
import com.mylifeos.app.plugins.PureShieldPlugin;
import com.mylifeos.app.plugins.ShieldPlugin;
import com.mylifeos.app.plugins.RiseAlarmPlugin;

public class MainActivity extends BridgeActivity {

    private static MainActivity instance;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShieldPlugin.class);
        registerPlugin(RiseAlarmPlugin.class);
        super.onCreate(savedInstanceState);

        instance = this;

        // 🔥 Handle first launch intent
        handleAlarmIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);

        // 🔥 VERY IMPORTANT (deep link React এ পাঠানোর জন্য)
        if (bridge != null) {
            bridge.handleOnNewIntent(intent);
        }

        handleAlarmIntent(intent);
    }

    private void handleAlarmIntent(Intent intent) {
        if (intent == null) return;

        // 🔥 Deep link case
        Uri data = intent.getData();
        if (data != null && "capacitor".equals(data.getScheme())) {

            enableLockScreenTakeover();

            Log.d("RiseAlarm", "Deep link received: " + data.toString());
            return;
        }

        // 🔥 Fallback (old system or extra)
        if (intent.hasExtra("ALARM_ID")) {

            enableLockScreenTakeover();

            String alarmId = intent.getStringExtra("ALARM_ID");
            if (alarmId == null) {
                alarmId = String.valueOf(intent.getIntExtra("ALARM_ID", -1));
            }

            // 🔥 Save for React fallback
            android.content.SharedPreferences prefs =
                    getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);

            prefs.edit().putString("ringing_alarm_id", alarmId).apply();

            Log.d("RiseAlarm", "Alarm via extra ID: " + alarmId);
        }
    }

    private void enableLockScreenTakeover() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {

            setShowWhenLocked(true);
            setTurnScreenOn(true);

            KeyguardManager km =
                    (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);

            if (km != null) {
                km.requestDismissKeyguard(this, null);
            }

        } else {

            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                    WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }
    }

    public static void disableLockScreenTakeover() {
        if (instance != null) {
            instance.runOnUiThread(() -> {

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                    instance.setShowWhenLocked(false);
                    instance.setTurnScreenOn(false);
                }

                instance.getWindow().clearFlags(
                        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                );
            });
        }
    }
} */

package com.mylifeos.app;

import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;
import com.mylifeos.app.plugins.PureShieldPlugin;
import com.mylifeos.app.plugins.ShieldPlugin;
import com.mylifeos.app.plugins.RiseAlarmPlugin;
import com.mylifeos.app.plugins.BarcodeScannerPlugin;
import com.mylifeos.app.plugins.NativeRingtonePickerPlugin;

public class MainActivity extends BridgeActivity {
  private static MainActivity instance;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Register plugins defensively — one failure must not crash the whole app
    try { registerPlugin(ShieldPlugin.class); } catch (Throwable t) { Log.e("MainActivity", "ShieldPlugin register failed", t); }
    try { registerPlugin(RiseAlarmPlugin.class); } catch (Throwable t) { Log.e("MainActivity", "RiseAlarmPlugin register failed", t); }
    try { registerPlugin(PureShieldPlugin.class); } catch (Throwable t) { Log.e("MainActivity", "PureShieldPlugin register failed", t); }
    try { registerPlugin(BarcodeScannerPlugin.class); } catch (Throwable t) { Log.e("MainActivity", "BarcodeScannerPlugin register failed", t); }
    try { registerPlugin(NativeRingtonePickerPlugin.class); } catch (Throwable t) { Log.e("MainActivity", "NativeRingtonePickerPlugin register failed", t); }
    super.onCreate(savedInstanceState);
    instance = this;
    // 🔥 Handle first launch intent
    try { handleAlarmIntent(getIntent()); } catch (Throwable t) { Log.e("MainActivity", "handleAlarmIntent failed", t); }
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent); // 👈 এইটাই Deep Link + সব হ্যান্ডেল করে
    setIntent(intent);
    handleAlarmIntent(intent);
  }

  private void handleAlarmIntent(Intent intent) {
    if (intent == null) return;
    // 🔥 Deep link case
    Uri data = intent.getData();
    if (data != null && "capacitor".equals(data.getScheme())) {
      enableLockScreenTakeover();
      Log.d("RiseAlarm", "Deep link received: " + data.toString());
      return;
    }
    // 🔥 Fallback (old system or extra)
    if (intent.hasExtra("ALARM_ID")) {
      enableLockScreenTakeover();
      String alarmId = intent.getStringExtra("ALARM_ID");
      if (alarmId == null) {
        alarmId = String.valueOf(intent.getIntExtra("ALARM_ID", -1));
      }
      // 🔥 Save for React fallback
      android.content.SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
      prefs.edit().putString("ringing_alarm_id", alarmId).apply();
      Log.d("RiseAlarm", "Alarm via extra ID: " + alarmId);
    }
  }

  private void enableLockScreenTakeover() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true);
      setTurnScreenOn(true);
      KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
      if (km != null) {
        km.requestDismissKeyguard(this, null);
      }
    } else {
      getWindow().addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
      );
    }
  }

  public static void disableLockScreenTakeover() {
    if (instance != null) {
      instance.runOnUiThread(() -> {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
          instance.setShowWhenLocked(false);
          instance.setTurnScreenOn(false);
        }
        instance.getWindow().clearFlags(
          WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
          WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
          WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        );
      });
    }
  }
}