import { Capacitor, registerPlugin } from '@capacitor/core';

// ==========================================
// 🔌 টাইপ ডেফিনিশন (যাতে ভুল ডেটা পাস না হয়)
// ==========================================
export interface RisePluginType {
  canScheduleExactAlarms(): Promise<{ granted: boolean }>;
  openExactAlarmSettings(): Promise<void>;
  scheduleAlarm(options: { id: number; timeInMillis: number; title: string; body: string }): Promise<void>;
  cancelAlarm(options: { id: number }): Promise<void>;
  checkPendingAlarms(): Promise<{ alarms: number[] }>;
}

// ক্যাপাসিটরের সাথে নেটিভ জাভা প্লাগিন (RisePlugin) এর কানেকশন
const RisePlugin = registerPlugin<RisePluginType>('RiseAlarmPlugin');


const isNative = Capacitor.isNativePlatform();
const isAndroid = Capacitor.getPlatform() === 'android';

// ==========================================
// ⏰ পারমিশন লজিক (Exact Alarms)
// ==========================================

export const canScheduleExactAlarms = async (): Promise<boolean> => {
  // ওয়েব বা আইওএস হলে বাই-ডিফল্ট ট্রু রিটার্ন করবে, কারণ সেখানে এই পারমিশন লাগে না
  if (!isNative || !isAndroid) return true;
  
  try {
    const result = await RisePlugin.canScheduleExactAlarms();
    return result.granted;
  } catch (error) {
    console.error('[RiseBridge] Error checking exact alarm permission:', error);
    return false; // এরর দিলে ফলস রিটার্ন করবে, যাতে সেটিংস পেজ ওপেন করার সুযোগ পায়
  }
};

export const openExactAlarmSettings = async (): Promise<void> => {
  if (!isNative || !isAndroid) {
    console.warn('[RiseBridge] Exact alarm settings are only available on Android native app.');
    return;
  }
  
  try {
    await RisePlugin.openExactAlarmSettings();
  } catch (error) {
    console.error('[RiseBridge] Error opening exact alarm settings:', error);
  }
};

// ==========================================
// 🚀 অ্যালার্ম কন্ট্রোল লজিক (Set / Cancel)
// ==========================================

export const scheduleRiseAlarm = async (id: number, timeInMillis: number, title: string, body: string): Promise<boolean> => {
  if (!isNative) {
    console.log(`[RiseBridge - Web] Mock Alarm scheduled for ID: ${id} at ${new Date(timeInMillis).toLocaleString()}`);
    return true; // ওয়েবে শুধু কনসোল লগ করবে
  }

  try {
    await RisePlugin.scheduleAlarm({ id, timeInMillis, title, body });
    console.log(`[RiseBridge] Alarm ${id} set successfully for ${new Date(timeInMillis).toLocaleString()}`);
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
    console.log(`[RiseBridge] Alarm ${id} cancelled successfully.`);
    return true;
  } catch (error) {
    console.error(`[RiseBridge] Failed to cancel alarm ${id}:`, error);
    return false;
  }
};
