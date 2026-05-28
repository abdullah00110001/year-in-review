import { registerPlugin } from '@capacitor/core';

export type BlurGender = 'FEMALE' | 'MALE' | 'BOTH';
// ✅ New blur styles matching PureShieldBlurView.BlurStyle
export type BlurStyle = 'PIXELATE' | 'FROSTED' | 'SOLID' | 'MOSAIC' | 'BLUR' | 'SMUDGE' | 'DOTS';

export interface PureShieldConfig {
  blurGender:            BlurGender;
  blurStyle:             BlurStyle;
  confidenceThreshold:   number;
  enabled:               boolean;
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
  deviceTier:       string;
  sampleIntervalMs: number;
  batteryLevel:     number;
  thermalStatus:    number | string;
  lastInferenceMs:  number;
}

export type ModelStatusCode = 'OK' | 'MODEL_FAILED' | 'MODEL_EMPTY' | 'UNKNOWN';

export interface ModelStatus {
  status: ModelStatusCode;
  reason?: string;
}

export interface LiveStats {
  totalFrames:      number;
  totalFaces:       number;
  totalBlurred:     number;
  lastInferenceMs:  number;
  lastDebugMessage: string;
  modelStatus:      string;
}

export interface PureShieldPluginInterface {
  checkPermissions():         Promise<PermissionStatus>;
  requestOverlayPermission(): Promise<{ granted: boolean }>;
  requestMediaProjection():   Promise<{ granted: boolean }>;

  startPureShield():          Promise<{ started: boolean }>;
  stopPureShield():           Promise<void>;
  isRunning():                Promise<{ running: boolean }>;

  setConfig(config: Partial<PureShieldConfig>): Promise<void>;
  getConfig():                Promise<PureShieldConfig>;

  setTargetApps(data: { packages: string[] }): Promise<void>;
  getTargetApps():            Promise<{ packages: string[] }>;
  getInstalledApps():         Promise<{ apps: InstalledApp[] }>;

  getAdaptiveStatus():        Promise<AdaptiveStatus>;
  getModelStatus():           Promise<ModelStatus>;
  getLiveStats():             Promise<LiveStats>;
}

export const PureShieldPlugin = registerPlugin<PureShieldPluginInterface>(
  'PureShield',
  {
    web: () => import('./pureShieldWeb').then(m => new m.PureShieldWeb()),
  }
);
