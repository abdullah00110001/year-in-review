package com.mylifeos.app.rise.scheduler;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import com.mylifeos.app.MainActivity;
import com.mylifeos.app.rise.core.AlarmConstants;
import com.mylifeos.app.rise.receiver.RiseAlarmReceiver;

/**
 * RiseAlarmScheduler
 * Package: com.mylifeos.app.rise.scheduler
 *
 * Alarm scheduling strategy (priority order):
 * ─────────────────────────────────────────────────────────
 * 1. setAlarmClock()           → Android 5.1+, system clock এ দেখায়,
 *                                সবচেয়ে reliable, Doze bypass করে
 *                                ✅ USE THIS when available
 *
 * 2. setExactAndAllowWhileIdle() → Android 6+, Doze mode bypass করে
 *                                  setAlarmClock না থাকলে fallback
 *
 * 3. setExact()                → Android 4.4+, basic exact alarm
 *                                oldest fallback
 *
 * কেন তিনটা দরকার?
 * ─────────────────────────────────────────────────────────
 * - setAlarmClock() সবসময় available কিন্তু কিছু Chinese ROM এ
 *   block করা থাকে।
 * - setExactAndAllowWhileIdle() Doze mode এ কাজ করে কিন্তু
 *   system clock এ দেখায় না।
 * - setExact() সবচেয়ে basic, Doze এ হয়তো delay হবে।
 *
 * আমরা সবসময় setAlarmClock() চেষ্টা করবো।
 * Fail হলে setExactAndAllowWhileIdle() ব্যবহার করবো।
 * ─────────────────────────────────────────────────────────
 */
public class RiseAlarmScheduler {

    private static final String TAG = "RiseAlarmScheduler";

    // ──────────────────────────────────────────────
    // SCHEDULE
    // ──────────────────────────────────────────────

    public static void scheduleAlarm(Context context, int id, long timeInMillis,
                                      String title, String body, String uuid) {
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) {
                Log.e(TAG, "AlarmManager is null — cannot schedule id=" + id);
                return;
            }

            // Android 12+ (API 31+) exact alarm permission check
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (!am.canScheduleExactAlarms()) {
                    Log.e(TAG, "No SCHEDULE_EXACT_ALARM permission — id=" + id);
                    return;
                }
            }

            // Null safety
            if (uuid  == null || uuid.isEmpty())  uuid  = String.valueOf(id);
            if (title == null || title.isEmpty()) title = "Rise Alarm";
            if (body  == null || body.isEmpty())  body  = "Wake up!";

            // ── Receiver PendingIntent ──
            // Alarm trigger হলে RiseAlarmReceiver এ যাবে
            Intent rxIntent = new Intent(context, RiseAlarmReceiver.class);
            rxIntent.putExtra(AlarmConstants.EXTRA_ALARM_ID,    id);
            rxIntent.putExtra(AlarmConstants.EXTRA_ALARM_UUID,  uuid);
            rxIntent.putExtra(AlarmConstants.EXTRA_ALARM_TITLE, title);
            rxIntent.putExtra(AlarmConstants.EXTRA_ALARM_BODY,  body);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent alarmPi = PendingIntent.getBroadcast(
                context, id, rxIntent, flags
            );

            // ── Show PendingIntent ──
            // System clock / status bar এ alarm icon দেখাবে
            // User tap করলে ring screen খুলবে
            Intent showIntent = new Intent(context, MainActivity.class);
            showIntent.setAction(Intent.ACTION_VIEW);
            showIntent.setData(Uri.parse(AlarmConstants.DEEP_LINK_BASE + uuid));
            showIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK    |
                Intent.FLAG_ACTIVITY_SINGLE_TOP  |
                Intent.FLAG_ACTIVITY_CLEAR_TOP
            );

            PendingIntent showPi = PendingIntent.getActivity(
                context, id, showIntent, flags
            );

            // ── Schedule with best available method ──
            boolean scheduled = false;

            // METHOD 1: setAlarmClock (BEST — Android 5.1+)
            // System alarm clock icon দেখায়, Doze bypass করে
            // সবচেয়ে user-facing, কোনো OS kill করে না
            try {
                AlarmManager.AlarmClockInfo clockInfo =
                    new AlarmManager.AlarmClockInfo(timeInMillis, showPi);
                am.setAlarmClock(clockInfo, alarmPi);
                scheduled = true;
                Log.d(TAG, "✅ setAlarmClock: id=" + id + " uuid=" + uuid
                          + " at " + new java.util.Date(timeInMillis));
            } catch (Exception e) {
                Log.w(TAG, "setAlarmClock failed — trying fallback. Error: " + e.getMessage());
            }

            // METHOD 2: setExactAndAllowWhileIdle (FALLBACK — Android 6+)
            // Doze mode এ কাজ করে কিন্তু system clock এ দেখায় না
            if (!scheduled && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    am.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        timeInMillis,
                        alarmPi
                    );
                    scheduled = true;
                    Log.d(TAG, "✅ setExactAndAllowWhileIdle: id=" + id
                              + " at " + new java.util.Date(timeInMillis));
                } catch (Exception e) {
                    Log.w(TAG, "setExactAndAllowWhileIdle failed — trying setExact. Error: " + e.getMessage());
                }
            }

            // METHOD 3: setExact (LAST RESORT — Android 4.4+)
            // Doze mode এ delay হতে পারে কিন্তু কোনো না কোনো সময় fire করবে
            if (!scheduled) {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                        am.setExact(AlarmManager.RTC_WAKEUP, timeInMillis, alarmPi);
                    } else {
                        am.set(AlarmManager.RTC_WAKEUP, timeInMillis, alarmPi);
                    }
                    scheduled = true;
                    Log.d(TAG, "✅ setExact (fallback): id=" + id
                              + " at " + new java.util.Date(timeInMillis));
                } catch (Exception e) {
                    Log.e(TAG, "All scheduling methods failed for id=" + id, e);
                }
            }

            if (!scheduled) {
                Log.e(TAG, "❌ CRITICAL: Could not schedule alarm id=" + id);
            }

        } catch (Exception e) {
            Log.e(TAG, "scheduleAlarm crashed for id=" + id, e);
        }
    }

    // ──────────────────────────────────────────────
    // CANCEL
    // ──────────────────────────────────────────────

    public static void cancelAlarm(Context context, int id) {
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            // Receiver intent এর সাথে match করতে হবে
            Intent intent = new Intent(context, RiseAlarmReceiver.class);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pi = PendingIntent.getBroadcast(context, id, intent, flags);
            am.cancel(pi);
            pi.cancel();

            Log.d(TAG, "Cancelled alarm id=" + id);

        } catch (Exception e) {
            Log.e(TAG, "cancelAlarm failed for id=" + id, e);
        }
    }

    // ──────────────────────────────────────────────
    // VERIFY — alarm এখনো pending আছে কিনা check করো
    // ──────────────────────────────────────────────

    /**
     * Alarm schedule হয়েছে কিনা verify করো।
     * PendingIntent.FLAG_NO_CREATE দিয়ে check করে।
     * true = pending আছে, false = আর নেই বা schedule হয়নি।
     */
    public static boolean isAlarmScheduled(Context context, int id) {
        try {
            Intent intent = new Intent(context, RiseAlarmReceiver.class);

            int flags = PendingIntent.FLAG_NO_CREATE;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pi = PendingIntent.getBroadcast(context, id, intent, flags);
            return pi != null;

        } catch (Exception e) {
            Log.e(TAG, "isAlarmScheduled check failed for id=" + id, e);
            return false;
        }
    }
}