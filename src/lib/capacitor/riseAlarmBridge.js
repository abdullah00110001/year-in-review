"use strict";
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
exports.cancelRiseAlarm = exports.scheduleRiseAlarm = exports.openExactAlarmSettings = exports.canScheduleExactAlarms = void 0;
var core_1 = require("@capacitor/core");
// ক্যাপাসিটরের সাথে নেটিভ জাভা প্লাগিন (RisePlugin) এর কানেকশন
var RisePlugin = (0, core_1.registerPlugin)('RiseAlarmPlugin');
var isNative = core_1.Capacitor.isNativePlatform();
var isAndroid = core_1.Capacitor.getPlatform() === 'android';
// ==========================================
// ⏰ পারমিশন লজিক (Exact Alarms)
// ==========================================
var canScheduleExactAlarms = function () { return __awaiter(void 0, void 0, Promise, function () {
    var result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // ওয়েব বা আইওএস হলে বাই-ডিফল্ট ট্রু রিটার্ন করবে, কারণ সেখানে এই পারমিশন লাগে না
                if (!isNative || !isAndroid)
                    return [2 /*return*/, true];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, RisePlugin.canScheduleExactAlarms()];
            case 2:
                result = _a.sent();
                return [2 /*return*/, result.granted];
            case 3:
                error_1 = _a.sent();
                console.error('[RiseBridge] Error checking exact alarm permission:', error_1);
                return [2 /*return*/, false]; // এরর দিলে ফলস রিটার্ন করবে, যাতে সেটিংস পেজ ওপেন করার সুযোগ পায়
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.canScheduleExactAlarms = canScheduleExactAlarms;
var openExactAlarmSettings = function () { return __awaiter(void 0, void 0, Promise, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isNative || !isAndroid) {
                    console.warn('[RiseBridge] Exact alarm settings are only available on Android native app.');
                    return [2 /*return*/];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, RisePlugin.openExactAlarmSettings()];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                console.error('[RiseBridge] Error opening exact alarm settings:', error_2);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.openExactAlarmSettings = openExactAlarmSettings;
// ==========================================
// 🚀 অ্যালার্ম কন্ট্রোল লজিক (Set / Cancel)
// ==========================================
var scheduleRiseAlarm = function (id, timeInMillis, title, body) { return __awaiter(void 0, void 0, Promise, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isNative) {
                    console.log("[RiseBridge - Web] Mock Alarm scheduled for ID: ".concat(id, " at ").concat(new Date(timeInMillis).toLocaleString()));
                    return [2 /*return*/, true]; // ওয়েবে শুধু কনসোল লগ করবে
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, RisePlugin.scheduleAlarm({ id: id, timeInMillis: timeInMillis, title: title, body: body })];
            case 2:
                _a.sent();
                console.log("[RiseBridge] Alarm ".concat(id, " set successfully for ").concat(new Date(timeInMillis).toLocaleString()));
                return [2 /*return*/, true];
            case 3:
                error_3 = _a.sent();
                console.error("[RiseBridge] Failed to schedule alarm ".concat(id, ":"), error_3);
                return [2 /*return*/, false];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.scheduleRiseAlarm = scheduleRiseAlarm;
var cancelRiseAlarm = function (id) { return __awaiter(void 0, void 0, Promise, function () {
    var error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!isNative) {
                    console.log("[RiseBridge - Web] Mock Alarm cancelled for ID: ".concat(id));
                    return [2 /*return*/, true];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, RisePlugin.cancelAlarm({ id: id })];
            case 2:
                _a.sent();
                console.log("[RiseBridge] Alarm ".concat(id, " cancelled successfully."));
                return [2 /*return*/, true];
            case 3:
                error_4 = _a.sent();
                console.error("[RiseBridge] Failed to cancel alarm ".concat(id, ":"), error_4);
                return [2 /*return*/, false];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.cancelRiseAlarm = cancelRiseAlarm;
