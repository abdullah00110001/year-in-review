import { LocalNotifications, LocalNotificationSchema, ScheduleOn } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isNative, isAndroid } from './platform';
import { supabase } from '@/integrations/supabase/client';

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
  daysOfWeek?: number[];
  alarmDbId?: string;
}

export interface AlarmNotification {
  id: number;
  notificationId: number;
  dbId?: string;
}

// Store for active alarms
const activeAlarms: Map<number, AlarmNotification> = new Map();

// Convert UUID to numeric ID for notifications (consistent hashing)
export const uuidToNumericId = (uuid: string): number => {
  const cleaned = uuid.replace(/-/g, '');
  // Use first 8 hex chars for a consistent ID
  return parseInt(cleaned.slice(0, 8), 16) % 2147483647;
};

// Calculate next alarm time based on days of week
const getNextAlarmTime = (time: string, daysOfWeek: number[]): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const today = now.getDay();
  
  // Sort days to find next occurrence
  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    const checkDay = (today + dayOffset) % 7;
    
    if (daysOfWeek.includes(checkDay)) {
      const alarmDate = new Date(now);
      alarmDate.setDate(alarmDate.getDate() + dayOffset);
      alarmDate.setHours(hours, minutes, 0, 0);
      
      if (alarmDate > now) {
        return alarmDate;
      }
    }
  }
  
  // Default to tomorrow same time
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hours, minutes, 0, 0);
  return tomorrow;
};

// Schedule a Rise alarm
export const scheduleAlarm = async (config: AlarmConfig): Promise<boolean> => {
  try {
    const notification: LocalNotificationSchema = {
      id: config.id,
      title: config.title,
      body: config.body,
      schedule: {
        at: config.scheduledAt,
        allowWhileIdle: true, // Critical for alarms - survives Doze
      },
      sound: config.sound || 'alarm_sound.wav',
      channelId: 'rise_alarms',
      extra: {
        type: 'rise_alarm',
        missionType: config.missionType || 'math',
        intention: config.intention,
        whoDepends: config.whoDepends,
        isGroupAlarm: config.isGroupAlarm,
        groupId: config.groupId,
        snoozeMinutes: config.snoozeMinutes || 5,
        alarmDbId: config.alarmDbId
      },
      ongoing: true, // Persistent notification - cannot be swiped away
      autoCancel: false,
      // Full-screen intent for alarm behavior
      largeBody: config.intention || 'Time to wake up and conquer the day!',
      summaryText: config.whoDepends ? `${config.whoDepends} is counting on you` : undefined
    };

    // Android-specific settings for alarm reliability
    if (isAndroid) {
      notification.channelId = 'rise_alarms';
    }

    await LocalNotifications.schedule({ notifications: [notification] });
    
    activeAlarms.set(config.id, {
      id: config.id,
      notificationId: config.id,
      dbId: config.alarmDbId
    });

    console.log('[NativeAlarm] Scheduled alarm:', config.id, 'at', config.scheduledAt.toLocaleString());
    return true;
  } catch (error) {
    console.error('[NativeAlarm] Failed to schedule:', error);
    return false;
  }
};

// Schedule recurring alarm based on days of week
export const scheduleRecurringAlarm = async (
  alarmDbId: string,
  time: string,
  daysOfWeek: number[],
  config: Omit<AlarmConfig, 'id' | 'scheduledAt'>
): Promise<boolean> => {
  const numericId = uuidToNumericId(alarmDbId);
  const nextTime = getNextAlarmTime(time, daysOfWeek);
  
  return scheduleAlarm({
    ...config,
    id: numericId,
    scheduledAt: nextTime,
    alarmDbId
  });
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

// Cancel alarm by database UUID
export const cancelAlarmByUuid = async (uuid: string): Promise<boolean> => {
  return cancelAlarm(uuidToNumericId(uuid));
};

// Cancel all Rise alarms
export const cancelAllAlarms = async (): Promise<boolean> => {
  try {
    const pending = await LocalNotifications.getPending();
    const alarmNotifications = pending.notifications.filter(n => 
      n.extra?.type === 'rise_alarm'
    );
    
    if (alarmNotifications.length > 0) {
      await LocalNotifications.cancel({ 
        notifications: alarmNotifications.map(n => ({ id: n.id }))
      });
    }
    
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
        autoCancel: false,
        extra: {
          type: 'rise_alarm',
          snoozed: true,
          snoozeCount: 1
        }
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
export const dismissAlarm = async (alarmId: number, userId?: string): Promise<boolean> => {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: alarmId }] });
    const alarmData = activeAlarms.get(alarmId);
    activeAlarms.delete(alarmId);
    
    // Success haptic feedback
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
    
    // Log to database
    if (userId && alarmData?.dbId) {
      try {
        await supabase.from('rise_alarm_logs').insert({
          user_id: userId,
          alarm_id: alarmData.dbId,
          scheduled_time: new Date().toISOString(),
          actual_wake_time: new Date().toISOString(),
          status: 'completed',
          verification_completed: true
        });
      } catch (dbError) {
        console.error('[NativeAlarm] Failed to log to database:', dbError);
      }
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

// Check if alarm permission is granted
export const checkAlarmPermission = async (): Promise<boolean> => {
  try {
    const { display } = await LocalNotifications.checkPermissions();
    return display === 'granted';
  } catch {
    return false;
  }
};

// Request alarm permission
export const requestAlarmPermission = async (): Promise<boolean> => {
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } catch {
    return false;
  }
};

