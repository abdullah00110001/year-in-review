import { registerPlugin } from '@capacitor/core';

export interface ShieldPluginInterface {
  enable(): Promise<void>;
  disable(): Promise<void>;
  isEnabled(): Promise<{ enabled: boolean }>;

  blockApps(options: { apps: string[] }): Promise<void>;
  getBlockedApps(): Promise<{ apps: string[] }>;

  activateFocusMode(): Promise<void>;
  activateSleepMode(): Promise<void>;
  activateStrictMode(): Promise<void>;
  deactivateMode(): Promise<void>;
  getCurrentMode(): Promise<{ mode: string; strict: boolean }>;

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

  checkPermissions(): Promise<{
    accessibility: boolean;
    usageStats: boolean;
    overlay: boolean;
    battery: boolean;
  }>;

  requestAccessibility(): Promise<void>;
  requestUsageStats(): Promise<void>;
  requestOverlay(): Promise<void>;
  requestBattery(): Promise<void>;
}

const Shield = registerPlugin<ShieldPluginInterface>('Shield');

export default Shield;
