export type ScheduleMode = 'everyday' | 'weekdays' | 'custom';

export interface AllowedApp {
  id: string;
  name: string;
  icon?: string;
}

export interface NightToRiseConfig {
  enabled: boolean;
  sleepTime: string; // "HH:MM" 24h
  sleepLockMinutesBefore: number;
  riseLockMinutesAfter: number;
  allowedApps: AllowedApp[];
  sleepBlockMessage: string;
  riseBlockMessage: string;
  scheduleMode: ScheduleMode;
  scheduleDays: number[]; // 0=Sun..6=Sat
  strictMode: boolean;
  showStreakOnBlock: boolean;
  pausedUntil?: string | null; // ISO date
  configured: boolean;
}

export const DEFAULT_CONFIG: NightToRiseConfig = {
  enabled: false,
  sleepTime: '22:30',
  sleepLockMinutesBefore: 30,
  riseLockMinutesAfter: 30,
  allowedApps: [
    { id: 'com.android.phone', name: 'Phone' },
    { id: 'com.android.clock', name: 'Clock' },
    { id: 'com.android.camera', name: 'Camera' },
    { id: 'quran', name: 'Quran' },
    { id: 'notes', name: 'Notes' },
  ],
  sleepBlockMessage: 'Time to rest. Put the phone down. 🌙',
  riseBlockMessage: 'Start your morning right. No scrolling yet. 🌅',
  scheduleMode: 'everyday',
  scheduleDays: [0, 1, 2, 3, 4, 5, 6],
  strictMode: false,
  showStreakOnBlock: true,
  pausedUntil: null,
  configured: false,
};

export const STORAGE_KEY = 'night_to_rise_config_v1';
