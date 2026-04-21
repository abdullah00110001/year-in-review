import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * ইউজারকে ফোনের Accessibility Settings এ নিয়ে যায়।
 * Shield ফিচারের জন্য এটা চালু করা মাস্ট।
 */
export const openAccessibilitySettings = async () => {
  if (Capacitor.getPlatform() === 'android') {
    await App.openUrl({ url: 'android.settings.ACCESSIBILITY_SETTINGS' });
  } else {
    alert('This feature is only available on Android.');
  }
};

/**
 * ইউজারকে ফোনের Security Settings এ নিয়ে যায়।
 * ওখান থেকে Device Admin চালু করতে পারবে।
 */
export const openDeviceAdminSettings = async () => {
  if (Capacitor.getPlatform() === 'android') {
    await App.openUrl({ url: 'android.settings.SECURITY_SETTINGS' });
  } else {
    alert('This feature is only available on Android.');
  }
};

/**
 * Usage Stats পারমিশনের জন্য Settings এ নিয়ে যায়।
 */
export const openUsageAccessSettings = async () => {
    if (Capacitor.getPlatform() === 'android') {
        await App.openUrl({ url: 'android.settings.USAGE_ACCESS_SETTINGS' });
    }
};