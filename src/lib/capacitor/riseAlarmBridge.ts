import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Bridge to the native RiseAlarmPlugin (Java).
 * This plugin uses AlarmManager.setAlarmClock() which is the only
 * Android API that survives Doze, App Standby, and battery savers.
 *
 * Falls back to a no-op on web — Rise.tsx still calls
 * Capacitor LocalNotifications via nativeAlarm.ts as a backup channel.
 */

export interface RiseAlarmPluginI {
  set(opts: {
    timestamp: number;
    title?: string;
    body?: string;
    missionType?: string;
    alarmDbId?: string;
  }): Promise<{ scheduled: boolean }>;

  cancel(opts: { timestamp: number }): Promise<void>;

  canScheduleExactAlarms(): Promise<{ granted: boolean }>;

  openAlarmSettings(): Promise<void>;
}

const RiseAlarm = registerPlugin<RiseAlarmPluginI>('RiseAlarm');

/** Schedule one shot at the next occurrence of `time` on the listed weekdays. */
export async function scheduleNativeAlarmShots(
  uuid: string,
  time: string,
  daysOfWeek: number[],
  meta: { title?: string; body?: string; missionType?: string },
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();

  let scheduled = 0;
  for (const day of daysOfWeek) {
    const target = nextOccurrence(day, hours, minutes);
    try {
      await RiseAlarm.set({
        timestamp: target.getTime(),
        title: meta.title || 'Rise Alarm',
        body: meta.body || 'Time to wake up!',
        missionType: meta.missionType || 'math',
        alarmDbId: uuid,
      });
      scheduled += 1;
    } catch (err) {
      console.error('RiseAlarm.set failed', err);
    }
  }
  return scheduled > 0;
}

/** Cancel by time — best-effort; safe to call repeatedly. */
export async function cancelNativeAlarmShots(
  uuid: string,
  time: string,
  daysOfWeek: number[],
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const [hours, minutes] = time.split(':').map(Number);
  for (const day of daysOfWeek) {
    const target = nextOccurrence(day, hours, minutes);
    try {
      await RiseAlarm.cancel({ timestamp: target.getTime() });
    } catch (err) {
      console.warn('RiseAlarm.cancel failed', err);
    }
  }
}

export async function canScheduleExactAlarms(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const { granted } = await RiseAlarm.canScheduleExactAlarms();
    return granted;
  } catch {
    return false;
  }
}

export async function openExactAlarmSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await RiseAlarm.openAlarmSettings();
  } catch (err) {
    console.error('openAlarmSettings failed', err);
  }
}

function nextOccurrence(dayOfWeek: number, h: number, m: number): Date {
  const now = new Date();
  const result = new Date();
  result.setHours(h, m, 0, 0);

  let diff = dayOfWeek - now.getDay();
  if (diff < 0 || (diff === 0 && result <= now)) diff += 7;
  result.setDate(now.getDate() + diff);
  return result;
}
