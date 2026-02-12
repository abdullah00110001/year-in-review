import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lifeos.com',
  appName: 'Life OS',
  webDir: 'dist',
  server: {
    // DEV MODE: uncomment url to load from Lovable preview
    // PRODUCTION: comment out url so app loads from local dist/
//    url: 'https://life-os-24.netlify.app',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'nxvtoviyldffcqbtgriw.supabase.co',
      '*.supabase.co',
      '*.lovableproject.com',
      '*.lovable.app'
    ]
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a'
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#0ea5e9',
      sound: 'alarm_sound.wav'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    backgroundColor: '#0f172a',
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f172a',
    scheme: 'Life OS'
  }
};

export default config;
