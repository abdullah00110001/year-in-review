import { useEffect, useState, useCallback } from 'react';
import { 
  isNative, 
  isAndroid,
  initializeCapacitor, 
  getDeviceInfo 
} from '@/lib/capacitor/platform';
import { 
  initializeAlarmChannel, 
  setupAlarmListeners,
  registerAlarmActions
} from '@/lib/capacitor/nativeAlarm';
import { 
  initializeShieldChannel, 
  setupShieldListeners,
  extendSession
} from '@/lib/capacitor/nativeShield';
import { 
  initializeNotificationChannels,
  registerPushNotifications,
  setupPushListeners,
  type GroupWakeSignal,
  type MentorFeedback
} from '@/lib/capacitor/nativeNotifications';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CapacitorState {
  isNative: boolean;
  isAndroid: boolean;
  isInitialized: boolean;
  deviceInfo: any;
  pushToken: string | null;
}

export function useCapacitor() {
  const { user } = useAuth();
  const [state, setState] = useState<CapacitorState>({
    isNative,
    isAndroid,
    isInitialized: false,
    deviceInfo: null,
    pushToken: null
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

  // Handle deep links
  const handleDeepLink = useCallback((url: string) => {
    console.log('[Capacitor] Deep link received:', url);
    
    // Handle auth redirects
    if (url.includes('auth/callback')) {
      window.location.href = url;
      return;
    }
    
    // Handle app routes
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      if (path && path !== '/') {
        window.location.href = path;
      }
    } catch {
      // Invalid URL
    }
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
      duration: 10000,
      action: {
        label: 'Dismiss',
        onClick: () => {
          window.location.href = '/rise';
        }
      }
    });
  }, []);

  // Handle alarm action
  const handleAlarmAction = useCallback((alarmId: number, action: string) => {
    console.log('[Capacitor] Alarm action:', alarmId, action);
    
    window.dispatchEvent(new CustomEvent('rise:alarmAction', {
      detail: { alarmId, action }
    }));
    
    // Navigate to Rise for interaction
    if (action === 'tap' || action === 'dismiss') {
      window.location.href = '/rise';
    }
  }, []);

  // Handle group wake signal
  const handleGroupWakeSignal = useCallback((signal: GroupWakeSignal) => {
    toast.error('🚨 Wake Up Call!', {
      description: `${signal.fromUserName}: ${signal.message}`,
      duration: 15000,
      action: {
        label: 'View',
        onClick: () => {
          window.location.href = '/rise';
        }
      }
    });
  }, []);

  // Handle mentor feedback
  const handleMentorFeedback = useCallback((feedback: MentorFeedback) => {
    toast.success('📝 New Feedback', {
      description: feedback.message,
      action: {
        label: 'View',
        onClick: () => window.location.href = '/dashboard'
      }
    });
  }, []);

  // Handle generic notification
  const handleGenericNotification = useCallback((title: string, body: string, data?: any) => {
    toast(title, { 
      description: body,
      action: data?.route ? {
        label: 'View',
        onClick: () => window.location.href = data.route
      } : undefined
    });
  }, []);

  // Initialize Capacitor
  useEffect(() => {
    const init = async () => {
      if (!isNative) {
        setState(prev => ({ ...prev, isInitialized: true }));
        return;
      }

      try {
        // Initialize platform (splash, status bar, back button, deep links)
        await initializeCapacitor(handleBackButton, handleDeepLink);

        // Get device info
        const deviceInfo = await getDeviceInfo();

        // Initialize notification channels (Android)
        if (isAndroid) {
          await initializeNotificationChannels();
          await initializeAlarmChannel();
          await initializeShieldChannel();
          await registerAlarmActions();
        }

        // Setup alarm listeners
        setupAlarmListeners(handleAlarmTriggered, handleAlarmAction);

        // Setup shield listeners
        setupShieldListeners(
          () => window.location.href = '/shield',
          () => {
            extendSession(15);
            window.dispatchEvent(new CustomEvent('shield:extendSession'));
          }
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
          deviceInfo,
          pushToken: null
        });

        console.log('[Capacitor] Fully initialized');
      } catch (error) {
        console.error('[Capacitor] Init error:', error);
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    };

    init();
  }, [handleBackButton, handleDeepLink, handleAlarmTriggered, handleAlarmAction, handleGroupWakeSignal, handleMentorFeedback, handleGenericNotification]);

  // Register push notifications when user logs in
  useEffect(() => {
    if (user && isNative && state.isInitialized) {
      registerPushNotifications(user.id).then(token => {
        if (token) {
          console.log('[Capacitor] Push registered for user');
          setState(prev => ({ ...prev, pushToken: token }));
        }
      });
    }
  }, [user, state.isInitialized]);

  return state;
}
