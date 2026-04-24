import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface RisePluginType {
  canScheduleExactAlarms(): Promise<{ granted: boolean }>;
  openExactAlarmSettings(): Promise<void>;
  scheduleAlarm(options: { id: number; timeInMillis: number; title: string; body: string }): Promise<void>;
  cancelAlarm(options: { id: number }): Promise<void>;
  checkPendingAlarms(): Promise<{ alarms: number[] }>;
}

const RisePlugin = registerPlugin<RisePluginType>('RiseAlarmPlugin');

const isNative = Capacitor.isNativePlatform();
const isAndroid = Capacitor.getPlatform() === 'android';

export const canScheduleExactAlarms = async (): Promise<boolean> => {
  if (!isNative || !isAndroid) return true;

  try {
    const result = await RisePlugin.canScheduleExactAlarms();
    return result.granted;
  } catch (error) {
    console.error('[RiseBridge] Error checking exact alarm permission:', error);
    return false;
  }
};

export const openExactAlarmSettings = async (): Promise<void> => {
  if (!isNative || !isAndroid) return;

  try {
    await RisePlugin.openExactAlarmSettings();
  } catch (error) {
    console.error('[RiseBridge] Error opening exact alarm settings:', error);
  }
};

export const scheduleRiseAlarm = async (id: number, timeInMillis: number, title: string, body: string): Promise<boolean> => {
  if (!isNative) {
    console.log(`[RiseBridge - Web] Mock Alarm scheduled for ID: ${id} at ${new Date(timeInMillis).toLocaleString()}`);
    return true;
  }

  try {
    await RisePlugin.scheduleAlarm({ id, timeInMillis, title, body });
    return true;
  } catch (error) {
    console.error(`[RiseBridge] Failed to schedule alarm ${id}:`, error);
    return false;
  }
};

export const cancelRiseAlarm = async (id: number): Promise<boolean> => {
  if (!isNative) {
    console.log(`[RiseBridge - Web] Mock Alarm cancelled for ID: ${id}`);
    return true;
  }

  try {
    await RisePlugin.cancelAlarm({ id });
    return true;
  } catch (error) {
    console.error(`[RiseBridge] Failed to cancel alarm ${id}:`, error);
    return false;
  }
};

export const scheduleNativeAlarmShots = async (
  uuid: string,
  time: string,
  daysOfWeek: number[],
  config: { title: string; body: string; missionType?: string },
): Promise<void> => {
  const [hours, minutes] = time.split(':').map(Number);

  for (const dayOfWeek of daysOfWeek) {
    const alarmId = numericIdFor(uuid, dayOfWeek);
    const scheduledDate = nextDateForDay(dayOfWeek, hours, minutes);
    const success = await scheduleRiseAlarm(alarmId, scheduledDate.getTime(), config.title, config.body);

    if (!success) {
      throw new Error(`Failed to schedule recurring alarm for ${uuid} on weekday ${dayOfWeek}`);
    }
  }
};

export const cancelNativeAlarmShots = async (uuid: string): Promise<void> => {
  await Promise.all(Array.from({ length: 7 }, (_, day) => cancelRiseAlarm(numericIdFor(uuid, day))));
};

export const ensureNativeAlarmChannel = async (): Promise<void> => {
  if (!isNative) return;

  await LocalNotifications.createChannel({
    id: 'rise_alarm_native_v2',
    name: 'Rise alarms',
    description: 'Critical full-screen wake alarms',
    importance: 5,
    visibility: 1,
    sound: 'beep.wav',
    vibration: true,
    lights: true,
    lightColor: '#F59E0B',
  });
};

function numericIdFor(uuid: string, salt: number): number {
  let hash = salt;
  for (let i = 0; i < uuid.length; i += 1) {
    hash = (hash << 5) - hash + uuid.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100000;
}

function nextDateForDay(dayOfWeek: number, hours: number, minutes: number): Date {
  const now = new Date();
  const result = new Date();
  result.setHours(hours, minutes, 0, 0);

  const currentDay = now.getDay();
  let diff = dayOfWeek - currentDay;
  if (diff < 0 || (diff === 0 && result <= now)) diff += 7;

  result.setDate(now.getDate() + diff);
  return result;
}
