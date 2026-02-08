# Life OS - Android Conversion Guide

## App Configuration
- **App ID:** `app.lifeos.com`
- **App Name:** Life OS
- **Target SDK:** 34+

## Prerequisites
1. Android Studio (latest version)
2. Node.js 18+
3. JDK 17+

## Setup Instructions

### 1. Clone & Install
```bash
git clone <your-repo>
cd <project>
npm install
```

### 2. Initialize Capacitor (Already Done)
The project is already configured with Capacitor. The config is in `capacitor.config.ts`.

### 3. Add Android Platform
```bash
npx cap add android
```

### 4. Build Web Assets
```bash
npm run build
```

### 5. Sync to Android
```bash
npx cap sync android
```

### 6. Open in Android Studio
```bash
npx cap open android
```

## Native Permissions Required

Add these to `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Alarms (Rise) -->
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />

<!-- Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Shield (Optional - Usage Stats) -->
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" 
    tools:ignore="ProtectedPermissions" />

<!-- Foreground Service for Shield -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />

<!-- Internet -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Notification Channels

The app creates these notification channels automatically:

| Channel ID | Name | Priority | Use |
|------------|------|----------|-----|
| `rise_alarms` | Rise Alarms | MAX | Wake-up alarms |
| `group_wake` | Group Wake Signals | MAX | Accountability alerts |
| `shield_sessions` | Shield Focus Sessions | HIGH | Active focus status |
| `shield_reminders` | Shield Reminders | HIGH | Focus reminders |
| `general` | General Notifications | DEFAULT | App updates |

## Native Bridge Architecture

```
src/lib/capacitor/
├── index.ts              # Central export
├── platform.ts           # Platform detection & init
├── permissions.ts        # Permission management
├── nativeAlarm.ts        # Rise alarm scheduling
├── nativeShield.ts       # Shield session management
└── nativeNotifications.ts # Push & local notifications
```

## Development Mode

For hot-reload during development, uncomment the server URL in `capacitor.config.ts`:

```typescript
server: {
  url: 'https://96d521a5-41fd-41e1-a1b5-fb9b8ee08e10.lovableproject.com?forceHideBadge=true',
  cleartext: true,
}
```

## Building for Release

### 1. Generate Signed APK
In Android Studio: Build > Generate Signed Bundle/APK

### 2. Play Store Checklist
- [ ] Privacy Policy URL added
- [ ] Data Safety form completed
- [ ] Screenshots uploaded
- [ ] App signing by Google enabled
- [ ] Target SDK 34+
- [ ] 64-bit support enabled

## Play Store Compliance Notes

### Shield Module
- Uses Usage Stats API (not Accessibility Service)
- Emergency bypass always available
- Session has maximum duration
- Never blocks Settings or Phone apps
- User always has control

### Rise Module
- Uses standard AlarmManager API
- Emergency stop visible on alarm screen
- Respects Do Not Disturb settings
- Snooze always available
- Volume follows user preferences

## Troubleshooting

### Alarms not firing
1. Check battery optimization settings
2. Verify exact alarm permission granted
3. Test on physical device (emulator is unreliable)

### Push notifications not working
1. Check FCM configuration in `google-services.json`
2. Verify `POST_NOTIFICATIONS` permission on Android 13+
3. Check Supabase push subscription saved

### White screen on launch
1. Verify splash screen resources exist
2. Check `android/app/src/main/res/drawable/splash.xml`
3. Ensure web assets are synced (`npx cap sync`)

## Support

For issues, check:
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Capacitor Community Plugins](https://github.com/capacitor-community)
