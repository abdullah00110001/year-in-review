import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { isNative, isAndroid } from './platform';

export interface ShieldSession {
  id: string;
  profileName: string;
  strictnessLevel: 'normal' | 'hard' | 'absolute';
  startedAt: Date;
  scheduledEndAt: Date;
  blockedApps: string[];
  blockedWebsites: string[];
}

export interface UsageStats {
  packageName: string;
  appName: string;
  totalTimeMs: number;
  lastUsed: Date;
}

// Active session state
let activeSession: ShieldSession | null = null;
let sessionNotificationId: number = 99999;

// Start a Shield focus session
export const startShieldSession = async (session: ShieldSession): Promise<boolean> => {
  try {
    activeSession = session;
    
    // Show persistent notification for session
    await LocalNotifications.schedule({
      notifications: [{
        id: sessionNotificationId,
        title: `🛡️ Shield Active: ${session.profileName}`,
        body: `${session.strictnessLevel.toUpperCase()} mode until ${formatTime(session.scheduledEndAt)}`,
        ongoing: true,
        autoCancel: false,
        channelId: 'shield_sessions',
        extra: {
          type: 'shield_session',
          sessionId: session.id,
          strictnessLevel: session.strictnessLevel
        },
        actionTypeId: 'shield_actions'
      }]
    });

    // Haptic feedback for session start
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Success });
    }

    console.log('[NativeShield] Session started:', session.id);
    
    // Dispatch event for web layer
    window.dispatchEvent(new CustomEvent('shield:sessionStarted', { detail: session }));
    
    return true;
  } catch (error) {
    console.error('[NativeShield] Failed to start session:', error);
    return false;
  }
};

// End a Shield session
export const endShieldSession = async (reason?: string): Promise<boolean> => {
  try {
    if (!activeSession) return false;
    
    // Cancel persistent notification
    await LocalNotifications.cancel({ notifications: [{ id: sessionNotificationId }] });
    
    // Show completion notification
    await LocalNotifications.schedule({
      notifications: [{
        id: sessionNotificationId + 1,
        title: '🛡️ Shield Session Complete',
        body: reason || 'Great job staying focused!',
        channelId: 'shield_sessions'
      }]
    });

    const sessionId = activeSession.id;
    activeSession = null;

    // Haptic feedback
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Success });
    }

    console.log('[NativeShield] Session ended:', sessionId);
    
    // Dispatch event for web layer
    window.dispatchEvent(new CustomEvent('shield:sessionEnded', { detail: { sessionId, reason } }));
    
    return true;
  } catch (error) {
    console.error('[NativeShield] Failed to end session:', error);
    return false;
  }
};

// Log bypass attempt (for discipline score)
export const logBypassAttempt = async (
  attemptType: 'app_switch' | 'notification_dismiss' | 'settings_access' | 'uninstall_attempt',
  details?: Record<string, any>
): Promise<void> => {
  if (!activeSession) return;

  console.log('[NativeShield] Bypass attempt:', attemptType, details);
  
  // Warning haptic
  if (isNative) {
    await Haptics.notification({ type: NotificationType.Warning });
  }

  // Dispatch event for web layer to log
  window.dispatchEvent(new CustomEvent('shield:bypassAttempt', {
    detail: {
      sessionId: activeSession.id,
      attemptType,
      details,
      timestamp: new Date().toISOString()
    }
  }));
};

// Check if an app should be blocked
export const shouldBlockApp = (packageName: string): boolean => {
  if (!activeSession) return false;
  
  return activeSession.blockedApps.some(app => 
    packageName.toLowerCase().includes(app.toLowerCase())
  );
};

// Check if a website should be blocked
export const shouldBlockWebsite = (url: string): boolean => {
  if (!activeSession) return false;
  
  const hostname = extractHostname(url);
  
  return activeSession.blockedWebsites.some(site => {
    // Handle wildcards
    if (site.startsWith('*')) {
      return hostname.includes(site.replace('*', ''));
    }
    return hostname.includes(site);
  });
};

// Get active session
export const getActiveSession = (): ShieldSession | null => activeSession;

// Check session time remaining
export const getSessionTimeRemaining = (): number | null => {
  if (!activeSession) return null;
  
  const now = new Date().getTime();
  const end = activeSession.scheduledEndAt.getTime();
  const remaining = end - now;
  
  return remaining > 0 ? remaining : 0;
};

// Emergency bypass (requires confirmation for hard/absolute modes)
export const requestEmergencyBypass = async (
  confirmationCallback: () => Promise<boolean>
): Promise<boolean> => {
  if (!activeSession) return false;
  
  if (activeSession.strictnessLevel === 'absolute') {
    // Absolute mode: No bypass allowed
    console.log('[NativeShield] Emergency bypass denied - Absolute mode');
    return false;
  }
  
  if (activeSession.strictnessLevel === 'hard') {
    // Hard mode: Requires confirmation
    const confirmed = await confirmationCallback();
    if (!confirmed) return false;
    
    // Log the bypass
    await logBypassAttempt('settings_access', { type: 'emergency_bypass' });
  }
  
  // End the session
  return await endShieldSession('Emergency bypass used');
};

// Initialize Shield notification channel (Android)
export const initializeShieldChannel = async () => {
  if (!isAndroid) return;
  
  try {
    await LocalNotifications.createChannel({
      id: 'shield_sessions',
      name: 'Shield Focus Sessions',
      description: 'Active focus session notifications',
      importance: 4, // High
      visibility: 1,
      vibration: false,
      lights: true,
      lightColor: '#22c55e'
    });
    
    // Register action types
    await LocalNotifications.registerActionTypes({
      types: [{
        id: 'shield_actions',
        actions: [
          {
            id: 'view_session',
            title: 'View Session'
          },
          {
            id: 'extend_session',
            title: 'Extend +15min'
          }
        ]
      }]
    });
    
    console.log('[NativeShield] Channel created');
  } catch (error) {
    console.error('[NativeShield] Channel creation failed:', error);
  }
};

// Listen for Shield notification actions
export const setupShieldListeners = (
  onViewSession: () => void,
  onExtendSession: () => void
) => {
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    if (action.notification.extra?.type === 'shield_session') {
      switch (action.actionId) {
        case 'view_session':
          onViewSession();
          break;
        case 'extend_session':
          onExtendSession();
          break;
      }
    }
  });
};

// Utility functions
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const extractHostname = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

// Get mock usage stats (would need native plugin for real data)
export const getUsageStats = async (days: number = 7): Promise<UsageStats[]> => {
  // This would require a custom Capacitor plugin to access UsageStatsManager
  // For now, return empty array - web layer uses its own tracking
  console.log('[NativeShield] Usage stats requested for', days, 'days');
  return [];
};