// Trigger alarm vibration pattern
export const triggerAlarmVibration = async (intensity: 'light' | 'medium' | 'heavy' = 'heavy') => {
  if (!isNative) return;
  
  try {
    const style = intensity === 'light' ? ImpactStyle.Light : 
                  intensity === 'medium' ? ImpactStyle.Medium : ImpactStyle.Heavy;
    
    // Strong vibration pattern for wake-up
    for (let i = 0; i < 5; i++) {
      await Haptics.impact({ style });
      await new Promise(resolve => setTimeout(resolve, 300));
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
      description: 'Wake-up alarms from Rise - Critical alerts that bypass DND',
      importance: 5, // Max importance - shows as heads-up notification
      visibility: 1, // Public - shows on lock screen
      vibration: true,
      sound: 'alarm_sound.wav',
      lights: true,
      lightColor: '#ef4444' // Red for urgency
    });
    
    // Create channel for snoozed alarms
    await LocalNotifications.createChannel({
      id: 'rise_snoozed',
      name: 'Snoozed Alarms',
      description: 'Reminders for snoozed alarms',
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: 'alarm_sound.wav'
    });
    
    console.log('[NativeAlarm] Channels created');
  } catch (error) {
    console.error('[NativeAlarm] Channel creation failed:', error);
  }
};

// Reschedule all alarms after boot (called from boot receiver)
export const rescheduleAllAlarmsAfterBoot = async (userId: string) => {
  try {
    const { data: alarms } = await supabase
      .from('rise_alarms')
      .select('*')
      .eq('user_id', userId)
      .eq('is_enabled', true);
    
    if (!alarms) return;
    
    for (const alarm of alarms) {
      await scheduleRecurringAlarm(
        alarm.id,
        alarm.alarm_time,
        alarm.days_of_week || [0, 1, 2, 3, 4, 5, 6],
        {
          title: alarm.label || 'Rise Alarm',
          body: alarm.intention || 'Time to wake up!',
          missionType: alarm.verification_type as any,
          intention: alarm.intention || undefined,
          snoozeMinutes: alarm.snooze_interval_minutes || 5
        }
      );
    }
    
    console.log('[NativeAlarm] Rescheduled', alarms.length, 'alarms after boot');
  } catch (error) {
    console.error('[NativeAlarm] Failed to reschedule after boot:', error);
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
      triggerAlarmVibration('heavy');
    }
  });

  // When user taps on notification or action button
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const { notification, actionId } = action;
    if (notification.extra?.type === 'rise_alarm') {
      console.log('[NativeAlarm] Action performed:', actionId);
      onAlarmAction(notification.id, actionId || 'tap');
    }
  });
};

// Register alarm action types (snooze, dismiss buttons)
export const registerAlarmActions = async () => {
  if (!isNative) return;
  
  try {
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'alarm_actions',
          actions: [
            {
              id: 'snooze',
              title: 'Snooze 5 min',
              foreground: false
            },
            {
              id: 'dismiss',
              title: 'I\'m Up!',
              foreground: true,
              destructive: false
            }
          ]
        }
      ]
    });
    console.log('[NativeAlarm] Action types registered');
  } catch (error) {
    console.error('[NativeAlarm] Failed to register actions:', error);
  }
};
