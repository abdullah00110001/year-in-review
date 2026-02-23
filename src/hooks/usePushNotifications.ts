import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { isNative } from '@/lib/capacitor/platform';
import { supabase } from '@/integrations/supabase/client';

type PushPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

export function usePushNotifications() {
  const { user } = useAuth();
  const registeredRef = useRef(false);
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>('unknown');
  const [token, setToken] = useState<string | null>(null);

  // Request permission and register for push
  const registerPush = useCallback(async () => {
    if (!isNative || !user || registeredRef.current) return;

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      // Check current status
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

      // Don't remove all listeners - other hooks may have set them up
      // Just add our own listeners

      // Listen for token
      PushNotifications.addListener('registration', async (tokenData) => {
        console.log('[Push] FCM token received');
        setToken(tokenData.value);
        registeredRef.current = true;

        // Store token in profiles table (safe - column may not exist yet)
        try {
          await supabase
            .from('profiles')
            .update({
              push_token: tokenData.value,
              push_token_updated_at: new Date().toISOString(),
            } as any)
            .eq('user_id', user.id);
        } catch (err) {
          // Column may not exist, that's OK
          console.warn('[Push] Token save skipped:', err);
        }
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('[Push] Registration error:', error);
      });

      // Foreground notification - show as in-app toast only
      PushNotifications.addListener('pushNotificationReceived', async (notification) => {
        console.log('[Push] Foreground notification:', notification);

        const { title, body, data } = notification;

        // Show as local notification if possible
        if (isNative) {
          try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            await LocalNotifications.schedule({
              notifications: [{
                id: Date.now(),
                title: title || 'Life OS',
                body: body || '',
                channelId: data?.channelId || 'general',
                extra: {
                  ...data,
                  route: data?.route || '/',
                },
              }],
            });
          } catch {
            // Silently fail - notification is still received
          }
        }
      });

      // Notification tapped (background/killed)
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
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

      // Register with FCM
      await PushNotifications.register();
      console.log('[Push] Registration initiated');
    } catch (error) {
      console.error('[Push] Setup failed:', error);
    }
  }, [user]);

  // Auto-register when user logs in (delayed for WebView stability)
  useEffect(() => {
    if (!user || !isNative) return;

    const timer = setTimeout(() => {
      registerPush();
    }, 3000); // Increased delay to let WebView fully initialize

    return () => clearTimeout(timer);
  }, [user?.id]);

  return { permissionStatus, token, registerPush };
}
