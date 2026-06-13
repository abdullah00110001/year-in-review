package com.mylifeos.app.nighttorise;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * NightToRisePlugin — JS bridge for syncing Night-to-Rise config + rise alarm
 * time into SharedPreferences so the accessibility service can enforce the lock.
 *
 * JS side: registerPlugin<…>('NightToRise')
 *   - setConfig({ json: string })
 *   - setRiseAlarm({ epochMillis: number })
 */
@CapacitorPlugin(name = "NightToRise")
public class NightToRisePlugin extends Plugin {

    @PluginMethod
    public void setConfig(PluginCall call) {
        String json = call.getString("json");
        if (json == null) { call.reject("json required"); return; }
        try {
            new NightToRisePreferences(getContext()).saveJsonConfig(json);
            call.resolve();
        } catch (Exception t) {
            call.reject("setConfig failed: " + t.getMessage(), t);
        }
    }

    @PluginMethod
    public void setRiseAlarm(PluginCall call) {
        long ms = call.getLong("epochMillis", 0L);
        new NightToRisePreferences(getContext()).saveRiseAlarmMillis(ms);
        call.resolve();
    }
}
