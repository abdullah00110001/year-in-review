"use strict";
/* import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { isNative, isAndroid } from './platform';
import Shield from './shieldPlugin';
import { canScheduleExactAlarms, openExactAlarmSettings } from './riseAlarmBridge';

export type PermissionStatus = 'granted' | 'denied' | 'prompt';

export interface PermissionState {
  notifications: PermissionStatus;
  exactAlarm: PermissionStatus;
  usageStats: PermissionStatus;
  overlay: PermissionStatus;
  battery: PermissionStatus;
  accessibility: PermissionStatus;
}

// Check notification permission
export const checkNotificationPermission = async (): Promise<PermissionStatus> => {
  if (!isNative) {
    if ('Notification' in window) {
      return Notification.permission as PermissionStatus;
    }
    return 'denied';
  }

  try {
    const { display } = await LocalNotifications.checkPermissions();
    return display as PermissionStatus;
  } catch {
    return 'denied';
  }
};

// Request notification permission with pre-explanation
export const requestNotificationPermission = async (
  onPreExplanation?: () => Promise<boolean>
): Promise<PermissionStatus> => {
  if (onPreExplanation) {
    const proceed = await onPreExplanation();
    if (!proceed) return 'denied';
  }

  if (!isNative) {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      return result as PermissionStatus;
    }
    return 'denied';
  }

  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display as PermissionStatus;
  } catch {
    return 'denied';
  }
};

// Check push notification permission
export const checkPushPermission = async (): Promise<PermissionStatus> => {
  if (!isNative) return 'denied';

  try {
    const { receive } = await PushNotifications.checkPermissions();
    return receive as PermissionStatus;
  } catch {
    return 'denied';
  }
};

// Request push notification permission
export const requestPushPermission = async (): Promise<PermissionStatus> => {
  if (!isNative) return 'denied';

  try {
    const { receive } = await PushNotifications.requestPermissions();
    
    if (receive === 'granted') {
      await PushNotifications.register();
    }
    
    return receive as PermissionStatus;
  } catch {
    return 'denied';
  }
};

// Android-specific: Check exact alarm permission (API 31+)
export const checkExactAlarmPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'granted';
  try {
    const ok = await canScheduleExactAlarms();
    return ok ? 'granted' : 'prompt';
  } catch {
    return 'prompt';
  }
};

// Android-specific: Open the system "Alarms & reminders" page for this app
export const requestExactAlarmPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'granted';
  try {
    await openExactAlarmSettings();
  } catch (e) {
    console.warn('[Permissions] openExactAlarmSettings failed', e);
  }
  return checkExactAlarmPermission();
};

// Android-specific: Check usage stats permission (for Shield) — uses native AppOps check
export const checkUsageStatsPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'denied';
  try {
    const { usageStats } = await Shield.checkPermissions();
    return usageStats ? 'granted' : 'prompt';
  } catch {
    return 'prompt';
  }
};

// Android-specific: Request usage stats permission
export const requestUsageStatsPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'denied';
  try {
    await Shield.requestUsageStats();
  } catch (e) {
    console.warn('[Permissions] requestUsageStats failed', e);
  }
  return checkUsageStatsPermission();
};

// Android-specific: Overlay (SYSTEM_ALERT_WINDOW)
export const checkOverlayPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'granted';
  try {
    const { overlay } = await Shield.checkPermissions();
    return overlay ? 'granted' : 'prompt';
  } catch {
    return 'prompt';
  }
};

export const requestOverlayPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'granted';
  try {
    await Shield.requestOverlay();
  } catch (e) {
    console.warn('[Permissions] requestOverlay failed', e);
  }
  return checkOverlayPermission();
};

// Android-specific: Battery optimization exemption
export const checkBatteryPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'granted';
  try {
    const { battery } = await Shield.checkPermissions();
    return battery ? 'granted' : 'prompt';
  } catch {
    return 'prompt';
  }
};

export const requestBatteryPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'granted';
  try {
    await Shield.requestBattery();
  } catch (e) {
    console.warn('[Permissions] requestBattery failed', e);
  }
  return checkBatteryPermission();
};

// Android-specific: Accessibility (Shield)
export const checkAccessibilityPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'granted';
  try {
    const { accessibility } = await Shield.checkPermissions();
    return accessibility ? 'granted' : 'prompt';
  } catch {
    return 'prompt';
  }
};

export const requestAccessibilityPermission = async (): Promise<PermissionStatus> => {
  if (!isAndroid) return 'granted';
  try {
    await Shield.requestAccessibility();
  } catch (e) {
    console.warn('[Permissions] requestAccessibility failed', e);
  }
  return checkAccessibilityPermission();
};

// Open app settings (for when permission was denied)
export const openAppSettings = async () => {
  if (!isNative) return;
  
  try {
    // Use the App plugin to open device settings for this app
    const { Browser } = await import('@capacitor/browser');
    if (isAndroid) {
      // Android: open app details settings
      await Browser.open({
        url: 'app-settings:',
        presentationStyle: 'fullscreen'
      });
    }
  } catch (error) {
    console.error('[Permissions] Failed to open app settings:', error);
    // Fallback: try native intent
    try {
      window.open('intent://settings#Intent;end', '_system');
    } catch {
      console.log('[Permissions] Cannot open settings programmatically');
    }
  }
};

// Open usage stats settings (for Shield)
export const openUsageStatsSettings = async () => {
  if (!isAndroid) return;
  
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({
      url: 'android.settings.USAGE_ACCESS_SETTINGS',
      presentationStyle: 'fullscreen'
    });
  } catch (error) {
    console.error('[Permissions] Failed to open usage stats settings:', error);
  }
};

// Open battery optimization settings
export const openBatterySettings = async () => {
  if (!isAndroid) return;
  
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({
      url: 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
      presentationStyle: 'fullscreen'
    });
  } catch (error) {
    console.error('[Permissions] Failed to open battery settings:', error);
  }
};

// Get all permission states
export const getAllPermissions = async (): Promise<PermissionState> => {
  const [notifications, exactAlarm, usageStats, overlay, battery, accessibility] = await Promise.all([
    checkNotificationPermission(),
    checkExactAlarmPermission(),
    checkUsageStatsPermission(),
    checkOverlayPermission(),
    checkBatteryPermission(),
    checkAccessibilityPermission(),
  ]);

  return { notifications, exactAlarm, usageStats, overlay, battery, accessibility };
};

// Check if all required permissions are granted for Rise
export const hasRisePermissions = async (): Promise<boolean> => {
  const notifications = await checkNotificationPermission();
  const exactAlarm = await checkExactAlarmPermission();
  
  return notifications === 'granted' && exactAlarm === 'granted';
};

// Check if all required permissions are granted for Shield
export const hasShieldPermissions = async (): Promise<boolean> => {
  const notifications = await checkNotificationPermission();
  const usageStats = await checkUsageStatsPermission();
  
  return notifications === 'granted' && usageStats === 'granted';
};

// Request all Rise permissions in sequence with user-friendly prompts
export const requestRisePermissions = async (): Promise<{
  notifications: PermissionStatus;
  exactAlarm: PermissionStatus;
}> => {
  const notifications = await requestNotificationPermission();
  const exactAlarm = await requestExactAlarmPermission();
  return { notifications, exactAlarm };
};

// Request all Shield permissions in sequence
export const requestShieldPermissions = async (): Promise<{
  notifications: PermissionStatus;
  usageStats: PermissionStatus;
}> => {
  const notifications = await requestNotificationPermission();
  const usageStats = await requestUsageStatsPermission();
  return { notifications, usageStats };
};
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestBatteryPermission = exports.checkBatteryPermission = exports.requestAccessibilityPermission = exports.checkAccessibilityPermission = exports.requestOverlayPermission = exports.checkOverlayPermission = exports.requestUsageStatsPermission = exports.checkUsageStatsPermission = exports.requestExactAlarmPermission = exports.checkExactAlarmPermission = exports.requestNotificationPermission = exports.checkNotificationPermission = void 0;
var core_1 = require("@capacitor/core");
var shieldPlugin_1 = require("@/lib/capacitor/shieldPlugin");
var local_notifications_1 = require("@capacitor/local-notifications");
var isAndroid = core_1.Capacitor.getPlatform() === 'android';
var isNative = core_1.Capacitor.isNativePlatform();
/**
 * ১. Notification Permission Check
 */
