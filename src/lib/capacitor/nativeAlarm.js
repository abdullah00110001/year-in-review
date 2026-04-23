"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.rescheduleAllAlarmsAfterBoot = exports.restoreAlarmsOnBoot = exports.setupAlarmListeners = exports.triggerAlarmVibration = exports.getPendingAlarms = exports.dismissAlarm = exports.snoozeAlarm = exports.cancelAllAlarms = exports.cancelAlarmByUuid = exports.cancelAlarm = exports.scheduleRecurringAlarm = exports.scheduleAlarm = exports.registerAlarmActions = exports.initializeAlarmChannel = exports.requestAlarmPermission = exports.requestAllAlarmPermissions = exports.checkAlarmPermission = exports.checkAllAlarmPermissions = exports.uuidToNumericId = void 0;
var core_1 = require("@capacitor/core");
var app_1 = require("@capacitor/app");
var local_notifications_1 = require("@capacitor/local-notifications");
var preferences_1 = require("@capacitor/preferences");
var haptics_1 = require("@capacitor/haptics");
var riseAlarmBridge_1 = require("./riseAlarmBridge");
var ALARM_STORAGE_KEY = 'scheduled_alarms';
var RISE_ALARM_CHANNEL_ID = 'rise_alarm_native_v2';
var listenersRegistered = false;
function uuidToNumericId(value) {
    var hash = 0;
    for (var i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % 100000;
}
exports.uuidToNumericId = uuidToNumericId;
function checkAllAlarmPermissions() {
    return __awaiter(this, void 0, void 0, function () {
        var notifPerm, exactAlarm;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!core_1.Capacitor.isNativePlatform()) {
                        return [2 /*return*/, { notifications: true, exactAlarm: true }];
                    }
                    return [4 /*yield*/, local_notifications_1.LocalNotifications.checkPermissions()];
                case 1:
                    notifPerm = _a.sent();
                    return [4 /*yield*/, (0, riseAlarmBridge_1.canScheduleExactAlarms)()];
                case 2:
                    exactAlarm = _a.sent();
                    return [2 /*return*/, {
                            notifications: notifPerm.display === 'granted',
                            exactAlarm: exactAlarm,
                        }];
            }
        });
    });
}
exports.checkAllAlarmPermissions = checkAllAlarmPermissions;
function checkAlarmPermission() {
    return __awaiter(this, void 0, Promise, function () {
        var perms;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, checkAllAlarmPermissions()];
                case 1:
                    perms = _a.sent();
                    return [2 /*return*/, perms.notifications && perms.exactAlarm];
            }
        });
    });
}
exports.checkAlarmPermission = checkAlarmPermission;
function requestAllAlarmPermissions() {
    return __awaiter(this, void 0, Promise, function () {
        var notifPerm;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!core_1.Capacitor.isNativePlatform())
                        return [2 /*return*/, true];
                    return [4 /*yield*/, local_notifications_1.LocalNotifications.requestPermissions()];
                case 1:
                    notifPerm = _a.sent();
                    return [2 /*return*/, notifPerm.display === 'granted'];
            }
        });
    });
}
exports.requestAllAlarmPermissions = requestAllAlarmPermissions;
function requestAlarmPermission() {
    return __awaiter(this, void 0, Promise, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, requestAllAlarmPermissions()];
        });
    });
}
exports.requestAlarmPermission = requestAlarmPermission;
function initializeAlarmChannel() {
    return __awaiter(this, void 0, Promise, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!core_1.Capacitor.isNativePlatform())
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, riseAlarmBridge_1.ensureNativeAlarmChannel)()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Failed to initialize alarm channel', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.initializeAlarmChannel = initializeAlarmChannel;
function registerAlarmActions() {
    return __awaiter(this, void 0, Promise, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!core_1.Capacitor.isNativePlatform())
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, local_notifications_1.LocalNotifications.registerActionTypes({
                            types: [
                                {
                                    id: 'ALARM_ACTIONS',
                                    actions: [
                                        { id: 'dismiss', title: 'Dismiss' },
                                        { id: 'snooze', title: 'Snooze' },
                                    ],
                                },
                            ],
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Failed to register alarm actions', error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.registerAlarmActions = registerAlarmActions;
function scheduleAlarm(config) {
    return __awaiter(this, void 0, Promise, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!core_1.Capacitor.isNativePlatform()) {
                        console.log('Web alarm scheduled', config);
                        return [2 /*return*/, true];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, local_notifications_1.LocalNotifications.schedule({
                            notifications: [
                                {
                                    id: config.id,
                                    title: config.title,
                                    body: config.body,
                                    schedule: { at: config.scheduledAt, allowWhileIdle: true },
                                    channelId: RISE_ALARM_CHANNEL_ID,
                                    actionTypeId: 'ALARM_ACTIONS',
                                    extra: {
                                        missionType: config.missionType,
                                        snoozeMinutes: config.snoozeMinutes || 5,
                                        alarmDbId: config.alarmDbId,
                                        originalId: config.id,
                                        intention: config.intention,
                                        whoDepends: config.whoDepends,
                                        isGroupAlarm: config.isGroupAlarm,
                                        groupId: config.groupId,
                                    },
                                    autoCancel: false,
                                    ongoing: true,
                                },
                            ],
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, saveAlarmToStorage(config)];
                case 3:
                    _a.sent();
                    return [2 /*return*/, true];
                case 4:
                    error_3 = _a.sent();
                    console.error('Schedule alarm failed', error_3);
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.scheduleAlarm = scheduleAlarm;
// FIX: Android এ শুধু Native Alarm। ডাবল নোটিফিকেশন বন্ধ।
function scheduleRecurringAlarm(uuid, time, daysOfWeek, config) {
    return __awaiter(this, void 0, Promise, function () {
        var _a, hours, minutes, baseId, i, nextDate, success;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = time.split(':').map(Number), hours = _a[0], minutes = _a[1];
                    baseId = uuidToNumericId(uuid);
                    return [4 /*yield*/, cancelAlarmByUuid(uuid)];
                case 1:
                    _b.sent();
                    if (!core_1.Capacitor.isNativePlatform()) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, riseAlarmBridge_1.scheduleNativeAlarmShots)(uuid, time, daysOfWeek, {
                            title: config.title,
                            body: config.body,
                            missionType: config.missionType,
                        })];
                case 2:
                    _b.sent();
                    return [2 /*return*/, true];
                case 3:
                    i = 0;
                    _b.label = 4;
                case 4:
                    if (!(i < 7)) return [3 /*break*/, 7];
                    if (!daysOfWeek.includes(i))
                        return [3 /*break*/, 6];
                    nextDate = getNextDayOfWeek(i, hours, minutes);
                    return [4 /*yield*/, scheduleAlarm(__assign(__assign({ id: baseId + i }, config), { scheduledAt: nextDate }))];
                case 5:
                    success = _b.sent();
                    if (!success)
                        return [2 /*return*/, false];
                    _b.label = 6;
                case 6:
                    i += 1;
                    return [3 /*break*/, 4];
                case 7: return [2 /*return*/, true];
            }
        });
    });
}
exports.scheduleRecurringAlarm = scheduleRecurringAlarm;
function cancelAlarm(id) {
    return __awaiter(this, void 0, Promise, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!core_1.Capacitor.isNativePlatform())
                        return [2 /*return*/, true];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, local_notifications_1.LocalNotifications.cancel({ notifications: [{ id: id }] })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, true];
                case 3:
                    error_4 = _a.sent();
                    console.error('Cancel alarm failed', error_4);
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.cancelAlarm = cancelAlarm;
function cancelAlarmByUuid(uuid) {
    return __awaiter(this, void 0, Promise, function () {
        var baseId, ids, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    baseId = uuidToNumericId(uuid);
                    ids = Array.from({ length: 7 }, function (_, i) { return ({ id: baseId + i }); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    if (!core_1.Capacitor.isNativePlatform()) return [3 /*break*/, 4];
                    return [4 /*yield*/, local_notifications_1.LocalNotifications.cancel({ notifications: ids })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, riseAlarmBridge_1.cancelNativeAlarmShots)(uuid)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [4 /*yield*/, removeAlarmFromStorage(baseId)];
                case 5:
                    _a.sent();
                    return [2 /*return*/, true];
                case 6:
                    error_5 = _a.sent();
                    console.error('Cancel alarm by uuid failed', error_5);
                    return [2 /*return*/, false];
                case 7: return [2 /*return*/];
            }
        });
    });
}
exports.cancelAlarmByUuid = cancelAlarmByUuid;
function cancelAllAlarms() {
    return __awaiter(this, void 0, Promise, function () {
        var pending, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!core_1.Capacitor.isNativePlatform()) return [3 /*break*/, 3];
                    return [4 /*yield*/, local_notifications_1.LocalNotifications.getPending()];
                case 1:
                    pending = _a.sent();
                    if (!(pending.notifications.length > 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, local_notifications_1.LocalNotifications.cancel({
                            notifications: pending.notifications.map(function (n) { return ({ id: n.id }); }),
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [4 /*yield*/, preferences_1.Preferences.remove({ key: ALARM_STORAGE_KEY })];
                case 4:
                    _a.sent();
                    return [2 /*return*/, true];
                case 5:
                    error_6 = _a.sent();
                    console.error('Cancel all alarms failed', error_6);
                    return [2 /*return*/, false];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.cancelAllAlarms = cancelAllAlarms;
function snoozeAlarm(id, minutes) {
    if (minutes === void 0) { minutes = 5; }
    return __awaiter(this, void 0, Promise, function () {
        var pending, existing, nextAt, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!core_1.Capacitor.isNativePlatform())
                        return [2 /*return*/, true];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, local_notifications_1.LocalNotifications.getPending()];
                case 2:
                    pending = _a.sent();
                    existing = pending.notifications.find(function (notification) { return notification.id === id; });
                    return [4 /*yield*/, cancelAlarm(id)];
                case 3:
                    _a.sent();
                    nextAt = new Date(Date.now() + minutes * 60 * 1000);
                    return [4 /*yield*/, local_notifications_1.LocalNotifications.schedule({
                            notifications: [
                                {
                                    id: id,
                                    title: (existing === null || existing === void 0 ? void 0 : existing.title) || 'Rise Alarm',
                                    body: (existing === null || existing === void 0 ? void 0 : existing.body) || 'Time to wake up!',
                                    schedule: { at: nextAt, allowWhileIdle: true },
                                    channelId: RISE_ALARM_CHANNEL_ID,
                                    actionTypeId: 'ALARM_ACTIONS',
                                    extra: __assign(__assign({}, ((existing === null || existing === void 0 ? void 0 : existing.extra) || {})), { snoozed: true }),
                                    autoCancel: false,
                                    ongoing: true,
                                },
                            ],
                        })];
                case 4:
                    _a.sent();
                    return [2 /*return*/, true];
                case 5:
                    error_7 = _a.sent();
                    console.error('Snooze alarm failed', error_7);
                    return [2 /*return*/, false];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.snoozeAlarm = snoozeAlarm;
function dismissAlarm(id, userId) {
    return __awaiter(this, void 0, Promise, function () {
        return __generator(this, function (_a) {
            if (userId) {
                console.log('Dismiss alarm for user', userId);
            }
            return [2 /*return*/, cancelAlarm(id)];
        });
    });
}
exports.dismissAlarm = dismissAlarm;
function getPendingAlarms() {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!core_1.Capacitor.isNativePlatform())
                        return [2 /*return*/, []];
                    return [4 /*yield*/, local_notifications_1.LocalNotifications.getPending()];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.notifications];
            }
        });
    });
}
exports.getPendingAlarms = getPendingAlarms;
function triggerAlarmVibration() {
    return __awaiter(this, void 0, Promise, function () {
        var error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, haptics_1.Haptics.vibrate({ duration: 800 })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, true];
                case 2:
                    error_8 = _a.sent();
                    console.error('Alarm vibration failed', error_8);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.triggerAlarmVibration = triggerAlarmVibration;
function setupAlarmListeners(onTriggered, onAction) {
    if (!core_1.Capacitor.isNativePlatform() || listenersRegistered)
        return;
    listenersRegistered = true;
    local_notifications_1.LocalNotifications.addListener('localNotificationReceived', function (notification) {
        onTriggered(notification.id, notification.extra);
    });
    local_notifications_1.LocalNotifications.addListener('localNotificationActionPerformed', function (result) {
        onAction(result.notification.id, result.actionId);
    });
}
exports.setupAlarmListeners = setupAlarmListeners;
function restoreAlarmsOnBoot() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            if (!core_1.Capacitor.isNativePlatform())
                return [2 /*return*/];
            app_1.App.addListener('appStateChange', function (_a) {
                var isActive = _a.isActive;
                return __awaiter(_this, void 0, void 0, function () {
                    var stored, alarms, now, _i, alarms_1, alarm, scheduledAt;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                if (!isActive)
                                    return [2 /*return*/];
                                return [4 /*yield*/, preferences_1.Preferences.get({ key: ALARM_STORAGE_KEY })];
                            case 1:
                                stored = _b.sent();
                                if (!stored.value)
                                    return [2 /*return*/];
                                alarms = JSON.parse(stored.value);
                                now = new Date();
                                _i = 0, alarms_1 = alarms;
                                _b.label = 2;
                            case 2:
                                if (!(_i < alarms_1.length)) return [3 /*break*/, 5];
                                alarm = alarms_1[_i];
                                scheduledAt = new Date(alarm.scheduledAt);
                                if (!(scheduledAt > now)) return [3 /*break*/, 4];
                                return [4 /*yield*/, scheduleAlarm(__assign(__assign({}, alarm), { scheduledAt: scheduledAt }))];
                            case 3:
                                _b.sent();
                                _b.label = 4;
                            case 4:
                                _i++;
                                return [3 /*break*/, 2];
                            case 5: return [2 /*return*/];
                        }
                    });
                });
            });
            return [2 /*return*/];
        });
    });
}
exports.restoreAlarmsOnBoot = restoreAlarmsOnBoot;
function rescheduleAllAlarmsAfterBoot(userId) {
    return __awaiter(this, void 0, Promise, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (userId) {
                        console.log('Rescheduling alarms for user', userId);
                    }
                    return [4 /*yield*/, restoreAlarmsOnBoot()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.rescheduleAllAlarmsAfterBoot = rescheduleAllAlarmsAfterBoot;
function getNextDayOfWeek(dayOfWeek, hours, minutes) {
    var now = new Date();
    var result = new Date();
    result.setHours(hours, minutes, 0, 0);
    var currentDay = now.getDay();
    var diff = dayOfWeek - currentDay;
    if (diff < 0 || (diff === 0 && result <= now))
        diff += 7;
    result.setDate(now.getDate() + diff);
    return result;
}
function saveAlarmToStorage(config) {
    return __awaiter(this, void 0, void 0, function () {
        var stored, alarms, index, next;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, preferences_1.Preferences.get({ key: ALARM_STORAGE_KEY })];
                case 1:
                    stored = _a.sent();
                    alarms = stored.value ? JSON.parse(stored.value) : [];
                    index = alarms.findIndex(function (alarm) { return alarm.id === config.id; });
                    next = __assign(__assign({}, config), { scheduledAt: new Date(config.scheduledAt) });
                    if (index >= 0)
                        alarms[index] = next;
                    else
                        alarms.push(next);
                    return [4 /*yield*/, preferences_1.Preferences.set({ key: ALARM_STORAGE_KEY, value: JSON.stringify(alarms) })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function removeAlarmFromStorage(baseId) {
    return __awaiter(this, void 0, void 0, function () {
        var stored, alarms, filtered;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, preferences_1.Preferences.get({ key: ALARM_STORAGE_KEY })];
                case 1:
                    stored = _a.sent();
                    if (!stored.value)
                        return [2 /*return*/];
                    alarms = JSON.parse(stored.value);
                    filtered = alarms.filter(function (alarm) { return !Array.from({ length: 7 }, function (_, i) { return baseId + i; }).includes(alarm.id); });
                    return [4 /*yield*/, preferences_1.Preferences.set({ key: ALARM_STORAGE_KEY, value: JSON.stringify(filtered) })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
