"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shield = void 0;
var core_1 = require("@capacitor/core");
var ShieldNative = (0, core_1.registerPlugin)('Shield');
// 🟢 FIX: Named export যাতে import { Shield } সব জায়গায় কাজ করে
exports.Shield = {
    enable: function () { return ShieldNative.enable(); },
    disable: function () { return ShieldNative.disable(); },
    isEnabled: function () { return ShieldNative.isEnabled(); },
    blockApps: function (options) { return ShieldNative.blockApps(options); },
    getBlockedApps: function () { return ShieldNative.getBlockedApps(); },
    blockSites: function (options) { return ShieldNative.blockSites(options); },
    getBlockedSites: function () { return ShieldNative.getBlockedSites(); },
    blockKeywords: function (options) { return ShieldNative.blockKeywords(options); },
    getBlockedKeywords: function () { return ShieldNative.getBlockedKeywords(); },
    getInstalledApps: function () { return ShieldNative.getInstalledApps(); },
    getBlockStats: function () { return ShieldNative.getBlockStats(); },
    activateFocusMode: function () { return ShieldNative.activateFocusMode(); },
    activateSleepMode: function () { return ShieldNative.activateSleepMode(); },
    activateStrictMode: function () { return ShieldNative.activateStrictMode(); },
    deactivateMode: function () { return ShieldNative.deactivateMode(); },
    getCurrentMode: function () { return ShieldNative.getCurrentMode(); },
    getStats: function (options) { return ShieldNative.getStats(options); },
    getScreenTimeStats: function () { return ShieldNative.getScreenTimeStats(); },
    checkPermissions: function () { return ShieldNative.checkPermissions(); },
    requestAccessibility: function () { return ShieldNative.requestAccessibility(); },
    requestUsageStats: function () { return ShieldNative.requestUsageStats(); },
    requestOverlay: function () { return ShieldNative.requestOverlay(); },
    requestBattery: function () { return ShieldNative.requestBattery(); },
    toggleAdultFilter: function (options) { return ShieldNative.toggleAdultFilter(options); },
    updateHardcoreSettings: function (options) { return ShieldNative.updateHardcoreSettings(options); },
    requestUninstall: function () { return ShieldNative.requestUninstall(); },
    getDailyHistory: function () { return ShieldNative.getDailyHistory(); },
    clearHistory: function () { return ShieldNative.clearHistory(); },
    updateNotificationSettings: function (options) { return ShieldNative.updateNotificationSettings(options); },
    setEmergencyPin: function (options) { return ShieldNative.setEmergencyPin(options); },
    triggerEmergencyBypass: function (options) { return ShieldNative.triggerEmergencyBypass(options); },
    toggleFloatingTimer: function (options) { return ShieldNative.toggleFloatingTimer(options); },
    updateFloatingTimerStyle: function (options) { return ShieldNative.updateFloatingTimerStyle(options); },
};
