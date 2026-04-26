/* import { registerPlugin } from '@capacitor/core';

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
  // 🛡️ অ্যাডভান্সড প্রোটেকশন মেথড
  // ==========================================
  toggleAdultFilter(options: { enable: boolean }): Promise<void>;
  updateHardcoreSettings(options: { key: string; value: boolean }): Promise<void>;
  requestUninstall(): Promise<void>;
  
  // 🟢 FIX: History Syntax Error Fixed
  getDailyHistory(): Promise<{ history: any }>;
  clearHistory(): Promise<{ success: boolean }>;

  // Interface update 
  updateNotificationSettings(options: { key: string; value: boolean }): Promise<void>;
  
  // ==========================================
  // 🔑 Emergency Bypass & Floating Timer
  // ==========================================
  setEmergencyPin(options: { pin: string }): Promise<void>;
  triggerEmergencyBypass(options: { pin: string }): Promise<{ success: boolean }>;
  toggleFloatingTimer(options: { enable: boolean }): Promise<void>;
  updateFloatingTimerStyle(options: { opacity?: number; size?: number; countdown?: boolean; icon?: string; format?: string; theme?: string }): Promise<void>;
}

// 🟢 আগের মতো অরিজিনাল Default Export
const Shield = registerPlugin<ShieldPluginInterface>('Shield');
export default Shield;
 */
 
 
 import { registerPlugin } from '@capacitor/core';

export interface InstalledApp {
  packageName: string;
  appName: string;
  isSystem: boolean;
}

export interface ShieldPluginInterface {
  // ১. বেসিক কন্ট্রোল
  enable(): Promise<void>;
  disable(): Promise<void>;
  isEnabled(): Promise<{ enabled: boolean }>;

  // ২. অ্যাপ ব্লকিং
  blockApps(options: { apps: string[] }): Promise<void>;
  getBlockedApps(): Promise<{ apps: string[] }>;
  blockSites(options: { sites: string[] }): Promise<void>;
  getBlockedSites(): Promise<{ sites: string[] }>;
  blockKeywords(options: { keywords: string[] }): Promise<void>;
  getBlockedKeywords(): Promise<{ keywords: string[] }>;
  getInstalledApps(): Promise<{ apps: InstalledApp[] }>;
  getBlockStats(): Promise<{ blockedAttemptsToday: number }>;

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

  // ৫. পারমিশন হ্যান্ডলিং - deviceAdmin অ্যাড করছি
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
  // 🛡️ অ্যাডভান্সড প্রোটেকশন - Year in review থেকে নেওয়া
  // ==========================================
  toggleAdultFilter(options: { enable: boolean }): Promise<void>;
  updateHardcoreSettings(options: { key: string; value: boolean }): Promise<void>;
  requestUninstall(): Promise<void>;
  getDailyHistory(): Promise<{ history: any }>;
  clearHistory(): Promise<{ success: boolean }>;
  updateNotificationSettings(options: { key: string; value: boolean }): Promise<void>;

  // ==========================================
  // 🔑 Emergency Bypass & Floating Timer - Year in review থেকে নেওয়া
  // ==========================================
  setEmergencyPin(options: { pin: string }): Promise<void>;
  triggerEmergencyBypass(options: { pin: string }): Promise<{ success: boolean }>;
  toggleFloatingTimer(options: { enable: boolean }): Promise<void>;
  updateFloatingTimerStyle(options: { 
    opacity?: number; 
    size?: number; 
    countdown?: boolean; 
    icon?: string; 
    format?: string; 
    theme?: string 
  }): Promise<void>;
}

const ShieldNative = registerPlugin<ShieldPluginInterface>('Shield');

// 🟢 FIX: Named export যাতে import { Shield } সব জায়গায় কাজ করে
export const Shield = {
  enable: () => ShieldNative.enable(),
  disable: () => ShieldNative.disable(),
  isEnabled: () => ShieldNative.isEnabled(),
  blockApps: (options) => ShieldNative.blockApps(options),
  getBlockedApps: () => ShieldNative.getBlockedApps(),
  blockSites: (options) => ShieldNative.blockSites(options),
  getBlockedSites: () => ShieldNative.getBlockedSites(),
  blockKeywords: (options) => ShieldNative.blockKeywords(options),
  getBlockedKeywords: () => ShieldNative.getBlockedKeywords(),
  getInstalledApps: () => ShieldNative.getInstalledApps(),
  getBlockStats: () => ShieldNative.getBlockStats(),
  activateFocusMode: () => ShieldNative.activateFocusMode(),
  activateSleepMode: () => ShieldNative.activateSleepMode(),
  activateStrictMode: () => ShieldNative.activateStrictMode(),
  deactivateMode: () => ShieldNative.deactivateMode(),
  getCurrentMode: () => ShieldNative.getCurrentMode(),
  getStats: (options) => ShieldNative.getStats(options),
  getScreenTimeStats: () => ShieldNative.getScreenTimeStats(),
  checkPermissions: () => ShieldNative.checkPermissions(),
  requestAccessibility: () => ShieldNative.requestAccessibility(),
  requestUsageStats: () => ShieldNative.requestUsageStats(),
  requestOverlay: () => ShieldNative.requestOverlay(),
  requestBattery: () => ShieldNative.requestBattery(),
  toggleAdultFilter: (options) => ShieldNative.toggleAdultFilter(options),
  updateHardcoreSettings: (options) => ShieldNative.updateHardcoreSettings(options),
  requestUninstall: () => ShieldNative.requestUninstall(),
  getDailyHistory: () => ShieldNative.getDailyHistory(),
  clearHistory: () => ShieldNative.clearHistory(),
  updateNotificationSettings: (options) => ShieldNative.updateNotificationSettings(options),
  setEmergencyPin: (options) => ShieldNative.setEmergencyPin(options),
  triggerEmergencyBypass: (options) => ShieldNative.triggerEmergencyBypass(options),
  toggleFloatingTimer: (options) => ShieldNative.toggleFloatingTimer(options),
  updateFloatingTimerStyle: (options) => ShieldNative.updateFloatingTimerStyle(options),
};