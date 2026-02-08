import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isNative, isAndroid } from './platform';

export interface AlarmConfig {
  id: number;
  title: string;
  body: string;
  scheduledAt: Date;
  sound?: string;
  vibrate?: boolean;
  snoozeMinutes?: number;
  missionType?: 'math' | 'shake' | 'photo' | 'qr' | 'memory' | 'typing' | 'walking' | 'squat';
  intention?: string;
  whoDepends?: string;
  isGroupAlarm?: boolean;
  groupId?: string;
}

export interface AlarmNotification {
  id: number;
  notificationId: number;
}

// Store for active alarms
const activeAlarms: Map<number, AlarmNotification> = new Map();

// Schedule a Rise alarm
export const scheduleAlarm = async (config: AlarmConfig): Promise<boolean> => {
  try {
    const notification: LocalNotificationSchema = {
      id: config.id,
      title: config.title,
      body: config.body,
      schedule: {
        at: config.scheduledAt,
        allowWhileIdle: true, // Critical for alarms
      },
      sound: config.sound || 'alarm_sound.wav',
      channelId: 'rise_alarms',
      extra: {
        type: 'rise_alarm',
        missionType: config.missionType,
        intention: config.intention,
        whoDepends: config.whoDepends,
        isGroupAlarm: config.isGroupAlarm,
        groupId: config.groupId,
        snoozeMinutes: config.snoozeMinutes
      },
      ongoing: true, // Persistent notification
      autoCancel: false
    };

    if (isAndroid) {
      // Android-specific alarm channel
      notification.channelId = 'rise_alarms';
    }

    await LocalNotifications.schedule({ notifications: [notification] });
    
    activeAlarms.set(config.id, {
      id: config.id,
      notificationId: config.id
    });

    console.log('[NativeAlarm] Scheduled alarm:', config.id, 'at', config.scheduledAt);
    return true;
  } catch (error) {
    console.error('[NativeAlarm] Failed to schedule:', error);
    return false;
  }
};

// Cancel a scheduled alarm
export const cancelAlarm = async (alarmId: number): Promise<boolean> => {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: alarmId }] });
    activeAlarms.delete(alarmId);
    console.log('[NativeAlarm] Cancelled alarm:', alarmId);
    return true;
  } catch (error) {
    console.error('[NativeAlarm] Failed to cancel:', error);
    return false;
  }
};

// Cancel all alarms
export const cancelAllAlarms = async (): Promise<boolean> => {
  try {
    const pending = await LocalNotifications.getPending();
    const alarmNotifications = pending.notifications.filter(n => 
      n.extra?.type === 'rise_alarm'
    );
    
    await LocalNotifications.cancel({ 
      notifications: alarmNotifications.map(n => ({ id: n.id }))
    });
    
    activeAlarms.clear();
    console.log('[NativeAlarm] Cancelled all alarms');
    return true;
  } catch (error) {
    console.error('[NativeAlarm] Failed to cancel all:', error);
    return false;
  }
};

// Snooze an active alarm
export const snoozeAlarm = async (alarmId: number, minutes: number = 5): Promise<boolean> => {
  try {
    // Cancel current notification
    await LocalNotifications.cancel({ notifications: [{ id: alarmId }] });
    
    // Reschedule for snooze duration
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);
    
    await LocalNotifications.schedule({
      notifications: [{
        id: alarmId,
        title: '⏰ Snoozed Alarm',
        body: `Wake up! (Snoozed ${minutes} min)`,
        schedule: { at: snoozeTime, allowWhileIdle: true },
        sound: 'alarm_sound.wav',
        channelId: 'rise_alarms',
        ongoing: true,
        autoCancel: false
      }]
    });
    
    console.log('[NativeAlarm] Snoozed alarm:', alarmId, 'for', minutes, 'minutes');
    return true;
  } catch (error) {
    console.error('[NativeAlarm] Failed to snooze:', error);
    return false;
  }
};

// Dismiss alarm (after mission completed)
export const dismissAlarm = async (alarmId: number): Promise<boolean> => {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: alarmId }] });
    activeAlarms.delete(alarmId);
    
    // Success haptic feedback
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
    
    console.log('[NativeAlarm] Dismissed alarm:', alarmId);
    return true;
  } catch (error) {
    console.error('[NativeAlarm] Failed to dismiss:', error);
    return false;
  }
};

// Get all pending alarms
export const getPendingAlarms = async (): Promise<LocalNotificationSchema[]> => {
  try {
    const { notifications } = await LocalNotifications.getPending();
    return notifications.filter(n => n.extra?.type === 'rise_alarm');
  } catch {
    return [];
  }
};

// Trigger alarm vibration pattern
export const triggerAlarmVibration = async () => {
  if (!isNative) return;
  
  try {
    // Strong vibration pattern for wake-up
    await Haptics.vibrate({ duration: 1000 });
    
    // Repeat pattern
    const pattern = [500, 200, 500, 200, 500];
    for (const duration of pattern) {
      await new Promise(resolve => setTimeout(resolve, 200));
      await Haptics.vibrate({ duration });
    }
  } catch (error) {
    console.error('[NativeAlarm] Vibration failed:', error);
  }
};

// Initialize alarm notification channel (Android)
export const initializeAlarmChannel = async () => {
  if (!isAndroid) return;
  
  try {
    await LocalNotifications.createChannel({
      id: 'rise_alarms',
      name: 'Rise Alarms',
      description: 'Wake-up alarms from Rise',
      importance: 5, // Max importance
      visibility: 1, // Public
      vibration: true,
      sound: 'alarm_sound.wav',
      lights: true,
      lightColor: '#0ea5e9'
    });
    
    console.log('[NativeAlarm] Channel created');
  } catch (error) {
    console.error('[NativeAlarm] Channel creation failed:', error);
  }
};

// Listen for alarm notifications
export const setupAlarmListeners = (
  onAlarmTriggered: (alarmId: number, extra: any) => void,
  onAlarmAction: (alarmId: number, action: string) => void
) => {
  // When notification is received while app is open
  LocalNotifications.addListener('localNotificationReceived', (notification) => {
    if (notification.extra?.type === 'rise_alarm') {
      console.log('[NativeAlarm] Alarm triggered:', notification.id);
      onAlarmTriggered(notification.id, notification.extra);
      triggerAlarmVibration();
    }
  });

  // When user taps on notification
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const { notification, actionId } = action;
    if (notification.extra?.type === 'rise_alarm') {
      console.log('[NativeAlarm] Action performed:', actionId);
      onAlarmAction(notification.id, actionId);
    }
  });
};
