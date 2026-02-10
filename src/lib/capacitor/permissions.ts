import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { isNative, isAndroid } from './platform';

export type PermissionStatus = 'granted' | 'denied' | 'prompt';

export interface PermissionState {
  notifications: PermissionStatus;
  exactAlarm: PermissionStatus;
  usageStats: PermissionStatus;
}

// Check notification permission
export const checkNotificationPermission = async (): Promise<PermissionStatus> => {
  if (!isNative) {
    // Web fallback
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
  // Show pre-explanation dialog if provided
  if (onPreExplanation) {
    const proceed = await onPreExplanation();
    if (!proceed) return 'denied';
  }

  if (!isNative) {
    // Web fallback
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
  
  // This would need a custom Capacitor plugin for SCHEDULE_EXACT_ALARM
  // For now, we assume granted and handle errors gracefully
  return 'granted';
};

// Android-specific: Request exact alarm permission
export const requestExactAlarmPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'granted';
  
  // Would open system settings for exact alarm permission
  // Requires custom plugin
  console.log('[Permissions] Would request exact alarm permission');
  return 'granted';
};

// Android-specific: Check usage stats permission (for Shield)
export const checkUsageStatsPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'denied';
  
  // This would need a custom Capacitor plugin for PACKAGE_USAGE_STATS
  // Returns 'prompt' to indicate user needs to go to Settings
  return 'prompt';
};

// Android-specific: Request usage stats permission
export const requestUsageStatsPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'denied';
  
  // Would open Usage Access settings
  // Requires custom plugin
  await openUsageStatsSettings();
  return 'prompt';
};

// Open app settings (for when permission was denied)
export const openAppSettings = async () => {
  if (!isNative) return;
  
  // This would use a native plugin to open app settings
  // For now, we log the action
  console.log('[Permissions] Would open app settings');
};

// Open usage stats settings (for Shield)
export const openUsageStatsSettings = async () => {
  if (!isAndroid) return;
  
  // This would open Settings > Apps > Usage Access
  console.log('[Permissions] Would open usage stats settings');
};

// Open battery optimization settings
export const openBatterySettings = async () => {
  if (!isAndroid) return;
  
  console.log('[Permissions] Would open battery optimization settings');
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
