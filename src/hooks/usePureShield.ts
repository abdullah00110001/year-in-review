import { useState, useEffect, useCallback, useRef } from 'react';
import { PureShieldPlugin, type PureShieldConfig, type InstalledApp } from '../lib/capacitor/pureShieldPlugin';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PureShieldState {
  isRunning:          boolean;
  isLoading:          boolean;
  hasOverlayPerm:     boolean;
  config:             PureShieldConfig;
  targetApps:         string[];
  installedApps:      InstalledApp[];
  adaptiveStatus:     AdaptiveStatusUI | null;
  error:              string | null;
}

export interface AdaptiveStatusUI {
  deviceTier:       string;
  sampleIntervalMs: number;
  batteryLevel:     number;
  lastInferenceMs:  number;
  thermalStatus:    number;
  thermalLabel:     string;
}

const DEFAULT_CONFIG: PureShieldConfig = {
  blurGender:           'FEMALE',
  blurStyle:            'PIXELATE',
  confidenceThreshold:  0.72,
  enabled:              false,
  pauseOnBatteryBelow20: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function usePureShield() {
  const [state, setState] = useState<PureShieldState>({
    isRunning:      false,
    isLoading:      true,
    hasOverlayPerm: false,
    config:         DEFAULT_CONFIG,
    targetApps:     [],
    installedApps:  [],
    adaptiveStatus: null,
    error:          null,
  });

  const statusIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Initial load ───────────────────────────────────────────────────────────

  const loadInitialState = useCallback(async () => {
    try {
      const [perms, config, targetAppsResult, appsResult, runningResult] = await Promise.all([
        PureShieldPlugin.checkPermissions(),
        PureShieldPlugin.getConfig(),
        PureShieldPlugin.getTargetApps(),
        PureShieldPlugin.getInstalledApps(),
        PureShieldPlugin.isRunning(),
      ]);

      setState(prev => ({
        ...prev,
        isLoading:      false,
        hasOverlayPerm: perms.overlay,
        config,
        targetApps:     targetAppsResult.packages,
        installedApps:  appsResult.apps,
        isRunning:      runningResult.running,
      }));
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false, error: String(err) }));
    }
  }, []);

  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);

  // ── Adaptive status polling (every 3s when running) ────────────────────────

  useEffect(() => {
    if (state.isRunning) {
      statusIntervalRef.current = setInterval(async () => {
        try {
          const status = await PureShieldPlugin.getAdaptiveStatus();
          setState(prev => ({
            ...prev,
            adaptiveStatus: {
              ...status,
              thermalLabel: getThermalLabel(status.thermalStatus),
            },
          }));
        } catch {}
      }, 3000);
    } else {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
    }
    return () => {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    };
  }, [state.isRunning]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const requestPermissions = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await PureShieldPlugin.requestOverlayPermission();
      setState(prev => ({
        ...prev,
        isLoading:      false,
        hasOverlayPerm: result.granted,
      }));
      return result.granted;
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false, error: String(err) }));
      return false;
    }
  }, []);

  const start = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await PureShieldPlugin.startPureShield();
      setState(prev => ({ ...prev, isLoading: false, isRunning: result.started }));
      return result.started;
    } catch (err: any) {
      const message = err?.message || String(err);
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      return false;
    }
  }, []);

  const stop = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await PureShieldPlugin.stopPureShield();
      setState(prev => ({ ...prev, isLoading: false, isRunning: false, adaptiveStatus: null }));
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false, error: String(err) }));
    }
  }, []);

  const toggle = useCallback(async () => {
    if (state.isRunning) return stop();
    if (!state.hasOverlayPerm) {
      const granted = await requestPermissions();
      if (!granted) return;
    }
    return start();
  }, [state.isRunning, state.hasOverlayPerm, start, stop, requestPermissions]);

  const updateConfig = useCallback(async (update: Partial<PureShieldConfig>) => {
    try {
      await PureShieldPlugin.setConfig(update);
      setState(prev => ({ ...prev, config: { ...prev.config, ...update } }));
    } catch (err) {
      setState(prev => ({ ...prev, error: String(err) }));
    }
  }, []);

  const toggleTargetApp = useCallback(async (packageName: string) => {
    const current = state.targetApps;
    const isSelected = current.includes(packageName);
    const updated = isSelected
      ? current.filter(p => p !== packageName)
      : [...current, packageName];

    setState(prev => ({ ...prev, targetApps: updated }));
    try {
      await PureShieldPlugin.setTargetApps({ packages: updated });
    } catch (err) {
      // rollback
      setState(prev => ({ ...prev, targetApps: current }));
    }
  }, [state.targetApps]);

  return {
    ...state,
    requestPermissions,
    start,
    stop,
    toggle,
    updateConfig,
    toggleTargetApp,
    refresh: loadInitialState,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getThermalLabel(status: number): string {
  switch (status) {
    case 0:  return 'Normal';
    case 1:  return 'Light';
    case 2:  return 'Moderate';
    case 3:  return 'Severe';
    case 4:  return 'Critical';
    case 5:  return 'Emergency';
    case 6:  return 'Shutdown';
    default: return 'Unknown';
  }
}
