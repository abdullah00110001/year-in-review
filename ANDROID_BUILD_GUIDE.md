# Android Project Setup for Capacitor

This document provides the complete setup instructions for building the Android APK.

## Quick Start Commands

```bash
# 1. Clone and install dependencies
git clone <your-repo-url>
cd <project-folder>
npm install

# 2. Build the web app
npm run build

# 3. Add Android platform
npx cap add android

# 4. Sync changes
npx cap sync android

# 5. Open in Android Studio
npx cap open android

# OR run directly on device/emulator
npx cap run android
```

## Production Build Steps

### Step 1: Update capacitor.config.ts for Production

```typescript
// Comment out the development server URL
server: {
  // url: 'https://...lovableproject.com?forceHideBadge=true',
  // cleartext: true,
  
  // Use bundled assets
  androidScheme: 'https'
},
```

### Step 2: Generate Signed APK

In Android Studio:
1. Build → Generate Signed Bundle / APK
2. Choose APK
3. Create new keystore or use existing
4. Select release build variant
5. Build

Or via command line:
```bash
cd android
./gradlew assembleRelease
```

## Required Android Permissions

Add these to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Internet (required for Supabase) -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Notifications -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    
    <!-- Alarms - Critical for Rise -->
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    
    <!-- Shield - Usage Stats (requires Settings access) -->
    <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS"
        tools:ignore="ProtectedPermissions" />
    
    <!-- Foreground Service for Shield -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    
    <!-- Keep app running -->
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
    
    <application
        android:allowBackup="true"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <!-- Main Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:showWhenLocked="true"
            android:turnScreenOn="true">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <!-- Deep linking -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="lifeos" />
            </intent-filter>
        </activity>
        
        <!-- Boot Receiver for Rise Alarms -->
        <receiver
            android:name=".BootReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
            </intent-filter>
        </receiver>
        
        <!-- Alarm Receiver -->
        <receiver
            android:name=".AlarmReceiver"
            android:enabled="true"
            android:exported="false" />
        
        <!-- Foreground Service for Shield -->
        <service
            android:name=".ShieldService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="specialUse" />
            
    </application>
</manifest>
```

## App Icons

Place your icons in `android/app/src/main/res/`:`

```
mipmap-hdpi/ic_launcher.png (72x72)
mipmap-mdpi/ic_launcher.png (48x48)
mipmap-xhdpi/ic_launcher.png (96x96)
mipmap-xxhdpi/ic_launcher.png (144x144)
mipmap-xxxhdpi/ic_launcher.png (192x192)
```

## Notification Icons

Place small notification icon in:
```
drawable/ic_stat_icon.png (24x24, white with transparent background)
```

## Alarm Sound

Place alarm sound file in:
```
android/app/src/main/res/raw/alarm_sound.wav
```

## Splash Screen

Configure in `android/app/src/main/res/values/styles.xml`:

```xml
<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">#0f172a</item>
    <item name="windowSplashScreenAnimatedIcon">@drawable/splash</item>
    <item name="windowSplashScreenAnimationDuration">200</item>
    <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
</style>
```

## OEM Battery Optimization

For Xiaomi, Oppo, Vivo devices, guide users to:
1. Settings → Battery → App Battery Saver → Select Life OS → No restrictions
2. Settings → Apps → Life OS → Battery → Unrestricted

## ProGuard Rules (for release builds)

Add to `android/app/proguard-rules.pro`:

```proguard
# Capacitor
-keep class com.getcapacitor.** { *; }
-keep class app.lifeos.** { *; }

# Supabase
-keep class io.supabase.** { *; }

# Keep notification classes
-keep class * extends android.app.Service
-keep class * extends android.content.BroadcastReceiver
```

## Testing Checklist

- [ ] App installs successfully
- [ ] Splash screen shows correctly
- [ ] Login/Authentication works
- [ ] Daily Input saves data
- [ ] Rise alarms fire when app is closed
- [ ] Rise alarms fire after device reboot
- [ ] Shield session starts with notification
- [ ] Push notifications received
- [ ] Deep links work
- [ ] Back button behavior is correct
- [ ] App resumes correctly from background

## Play Store Requirements

1. Target SDK: 34 (Android 14)
2. Privacy Policy URL in listing
3. Data Safety declaration
4. App Access instructions for reviewers
5. Screenshots for all required sizes
6. Feature graphic (1024x500)

## Troubleshooting

### Alarms not firing
- Check battery optimization settings
- Verify SCHEDULE_EXACT_ALARM permission
- Check if app is in "protected apps" list

### Notifications not showing
- Check POST_NOTIFICATIONS permission (Android 13+)
- Verify notification channels are created
- Check if notifications are blocked in system settings

### Build errors
- Run `npx cap sync` after any web changes
- Clean build: `cd android && ./gradlew clean`
- Check for SDK version mismatches
