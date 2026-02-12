import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  isNative, 
  isAndroid,
  initializeCapacitor, 
  getDeviceInfo 
} from '@/lib/capacitor/platform';
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
  const initRef = useRef(false);
  const [state, setState] = useState<CapacitorState>({
    isNative,
    isAndroid,
    isInitialized: !isNative,
    deviceInfo: null,
    pushToken: null
  });

  const handleBackButton = useCallback((): boolean => {
    try {
      // Close dialogs first
      const dialogs = document.querySelectorAll('[role="dialog"][data-state="open"]');
      if (dialogs.length > 0) {
        const closeButton = dialogs[dialogs.length - 1].querySelector('[aria-label="Close"]');
        if (closeButton) {
          (closeButton as HTMLElement).click();
          return true;
        }
      }
      // Close drawers
      const drawers = document.querySelectorAll('[data-vaul-drawer][data-state="open"]');
      if (drawers.length > 0) {
        document.body.click();
        return true;
      }
    } catch (e) {
      console.error('[Capacitor] Back button handler error:', e);
    }
    return false;
  }, []);

  const handleDeepLink = useCallback((url: string) => {
    try {
      console.log('[Capacitor] Deep link received:', url);
      if (url.includes('auth/callback') || url.includes('supabase.co')) {
        window.location.href = url;
        return;
      }
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      if (path && path !== '/') {
        window.location.href = path;
      }
    } catch {
      // Invalid URL
    }
  }, []);

  // Initialize Capacitor - runs once
  useEffect(() => {
    if (!isNative || initRef.current) return;
    initRef.current = true;

    const init = async () => {
      // Step 1: Core platform init
      try {
        await initializeCapacitor(handleBackButton, handleDeepLink);
      } catch (error) {
        console.error('[Capacitor] Platform init error:', error);
      }

      let deviceInfo = null;
      try {
        deviceInfo = await getDeviceInfo();
      } catch (error) {
        console.error('[Capacitor] Device info error:', error);
      }

      // Step 2: Request notification permission early (Android 13+)
      if (isAndroid) {
        try {
          const { requestNotificationPermission, checkExactAlarmPermission } = await import('@/lib/capacitor/permissions');
          const permStatus = await requestNotificationPermission();
          console.log('[Capacitor] Notification permission:', permStatus);
          
          // Also check exact alarm permission for Rise
          const alarmPerm = await checkExactAlarmPermission();
          console.log('[Capacitor] Exact alarm permission:', alarmPerm);
        } catch (error) {
          console.error('[Capacitor] Permission error:', error);
        }
      }

      // Step 3: Notification channels (each wrapped separately)
      if (isAndroid) {
        try {
          const { initializeNotificationChannels } = await import('@/lib/capacitor/nativeNotifications');
          await initializeNotificationChannels();
        } catch (error) {
          console.error('[Capacitor] Notification channels error:', error);
        }

        try {
          const { initializeAlarmChannel, registerAlarmActions } = await import('@/lib/capacitor/nativeAlarm');
          await initializeAlarmChannel();
          await registerAlarmActions();
        } catch (error) {
          console.error('[Capacitor] Alarm channel error:', error);
        }

        try {
          const { initializeShieldChannel } = await import('@/lib/capacitor/nativeShield');
          await initializeShieldChannel();
        } catch (error) {
          console.error('[Capacitor] Shield channel error:', error);
        }
      }

      // Step 4: Set up listeners
      try {
        const { setupAlarmListeners } = await import('@/lib/capacitor/nativeAlarm');
        setupAlarmListeners(
          (alarmId, extra) => {
            console.log('[Capacitor] Alarm triggered:', alarmId);
            window.dispatchEvent(new CustomEvent('rise:alarmTriggered', { detail: { alarmId, ...extra } }));
            toast('⏰ Alarm!', {
              description: extra?.intention || 'Time to wake up!',
              duration: 10000,
            });
          },
          (alarmId, action) => {
            console.log('[Capacitor] Alarm action:', alarmId, action);
            window.dispatchEvent(new CustomEvent('rise:alarmAction', { detail: { alarmId, action } }));
          }
        );
      } catch (error) {
        console.error('[Capacitor] Alarm listeners error:', error);
      }

      try {
        const { setupShieldListeners, extendSession } = await import('@/lib/capacitor/nativeShield');
        setupShieldListeners(
          () => { try { window.location.href = '/shield'; } catch {} },
          () => {
            try {
              extendSession(15);
              window.dispatchEvent(new CustomEvent('shield:extendSession'));
            } catch {}
          }
        );
      } catch (error) {
        console.error('[Capacitor] Shield listeners error:', error);
      }

      try {
        const { setupPushListeners } = await import('@/lib/capacitor/nativeNotifications');
        setupPushListeners(
          (signal) => {
            toast.error('🚨 Wake Up Call!', { description: `${signal.fromUserName}: ${signal.message}`, duration: 15000 });
          },
          (feedback) => {
            toast.success('📝 New Feedback', { description: feedback.message });
          },
          (title, body) => {
            toast(title, { description: body });
          }
        );
      } catch (error) {
        console.error('[Capacitor] Push listeners error:', error);
      }

      // Mark as initialized
      setState({
        isNative: true,
        isAndroid,
        isInitialized: true,
        deviceInfo,
        pushToken: null
      });

      console.log('[Capacitor] Initialization complete');
    };

    init();
  }, []);

  // Register push notifications when user logs in
  useEffect(() => {
    if (!user || !isNative || !state.isInitialized) return;

    const registerPush = async () => {
      try {
        const { registerPushNotifications } = await import('@/lib/capacitor/nativeNotifications');
        const token = await registerPushNotifications(user.id);
        if (token) {
          console.log('[Capacitor] Push registered for user');
          setState(prev => ({ ...prev, pushToken: token }));
        }
      } catch (error) {
        console.error('[Capacitor] Push registration error:', error);
      }
    };

    const timer = setTimeout(registerPush, 3000);
    return () => clearTimeout(timer);
  }, [user?.id, state.isInitialized]);

  return state;
}
