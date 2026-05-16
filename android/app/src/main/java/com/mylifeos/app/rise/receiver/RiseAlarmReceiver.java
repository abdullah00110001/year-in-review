package com.mylifeos.app.rise.receiver;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.mylifeos.app.MainActivity;
import com.mylifeos.app.rise.core.AlarmConstants;
import com.mylifeos.app.rise.recovery.AlarmRecoveryReceiver;
import com.mylifeos.app.rise.service.AlarmSoundService;
import com.mylifeos.app.rise.state.AlarmStateManager;

/**
 * RiseAlarmReceiver
 * Package: com.mylifeos.app.rise.receiver  ← CORRECT
 *
 * ⚠️ এই file এ কোনো inner/nested class নেই।
 * RiseRingActivity আলাদা file এ আছে: rise/ui/RiseRingActivity.java
 *
 * Build error fix:
 * "class RiseRingActivity is public, should be declared in a file named RiseRingActivity.java"
 * → সেই class এখান থেকে সরানো হয়েছে।
 */
public class RiseAlarmReceiver extends BroadcastReceiver {

    private static final String TAG        = "RiseAlarmReceiver";
    private static final String CHANNEL_ID = "rise_alarm_notif_v3";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;

        int    alarmId = intent.getIntExtra("ALARM_ID", 0);
        String uuid    = intent.getStringExtra("ALARM_UUID");
        String title   = intent.getStringExtra("ALARM_TITLE");
        String body    = intent.getStringExtra("ALARM_BODY");

        if (uuid  == null) uuid  = String.valueOf(alarmId);
        if (title == null) title = "Rise Alarm";
        if (body  == null) body  = "Time to wake up!";

        Log.d(TAG, "⏰ Alarm triggered! id=" + alarmId + " uuid=" + uuid);

        // 1. Persistent state সেট করো
        AlarmStateManager.setRinging(context, alarmId, uuid, title, body, 3);

        // 2. Foreground sound service start করো
        startSoundService(context, alarmId, uuid, title, body);

        // 3. Short WakeLock (screen জাগাও)
        acquireWakeLock(context);

        // 4. Full screen notification
        showFullScreenNotification(context, alarmId, uuid, title, body);

        // 5. Force open ring screen (backup)
        forceOpenApp(context, uuid);

        // 6. Recovery watchdog schedule করো
        AlarmRecoveryReceiver.schedule(context);

        Log.d(TAG, "✅ All alarm actions dispatched");
    }

    private void startSoundService(Context ctx, int id, String uuid,
                                    String title, String body) {
        try {
            Intent svc = new Intent(ctx, AlarmSoundService.class);
            svc.putExtra("ALARM_ID",    id);
            svc.putExtra("ALARM_UUID",  uuid);
            svc.putExtra("ALARM_TITLE", title);
            svc.putExtra("ALARM_BODY",  body);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ctx.startForegroundService(svc);
            } else {
                ctx.startService(svc);
            }
            Log.d(TAG, "AlarmSoundService started");
        } catch (Exception e) {
            Log.e(TAG, "startSoundService failed", e);
        }
    }

    private void acquireWakeLock(Context ctx) {
        try {
            PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
            if (pm == null) return;
            PowerManager.WakeLock wl = pm.newWakeLock(
                PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "RiseAlarm:ReceiverWL"
            );
            wl.acquire(30_000L); // 30 seconds — service takes over after
        } catch (Exception e) {
            Log.e(TAG, "acquireWakeLock failed", e);
        }
    }

    private void showFullScreenNotification(Context ctx, int alarmId, String uuid,
                                             String title, String body) {
        try {
            NotificationManager nm =
                (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Rise Alarm Alerts", NotificationManager.IMPORTANCE_HIGH);
                ch.setBypassDnd(true);
                ch.setSound(null, null);
                ch.enableVibration(false);
                ch.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
                nm.createNotificationChannel(ch);
            }

            PendingIntent tapPi = buildRingPendingIntent(ctx, uuid, alarmId);

            nm.notify(alarmId, new NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(ctx.getApplicationInfo().icon)
                .setContentTitle("⏰ " + title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(tapPi, true)
                .setOngoing(true)
                .setAutoCancel(false)
                .setContentIntent(tapPi)
                .build());

            Log.d(TAG, "Full screen notification shown");
        } catch (Exception e) {
            Log.e(TAG, "showFullScreenNotification failed", e);
        }
    }

    private void forceOpenApp(Context ctx, String uuid) {
        try {
            Intent i = buildRingIntent(ctx, uuid);
            ctx.startActivity(i);
            Log.d(TAG, "Force opened ring screen");
        } catch (Exception e) {
            Log.e(TAG, "forceOpenApp failed", e);
        }
    }

    private Intent buildRingIntent(Context ctx, String uuid) {
        Intent i = new Intent(ctx, MainActivity.class);
        i.setAction(Intent.ACTION_VIEW);
        i.setData(Uri.parse("capacitor://localhost/rise/ring/" + uuid));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK |
                   Intent.FLAG_ACTIVITY_SINGLE_TOP |
                   Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return i;
    }

    private PendingIntent buildRingPendingIntent(Context ctx, String uuid, int reqCode) {
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(ctx, reqCode, buildRingIntent(ctx, uuid), flags);
    }

    /** Plugin এর stopRinging() এখান থেকে call করে */
    public static void stopSound(Context context) {
        AlarmSoundService.stop(context);
        AlarmRecoveryReceiver.cancel(context);
        Log.d(TAG, "stopSound called");
    }
}