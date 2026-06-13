package com.mylifeos.app.nighttorise;

import android.content.Context;
import java.util.Calendar;
import java.util.Set;

/**
 * NightToRiseManager — pure decision logic. Given the current time, returns
 * whether the foreground app should be blocked, in which phase, and the
 * message/end-time to display on the block screen.
 */
public class NightToRiseManager {

    public enum Phase { OFF, ARMED, SLEEP_LOCK, RISE_LOCK, PAUSED, INACTIVE_DAY }

    public static class Decision {
        public final Phase phase;
        public final boolean shouldBlock;
        public final long endTimeMs;
        public final String message;
        public Decision(Phase p, boolean b, long end, String msg) {
            this.phase = p; this.shouldBlock = b; this.endTimeMs = end; this.message = msg;
        }
    }

    private final NightToRisePreferences prefs;

    public NightToRiseManager(Context ctx) {
        this.prefs = new NightToRisePreferences(ctx);
    }

    public NightToRisePreferences prefs() { return prefs; }

    /** Compute current decision. */
    public Decision decide(long nowMs, String foregroundPackage) {
        if (!prefs.isEnabled()) return new Decision(Phase.OFF, false, 0, "");
        if (prefs.pausedUntilMs() > nowMs) return new Decision(Phase.PAUSED, false, prefs.pausedUntilMs(), "");

        Calendar now = Calendar.getInstance();
        now.setTimeInMillis(nowMs);
        int dow = now.get(Calendar.DAY_OF_WEEK) - 1; // 0=Sun..6=Sat

        String mode = prefs.scheduleMode();
        boolean active;
        if ("everyday".equals(mode))      active = true;
        else if ("weekdays".equals(mode)) active = dow >= 1 && dow <= 5;
        else                              active = prefs.scheduleDays().contains(dow);
        if (!active) return new Decision(Phase.INACTIVE_DAY, false, 0, "");

        Set<String> allowed = prefs.allowedPackages();
        if (foregroundPackage != null && allowed.contains(foregroundPackage)) {
            return new Decision(Phase.ARMED, false, 0, "");
        }

        // Sleep lock window
        String[] s = prefs.sleepTime().split(":");
        int sh = Integer.parseInt(s[0]), sm = Integer.parseInt(s[1]);
        int sleepStartMin = ((sh * 60 + sm) - prefs.sleepBeforeMin() + 1440) % 1440;
        int sleepEndMin   = ((sh * 60 + sm) + 30) % 1440; // 30-min grace
        int curMin = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);
        boolean inSleep = sleepStartMin <= sleepEndMin
            ? curMin >= sleepStartMin && curMin < sleepEndMin
            : curMin >= sleepStartMin || curMin < sleepEndMin;
        if (inSleep) {
            long endMs = millisFromMinuteOfDay(sleepEndMin, nowMs);
            return new Decision(Phase.SLEEP_LOCK, true, endMs, prefs.sleepMessage());
        }

        // Rise lock window
        long alarmMs = prefs.riseAlarmMs();
        if (alarmMs > 0) {
            long riseEnd = alarmMs + (long) prefs.riseAfterMin() * 60_000L;
            if (nowMs >= alarmMs && nowMs < riseEnd) {
                return new Decision(Phase.RISE_LOCK, true, riseEnd, prefs.riseMessage());
            }
        }

        return new Decision(Phase.ARMED, false, 0, "");
    }

    private long millisFromMinuteOfDay(int minuteOfDay, long nowMs) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(nowMs);
        c.set(Calendar.HOUR_OF_DAY, minuteOfDay / 60);
        c.set(Calendar.MINUTE, minuteOfDay % 60);
        c.set(Calendar.SECOND, 0); c.set(Calendar.MILLISECOND, 0);
        if (c.getTimeInMillis() < nowMs) c.add(Calendar.DAY_OF_MONTH, 1);
        return c.getTimeInMillis();
    }
}
