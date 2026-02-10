

# Fix Blank Page + Native App Flow

## Problem

The Android APK shows a **blank dark screen** (as seen in your screenshot) and then redirects to `lovable.dev/auth-bridge`. This happens because:

1. **`capacitor.config.ts`** has `server.url` pointing to the Lovable preview URL, which requires Lovable's own authentication (not your app's auth)
2. The **Index page** (landing page) shows a marketing website, but on the native app it should skip straight to **Login/Signup**
3. The native app is loading a remote URL instead of the bundled app files

## Solution

### Step 1: Fix Capacitor Config (Production Mode)

Switch from remote URL to local bundled files. The `server.url` line will be removed so the app loads from `dist/` (the built web assets inside the APK). Add `androidScheme: 'https'` for proper Supabase auth.

### Step 2: Native App Flow - Splash then Auth then Dashboard

Update `Index.tsx` to detect if running as a native Capacitor app using `isNative` from the platform module. If native, immediately redirect to `/auth` (skip the landing page entirely).

Flow:
```text
App Opens --> Native Splash (2s) --> /auth (Login/Signup) --> /dashboard
```

### Step 3: Fix Google OAuth for Native

Google OAuth redirects won't work inside a WebView. Update `useAuth.tsx` so `signInWithGoogle` uses the correct redirect URL scheme for native apps (`app.lifeos.com://` deep link) instead of `window.location.origin`.

### Step 4: Auth Race Condition Fix

Apply the proven pattern from the knowledge base -- separate initial auth load from ongoing auth changes to prevent blank screen during session restore.

---

## Technical Details

### Files to modify:

1. **`capacitor.config.ts`** -- Remove `server.url`, enable `androidScheme: 'https'`
2. **`src/pages/Index.tsx`** -- Add `isNative` check to redirect to `/auth` immediately
3. **`src/hooks/useAuth.tsx`** -- Fix auth race condition (use `isMounted` pattern), fix Google OAuth redirect for native
4. **`src/components/ProtectedRoute.tsx`** -- Ensure no flash of blank screen during auth init
5. **`src/contexts/CapacitorContext.tsx`** -- Improve the loading screen to show the branded splash instead of generic spinner


You are a senior system architect, SaaS product designer, and mobile-native engineer.

Your task is to DESIGN, VERIFY, and HARDEN a COMPLETE “Life OS” system
with a powerful Admin Panel, Shield (focus protection), and Rise (force-action alarm system).

This system already exists.
Your responsibility is to UPGRADE it to PRODUCTION-GRADE with ZERO broken flows.

━━━━━━━━━━━━━━━━━━━━━━
CORE REQUIREMENT
━━━━━━━━━━━━━━━━━━━━━━
Everything must work:
- On Web
- On Native Mobile App (Capacitor)
- With same logic, same data, same results

No partial flow.
No visual-only feature.
Every feature MUST:
- Start correctly
- Execute correctly
- End correctly
- Persist correctly in database

