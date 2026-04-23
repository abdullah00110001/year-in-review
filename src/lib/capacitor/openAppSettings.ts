import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { openNativeAppSettings } from '@/lib/capacitor/riseAlarmBridge';

/**
 * Opens the OS-level app settings page so the user can manually
 * grant a permission that they previously denied.
 *
 * Uses dynamic imports so missing optional plugins never break the bundle.
 */
export async function openAppSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    toast.info('Open your browser settings to manage permissions');
    return;
  }

  const platform = Capacitor.getPlatform();

  if (platform === 'android') {
    try {
      await openNativeAppSettings();
      return;
    } catch (e) {
      console.warn('[openAppSettings] Native Android settings failed:', e);
    }
  }

  // Strategy 1: Use Browser plugin with platform-specific URI
  try {
    const { Browser } = await import('@capacitor/browser');
    if (platform === 'ios') {
      await Browser.open({ url: 'app-settings:' });
      return;
    }
  } catch (e) {
    console.warn('[openAppSettings] Browser open failed:', e);
  }

  toast.error('Could not open settings. Please open them manually from your device.');
}

/**
 * Show a standardized "permission denied" toast with an
 * action button that opens app settings.
 */
export function showPermissionDeniedToast(opts: {
  feature: string; // e.g. "Notifications", "Camera"
  reason: string;  // why the app needs it
}) {
  toast.error(`${opts.feature} permission denied`, {
    description: opts.reason,
    duration: 8000,
    action: {
      label: 'Open Settings',
      onClick: () => { openAppSettings(); },
    },
  });
}
