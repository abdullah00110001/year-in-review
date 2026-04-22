
## Core problems found

1. **The app identity is still wrong everywhere**
   - Your final package should be `com.myfileos.app`.
   - The codebase is still using `com.mylifeos.app` in:
     - `android/app/build.gradle`
     - `capacitor.config.ts`
     - `capacitor.config.js`
     - `AndroidManifest.xml`
     - `strings.xml`
     - Java package folders and class declarations
     - `src/hooks/useAuth.tsx`
     - multiple native Shield/Rise files
   - This is the biggest structural problem. After `npx cap sync android`, Capacitor expects one app identity, while Java/manifest/deep link/plugin references still point to another. That mismatch is a classic cause of “installs fine, opens, then crashes”.

2. **There is a real build error in `src/utils/permissions.ts`**
   - `App.openUrl(...)` does not exist on Capacitor `AppPlugin`.
   - That is why TypeScript is failing now.
   - These functions need either:
     - a proper native plugin / Android intent bridge, or
     - a safe supported Capacitor alternative.

3. **Startup error handling was made unsafe**
   - `src/App.tsx` now adds global `window.addEventListener('error'...)` and `unhandledrejection` listeners that show blocking `alert(...)`.
   - `src/main.tsx` already has global error listeners.
   - On Android WebView, these extra alert-based handlers can trap startup errors, create loops, and make the app feel like it “crashes” or freezes instead of failing gracefully.

4. **Shield/Rise native wiring is incomplete and partly fake**
   - `AndroidManifest.xml` currently has Shield native components disabled with `android:enabled="false"`.
   - `src/components/shield/ShieldSettings.tsx` uses nonexistent `window.capacitor?.UsageStatsManager`, `window.capacitor?.PowerManager`, and `window.capacitor?.App?.openUrl(...)`.
   - So Shield is not fully connected to native Android yet.
   - This is not the main launch-crash root cause, but it is a real implementation problem.

5. **The current package migration was never completed**
   - There is **no** `android/app/src/main/java/com/myfileos/app/...` tree right now.
   - The whole native source still lives under `com/mylifeos/app`.
   - That means the migration to your final package was only partial and left the app in an inconsistent state.

6. **This is not an env-variable crash**
   - I checked `src/integrations/supabase/client.ts`.
   - Supabase URL and publishable key are hardcoded there, so the launch crash is not caused by missing `VITE_SUPABASE_*` variables in this project.

---

## Permanent fix plan

### 1) Finish the package migration completely
I will make the app use **only** `com.myfileos.app` across the whole project.

Files/areas to update:
- `android/app/build.gradle`
- `capacitor.config.ts`
- `capacitor.config.js`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/res/values/strings.xml`
- `src/hooks/useAuth.tsx`
- all native Java package declarations/imports
- any hardcoded fully-qualified class names
- Proguard rules
- any remaining deep-link/custom scheme references

Native source tree to move:
```text
android/app/src/main/java/com/mylifeos/app/...
→
android/app/src/main/java/com/myfileos/app/...
```

This includes:
- `MainActivity.java`
- `plugins/*`
- `shield/*`
- `shield/core/*`

This is the main permanent fix for both:
- build inconsistency
- install-then-crash behavior

---

### 2) Fix the current TypeScript build blocker
I will replace `src/utils/permissions.ts` usage of unsupported `App.openUrl(...)`.

Plan:
- remove invalid `App.openUrl(...)` calls
- route these settings actions through a supported native pathway
- if needed, add/extend a small Capacitor-native Android helper so:
  - Accessibility settings opens correctly
  - Usage Access settings opens correctly
  - Device Admin / Security settings opens correctly

This will fix the current build failure cleanly instead of patching around types.

---

### 3) Remove unsafe global crash-alert code
I will clean startup error handling so it does not create alert loops or freeze the app.

Changes:
- remove the extra `window.addEventListener('error'...)` and `unhandledrejection` alert handlers from `src/App.tsx`
- keep a single safe error-handling strategy
- preserve logging, but avoid blocking `alert()` during app boot
- let `ErrorBoundary` handle render failures in a controlled way

This is important because the current setup can make minor errors look like a hard app crash.

---

### 4) Harden native startup flow
I will review and stabilize the native launch path:

- `MainActivity.java`
  - ensure startup does not repeatedly force heavy permission flows on every resume
  - keep permission prompts safe and non-recursive
  - avoid launch-time instability from aggressive settings dialogs

- `src/main.tsx`
  - keep service worker cleanup only for native WebView safety
  - ensure native boot does not depend on web-only features

- `src/hooks/useCapacitor.ts`
  - verify initialization is resilient if optional plugins are unavailable
  - keep plugin setup non-blocking

Goal: app should open reliably first, then request permissions progressively.

---

### 5) Repair all package-dependent native references
I found several places that will break once the package changes unless updated together.

Examples:
- `ShieldPermissionHelper.ACCESSIBILITY_SERVICE_NAME`
- `ShieldService` using `Class.forName("com.mylifeos.app.MainActivity")`
- `RiseAlarmReceiver` imports `com.mylifeos.app.MainActivity`
- manifest receiver/service names
- OAuth callback scheme strings

I will update these all in one pass so there are no leftover references.

---

### 6) Reconnect Shield settings to real native capabilities
This is not the first crash fix, but it belongs to the same cleanup because there are existing broken calls.

I will:
- remove fake `window.capacitor?...` checks from `ShieldSettings.tsx`
- use real plugin-backed permission checks instead
- align the UI with what native Android can actually report

This will stop hidden runtime errors when users open Shield screens.

---

### 7) Decide whether Shield components should stay disabled or be re-enabled safely
Right now the manifest disables:
- `ShieldService`
- `ShieldAccessibilityService`
- `ShieldDeviceAdminReceiver`
- `ShieldBlockActivity`

I will not blindly turn these all on at boot.
Instead I will:
- re-enable only what is safe and required
- gate activation through proper permission flow
- ensure the app launches normally even if Shield permissions are not granted yet

This avoids trading one crash for another.

---

## Files most likely to be changed

```text
android/app/build.gradle
capacitor.config.ts
capacitor.config.js
android/app/src/main/AndroidManifest.xml
android/app/src/main/res/values/strings.xml
android/app/src/main/java/com/myfileos/app/MainActivity.java
android/app/src/main/java/com/myfileos/app/plugins/RiseAlarmPlugin.java
android/app/src/main/java/com/myfileos/app/plugins/RiseAlarmReceiver.java
android/app/src/main/java/com/myfileos/app/plugins/AppUpdatePlugin.java
android/app/src/main/java/com/myfileos/app/plugins/ShieldPlugin.java
android/app/src/main/java/com/myfileos/app/shield/*
android/app/src/main/java/com/myfileos/app/shield/core/*
android/app/proguard-rules.pro
src/hooks/useAuth.tsx
src/utils/permissions.ts
src/App.tsx
src/components/shield/ShieldSettings.tsx
```

---

## Validation plan after the fix

1. TypeScript build passes.
2. Capacitor Android sync completes cleanly.
3. No remaining `com.mylifeos.app` references remain.
4. Fresh APK installs successfully.
5. App opens without immediate crash.
6. Auth deep link still matches final package:
   - `com.myfileos.app://callback`
7. Rise native plugin loads.
8. Shield screens open without runtime permission-call errors.

---

## Technical note
The primary permanent root cause is **not one single bug**. It is a **broken migration state**:
- final package requested: `com.myfileos.app`
- actual codebase state: still mostly `com.mylifeos.app`
- plus unsupported Capacitor API usage
- plus unsafe startup error handlers

Fixing those together is the correct permanent solution.
