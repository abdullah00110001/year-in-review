package com.mylifeos.app.plugins;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.media.AudioAttributes;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "RiseAlarm")
public class RiseAlarmPlugin extends Plugin {
    private static final String ALARM_CHANNEL_ID = "rise_alarm_native_v2";

    private void ensureAlarmChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;
        if (manager.getNotificationChannel(ALARM_CHANNEL_ID)!= null) return;

        Uri alarmUri = Uri.parse("android.resource://" + context.getPackageName() + "/" + com.mylifeos.app.R.raw.tonton);

        AudioAttributes audioAttributes = new AudioAttributes.Builder()
         .setUsage(AudioAttributes.USAGE_ALARM)
         .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
         .build();

        NotificationChannel channel = new NotificationChannel(
            ALARM_CHANNEL_ID,
            "Rise Alarms",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("High priority Rise alarm alerts");
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 1000, 500, 1000});
        channel.enableLights(true);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        channel.setBypassDnd(true);
        channel.setSound(alarmUri, audioAttributes);
        manager.createNotificationChannel(channel);
    }

    @PluginMethod
    public void set(PluginCall call) {
        long timestamp = call.getLong("timestamp", 0L);
        String title = call.getString("title", "Rise Alarm");
        String body = call.getString("body", "Time to wake up!");
        String missionType = call.getString("missionType", "math");
        String dbId = call.getString("alarmDbId", "");

        if (timestamp == 0) {
            call.reject("Must provide timestamp");
            return;
        }

        Context context = getContext();
        ensureAlarmChannel(context);
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        Intent intent = new Intent(context, RiseAlarmReceiver.class);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("missionType", missionType);
        intent.putExtra("dbId", dbId);

        int requestCode = (int) (timestamp % 2147483647);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timestamp, pendingIntent);
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, timestamp, pendingIntent);
        }

        JSObject ret = new JSObject();
        ret.put("scheduled", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        long timestamp = call.getLong("timestamp", 0L);
        int requestCode = (int) (timestamp % 2147483647);
        Context context = getContext();
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, RiseAlarmReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        alarmManager.cancel(pendingIntent);
        call.resolve();
    }

    @PluginMethod
    public void canScheduleExactAlarms(PluginCall call) {
        boolean canSchedule = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            canSchedule = alarmManager.canScheduleExactAlarms();
        }
        JSObject ret = new JSObject();
        ret.put("granted", canSchedule);
        call.resolve(ret);
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void ensureAlarmChannel(PluginCall call) {
        ensureAlarmChannel(getContext());
        call.resolve();
    }
}