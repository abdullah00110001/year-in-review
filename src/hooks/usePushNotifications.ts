import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { isNative } from '@/lib/capacitor/platform';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      const permResult = await PushNotifications.checkPermissions();
      setPermissionStatus(permResult.receive as PushPermissionStatus);

      // Request if needed
      if (permResult.receive === 'prompt' || permResult.receive === 'denied') {
        const requestResult = await PushNotifications.requestPermissions();
        setPermissionStatus(requestResult.receive as PushPermissionStatus);

        if (requestResult.receive !== 'granted') {
          console.warn('[Push] Permission denied');
          toast.error('Notifications Disabled', {
            description: 'Enable notifications in Settings to receive prayer reminders, daily inspiration, and mentor messages.',
            duration: 8000,
          });
          return;
        }
      }

      if (permResult.receive !== 'granted') {
        const reqAgain = await PushNotifications.requestPermissions();
        if (reqAgain.receive !== 'granted') return;
      }

      // Remove old listeners to avoid duplicates
      await PushNotifications.removeAllListeners();

      // Listen for token
      PushNotifications.addListener('registration', async (tokenData) => {
        console.log('[Push] FCM token received:', tokenData.value.substring(0, 20) + '...');
        setToken(tokenData.value);
        registeredRef.current = true;

        // Store token in profiles table
        try {
          await supabase
            .from('profiles')
            .update({
              push_token: tokenData.value,
              push_token_updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
          console.log('[Push] Token saved to profiles');
        } catch (err) {
          console.error('[Push] Failed to save token:', err);
        }
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('[Push] Registration error:', error);
      });

      // Foreground notification - show local notification with big picture
      PushNotifications.addListener('pushNotificationReceived', async (notification) => {
        console.log('[Push] Foreground notification:', notification);

        const { title, body, data } = notification;
        const imageUrl = data?.imageUrl || data?.image || data?.bigPicture;

        // Show as local notification for big picture support
        if (isNative) {
          try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            await LocalNotifications.schedule({
              notifications: [{
                id: Date.now(),
                title: title || 'Life OS',
                body: body || '',
                channelId: data?.channelId || 'general',
                largeIcon: imageUrl || undefined,
                extra: {
                  ...data,
                  imageUrl,
                  route: data?.route || '/',
                },
              }],
            });
          } catch {
            // Fallback: in-app toast
            toast(title || 'Life OS', { description: body });
          }
        }
      });

      // Notification tapped (background/killed)
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[Push] Notification tapped:', action);
        const data = action.notification.data;
        const route = data?.route || data?.url;

        if (route) {
          // Small delay to let app initialize if cold-started
          setTimeout(() => {
            window.location.href = route;
          }, 500);
        } else {
          // Route based on type
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

  // Auto-register when user logs in
  useEffect(() => {
    if (!user || !isNative) return;

    // Delay to let WebView fully initialize
    const timer = setTimeout(() => {
      registerPush();
    }, 2000);

    return () => clearTimeout(timer);
  }, [user?.id]);

  return { permissionStatus, token, registerPush };
}
