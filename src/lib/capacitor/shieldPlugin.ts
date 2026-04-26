import { registerPlugin } from '@capacitor/core';

export interface ShieldPluginInterface {
  // ১. বেসিক কন্ট্রোল
  enable(): Promise<void>;
  disable(): Promise<void>;
  isEnabled(): Promise<{ enabled: boolean }>;

  // ২. অ্যাপ ব্লকিং
  blockApps(options: { apps: string[] }): Promise<void>;
  getBlockedApps(): Promise<{ apps: string[] }>;

  // ৩. মোড ম্যানেজমেন্ট
  activateFocusMode(): Promise<void>;
  activateSleepMode(): Promise<void>;
  activateStrictMode(): Promise<void>;
  deactivateMode(): Promise<void>;
  getCurrentMode(): Promise<{ mode: string; strict: boolean }>;

  // ৪. স্ট্যাটাস ও অ্যানালিটিক্স
  getStats(options: { packageName: string }): Promise<{ blockCount: number; timeSaved: number }>;
  
  getScreenTimeStats(): Promise<{
    totalMinutes: number;
    totalLaunches: number;
    apps: Array<{
      packageName: string;
      appName: string;
      usageMinutes: number;
      launchCount: number;
      lastUsed: number;
    }>;
    error?: string;
  }>;

  // ৫. পারমিশন হ্যান্ডলিং
  checkPermissions(): Promise<{
    accessibility: boolean;
    usageStats: boolean;
    overlay: boolean;
    battery: boolean;
    deviceAdmin: boolean;
  }>;

  requestAccessibility(): Promise<void>;
  requestUsageStats(): Promise<void>;
  requestOverlay(): Promise<void>;
  requestBattery(): Promise<void>;

  // ==========================================
  // 🛡️ অ্যাডভান্সড প্রোটেকশন মেথড (The Hardcore Part)
  // ==========================================

  // ১. অ্যাডাল্ট কন্টেন্ট ফিল্টার (VPN)
  toggleAdultFilter(options: { enable: boolean }): Promise<void>;

  // ২. হার্ডকোর সেটিংস (Power off, Split screen, Recent Apps)
  updateHardcoreSettings(options: { key: string; value: boolean }): Promise<void>;

  // 🔴 ৩. সেফ আনইনস্টল (Safe Uninstall System)
  // রিঅ্যাক্ট সেটিংস থেকে কল করলে এটি জাভাতে কমান্ড পাঠাবে
  requestUninstall(): Promise<void>;
  // history
  getDailyHistory(): Promise<{ history: history
  //interface update 
  updateNotificationSettings(options: { key: string; value: boolean }): Promise<void>;
  
    // ==========================================
  // 🔑 Emergency Bypass
  // ==========================================
  setEmergencyPin(options: { pin: string }): Promise<void>;
  triggerEmergencyBypass(options: { pin: string }): Promise<{ success: boolean }>;
    toggleFloatingTimer(options: { enable: boolean }): Promise<void>;
  updateFloatingTimerStyle(options: { opacity?: number; size?: number; countdown?: boolean }): Promise<void>;


}

const Shield = registerPlugin<ShieldPluginInterface>('Shield');

export default Shield;
