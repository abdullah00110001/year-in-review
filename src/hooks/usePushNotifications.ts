import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { isNative } from '@/lib/capacitor/platform';
import { supabase } from '@/integrations/supabase/client';

type PushPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

export function usePushNotifications() {
  const { user } = useAuth();
  const registeredRef = useRef(false);
  const listenersRef = useRef<Array<{ remove: () => void }>>([]);
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>('unknown');
  const [token, setToken] = useState<string | null>(null);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      listenersRef.current.forEach(l => {
        try { l.remove(); } catch {}
      });
      listenersRef.current = [];
    };
  }, []);

  const registerPush = useCallback(async () => {
    if (!isNative || !user || registeredRef.current) return;

    try {
      // Dynamic import wrapped - fails gracefully on devices without Play Services
      let PushNotifications: any;
      try {
        const mod = await import('@capacitor/push-notifications');
        PushNotifications = mod.PushNotifications;
      } catch (e) {
        console.warn('[Push] Plugin not available:', e);
        return;
      }

      // Check current status - wrapped individually
      let permResult;
      try {
        permResult = await PushNotifications.checkPermissions();
      } catch (e) {
        console.warn('[Push] checkPermissions failed:', e);
        return;
      }
      setPermissionStatus(permResult.receive as PushPermissionStatus);

      // Request if needed
      if (permResult.receive !== 'granted') {
        try {
          const requestResult = await PushNotifications.requestPermissions();
          setPermissionStatus(requestResult.receive as PushPermissionStatus);
          if (requestResult.receive !== 'granted') {
            console.warn('[Push] Permission denied');
            return;
          }
        } catch (e) {
          console.warn('[Push] requestPermissions failed:', e);
          return;
        }
      }

      // Clean up any previous listeners before adding new ones
      listenersRef.current.forEach(l => {
        try { l.remove(); } catch {}
      });
      listenersRef.current = [];

      // Listen for token
      const regListener = await PushNotifications.addListener('registration', async (tokenData: any) => {
        console.log('[Push] FCM token received');
        setToken(tokenData.value);
        registeredRef.current = true;

        try {
          await supabase
            .from('profiles')
            .update({
              push_token: tokenData.value,
              push_token_updated_at: new Date().toISOString(),
            } as any)
            .eq('user_id', user.id);
        } catch (err) {
          console.warn('[Push] Token save skipped:', err);
        }
      });
      listenersRef.current.push(regListener);

      const errListener = await PushNotifications.addListener('registrationError', (error: any) => {
        console.error('[Push] Registration error:', error);
      });
      listenersRef.current.push(errListener);

      // Foreground notification
      const fgListener = await PushNotifications.addListener('pushNotificationReceived', async (notification: any) => {
        console.log('[Push] Foreground notification:', notification);
        const { title, body, data } = notification;

        if (isNative) {
          try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            await LocalNotifications.schedule({
              notifications: [{
                id: Date.now(),
                title: title || 'Life OS',
                body: body || '',
                channelId: data?.channelId || 'general',
                extra: { ...data, route: data?.route || '/' },
              }],
            });
          } catch {
            // Silently fail
          }
        }
      });
      listenersRef.current.push(fgListener);

      // Notification tapped
      const tapListener = await PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
        console.log('[Push] Notification tapped:', action);
        const data = action.notification.data;
        const route = data?.route || data?.url;

        if (route) {
          setTimeout(() => { window.location.href = route; }, 500);
        } else {
          const typeRoutes: Record<string, string> = {
            group_wake: '/rise',
            mentor_feedback: '/dashboard',
            challenge_update: '/challenges',
            achievement: '/gamification',
            prayer_reminder: '/islamic-dashboard',
            daily_reminder: '/daily-input',
            shield_alert: '/shield',
            app_update: '/download',
          };
          const targetRoute = typeRoutes[data?.type] || '/dashboard';
          setTimeout(() => { window.location.href = targetRoute; }, 500);
        }
      });
      listenersRef.current.push(tapListener);

      // Register with FCM - this is where devices without Play Services crash
      try {
        await PushNotifications.register();
        console.log('[Push] Registration initiated');
      } catch (regError) {
        console.error('[Push] FCM register failed (no Play Services?):', regError);
        // Don't crash the app - just skip push
      }
    } catch (error) {
      console.error('[Push] Setup failed:', error);
    }
  }, [user]);

  // Auto-register when user logs in
  useEffect(() => {
    if (!user || !isNative) return;

    const timer = setTimeout(() => {
      registerPush();
    }, 3000);

    return () => clearTimeout(timer);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { permissionStatus, token, registerPush };
}