var checkNotificationPermission = function () { return __awaiter(void 0, void 0, Promise, function () {
    var status, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isNative)
                    return [2 /*return*/, 'granted'];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, local_notifications_1.LocalNotifications.checkPermissions()];
            case 2:
                status = _a.sent();
                return [2 /*return*/, status.display === 'granted' ? 'granted' : 'prompt'];
            case 3:
                e_1 = _a.sent();
                console.error('[Permissions] Notification check failed', e_1);
                return [2 /*return*/, 'unknown'];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.checkNotificationPermission = checkNotificationPermission;
var requestNotificationPermission = function () { return __awaiter(void 0, void 0, Promise, function () {
    var status, e_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isNative)
                    return [2 /*return*/, 'granted'];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, local_notifications_1.LocalNotifications.requestPermissions()];
            case 2:
                status = _a.sent();
                return [2 /*return*/, status.display === 'granted' ? 'granted' : 'denied'];
            case 3:
                e_2 = _a.sent();
                return [2 /*return*/, 'denied'];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.requestNotificationPermission = requestNotificationPermission;
/**
 * ২. Exact Alarm Permission (Android 12+)
 */
var checkExactAlarmPermission = function () { return __awaiter(void 0, void 0, Promise, function () {
    var _a, accessibility, usageStats, overlay, battery, e_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!isNative || !isAndroid)
                    return [2 /*return*/, 'granted'];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, shieldPlugin_1.default.checkPermissions()];
            case 2:
                _a = _b.sent(), accessibility = _a.accessibility, usageStats = _a.usageStats, overlay = _a.overlay, battery = _a.battery;
                // এখানে ব্যাটারি বা অন্য কোনো হার্ডওয়্যার স্ট্যাটাস দিয়ে লজিক চেক করা হয়
                return [2 /*return*/, 'prompt'];
            case 3:
                e_3 = _b.sent();
                return [2 /*return*/, 'unknown'];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.checkExactAlarmPermission = checkExactAlarmPermission;
var requestExactAlarmPermission = function () { return __awaiter(void 0, void 0, Promise, function () {
    var e_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isNative || !isAndroid)
                    return [2 /*return*/, 'granted'];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                // জাভা ব্রিজের মাধ্যমে সেটিংস ওপেন
                return [4 /*yield*/, shieldPlugin_1.default.requestBattery()];
            case 2:
                // জাভা ব্রিজের মাধ্যমে সেটিংস ওপেন
                _a.sent();
                return [2 /*return*/, 'prompt'];
            case 3:
                e_4 = _a.sent();
                return [2 /*return*/, 'denied'];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.requestExactAlarmPermission = requestExactAlarmPermission;
/**
 * ৩. Usage Stats Permission (Stay Focused এর জন্য সবচেয়ে জরুরি)
 */
var checkUsageStatsPermission = function () { return __awaiter(void 0, void 0, Promise, function () {
    var usageStats, e_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isNative || !isAndroid)
                    return [2 /*return*/, 'granted'];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, shieldPlugin_1.default.checkPermissions()];
            case 2:
                usageStats = (_a.sent()).usageStats;
                return [2 /*return*/, usageStats ? 'granted' : 'prompt'];
            case 3:
                e_5 = _a.sent();
                return [2 /*return*/, 'unknown'];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.checkUsageStatsPermission = checkUsageStatsPermission;
var requestUsageStatsPermission = function () { return __awaiter(void 0, void 0, Promise, function () {
    var e_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isNative || !isAndroid)
                    return [2 /*return*/, 'granted'];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, shieldPlugin_1.default.requestUsageStats()];
            case 2:
                _a.sent();
                return [2 /*return*/, 'prompt'];
            case 3:
                e_6 = _a.sent();
                return [2 /*return*/, 'denied'];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.requestUsageStatsPermission = requestUsageStatsPermission;
/**
 * ৪. Display Over Other Apps (Overlay)
 */
var checkOverlayPermission = function () { return __awaiter(void 0, void 0, Promise, function () {
    var overlay, e_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isNative || !isAndroid)
                    return [2 /*return*/, 'granted'];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, shieldPlugin_1.default.checkPermissions()];
            case 2:
                overlay = (_a.sent()).overlay;
                return [2 /*return*/, overlay ? 'granted' : 'prompt'];
            case 3:
                e_7 = _a.sent();
                return [2 /*return*/, 'unknown'];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.checkOverlayPermission = checkOverlayPermission;
var requestOverlayPermission = function () { return __awaiter(void 0, void 0, Promise, function () {
    var e_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isNative || !isAndroid)
                    return [2 /*return*/, 'granted'];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, shieldPlugin_1.default.requestOverlay()];
            case 2:
                _a.sent();
                return [2 /*return*/, 'prompt'];
            case 3:
                e_8 = _a.sent();
                return [2 /*return*/, 'denied'];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.requestOverlayPermission = requestOverlayPermission;
/**
 * ৫. Accessibility Service (Hardcore App Blocking)
 */
var checkAccessibilityPermission = function () { return __awaiter(void 0, void 0, Promise, function () {
    var accessibility, e_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isNative || !isAndroid)
                    return [2 /*return*/, 'granted'];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, shieldPlugin_1.default.checkPermissions()];
            case 2:
                accessibility = (_a.sent()).accessibility;
                return [2 /*return*/, accessibility ? 'granted' : 'prompt'];
            case 3:
                e_9 = _a.sent();
                return [2 /*return*/, 'unknown'];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.checkAccessibilityPermission = checkAccessibilityPermission;
var requestAccessibilityPermission = function () { return __awaiter(void 0, void 0, Promise, function () {
    var e_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isNative || !isAndroid)
                    return [2 /*return*/, 'granted'];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, shieldPlugin_1.default.requestAccessibility()];
            case 2:
                _a.sent();
                return [2 /*return*/, 'prompt'];
            case 3:
                e_10 = _a.sent();
                return [2 /*return*/, 'denied'];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.requestAccessibilityPermission = requestAccessibilityPermission;
/**
 * ৬. Battery Optimization (Background Stability)
 */
var checkBatteryPermission = function () { return __awaiter(void 0, void 0, Promise, function () {
    var battery, e_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isNative || !isAndroid)
                    return [2 /*return*/, 'granted'];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, shieldPlugin_1.default.checkPermissions()];
            case 2:
                battery = (_a.sent()).battery;
                return [2 /*return*/, battery ? 'granted' : 'prompt'];
            case 3:
                e_11 = _a.sent();
                return [2 /*return*/, 'unknown'];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.checkBatteryPermission = checkBatteryPermission;
var requestBatteryPermission = function () { return __awaiter(void 0, void 0, Promise, function () {
    var e_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isNative || !isAndroid)
                    return [2 /*return*/, 'granted'];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, shieldPlugin_1.default.requestBattery()];
            case 2:
                _a.sent();
                return [2 /*return*/, 'prompt'];
            case 3:
                e_12 = _a.sent();
                return [2 /*return*/, 'denied'];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.requestBatteryPermission = requestBatteryPermission;
