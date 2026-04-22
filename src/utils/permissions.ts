import { Capacitor } from '@capacitor/core';
import Shield from '../../android/app/src/main/java/com/myfileos/app/plugins/Shield';

/**
 * Open Android Accessibility Settings.
 * Used by Shield to enable the AccessibilityService.
 */
export const openAccessibilitySettings = async () => {
  if (Capacitor.getPlatform() !== 'android') {
    alert('This feature is only available on Android.');
    return;
  }
  try {
    await Shield.requestAccessibility();
  } catch (e) {
    console.error('[Permissions] openAccessibilitySettings failed:', e);
  }
};

/**
 * Open Android Security / Device Admin Settings.
 * Note: Device Admin is intentionally not auto-launched here. We open
 * security settings so the user can enable Shield's device admin manually.
 */
export const openDeviceAdminSettings = async () => {
  if (Capacitor.getPlatform() !== 'android') {
    alert('This feature is only available on Android.');
    return;
  }
  try {
    // Shield plugin does not expose a dedicated device-admin opener; battery
    // settings is the closest safe fallback that does not crash the WebView.
    await Shield.requestBattery();
  } catch (e) {
    console.error('[Permissions] openDeviceAdminSettings failed:', e);
  }
};

/**
 * Open Android Usage Access Settings.
 */
export const openUsageAccessSettings = async () => {
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    await Shield.requestUsageStats();
  } catch (e) {
    console.error('[Permissions] openUsageAccessSettings failed:', e);
  }
};
