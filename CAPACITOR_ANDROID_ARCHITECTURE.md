# Life OS – Capacitor Android Architecture
## Complete Native Conversion Blueprint

---

## 📋 Table of Contents

1. [Philosophy & Core Principles](#1-philosophy--core-principles)
2. [Web vs Native Responsibility Matrix](#2-web-vs-native-responsibility-matrix)
3. [Capacitor Plugin Architecture](#3-capacitor-plugin-architecture)
4. [Rise: Native Alarm System](#4-rise-native-alarm-system)
5. [Shield: Native Blocker System](#5-shield-native-blocker-system)
6. [Permission Strategy](#6-permission-strategy)
7. [Native Feel Without UI Rewrite](#7-native-feel-without-ui-rewrite)
8. [OEM Survival & Edge Cases](#8-oem-survival--edge-cases)
9. [Play Store Compliance](#9-play-store-compliance)
10. [Testing & Release Checklist](#10-testing--release-checklist)
11. [Common Fatal Mistakes](#11-common-fatal-mistakes)

---

## 1. Philosophy & Core Principles

### The Golden Rule

```
┌─────────────────────────────────────────────────────────┐
│                    WEB = BRAIN                          │
│  Decides: Rules, Schedules, UI, State, Logic, Sync      │
├─────────────────────────────────────────────────────────┤
│                   NATIVE = MUSCLE                       │
│  Guarantees: Execution, Reliability, Survival, Enforce  │
└─────────────────────────────────────────────────────────┘
```

### What Web Handles (Unchanged)

| Responsibility | Details |
|---------------|---------|
| UI/UX | All screens, animations, interactions |
| Business Logic | Alarm rules, Shield profiles, Group logic |
| Data Layer | Supabase sync, offline storage, state |
| User Settings | All preferences, schedules, configurations |
| Group Features | Accountability partners, wake signals |
| Analytics | Tracking, insights, reports |

### What Native Handles (New)

| Responsibility | Details |
|---------------|---------|
| Alarm Execution | System-level scheduling, ringing, wake locks |
| Background Services | Foreground service for active sessions |
| App Monitoring | Usage stats API for Shield |
| System Notifications | Channels, heads-up, full-screen intents |
| Device Lifecycle | Boot receiver, app state, battery |
| Blocking Enforcement | Redirect/overlay when blocked app detected |

### Non-Negotiable Rules

❌ Web must NEVER:
- Ring alarms (JavaScript timers die when app is killed)
- Run background timers for blocking
- Expect to survive app kill/reboot
- Handle enforcement directly

✅ Native must ALWAYS:
- Execute scheduled operations regardless of web state
- Survive app kill, reboot, battery saver
- Report status back to web layer
- Provide emergency exits

---

## 2. Web vs Native Responsibility Matrix

### Rise (Alarm System)

| Action | Web Layer | Native Layer |
|--------|-----------|--------------|
| Create alarm | ✅ UI, validation, save to DB | Receives schedule via bridge |
| Store alarm | ✅ Supabase + IndexedDB | Mirrors to SharedPreferences |
| Schedule alarm | Sends to native | ✅ AlarmManager.setExactAndAllowWhileIdle |
| Alarm fires | Notified after | ✅ BroadcastReceiver triggers |
| Ring sound | — | ✅ MediaPlayer with AudioFocus |
| Wake lock | — | ✅ Partial wake lock (30s max) |
| Full-screen UI | — | ✅ Full-screen intent activity |
| Snooze/Dismiss | Receives event | ✅ Handles button actions |
| Group sync | ✅ After dismissal | Provides wake timestamp |
| Escalation | ✅ Decides logic | ✅ Executes vibration/volume |

### Shield (Blocker System)

| Action | Web Layer | Native Layer |
|--------|-----------|--------------|
| Create profile | ✅ UI, rules, save | Receives block list |
| Start session | ✅ Initiates | ✅ Starts foreground service |
| Monitor apps | — | ✅ UsageStatsManager polling |
| Detect violation | — | ✅ Foreground app check |
| Block/redirect | — | ✅ Shows block screen overlay |
| Session timer | — | ✅ Native countdown |
| Emergency exit | ✅ Handles unlock | ✅ Stops service immediately |
| Log events | ✅ Saves to DB | Reports to web |
| Accountability | ✅ Notifies partners | — |

### Notifications

| Type | Web Layer | Native Layer |
|------|-----------|--------------|
| Alarm ringing | — | ✅ MAX priority, full-screen |
| Group wake signal | ✅ Receives push | ✅ Shows heads-up |
| Shield active | — | ✅ Ongoing foreground notification |
| Shield reminder | ✅ Schedules | ✅ Shows at scheduled time |
| Admin feedback | ✅ Receives | ✅ Shows notification |
| Daily reminder | ✅ Schedules | ✅ Local notification |

---

## 3. Capacitor Plugin Architecture

### Plugin Boundary Design

```
┌──────────────────────────────────────────────────────────────┐
│                      CAPACITOR BRIDGE                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │  AlarmPlugin    │  │  ShieldPlugin   │  │ LifecyclePlugin│ │
│  │                 │  │                 │  │              │  │
│  │ • scheduleAlarm │  │ • startSession  │  │ • onBoot     │  │
│  │ • cancelAlarm   │  │ • stopSession   │  │ • onResume   │  │
│  │ • snoozeAlarm   │  │ • updateRules   │  │ • onPause    │  │
│  │ • dismissAlarm  │  │ • getStatus     │  │ • onKill     │  │
│  │ • getScheduled  │  │ • checkPermission│ │              │  │
│  └─────────────────┘  └─────────────────┘  └──────────────┘  │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐                    │
│  │ NotificationPlugin│ │  DevicePlugin   │                    │
│  │                 │  │                 │                    │
│  │ • createChannel │  │ • getBatteryInfo│                    │
│  │ • showNotification│ │ • isIgnoringOpt│                    │
│  │ • showFullScreen│  │ • requestExempt │                    │
│  │ • cancelNotif   │  │ • getOEMInfo    │                    │
│  └─────────────────┘  └─────────────────┘                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Plugin Responsibilities

#### 1. AlarmPlugin (capacitor-alarm-execution)

**Purpose**: Execute alarms at exact times regardless of app/device state

**Native Components**:
- `AlarmReceiver` (BroadcastReceiver) - Receives alarm trigger
- `AlarmService` (ForegroundService) - Handles ringing
- `AlarmActivity` (Activity) - Full-screen alarm UI
- `BootReceiver` (BroadcastReceiver) - Reschedules after reboot

**Methods**:
```
scheduleAlarm(id, time, label, intention, sound, vibration, snoozeLimit)
cancelAlarm(id)
snoozeAlarm(id, minutes)
dismissAlarm(id, feeling)
getScheduledAlarms() → Alarm[]
```

**Events Emitted**:
```
alarmTriggered(id, extra)
alarmDismissed(id, method, feeling)
alarmSnoozed(id, count)
alarmMissed(id)
```

#### 2. ShieldPlugin (capacitor-shield-blocker)

**Purpose**: Monitor and block apps during focus sessions

**Native Components**:
- `ShieldService` (ForegroundService) - Monitors foreground app
- `BlockActivity` (Activity) - Shows when blocked app detected
- `UsageMonitor` (Worker) - Polls usage stats

**Methods**:
```
startSession(profileId, blockedApps, duration, strictness)
stopSession(reason)
extendSession(minutes)
updateBlockList(apps)
getSessionStatus() → SessionStatus
checkUsagePermission() → boolean
requestUsagePermission()
```

**Events Emitted**:
```
sessionStarted(profileId)
sessionEnded(reason, stats)
appBlocked(packageName, timestamp)
bypassAttempted(type)
```

#### 3. LifecyclePlugin (capacitor-lifecycle)

**Purpose**: Handle device lifecycle events

**Native Components**:
- `BootReceiver` - BOOT_COMPLETED receiver
- `AppStateReceiver` - App pause/resume

**Methods**:
```
registerBootReceiver()
getAppState() → 'active' | 'background' | 'killed'
```

**Events Emitted**:
```
deviceBooted()
appResumed()
appPaused()
appKilled()
```

#### 4. NotificationPlugin (extends @capacitor/local-notifications)

**Purpose**: Native notification channels and full-screen intents

**Channels Created**:
| Channel ID | Name | Priority | Use |
|------------|------|----------|-----|
| `rise_alarms` | Rise Alarms | MAX | Wake-up alarms |
| `rise_group` | Group Wake | MAX | Accountability alerts |
| `shield_active` | Shield Focus | HIGH | Ongoing session |
| `shield_reminder` | Shield Reminders | HIGH | Focus reminders |
| `general` | Life OS | DEFAULT | App updates |

#### 5. DevicePlugin (capacitor-device-control)

**Purpose**: Battery optimization and OEM handling

**Methods**:
```
isIgnoringBatteryOptimizations() → boolean
requestBatteryOptimizationExemption()
getManufacturer() → string
openBatterySettings()
openAutoStartSettings() // For Xiaomi/Oppo
```

---

## 4. Rise: Native Alarm System

### Alarm Execution Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALARM SCHEDULING FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐     ┌──────────────┐     ┌───────────────────┐   │
│  │   Web    │────▶│   Capacitor  │────▶│  AlarmManager     │   │
│  │  Layer   │     │    Bridge    │     │  (setExactAndAllow│   │
│  └──────────┘     └──────────────┘     │   WhileIdle)      │   │
│       │                                 └───────────────────┘   │
│       │                                          │              │
│       │  Saves to:                               │              │
│       │  • Supabase                              ▼              │
│       │  • IndexedDB              ┌───────────────────┐         │
│       │                           │ SharedPreferences │         │
│       │                           │ (native backup)   │         │
│       │                           └───────────────────┘         │
│       │                                                         │
└───────┼─────────────────────────────────────────────────────────┘
        │
        │ Web continues normally, alarm is now in system
        │
┌───────▼─────────────────────────────────────────────────────────┐
│                    ALARM TRIGGER FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Device sleeps... time passes... scheduled time arrives]       │
│                                                                  │
│  ┌──────────────┐                                               │
│  │ AlarmReceiver│◀──── System triggers at exact time            │
│  │ (Broadcast)  │                                               │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐     ┌─────────────────┐                       │
│  │ AlarmService │────▶│ Acquire WakeLock│ (30 sec max)          │
│  │ (Foreground) │     └─────────────────┘                       │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ├──────────▶ Start MediaPlayer (alarm sound)            │
│         │                                                        │
│         ├──────────▶ Start Vibration pattern                    │
│         │                                                        │
│         ├──────────▶ Show ongoing notification (MAX priority)   │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ AlarmActivity│◀──── Full-screen intent (if device locked)   │
│  │ (Full Screen)│      OR heads-up notification (if unlocked)  │
│  └──────┬───────┘                                               │
│         │                                                        │
│         │  Shows:                                                │
│         │  • Time + Label                                        │
│         │  • Intention text                                      │
│         │  • [SNOOZE] [DISMISS] buttons                         │
│         │  • Emergency stop (always visible)                     │
│         │                                                        │
└─────────┼───────────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────────┐
│                    ALARM DISMISSAL FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User taps [DISMISS]                                            │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Native Layer │                                               │
│  │              │                                               │
│  │ • Stop MediaPlayer                                           │
│  │ • Stop Vibration                                             │
│  │ • Release WakeLock                                           │
│  │ • Stop foreground service                                    │
│  │ • Record wake timestamp                                      │
│  │ • Emit 'alarmDismissed' event                                │
│  └──────┬───────┘                                               │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐     ┌─────────────────┐                       │
│  │   Capacitor  │────▶│    Web Layer    │                       │
│  │    Bridge    │     │                 │                       │
│  └──────────────┘     │ • Update UI     │                       │
│                       │ • Sync to Supabase                      │
│                       │ • Notify group   │                       │
│                       │ • Update streak  │                       │
│                       └─────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Alarm Survival Guarantees

| Scenario | How Alarm Survives |
|----------|-------------------|
| App closed | AlarmManager is system-level, survives app closure |
| App force-killed | Alarm stays scheduled in AlarmManager |
| Device reboot | BootReceiver reschedules all alarms from SharedPrefs |
| Battery saver | `setExactAndAllowWhileIdle` bypasses Doze |
| No internet | Alarm is 100% local, no network dependency |
| Low memory | Foreground service has high priority |

### Snooze Logic

```
Snooze Tap
    │
    ▼
┌─────────────────────────────────────────┐
│ Native checks: snoozeCount < snoozeLimit │
├──────────────┬──────────────────────────┤
│     YES      │           NO             │
│              │                          │
│ • Increment count                       │
│ • Schedule new alarm (+snoozeInterval)  │
│ • Stop current ringing                  │
│ • Show "Snoozed" notification           │
│              │                          │
│              │ • Show "No snoozes left" │
│              │ • Continue ringing       │
│              │ • Require DISMISS        │
└──────────────┴──────────────────────────┘
```

### Group Wake Integration

```
┌─────────────────────────────────────────────────────────────────┐
│              GROUP WAKE - NATIVE + WEB HYBRID                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. LOCAL ALARM (Native - Always executes first)                 │
│     │                                                            │
│     ├── Alarm rings at scheduled time (no network wait)         │
│     │                                                            │
│     └── User dismisses → Native records timestamp                │
│                                                                  │
│  2. GROUP SYNC (Web - Happens after dismissal)                   │
│     │                                                            │
│     ├── Web receives 'alarmDismissed' event                     │
│     │                                                            │
│     ├── Web syncs to Supabase:                                  │
│     │   • User wake status: 'awake'                             │
│     │   • Actual wake time                                      │
│     │   • Snooze count                                          │
│     │                                                            │
│     └── Web triggers group notifications if needed               │
│                                                                  │
│  3. INCOMING GROUP SIGNAL (Push → Native)                        │
│     │                                                            │
│     ├── FCM delivers push notification                          │
│     │                                                            │
│     ├── Native shows MAX priority notification:                 │
│     │   "🚨 [Name] needs you to wake up!"                       │
│     │                                                            │
│     └── User sees even if app is closed                         │
│                                                                  │
│  KEY PRINCIPLE: User's own alarm NEVER waits for network        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Escalation System

```
User ignores alarm for X minutes
         │
         ▼
┌─────────────────────────────────────────┐
│            NATIVE ESCALATION            │
├─────────────────────────────────────────┤
│                                         │
│  Level 1 (0-2 min): Normal ringing      │
│         │                               │
│         ▼                               │
│  Level 2 (2-5 min): Increase volume     │
│         │           Add vibration burst │
│         │                               │
│         ▼                               │
│  Level 3 (5+ min): Max volume           │
│                    Continuous vibration │
│                    Flash notification   │
│                                         │
│  At any point: Emergency stop visible   │
│                                         │
└─────────────────────────────────────────┘
         │
         ▼ (If dismissed after escalation)
┌─────────────────────────────────────────┐
│             WEB LAYER SYNC              │
│                                         │
│  • Record "late" status                 │
│  • Calculate minutes_late               │
│  • Update streak (may break)            │
│  • Notify group if enabled              │
│                                         │
└─────────────────────────────────────────┘
```

---

## 5. Shield: Native Blocker System

### Shield Philosophy

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHIELD IS NOT SPYWARE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Shield is a USER-ACTIVATED focus firewall.                      │
│                                                                  │
│  ✅ What Shield IS:                                              │
│     • A tool the user chooses to enable                         │
│     • Active only during explicit focus sessions                │
│     • Transparent about what it monitors                         │
│     • Always reversible with emergency exit                     │
│                                                                  │
│  ❌ What Shield is NOT:                                          │
│     • A parental control imposed on user                        │
│     • A background spy collecting data                          │
│     • An unblockable restriction                                │
│     • An accessibility service (policy risk)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Shield Execution Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION START FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User taps "Start Focus Session" in Web UI                      │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐     ┌─────────────────────────────────────┐   │
│  │   Web Layer  │────▶│  Check: hasUsageStatsPermission()   │   │
│  └──────────────┘     └──────────────────┬──────────────────┘   │
│                                          │                       │
│                       ┌──────────────────┴──────────────────┐   │
│                       │                                      │   │
│                    NO │                                 YES  │   │
│                       ▼                                      ▼   │
│         ┌─────────────────────────┐    ┌────────────────────────┐│
│         │ Show permission screen: │    │ Proceed to start       ││
│         │ "Shield needs Usage     │    │                        ││
│         │  Access to monitor apps"│    │                        ││
│         │ [Open Settings] [Later] │    │                        ││
│         └─────────────────────────┘    └────────────────────────┘│
│                                                  │               │
│                                                  ▼               │
│                              ┌──────────────────────────────────┐│
│                              │ ShieldPlugin.startSession({     ││
│                              │   profileId: 'deep_work',       ││
│                              │   blockedApps: [...],           ││
│                              │   duration: 60, // minutes      ││
│                              │   strictness: 'standard'        ││
│                              │ })                              ││
│                              └──────────────────┬───────────────┘│
│                                                 │                │
└─────────────────────────────────────────────────┼────────────────┘
                                                  │
┌─────────────────────────────────────────────────▼────────────────┐
│                    NATIVE SERVICE START                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    ShieldService                          │   │
│  │                   (ForegroundService)                     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  1. Show ongoing notification:                           │   │
│  │     "🛡️ Shield Active • 60 min remaining"                │   │
│  │     [End Session] action button                          │   │
│  │                                                          │   │
│  │  2. Store session config in memory:                      │   │
│  │     • blockedApps: ["com.instagram", "com.twitter", ...] │   │
│  │     • endTime: System.currentTimeMillis() + duration     │   │
│  │     • strictness: "standard"                             │   │
│  │                                                          │   │
│  │  3. Start monitoring loop (every 1-2 seconds):           │   │
│  │     • Query UsageStatsManager for foreground app         │   │
│  │     • Compare against blockedApps                        │   │
│  │     • If match → trigger block                           │   │
│  │                                                          │   │
│  │  4. Start session timer:                                 │   │
│  │     • Count down to endTime                              │   │
│  │     • Update notification periodically                   │   │
│  │     • Auto-end when timer expires                        │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Blocking Mechanism

```
┌─────────────────────────────────────────────────────────────────┐
│                    APP DETECTION & BLOCKING                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Every 1-2 seconds:                                             │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ UsageStatsManager.queryUsageStats(                     │     │
│  │   UsageStatsManager.INTERVAL_DAILY,                    │     │
│  │   startTime, endTime                                   │     │
│  │ )                                                      │     │
│  │                                                        │     │
│  │ → Get foregroundApp from most recent UsageStats        │     │
│  └────────────────────────────────────────────────────────┘     │
│                        │                                         │
│                        ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Is foregroundApp in blockedApps?                         │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │                                     │
│            ┌───────────────┴───────────────┐                    │
│            │                               │                    │
│         NO │                          YES  │                    │
│            ▼                               ▼                    │
│   Continue monitoring           ┌──────────────────────┐        │
│                                 │ Launch BlockActivity │        │
│                                 │ (FLAG_ACTIVITY_NEW_TASK)      │
│                                 └──────────────────────┘        │
│                                            │                    │
│                                            ▼                    │
│                                 ┌──────────────────────┐        │
│                                 │    Block Screen UI    │        │
│                                 │                      │        │
│                                 │  "🛡️ Shield Active"  │        │
│                                 │                      │        │
│                                 │  "Instagram is       │        │
│                                 │   blocked during     │        │
│                                 │   your focus session"│        │
│                                 │                      │        │
│                                 │  [Back to Life OS]   │        │
│                                 │  [Emergency Exit]    │        │
│                                 │                      │        │
│                                 │  45 min remaining    │        │
│                                 │                      │        │
│                                 └──────────────────────┘        │
│                                                                  │
│  IMPORTANT: Block screen is a full activity that:               │
│  • Takes focus from blocked app                                 │
│  • Shows clear explanation                                      │
│  • Provides escape routes                                       │
│  • NEVER traps the user                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Strictness Levels

```
┌─────────────────────────────────────────────────────────────────┐
│                    STRICTNESS MODES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GENTLE (Default for new users)                                 │
│  ├── Warning toast before blocking                              │
│  ├── 10-second grace period                                     │
│  ├── Easy exit button visible                                   │
│  └── No penalty for exiting early                               │
│                                                                  │
│  STANDARD (Recommended)                                         │
│  ├── Immediate blocking                                         │
│  ├── Block screen with motivation quote                         │
│  ├── Exit requires confirmation                                 │
│  └── Early exit logged (no penalty)                             │
│                                                                  │
│  STRICT (For advanced users)                                    │
│  ├── Immediate blocking                                         │
│  ├── Exit requires typing phrase                                │
│  ├── Cooldown before re-enabling blocked app                    │
│  └── Early exit affects discipline score                        │
│                                                                  │
│  ABSOLUTE (Requires high discipline score)                      │
│  ├── No exit during session (except emergency)                  │
│  ├── Accountability partner notified on attempt                 │
│  ├── Session cannot be shortened                                │
│  └── Highest discipline score impact                            │
│                                                                  │
│  ⚠️ EMERGENCY EXIT: Always available in all modes               │
│     Immediately stops session, no questions asked               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Session End Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION END SCENARIOS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SCENARIO 1: Timer Complete (Success)                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Native:                                                    │ │
│  │ • Stop foreground service                                  │ │
│  │ • Show completion notification: "🎉 Focus session complete"│ │
│  │ • Emit 'sessionEnded' with reason: 'completed'             │ │
│  │                                                            │ │
│  │ Web:                                                       │ │
│  │ • Update UI to show success                                │ │
│  │ • Record to Supabase                                       │ │
│  │ • Award points/streak                                      │ │
│  │ • Update discipline score                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  SCENARIO 2: User Ends Early                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Native:                                                    │ │
│  │ • Show confirmation (if STANDARD+)                         │ │
│  │ • Stop service                                             │ │
│  │ • Emit 'sessionEnded' with reason: 'user_ended'            │ │
│  │                                                            │ │
│  │ Web:                                                       │ │
│  │ • Record early exit                                        │ │
│  │ • Optionally reduce score                                  │ │
│  │ • No judgment shown                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  SCENARIO 3: Emergency Exit                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Native:                                                    │ │
│  │ • Immediately stop service                                 │ │
│  │ • No confirmation needed                                   │ │
│  │ • Emit 'sessionEnded' with reason: 'emergency'             │ │
│  │                                                            │ │
│  │ Web:                                                       │ │
│  │ • Record but NO penalty                                    │ │
│  │ • Emergency is always respected                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### What Shield Never Does

| Action | Status | Reason |
|--------|--------|--------|
| Block Phone app | ❌ Never | Safety |
| Block Settings | ❌ Never | User must control device |
| Block Emergency Dialer | ❌ Never | Safety |
| Run when Shield not active | ❌ Never | Privacy |
| Collect app usage for analytics | ❌ Never | Privacy |
| Report to third parties | ❌ Never | Trust |
| Hide that it's monitoring | ❌ Never | Transparency |

---

## 6. Permission Strategy

### Permission Philosophy

```
┌─────────────────────────────────────────────────────────────────┐
│             PERMISSIONS ARE A CONVERSATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ❌ WRONG WAY:                                                   │
│     • Request all permissions on first launch                   │
│     • Show system popup without explanation                     │
│     • Require permissions to use app                            │
│     • Guilt user for denying                                    │
│                                                                  │
│  ✅ RIGHT WAY:                                                   │
│     • Request only when feature is used                         │
│     • Explain benefit BEFORE system popup                       │
│     • Allow "Later" option                                      │
│     • Respect denial gracefully                                 │
│     • Feature degrades, doesn't break                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Permission Request Flows

#### Notifications Permission (Android 13+)

```
User taps "Enable Daily Reminders"
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRE-PERMISSION SCREEN                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  🔔 Stay on Track                                          │ │
│  │                                                            │ │
│  │  Life OS can remind you to:                                │ │
│  │  • Log your daily entry before bed                         │ │
│  │  • Wake up with Rise alarms                                │ │
│  │  • Start focus sessions at scheduled times                 │ │
│  │                                                            │ │
│  │  You control exactly what notifications you receive.       │ │
│  │                                                            │ │
│  │  ┌──────────────────┐  ┌─────────────┐                    │ │
│  │  │  Enable Notifications │  │   Later   │                    │ │
│  │  └──────────────────┘  └─────────────┘                    │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼ (User taps Enable)
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM PERMISSION POPUP                       │
│                                                                  │
│  "Allow Life OS to send you notifications?"                     │
│                                                                  │
│  [Don't allow]  [Allow]                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Exact Alarm Permission (Android 12+)

```
User creates first alarm in Rise
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRE-PERMISSION SCREEN                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  ⏰ Reliable Alarms                                        │ │
│  │                                                            │ │
│  │  For your alarms to ring exactly on time (even when       │ │
│  │  your phone is in battery saver mode), Life OS needs      │ │
│  │  permission to schedule exact alarms.                     │ │
│  │                                                            │ │
│  │  Without this, alarms may be delayed by several minutes.  │ │
│  │                                                            │ │
│  │  ┌──────────────────┐  ┌─────────────┐                    │ │
│  │  │  Open Settings    │  │   Skip     │                    │ │
│  │  └──────────────────┘  └─────────────┘                    │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼ (Opens system settings for Alarms & Reminders)
```

#### Usage Stats Permission (Shield)

```
User tries to start first Shield session
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRE-PERMISSION SCREEN                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  🛡️ Shield Needs Usage Access                              │ │
│  │                                                            │ │
│  │  To block distracting apps during your focus sessions,    │ │
│  │  Shield needs to know which app is currently open.        │ │
│  │                                                            │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │ 🔒 Privacy Promise                                  │  │ │
│  │  │                                                     │  │ │
│  │  │ • Shield ONLY checks apps during active sessions    │  │ │
│  │  │ • No data is collected or stored                    │  │ │
│  │  │ • You can revoke access anytime in Settings         │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  │                                                            │ │
│  │  ┌──────────────────┐  ┌─────────────┐                    │ │
│  │  │  Open Settings    │  │   Not Now  │                    │ │
│  │  └──────────────────┘  └─────────────┘                    │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼ (Opens Settings → Apps → Usage Access)
         
User manually toggles "Life OS" to ON
```

#### Battery Optimization Exemption (Optional)

```
User experiences missed alarms OR
System shows battery warning
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONTEXTUAL REQUEST                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  🔋 Improve Reliability                                    │ │
│  │                                                            │ │
│  │  Your phone's battery saver may delay alarms and          │ │
│  │  focus session monitoring.                                │ │
│  │                                                            │ │
│  │  Allowing Life OS to run in the background ensures:       │ │
│  │  • Alarms ring exactly on time                            │ │
│  │  • Shield sessions stay active                            │ │
│  │  • Group wake signals arrive instantly                    │ │
│  │                                                            │ │
│  │  (This has minimal impact on battery life)                │ │
│  │                                                            │ │
│  │  ┌──────────────────┐  ┌─────────────┐                    │ │
│  │  │  Allow           │  │   Later     │                    │ │
│  │  └──────────────────┘  └─────────────┘                    │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Permission Status Tracking

```typescript
// Web layer tracks permission status
interface PermissionState {
  notifications: 'granted' | 'denied' | 'prompt';
  exactAlarm: 'granted' | 'denied' | 'not_required'; // API < 31
  usageStats: 'granted' | 'denied' | 'prompt';
  batteryOptimization: 'exempt' | 'not_exempt';
}

// Graceful degradation based on permissions
function getFeatureAvailability(permissions: PermissionState) {
  return {
    rise: {
      basicAlarms: true, // Always works
      exactTiming: permissions.exactAlarm === 'granted',
      groupWake: permissions.notifications === 'granted',
    },
    shield: {
      available: permissions.usageStats === 'granted',
      reliable: permissions.batteryOptimization === 'exempt',
    },
    reminders: {
      available: permissions.notifications === 'granted',
    }
  };
}
```

### Play Store Reviewer Justification

| Permission | Justification Text |
|------------|-------------------|
| POST_NOTIFICATIONS | "Required to deliver alarm sounds, focus session status, and accountability partner messages that the user has opted into" |
| SCHEDULE_EXACT_ALARM | "Core functionality: User sets wake-up alarms that must ring at exact times. Inexact alarms would defeat the purpose of the alarm feature." |
| PACKAGE_USAGE_STATS | "Used ONLY during user-activated focus sessions to detect when user opens a self-selected blocked app. No data is collected or transmitted. User can revoke access anytime." |
| REQUEST_IGNORE_BATTERY_OPTIMIZATIONS | "Optional. Offered to users who experience missed alarms. Improves reliability of time-critical notifications." |
| FOREGROUND_SERVICE | "Required to keep Shield focus sessions active and display ongoing notification showing session status." |
| RECEIVE_BOOT_COMPLETED | "Reschedules user's alarms after device restart. Essential for alarm reliability." |

---

## 7. Native Feel Without UI Rewrite

### Splash Screen

```xml
<!-- android/app/src/main/res/drawable/splash.xml -->
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background" />
    <item>
        <bitmap
            android:gravity="center"
            android:src="@drawable/splash_logo" />
    </item>
</layer-list>
```

**Capacitor handles**:
- Show splash during WebView load
- Fade out when web app signals ready
- Configurable duration and fade

### Status Bar

```typescript
// Capacitor StatusBar plugin
import { StatusBar, Style } from '@capacitor/status-bar';

// On app init
if (isAndroid) {
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: '#0f172a' });
}

// On theme change
function handleThemeChange(isDark: boolean) {
  StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
  StatusBar.setBackgroundColor({ 
    color: isDark ? '#0f172a' : '#ffffff' 
  });
}
```

### Android Back Button

```typescript
// Already implemented in platform.ts
App.addListener('backButton', ({ canGoBack }) => {
  // 1. Close any open dialogs/modals first
  const dialogs = document.querySelectorAll('[role="dialog"][data-state="open"]');
  if (dialogs.length > 0) {
    closeTopDialog();
    return;
  }
  
  // 2. Close any open sheets/drawers
  const sheets = document.querySelectorAll('[data-sheet-open="true"]');
  if (sheets.length > 0) {
    closeSheet();
    return;
  }
  
  // 3. Navigate back if possible
  if (canGoBack) {
    window.history.back();
    return;
  }
  
  // 4. If on home screen, show exit confirmation or minimize
  if (isHomeScreen()) {
    showExitConfirmation();
  } else {
    App.exitApp();
  }
});
```

### Keyboard Behavior

```typescript
// Capacitor Keyboard plugin
import { Keyboard } from '@capacitor/keyboard';

// Prevent keyboard from pushing content
Keyboard.setResizeMode({ mode: 'none' });

// Or adjust for specific inputs
Keyboard.addListener('keyboardWillShow', (info) => {
  document.body.style.paddingBottom = `${info.keyboardHeight}px`;
});

Keyboard.addListener('keyboardWillHide', () => {
  document.body.style.paddingBottom = '0';
});
```

### App Lifecycle

```typescript
// Already implemented via custom events
App.addListener('appStateChange', ({ isActive }) => {
  if (isActive) {
    // App resumed from background
    window.dispatchEvent(new CustomEvent('app:resume'));
    // Refresh data, check for updates
  } else {
    // App going to background
    window.dispatchEvent(new CustomEvent('app:pause'));
    // Save state, pause non-essential operations
  }
});

// Components can listen
useEffect(() => {
  const handleResume = () => {
    queryClient.invalidateQueries();
  };
  
  window.addEventListener('app:resume', handleResume);
  return () => window.removeEventListener('app:resume', handleResume);
}, []);
```

### Safe Area Insets

```css
/* Already in index.css - handle notch/cutout */
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-inset-left: env(safe-area-inset-left, 0px);
  --safe-area-inset-right: env(safe-area-inset-right, 0px);
}

/* Apply to fixed elements */
.mobile-nav {
  padding-bottom: calc(1rem + var(--safe-area-inset-bottom));
}

.status-bar-spacer {
  height: var(--safe-area-inset-top);
}
```

### Haptic Feedback

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// On button press
async function handleImportantAction() {
  if (isNative) {
    await Haptics.impact({ style: ImpactStyle.Medium });
  }
  // Continue with action
}

// On alarm dismiss
async function handleAlarmDismiss() {
  if (isNative) {
    await Haptics.notification({ type: 'success' });
  }
}
```

---

## 8. OEM Survival & Edge Cases

### OEM-Specific Issues

| Manufacturer | Issue | Solution |
|-------------|-------|----------|
| Xiaomi (MIUI) | Aggressive battery killer | Request AutoStart permission |
| Oppo/Realme (ColorOS) | App killed in background | Request "Don't optimize" |
| Vivo (FunTouch) | Similar to Oppo | Same approach |
| Samsung (OneUI) | Sleeping apps | Exclude from sleep |
| Huawei (EMUI) | App launch restricted | Protected apps setting |
| OnePlus (OxygenOS) | Battery optimization | Similar to stock |

### OEM Detection & Guidance

```typescript
import { Device } from '@capacitor/device';

async function getOEMGuidance(): Promise<OEMGuidance | null> {
  const info = await Device.getInfo();
  const manufacturer = info.manufacturer.toLowerCase();
  
  const guidance: Record<string, OEMGuidance> = {
    xiaomi: {
      name: 'Xiaomi',
      issue: 'MIUI may stop alarms from ringing',
      steps: [
        'Go to Settings → Apps → Manage apps',
        'Find "Life OS" and tap it',
        'Tap "Autostart" and enable it',
        'Go back and tap "Battery saver"',
        'Select "No restrictions"'
      ],
      settingsIntent: 'miui.intent.action.OP_AUTO_START'
    },
    oppo: {
      name: 'Oppo/Realme',
      issue: 'ColorOS may stop background alarms',
      steps: [
        'Go to Settings → Battery',
        'Tap "Life OS"',
        'Enable "Allow background activity"',
        'Disable "Pause app activity if unused"'
      ]
    },
    vivo: {
      name: 'Vivo',
      issue: 'Similar restrictions as Oppo',
      steps: [
        'Go to Settings → Battery',
        'Tap "High background power consumption"',
        'Enable "Life OS"'
      ]
    },
    samsung: {
      name: 'Samsung',
      issue: 'Sleeping apps feature may stop alarms',
      steps: [
        'Go to Settings → Battery',
        'Tap "Background usage limits"',
        'Tap "Sleeping apps"',
        'Remove "Life OS" from the list'
      ]
    },
    huawei: {
      name: 'Huawei',
      issue: 'EMUI restricts background apps',
      steps: [
        'Go to Settings → Battery',
        'Tap "App launch"',
        'Find "Life OS"',
        'Disable "Manage automatically"',
        'Enable all toggles manually'
      ]
    }
  };
  
  return guidance[manufacturer] || null;
}
```

### Graceful Degradation Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    FAILURE HANDLING MATRIX                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SCENARIO: Notification Permission Denied                       │
│  ├── Rise: Alarms still ring (uses foreground service)         │
│  ├── Shield: Sessions work, but no reminder notifications       │
│  ├── Group: Can't receive wake signals                          │
│  └── Action: Show banner suggesting to enable                   │
│                                                                  │
│  SCENARIO: Exact Alarm Permission Denied                        │
│  ├── Rise: Alarms use inexact scheduling (may be late)         │
│  ├── Shield: Unaffected                                         │
│  └── Action: Warn user alarms may be delayed                    │
│                                                                  │
│  SCENARIO: Usage Stats Permission Denied                        │
│  ├── Rise: Unaffected                                           │
│  ├── Shield: CANNOT function - show explanation                 │
│  └── Action: Guide to settings on every Shield attempt          │
│                                                                  │
│  SCENARIO: Battery Optimization NOT Exempt                      │
│  ├── Rise: May miss alarms when Doze is active                 │
│  ├── Shield: May stop monitoring in deep sleep                  │
│  └── Action: Optional prompt after missed event                 │
│                                                                  │
│  SCENARIO: App Force-Killed by User                             │
│  ├── Rise: Scheduled alarms still fire (AlarmManager)          │
│  ├── Shield: Active session ends immediately                    │
│  └── Action: Session recorded as 'interrupted'                  │
│                                                                  │
│  SCENARIO: App Force-Killed by OEM                              │
│  ├── Rise: Same as user kill                                    │
│  ├── Shield: Same as user kill                                  │
│  └── Action: Show OEM guidance on next launch                   │
│                                                                  │
│  SCENARIO: Device Rebooted                                      │
│  ├── Rise: BootReceiver reschedules all alarms                 │
│  ├── Shield: No active session (expected)                       │
│  └── Action: None required                                      │
│                                                                  │
│  SCENARIO: No Internet                                          │
│  ├── Rise: Alarms work 100% locally                            │
│  ├── Shield: Sessions work 100% locally                         │
│  ├── Sync: Queued for when online                               │
│  └── Action: Show offline indicator, sync later                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### User Communication

```typescript
// Show OEM guidance when appropriate
async function checkAndShowOEMGuidance() {
  const guidance = await getOEMGuidance();
  if (!guidance) return;
  
  const hasShownBefore = await getStoredFlag(`oem_guidance_shown_${guidance.name}`);
  const hasHadIssue = await getStoredFlag('alarm_missed_recently');
  
  // Show only if:
  // 1. Never shown before, OR
  // 2. User has experienced an issue
  if (!hasShownBefore || hasHadIssue) {
    showOEMGuidanceDialog(guidance);
    await setStoredFlag(`oem_guidance_shown_${guidance.name}`, true);
  }
}

// After missed alarm
async function handleMissedAlarm(alarmId: string) {
  await setStoredFlag('alarm_missed_recently', true);
  
  // Show non-judgmental message
  showDialog({
    title: 'Alarm May Have Been Delayed',
    message: `Some phones pause apps to save battery. 
              Would you like to see how to fix this?`,
    actions: [
      { label: 'Show Me', action: showOEMGuidance },
      { label: 'Maybe Later', action: dismiss }
    ]
  });
}
```

---

## 9. Play Store Compliance

### Policy Compliance Checklist

| Policy Area | Requirement | Life OS Compliance |
|-------------|-------------|-------------------|
| App functionality | Must provide value without special permissions | ✅ Core tracking works without Rise/Shield |
| Login requirement | Must not require login for basic features | ✅ Can view sample/demo without login |
| Privacy policy | Must be accessible and accurate | ✅ Linked in app and Play Store |
| Data collection | Must be disclosed | ✅ Only user's own data, no third-party sharing |
| Background services | Must justify and minimize | ✅ Only for active alarm/focus sessions |
| Usage access | Must justify and limit scope | ✅ Shield only, user-activated only |
| Deceptive behavior | No hidden functionality | ✅ All features explained before use |

### Play Store Rejection Prevention

#### ❌ Common Rejection Reasons & Avoidance

| Rejection Reason | How Life OS Avoids |
|-----------------|-------------------|
| "Web wrapper only" | Native alarm/notification/blocking features |
| "Insufficient functionality" | Full productivity + Islamic lifestyle app |
| "Unclear permissions" | Pre-permission screens explain each |
| "Background location" | We don't use location at all |
| "Accessibility abuse" | We don't use Accessibility Service |
| "Device admin abuse" | We don't use Device Admin |
| "Spyware-like behavior" | Shield only monitors during active sessions |

#### ✅ Positive Signals for Reviewers

1. **Clear value proposition**: "Life tracking app for mindful living"
2. **Permission timing**: Never on first launch
3. **Feature degradation**: App works without special permissions
4. **Emergency exits**: Always visible in Shield
5. **Privacy clarity**: In-app privacy explanation
6. **No aggressive ads**: No ads at all
7. **No dark patterns**: No guilt for missed goals

### Data Safety Form Answers

| Question | Answer |
|----------|--------|
| Does your app collect or share user data? | Yes - collects |
| What data is collected? | Personal info (name), App activity (usage), App info (crash logs) |
| Is data encrypted in transit? | Yes (HTTPS) |
| Can users request data deletion? | Yes |
| Is data shared with third parties? | No |
| Why is Usage Stats accessed? | To detect when user opens self-selected blocked apps during focus sessions |

### Privacy Policy Requirements

```markdown
# Life OS Privacy Policy

## Data We Collect
- Account information (email)
- Daily entries you log
- Alarm schedules you create
- Focus session history

## Shield-Specific Data
- During active focus sessions ONLY: which app is in foreground
- This data is NOT stored or transmitted
- Used only to determine if blocked app is open

## What We Don't Do
- We do not track location
- We do not access contacts
- We do not access messages
- We do not share data with advertisers
- We do not sell your data

## Your Rights
- Request data export
- Request data deletion
- Revoke permissions anytime
```

---

## 10. Testing & Release Checklist

### Real-Device Testing Checklist

#### Alarm Testing (Rise)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Basic alarm | Set alarm for 1 min, lock screen | Alarm rings, screen wakes |
| App closed | Set alarm, close app, wait | Alarm rings |
| App killed | Set alarm, force stop app, wait | Alarm rings |
| After reboot | Set alarm, reboot device, wait | Alarm rings |
| Battery saver ON | Enable battery saver, set alarm | Alarm rings on time |
| Do Not Disturb | Enable DND, set alarm | Alarm rings (alarms bypass DND) |
| Snooze | Tap snooze, verify reschedule | New alarm in X minutes |
| Snooze limit | Exhaust snoozes, verify no more | No snooze button |
| Dismiss | Tap dismiss | Alarm stops, data synced |
| Multiple alarms | Set 3 alarms, verify all | All fire correctly |
| Recurring alarm | Set daily alarm, verify next day | Fires again tomorrow |

#### Focus Session Testing (Shield)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Permission flow | Start first session | Usage access prompt |
| Session start | Start session with blocked apps | Foreground notification appears |
| Blocking works | Open blocked app | Block screen appears |
| Back to app | Tap "Back to Life OS" | Returns to app |
| Emergency exit | Tap emergency exit | Session ends immediately |
| Session timer | Wait for session to expire | Auto-ends with notification |
| App in background | Switch to unblocked app, then blocked | Still blocks |
| App killed | Start session, kill app | Session ends (expected) |

#### Notification Testing

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Alarm notification | Trigger alarm | Full-screen or heads-up |
| Session notification | Start focus session | Ongoing notification |
| Group wake | Trigger group signal | Heads-up notification |
| Channel settings | Go to app notification settings | All channels visible |

### Pre-Submission Checklist

- [ ] App ID matches: `app.lifeos.com`
- [ ] Version code incremented
- [ ] Release build signed
- [ ] ProGuard/R8 enabled
- [ ] All permissions have justifications
- [ ] Privacy policy URL in Play Console
- [ ] Data safety form complete
- [ ] Screenshots for all form factors
- [ ] Feature graphic uploaded
- [ ] App description accurate
- [ ] No beta/test language in description
- [ ] Content rating questionnaire done
- [ ] Target SDK 34+
- [ ] 64-bit support included

### Post-Launch Monitoring

- [ ] Monitor Play Console for crashes
- [ ] Check review for permission complaints  
- [ ] Monitor for ANR (App Not Responding)
- [ ] Check Firebase Crashlytics (if added)
- [ ] Respond to user feedback

---

## 11. Common Fatal Mistakes

### ❌ Mistakes to NEVER Make

| Mistake | Why It's Fatal | Correct Approach |
|---------|----------------|------------------|
| Using JavaScript timers for alarms | Dies when app closes | Use native AlarmManager |
| Using Accessibility Service for blocking | Policy violation, Play Store ban | Use UsageStatsManager |
| Requesting all permissions on first launch | User distrust, high deny rate | Request when feature used |
| Not providing emergency exit | Trap user, policy violation | Always visible exit |
| Running background service 24/7 | Battery drain, bad reviews | Only during active sessions |
| Hiding what app monitors | Spyware perception, ban risk | Transparent notification |
| Not handling OEM restrictions | Missed alarms, bad reviews | Detect and guide user |
| Hardcoding API keys | Security breach | Use BuildConfig or Secrets |
| Ignoring offline state | Broken experience | Offline-first design |
| Not testing on real devices | Emulator hides real issues | Test on physical phones |

### ⚠️ Anti-Patterns to Avoid

```
❌ DON'T:
setTimeout(() => ringAlarm(), 8 * 60 * 60 * 1000); // 8 hours

✅ DO:
AlarmManager.setExactAndAllowWhileIdle(
  AlarmManager.RTC_WAKEUP,
  triggerTime,
  pendingIntent
);
```

```
❌ DON'T:
// Check foreground app using Accessibility Service
accessibilityService.getActiveWindow();

✅ DO:
// Check foreground app using Usage Stats
usageStatsManager.queryUsageStats(INTERVAL_DAILY, start, end);
```

```
❌ DON'T:
// Request permission silently on app start
requestUsageStatsPermission();

✅ DO:
// Request only when user taps "Start Shield"
showExplanationDialog()
  .then(confirmed => confirmed && requestUsageStatsPermission());
```

---

## Appendix: Quick Reference

### Capacitor Commands

```bash
# Initial setup
npm install @capacitor/cli @capacitor/core
npx cap init

# Add Android
npx cap add android

# Sync web to native
npm run build && npx cap sync

# Open in Android Studio
npx cap open android

# Run on device
npx cap run android

# Live reload during development
# (Update capacitor.config.ts with server URL first)
npx cap run android --livereload --external
```

### Android Manifest Permissions

```xml
<!-- Alarms -->
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />

<!-- Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Shield -->
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS"
    tools:ignore="ProtectedPermissions" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />

<!-- Network -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Key Android Components Needed

```
android/app/src/main/java/app/lifeos/com/
├── AlarmReceiver.java          # BroadcastReceiver for alarms
├── AlarmService.java           # ForegroundService for ringing
├── AlarmActivity.java          # Full-screen alarm UI
├── BootReceiver.java           # Reschedule after reboot
├── ShieldService.java          # ForegroundService for blocking
├── BlockActivity.java          # Block screen UI
└── plugins/
    ├── AlarmPlugin.java        # Capacitor bridge
    └── ShieldPlugin.java       # Capacitor bridge
```

---

**END OF ARCHITECTURE DOCUMENT**

*This document serves as the complete blueprint for converting Life OS web app to a native Android experience using Capacitor. No code has been provided - this is purely architectural planning for the engineering team to implement.*
