import { registerPlugin } from '@capacitor/core';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type BlurGender = 'FEMALE' | 'MALE' | 'BOTH';
export type BlurStyle  = 'PIXELATE' | 'FROSTED' | 'SOLID' | 'MOSAIC';

export interface PureShieldConfig {
  blurGender:           BlurGender;
  blurStyle:            BlurStyle;
  confidenceThreshold:  number; // 0.0 – 1.0, default 0.72
  blurOpacity:          number; // 20-100
  blurPaddingPct:       number; // 0-80
  minFaceSizePct:       number; // 1-50
  debugOverlay:         boolean;
  enabled:              boolean;
  pauseOnBatteryBelow20: boolean;
}

export interface InstalledApp {
  packageName: string;
  appName:     string;
}

export interface PermissionStatus {
  overlay:    boolean;
  projection: boolean;
}

export interface AdaptiveStatus {
  deviceTier:      string;
  sampleIntervalMs: number;
  batteryLevel:    number;
  thermalStatus:   number;
  lastInferenceMs: number;
}

export type ModelStatusCode = 'OK' | 'MODEL_FAILED' | 'MODEL_EMPTY' | 'UNKNOWN';

export interface ModelStatus {
  status: ModelStatusCode;
  reason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Plugin interface
// ─────────────────────────────────────────────────────────────────────────────

export interface PureShieldPluginInterface {
  checkPermissions():            Promise<PermissionStatus>;
  requestOverlayPermission():    Promise<{ granted: boolean }>;
  requestMediaProjection():      Promise<{ granted: boolean }>;

  startPureShield():             Promise<{ started: boolean }>;
  stopPureShield():              Promise<void>;
  isRunning():                   Promise<{ running: boolean }>;

  setConfig(config: Partial<PureShieldConfig>): Promise<void>;
  getConfig():                   Promise<PureShieldConfig>;

  setTargetApps(data: { packages: string[] }): Promise<void>;
  getTargetApps():               Promise<{ packages: string[] }>;
  getInstalledApps():            Promise<{ apps: InstalledApp[] }>;

  getAdaptiveStatus():           Promise<AdaptiveStatus>;
  getModelStatus():              Promise<ModelStatus>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Register
// ─────────────────────────────────────────────────────────────────────────────

export const PureShieldPlugin = registerPlugin<PureShieldPluginInterface>(
  'PureShield',
  {
    // Web stub for browser dev environment
    web: () => import('./pureShieldWeb').then(m => new m.PureShieldWeb()),
  }
);
