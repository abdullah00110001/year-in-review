package com.mylifeos.app.plugins;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// ⚠️ ফাইলের নামের সাথে মিলিয়ে প্লাগিনের নাম RiseAlarmPlugin করা হলো
@CapacitorPlugin(name = "RiseAlarmPlugin")
public class RiseAlarmPlugin extends Plugin {

    private AlarmManager alarmManager;

    @Override
    public void load() {
        alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
    }

    // ==========================================
    // 🔐 পারমিশন চেকিং (Android 12+)
    // ==========================================

    @PluginMethod
    public void canScheduleExactAlarms(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ret.put("granted", alarmManager.canScheduleExactAlarms());
        } else {
            // Android 11 বা তার নিচে এই পারমিশন লাগে না
            ret.put("granted", true);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    // ==========================================
    // ⏰ অ্যালার্ম সেট করা (Set Alarm)
    // ==========================================

    @PluginMethod
    public void scheduleAlarm(PluginCall call) {
        Integer id = call.getInt("id");
        Long timeInMillis = call.getLong("timeInMillis");
        String title = call.getString("title", "Rise Alarm");
        String body = call.getString("body", "Time to wake up!");

        if (id == null || timeInMillis == null) {
            call.reject("Must provide id and timeInMillis");
            return;
        }

        try {
            // Android 12+ এর জন্য পারমিশন চেক
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
                call.reject("Exact alarm permission not granted by user");
                return;
            }

            // RiseAlarmReceiver ক্লাসে সিগন্যাল পাঠানো হবে (এই ফাইলটা আমরা নেক্সটে ফিক্স করব)
            Intent intent = new Intent(getContext(), RiseAlarmReceiver.class);
            intent.putExtra("ALARM_ID", id);
            intent.putExtra("ALARM_TITLE", title);
            intent.putExtra("ALARM_BODY", body);

            // ⚠️ Android 12+ Crash ফিক্স (FLAG_IMMUTABLE বাধ্যতামূলক)
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    getContext(),
                    id,
                    intent,
                    flags
            );

            // setAlarmClock ব্যবহার করলে ফোন স্লিপ মোডে থাকলেও কাঁটায় কাঁটায় অ্যালার্ম বাজবে
            AlarmManager.AlarmClockInfo alarmClockInfo = new AlarmManager.AlarmClockInfo(timeInMillis, pendingIntent);
            alarmManager.setAlarmClock(alarmClockInfo, pendingIntent);

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to schedule alarm", e);
        }
    }

    // ==========================================
    // 🛑 অ্যালার্ম বাতিল করা (Cancel Alarm)
    // ==========================================

    @PluginMethod
    public void cancelAlarm(PluginCall call) {
        Integer id = call.getInt("id");
        if (id == null) {
            call.reject("Must provide alarm id");
            return;
        }

        try {
            Intent intent = new Intent(getContext(), RiseAlarmReceiver.class);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    getContext(),
                    id,
                    intent,
                    flags
            );

            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel(); // মেমোরি থেকে মুছে ফেলা
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to cancel alarm", e);
        }
    }
}
