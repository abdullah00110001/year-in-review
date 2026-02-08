import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Device } from '@capacitor/device';

// Platform detection
export const isNative = Capacitor.isNativePlatform();
export const isAndroid = Capacitor.getPlatform() === 'android';
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isWeb = Capacitor.getPlatform() === 'web';

// Device info
export const getDeviceInfo = async () => {
  try {
    return await Device.getInfo();
  } catch {
    return null;
  }
};

// Initialize Capacitor app
export const initializeCapacitor = async (onBackButton?: () => boolean) => {
  if (!isNative) return;

  try {
    // Hide splash screen after app is ready
    await SplashScreen.hide({ fadeOutDuration: 500 });

    // Configure status bar for Android
    if (isAndroid) {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0f172a' });
    }

    // Handle Android back button
    App.addListener('backButton', ({ canGoBack }) => {
      // Allow custom handler to prevent default
      if (onBackButton && onBackButton()) {
        return;
      }
      
      // Default behavior: go back or exit
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        console.log('[Capacitor] App became active');
        // Trigger any sync or refresh logic here
        window.dispatchEvent(new CustomEvent('app:resume'));
      } else {
        console.log('[Capacitor] App went to background');
        window.dispatchEvent(new CustomEvent('app:pause'));
      }
    });

    // Handle deep links
    App.addListener('appUrlOpen', ({ url }) => {
      console.log('[Capacitor] Deep link:', url);
      // Handle Supabase auth redirects
      if (url.includes('auth/callback')) {
        window.location.href = url;
      }
    });

    console.log('[Capacitor] Initialized successfully');
  } catch (error) {
    console.error('[Capacitor] Initialization error:', error);
  }
};

// App lifecycle utilities
export const exitApp = () => {
  if (isNative) {
    App.exitApp();
  }
};

export const minimizeApp = () => {
  if (isNative) {
    App.minimizeApp();
  }
};

// Show splash screen (useful for reload scenarios)
export const showSplash = async () => {
  if (isNative) {
    await SplashScreen.show({
      autoHide: false,
      fadeInDuration: 300
    });
  }
};

export const hideSplash = async () => {
  if (isNative) {
    await SplashScreen.hide({ fadeOutDuration: 500 });
  }
};
