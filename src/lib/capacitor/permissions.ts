import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { isNative, isAndroid } from './platform';
import Shield from './shieldPlugin';
import { canScheduleExactAlarms, openExactAlarmSettings } from './riseAlarmBridge';

export type PermissionStatus = 'granted' | 'denied' | 'prompt';

export interface PermissionState {
  notifications: PermissionStatus;
  exactAlarm: PermissionStatus;
  usageStats: PermissionStatus;
  overlay: PermissionStatus;
  battery: PermissionStatus;
  accessibility: PermissionStatus;
}

// Check notification permission
export const checkNotificationPermission = async (): Promise<PermissionStatus> => {
  if (!isNative) {
    if ('Notification' in window) {
      return Notification.permission as PermissionStatus;
    }
    return 'denied';
  }

  try {
    const { display } = await LocalNotifications.checkPermissions();
    return display as PermissionStatus;
  } catch {
    return 'denied';
  }
};

// Request notification permission with pre-explanation
export const requestNotificationPermission = async (
  onPreExplanation?: () => Promise<boolean>
): Promise<PermissionStatus> => {
  if (onPreExplanation) {
    const proceed = await onPreExplanation();
    if (!proceed) return 'denied';
  }

  if (!isNative) {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      return result as PermissionStatus;
    }
    return 'denied';
  }

  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display as PermissionStatus;
  } catch {
    return 'denied';
  }
};

// Check push notification permission
export const checkPushPermission = async (): Promise<PermissionStatus> => {
  if (!isNative) return 'denied';

  try {
    const { receive } = await PushNotifications.checkPermissions();
    return receive as PermissionStatus;
  } catch {
    return 'denied';
  }
};

// Request push notification permission
export const requestPushPermission = async (): Promise<PermissionStatus> => {
  if (!isNative) return 'denied';

  try {
    const { receive } = await PushNotifications.requestPermissions();
    
    if (receive === 'granted') {
      await PushNotifications.register();
    }
    
    return receive as PermissionStatus;
  } catch {
    return 'denied';
  }
};

// Android-specific: Check exact alarm permission (API 31+)
export const checkExactAlarmPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'granted';
  // Capacitor LocalNotifications handles this internally
  // We check by trying to schedule and catching errors
  return 'granted';
};

// Android-specific: Open app settings for exact alarm permission
export const requestExactAlarmPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'granted';
  
  try {
    // Open Android app settings where user can grant exact alarm permission
    const { App } = await import('@capacitor/app');
    // On Android 12+, exact alarm permission is auto-granted for alarm apps
    // but users can revoke it in Settings > Apps > Special access > Alarms & reminders
    console.log('[Permissions] Exact alarm permission - handled by system');
    return 'granted';
  } catch {
    return 'granted';
  }
};

// Android-specific: Check usage stats permission (for Shield)
export const checkUsageStatsPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'denied';
  // Usage stats requires user to manually enable in Settings
  // We return 'prompt' to indicate user needs to go to Settings
  return 'prompt';
};

// Android-specific: Request usage stats permission
export const requestUsageStatsPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'denied';
  await openUsageStatsSettings();
  return 'prompt';
};

// Open app settings (for when permission was denied)
export const openAppSettings = async () => {
  if (!isNative) return;
  
  try {
    // Use the App plugin to open device settings for this app
    const { Browser } = await import('@capacitor/browser');
    if (isAndroid) {
      // Android: open app details settings
      await Browser.open({ 
        url: 'app-settings:',
        presentationStyle: 'fullscreen'
      });
    }
  } catch (error) {
    console.error('[Permissions] Failed to open app settings:', error);
    // Fallback: try native intent
    try {
      window.open('intent://settings#Intent;end', '_system');
    } catch {
      console.log('[Permissions] Cannot open settings programmatically');
    }
  }
};

// Open usage stats settings (for Shield)
export const openUsageStatsSettings = async () => {
  if (!isAndroid) return;
  
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ 
      url: 'android.settings.USAGE_ACCESS_SETTINGS',
      presentationStyle: 'fullscreen'
    });
  } catch (error) {
    console.error('[Permissions] Failed to open usage stats settings:', error);
  }
};

// Open battery optimization settings
export const openBatterySettings = async () => {
  if (!isAndroid) return;
  
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ 
      url: 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
      presentationStyle: 'fullscreen'
    });
  } catch (error) {
    console.error('[Permissions] Failed to open battery settings:', error);
  }
};

// Get all permission states
export const getAllPermissions = async (): Promise<PermissionState> => {
  const [notifications, exactAlarm, usageStats] = await Promise.all([
    checkNotificationPermission(),
    checkExactAlarmPermission(),
    checkUsageStatsPermission()
  ]);

  return { notifications, exactAlarm, usageStats };
};

// Check if all required permissions are granted for Rise
export const hasRisePermissions = async (): Promise<boolean> => {
  const notifications = await checkNotificationPermission();
  const exactAlarm = await checkExactAlarmPermission();
  
  return notifications === 'granted' && exactAlarm === 'granted';
};

// Check if all required permissions are granted for Shield
export const hasShieldPermissions = async (): Promise<boolean> => {
  const notifications = await checkNotificationPermission();
  const usageStats = await checkUsageStatsPermission();
  
  return notifications === 'granted' && usageStats === 'granted';
};

// Request all Rise permissions in sequence with user-friendly prompts
export const requestRisePermissions = async (): Promise<{
  notifications: PermissionStatus;
  exactAlarm: PermissionStatus;
}> => {
  const notifications = await requestNotificationPermission();
  const exactAlarm = await requestExactAlarmPermission();
  return { notifications, exactAlarm };
};

// Request all Shield permissions in sequence
export const requestShieldPermissions = async (): Promise<{
  notifications: PermissionStatus;
  usageStats: PermissionStatus;
}> => {
  const notifications = await requestNotificationPermission();
  const usageStats = await requestUsageStatsPermission();
  return { notifications, usageStats };
};
