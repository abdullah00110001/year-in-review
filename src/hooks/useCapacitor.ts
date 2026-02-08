import { useEffect, useState, useCallback } from 'react';
import { 
  isNative, 
  isAndroid,
  initializeCapacitor, 
  getDeviceInfo 
} from '@/lib/capacitor/platform';
import { 
  initializeAlarmChannel, 
  setupAlarmListeners 
} from '@/lib/capacitor/nativeAlarm';
import { 
  initializeShieldChannel, 
  setupShieldListeners 
} from '@/lib/capacitor/nativeShield';
import { 
  initializeNotificationChannels,
  registerPushNotifications,
  setupPushListeners
} from '@/lib/capacitor/nativeNotifications';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CapacitorState {
  isNative: boolean;
  isAndroid: boolean;
  isInitialized: boolean;
  deviceInfo: any;
}

export function useCapacitor() {
  const { user } = useAuth();
  const [state, setState] = useState<CapacitorState>({
    isNative,
    isAndroid,
    isInitialized: false,
    deviceInfo: null
  });

  // Handle back button (return true to prevent default)
  const handleBackButton = useCallback((): boolean => {
    // Check if any modals/dialogs are open
    const dialogs = document.querySelectorAll('[role="dialog"][data-state="open"]');
    if (dialogs.length > 0) {
      // Close the topmost dialog
      const closeButton = dialogs[dialogs.length - 1].querySelector('[aria-label="Close"]');
      if (closeButton) {
        (closeButton as HTMLElement).click();
        return true;
      }
    }
    
    // Let default behavior handle it
    return false;
  }, []);

  // Handle alarm triggered
  const handleAlarmTriggered = useCallback((alarmId: number, extra: any) => {
    console.log('[Capacitor] Alarm triggered:', alarmId, extra);
    
    // Navigate to Rise page with alarm data
    window.dispatchEvent(new CustomEvent('rise:alarmTriggered', {
      detail: { alarmId, ...extra }
    }));
    
    // Show toast if app is open
    toast('⏰ Alarm!', {
      description: extra.intention || 'Time to wake up!',
      duration: 10000
    });
  }, []);

  // Handle alarm action
  const handleAlarmAction = useCallback((alarmId: number, action: string) => {
    console.log('[Capacitor] Alarm action:', alarmId, action);
    
    window.dispatchEvent(new CustomEvent('rise:alarmAction', {
      detail: { alarmId, action }
    }));
  }, []);

  // Handle group wake signal
  const handleGroupWakeSignal = useCallback((signal: any) => {
    toast.error('🚨 Wake Up Call!', {
      description: `${signal.fromUserName}: ${signal.message}`,
      duration: 15000
    });
  }, []);

  // Handle mentor feedback
  const handleMentorFeedback = useCallback((message: string) => {
    toast.success('📝 New Feedback', {
      description: message,
      action: {
        label: 'View',
        onClick: () => window.location.href = '/dashboard'
      }
    });
  }, []);

  // Handle generic notification
  const handleGenericNotification = useCallback((title: string, body: string) => {
    toast(title, { description: body });
  }, []);

  // Initialize Capacitor
  useEffect(() => {
    const init = async () => {
      if (!isNative) {
        setState(prev => ({ ...prev, isInitialized: true }));
        return;
      }

      try {
        // Initialize platform (splash, status bar, back button)
        await initializeCapacitor(handleBackButton);

        // Get device info
        const deviceInfo = await getDeviceInfo();

        // Initialize notification channels (Android)
        if (isAndroid) {
          await initializeNotificationChannels();
          await initializeAlarmChannel();
          await initializeShieldChannel();
        }

        // Setup alarm listeners
        setupAlarmListeners(handleAlarmTriggered, handleAlarmAction);

        // Setup shield listeners
        setupShieldListeners(
          () => window.location.href = '/shield',
          () => window.dispatchEvent(new CustomEvent('shield:extendSession'))
        );

        // Setup push listeners
        setupPushListeners(
          handleGroupWakeSignal,
          handleMentorFeedback,
          handleGenericNotification
        );

        setState({
          isNative: true,
          isAndroid,
          isInitialized: true,
          deviceInfo
        });

        console.log('[Capacitor] Fully initialized');
      } catch (error) {
        console.error('[Capacitor] Init error:', error);
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    };

    init();
  }, [handleBackButton, handleAlarmTriggered, handleAlarmAction, handleGroupWakeSignal, handleMentorFeedback, handleGenericNotification]);

  // Register push notifications when user logs in
  useEffect(() => {
    if (user && isNative && state.isInitialized) {
      registerPushNotifications(user.id).then(token => {
        if (token) {
          console.log('[Capacitor] Push registered for user');
        }
      });
    }
  }, [user, state.isInitialized]);

  return state;
}
