package com.mylifeos.app;

import android.app.KeyguardManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;
import com.mylifeos.app.plugins.ShieldPlugin;
import com.mylifeos.app.plugins.RiseAlarmPlugin; // 🟢 রাইজ অ্যালার্ম প্লাগিন ইমপোর্ট করা হলো

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        
        // 🟢 মেইন গেটে দুই প্লাগিনকেই রেজিস্টার করা হলো
        registerPlugin(ShieldPlugin.class);
        registerPlugin(RiseAlarmPlugin.class); // 🟢 এই লাইনটা ছাড়া রাইজের বাটন কাজ করবে না

        // Honour show-on-lockscreen + turn-screen-on so that when an
        // alarm fires, the activity appears even on a locked device.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) {
                km.requestDismissKeyguard(this, null);
            }
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }

        super.onCreate(savedInstanceState);
    }
}
