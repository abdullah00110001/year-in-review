import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { PushNotifications, Token, PushNotificationSchema } from '@capacitor/push-notifications';
import { isNative, isAndroid } from './platform';
import { supabase } from '@/integrations/supabase/client';

export interface GroupWakeSignal {
  fromUserId: string;
  fromUserName: string;
  groupId: string;
  message: string;
}

// Register for push notifications and save token
export const registerPushNotifications = async (userId: string): Promise<string | null> => {
  if (!isNative) return null;

  try {
    // Request permission
    const { receive } = await PushNotifications.requestPermissions();
    
    if (receive !== 'granted') {
      console.log('[Notifications] Push permission denied');
      return null;
    }

    // Register with FCM/APNs
    await PushNotifications.register();

    // Wait for token
    return new Promise((resolve) => {
      PushNotifications.addListener('registration', async (token: Token) => {
        console.log('[Notifications] Push token:', token.value);
        
        // Save token to Supabase for server-side notifications
        try {
          await supabase.from('push_subscriptions').upsert({
            user_id: userId,
            endpoint: token.value,
            p256dh: 'fcm', // Marker for FCM tokens
            auth: 'native',
            is_active: true
          }, {
            onConflict: 'user_id'
          });
        } catch (error) {
          console.error('[Notifications] Failed to save token:', error);
        }
        
        resolve(token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('[Notifications] Registration error:', error);
        resolve(null);
      });
    });
  } catch (error) {
    console.error('[Notifications] Push registration failed:', error);
    return null;
  }
};

// Setup push notification listeners
export const setupPushListeners = (
  onGroupWakeSignal: (signal: GroupWakeSignal) => void,
  onMentorFeedback: (message: string) => void,
  onGenericNotification: (title: string, body: string) => void
) => {
  if (!isNative) return;

  // Notification received while app is open
  PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
    console.log('[Notifications] Push received:', notification);
    
    const { data } = notification;
    
    switch (data?.type) {
      case 'group_wake':
        onGroupWakeSignal({
          fromUserId: data.fromUserId,
          fromUserName: data.fromUserName,
          groupId: data.groupId,
          message: data.message || 'Someone needs help waking up!'
        });
        break;
      case 'mentor_feedback':
        onMentorFeedback(notification.body || 'You have new feedback');
        break;
      default:
        onGenericNotification(
          notification.title || 'Life OS',
          notification.body || ''
        );
    }
  });

  // Notification tapped
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('[Notifications] Push action:', action);
    
    const { data } = action.notification;
    
    // Navigate based on notification type
    if (data?.type === 'group_wake') {
      window.location.href = '/rise';
    } else if (data?.type === 'mentor_feedback') {
      window.location.href = '/dashboard';
    }
  });
};

// Send local notification for group wake signal
export const sendGroupWakeNotification = async (signal: GroupWakeSignal): Promise<void> => {
  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: Date.now(),
        title: '🚨 Wake Up Call!',
        body: `${signal.fromUserName}: ${signal.message}`,
        channelId: 'group_wake',
        sound: 'alarm_sound.wav',
        extra: {
          type: 'group_wake',
          groupId: signal.groupId
        }
      }]
    });
  } catch (error) {
    console.error('[Notifications] Group wake notification failed:', error);
  }
};

// Send shield reminder notification
export const sendShieldReminder = async (
  title: string,
  body: string,
  scheduledAt?: Date
): Promise<void> => {
  try {
    const notification: LocalNotificationSchema = {
      id: Date.now(),
      title,
      body,
      channelId: 'shield_reminders',
      extra: { type: 'shield_reminder' }
    };

    if (scheduledAt) {
      notification.schedule = { at: scheduledAt };
    }

    await LocalNotifications.schedule({ notifications: [notification] });
  } catch (error) {
    console.error('[Notifications] Shield reminder failed:', error);
  }
};

// Initialize all notification channels (Android)
export const initializeNotificationChannels = async (): Promise<void> => {
  if (!isAndroid) return;

  try {
    // Group wake channel - max priority
    await LocalNotifications.createChannel({
      id: 'group_wake',
      name: 'Group Wake Signals',
      description: 'Urgent wake-up calls from your accountability group',
      importance: 5,
      visibility: 1,
      vibration: true,
      sound: 'alarm_sound.wav',
      lights: true,
      lightColor: '#ef4444'
    });

    // Shield reminders - high priority
    await LocalNotifications.createChannel({
      id: 'shield_reminders',
      name: 'Shield Reminders',
      description: 'Focus session reminders and updates',
      importance: 4,
      visibility: 1,
      vibration: true
    });

    // General notifications - default priority
    await LocalNotifications.createChannel({
      id: 'general',
      name: 'General Notifications',
      description: 'App updates and reminders',
      importance: 3,
      visibility: 1
    });

    console.log('[Notifications] All channels created');
  } catch (error) {
    console.error('[Notifications] Channel creation failed:', error);
  }
};

// Clear all notifications
export const clearAllNotifications = async (): Promise<void> => {
  try {
    // Cancel all pending notifications
    const { notifications } = await LocalNotifications.getPending();
    if (notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: notifications.map(n => ({ id: n.id }))
      });
    }
  } catch (error) {
    console.error('[Notifications] Clear failed:', error);
  }
};

// Get notification badge count
export const getBadgeCount = async (): Promise<number> => {
  // Would need native implementation
  return 0;
};

// Set notification badge count
export const setBadgeCount = async (count: number): Promise<void> => {
  // Would need native implementation
  console.log('[Notifications] Badge count:', count);
};