━━━━━━━━━━━━━━━━━━━━━━
SYSTEM MODULES (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━
1. Life OS Core (years, goals, habits, tasks)
2. Admin Panel (control & analytics)
3. Shield (focus & distraction blocking)
4. Rise (alarm & forced action system)
5. Auth & Session system
6. Database & sync layer
7. Native background handling

━━━━━━━━━━━━━━━━━━━━━━
SHIELD MODULE (StayFocusd-style, HARD MODE)
━━━━━━━━━━━━━━━━━━━━━━
Shield is a LIFE PROTECTION SYSTEM, not just a blocker.

Features:
- App & website blocking rules
- Time-based focus locks
- Task-based unlock rules
- Habit-based unlock rules
- Emergency override (cooldown + penalty)
- Shield schedules (work, deep focus, night)
- Progressive restriction (soft → strict)
- Distraction score per user

Admin Control:
- Global shield templates
- Shield strictness levels
- Override limits
- Abuse detection
- Shield effectiveness analytics

Native Requirements:
- Works in background
- Survives app minimize
- Cannot be bypassed easily
- Restores state after restart

━━━━━━━━━━━━━━━━━━━━━━
RISE MODULE (Alarmy-style, FORCE EXECUTION)
━━━━━━━━━━━━━━━━━━━━━━
Rise alarms must be UNIGNORABLE.

Features:
- Smart alarms (time + context)
- Mission-based dismissal:
  - Math
  - Habit confirmation
  - Physical action confirmation
- Escalation logic:
  - Sound
  - Vibration
  - Screen lock
- Missed alarm punishment logic
- Alarm chains (wake → task → habit)

Native Requirements:
- Works when app closed
- Works on locked screen
- Background execution
- Battery-optimized but reliable
- Exact timing accuracy

Admin Control:
- Alarm difficulty templates
- Escalation rules
- Silent abuse detection
- Alarm success analytics
- User alarm reliability score

━━━━━━━━━━━━━━━━━━━━━━
ADMIN PANEL (LIFE OS CONTROL ROOM)
━━━━━━━━━━━━━━━━━━━━━━
Admin must control:

- Users & roles
- Life data integrity
- Shield & Rise rules
- Premium depth
- Feature flags
- Ethical limits
- Global emergencies

Admin dashboards:
- Shield success vs failure
- Rise alarm completion rates
- Productivity before vs after Shield/Rise
- Burnout & overload detection
- Feature harm indicators

━━━━━━━━━━━━━━━━━━━━━━
AUTH & SESSION (WEB + NATIVE SAFE)
━━━━━━━━━━━━━━━━━━━━━━
Requirements:
- No blank screen ever
- Session restore before routing
- Separate initial auth load vs live changes
- Native-safe OAuth with deep links
- Secure token storage
- Offline-safe auth state

━━━━━━━━━━━━━━━━━━━━━━
DATABASE (NON-NEGOTIABLE)
━━━━━━━━━━━━━━━━━━━━━━
Every feature MUST persist.

Required entities:
- Users
- Life timelines (year → day)
- Goals, habits, tasks
- Shield rules & events
- Rise alarms & completions
- Admin actions
- Analytics events

Rules:
- No client-only state
- No silent failure
- Every action logged
- Recoverable state after crash

━━━━━━━━━━━━━━━━━━━━━━
FLOW TESTING (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━
For EVERY feature, generate and verify:

1. Start condition
2. User interaction
3. System reaction
4. Native background behavior
5. App close & reopen
6. Data persistence check
7. Final state validation

Test flows for:
- New user
- Returning user
- Offline user
- Alarm missed
- Shield override attempt
- App killed & restarted

━━━━━━━━━━━━━━━━━━━━━━
WEB + NATIVE PARITY RULE
━━━━━━━━━━━━━━━━━━━━━━
If a feature exists:
- It must behave identically on Web & Native
- Differences must be documented
- No native-only logic without fallback
- No web-only shortcuts

━━━━━━━━━━━━━━━━━━━━━━
FAILURE & RECOVERY
━━━━━━━━━━━━━━━━━━━━━━
System must handle:
- Missed alarms
- Shield bypass attempts
- Burnout signals
- User rage-quit moments
- Data corruption
- Network loss

Recovery:
- Grace modes
- Data repair
- Confidence rebuild
- No punishment loops

━━━━━━━━━━━━━━━━━━━━━━
FINAL OUTPUT REQUIRED
━━━━━━━━━━━━━━━━━━━━━━
Produce a FULL, VERIFIED blueprint including:

- System architecture
- Admin feature map
- Shield & Rise logic
- Native constraints handling
- Database schema
- Auth flow
- Edge-case handling
- End-to-end flow tests

This system must feel like:
“A strict but humane Life Operating System that cannot be cheated, but never harms the user.”