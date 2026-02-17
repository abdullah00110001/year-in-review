import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean | null;
  created_at: string;
  metadata?: unknown;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(true);

  // Check browser notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setNotifications((data as AppNotification[]) || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as AppNotification;
          setNotifications((prev) => [newNotification, ...prev].slice(0, 20));
          setUnreadCount((prev) => prev + 1);
          
          // Show browser notification if permitted (only when tab is not visible)
          if (document.visibilityState !== 'visible') {
            showBrowserNotification(newNotification.title, newNotification.message);
          }
          
          // Always show in-app toast
          toast(newNotification.title, {
            description: newNotification.message.slice(0, 100),
            duration: 6000,
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Notifications] Realtime channel error, will retry...');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Request browser notification permission
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        // Update profile to enable notifications
        if (user) {
          await supabase
            .from('profiles')
            .update({ notifications_enabled: true })
            .eq('user_id', user.id);
        }
        toast.success('Notifications enabled!');
        return true;
      } else if (permission === 'denied') {
        toast.error('Notification permission denied');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Show browser notification
  const showBrowserNotification = (title: string, body: string, icon?: string) => {
    if (permissionStatus !== 'granted') return;
    if (!('Notification' in window)) return;

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'oporajeyo-notification',
        requireInteraction: false,
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Disable notifications
  const disableNotifications = async () => {
    if (user) {
      await supabase
        .from('profiles')
        .update({ notifications_enabled: false })
        .eq('user_id', user.id);
    }
    toast.success('Notifications disabled');
  };

  return {
    notifications,
    unreadCount,
    loading,
    permissionStatus,
    requestPermission,
    showBrowserNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    disableNotifications,
    refetch: fetchNotifications,
  };
}

// Utility function to send notification to a user (for admin use)
export async function sendNotificationToUser(
  userId: string,
  title: string,
  message: string,
  type: string = 'general',
  metadata: Record<string, any> = {}
) {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type,
      metadata,
    });

  if (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}
