import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PureShieldPlugin,
  type PureShieldConfig,
  type PermissionStatus,
  type AdaptiveStatus,
  type InstalledApp,
  type ModelStatus,
} from '@/lib/capacitor/pureShieldPlugin';
import type { BlurStyle } from '@/components/shield/pureShield/types';

const DEFAULT_CONFIG: PureShieldConfig = {
  blurGender: 'BOTH',
  blurStyle: 'BLUR' as BlurStyle,   // ✅ new default
  confidenceThreshold: 0.60,
  blurOpacity: 100,
  blurPaddingPct: 15,
  minFaceSizePct: 2,
  maxFaces: 100,
  debugOverlay: false,
  enabled: false,
  pauseOnBatteryBelow20: true,
};

// ✅ Live stats type
export interface LiveStats {
  totalFrames: number;
  totalFaces: number;
  totalBlurred: number;
  lastInferenceMs: number;
  lastDebugMessage: string;
  modelStatus: string;
  foregroundApp?: string;
  blazeMaxScore?: number;
  blazeAboveCount?: number;
  blazeKeptCount?: number;
  overlayCount?: number;
  genderModelLoaded?: boolean;
}

export function usePureShield() {
  const [config, setConfig]           = useState<PureShieldConfig>(DEFAULT_CONFIG);
  const [permissions, setPermissions] = useState<PermissionStatus>({ overlay: false, projection: false });
  const [running, setRunning]         = useState(false);
  const [status, setStatus]           = useState<AdaptiveStatus | null>(null);
  const [targetApps, setTargetApps]   = useState<string[]>([]);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading]         = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus>({ status: 'UNKNOWN' });

  const [liveStats, setLiveStats] = useState<LiveStats>({
    totalFrames: 0,
    totalFaces: 0,
    totalBlurred: 0,
    lastInferenceMs: 0,
    lastDebugMessage: 'Not started yet',
    modelStatus: 'UNKNOWN',
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Refresh all state from native
  // ─────────────────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const [p, c, r, t, m] = await Promise.all([
        PureShieldPlugin.checkPermissions(),
        PureShieldPlugin.getConfig().catch(() => DEFAULT_CONFIG),
        PureShieldPlugin.isRunning().catch(() => ({ running: false })),
        PureShieldPlugin.getTargetApps().catch(() => ({ packages: [] })),
        PureShieldPlugin.getModelStatus().catch(() => ({ status: 'UNKNOWN' as const })),
      ]);
      setPermissions(p);
      // ✅ Merge with defaults so unknown/old saved values don't break UI
      setConfig({ ...DEFAULT_CONFIG, ...c });
      setRunning(r.running);
      setTargetApps(t.packages);
      setModelStatus(m);
    } catch (e) {
      console.warn('PureShield refresh failed', e);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Config
  // ─────────────────────────────────────────────────────────────────────────
  const updateConfig = useCallback(async (patch: Partial<PureShieldConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    try {
      await PureShieldPlugin.setConfig(patch);
    } catch (e) {
      console.warn('setConfig failed', e);
    }
  }, [config]);

  // ─────────────────────────────────────────────────────────────────────────
  // Start / Stop
  // ─────────────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PureShieldPlugin.startPureShield();
      setRunning(!!res.started);
      return !!res.started;
    } finally {
      setLoading(false);
    }
  }, []);

  const stop = useCallback(async () => {
    setLoading(true);
    try {
      await PureShieldPlugin.stopPureShield();
      setRunning(false);
      setStatus(null);
      setLiveStats({
        totalFrames: 0,
        totalFaces: 0,
        totalBlurred: 0,
        lastInferenceMs: 0,
        lastDebugMessage: 'Stopped',
        modelStatus: 'UNKNOWN',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Permissions
  // ─────────────────────────────────────────────────────────────────────────
  const requestOverlay = useCallback(async () => {
    const r = await PureShieldPlugin.requestOverlayPermission();
    setPermissions(p => ({ ...p, overlay: r.granted }));
    return r.granted;
  }, []);

  const requestProjection = useCallback(async () => {
    const r = await PureShieldPlugin.requestMediaProjection();
    if (r.granted) {
      // ✅ Poll until service confirms it's running (up to 3 seconds)
      let runningState = await PureShieldPlugin.isRunning().catch(() => ({ running: false }));
      for (let i = 0; i < 10 && !runningState.running; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        runningState = await PureShieldPlugin.isRunning().catch(() => ({ running: false }));
      }
      setRunning(runningState.running);
      setPermissions(p => ({ ...p, projection: runningState.running }));
      const model = await PureShieldPlugin.getModelStatus().catch(() => null);
      if (model) setModelStatus(model);
    } else {
      setPermissions(p => ({ ...p, projection: false }));
    }
    return r.granted;
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Apps
  // ─────────────────────────────────────────────────────────────────────────
  const loadInstalledApps = useCallback(async () => {
    try {
      const { apps } = await PureShieldPlugin.getInstalledApps();
      setInstalledApps(apps);
    } catch (e) {
      console.warn('loadInstalledApps failed', e);
    }
  }, []);

  const toggleTargetApp = useCallback(async (pkg: string) => {
    const next = targetApps.includes(pkg)
      ? targetApps.filter(p => p !== pkg)
      : [...targetApps, pkg];
    setTargetApps(next);
    try {
      await PureShieldPlugin.setTargetApps({ packages: next });
    } catch (e) {
      console.warn('setTargetApps failed', e);
    }
  }, [targetApps]);

  // ─────────────────────────────────────────────────────────────────────────
  // ✅ Live stats polling — runs while service is active
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (!running) return;

    const poll = async () => {
      try {
        const [adaptive, model, stats] = await Promise.all([
          PureShieldPlugin.getAdaptiveStatus().catch(() => null),
          PureShieldPlugin.getModelStatus().catch(() => null),
          (PureShieldPlugin as any).getLiveStats?.().catch(() => null),
        ]);

        if (adaptive) setStatus(adaptive);
        if (model)    setModelStatus(model);

        if (stats) {
          setLiveStats({
            totalFrames:      stats.totalFrames      ?? 0,
            totalFaces:       stats.totalFaces       ?? 0,
            totalBlurred:     stats.totalBlurred     ?? 0,
            lastInferenceMs:  stats.lastInferenceMs  ?? 0,
            lastDebugMessage: stats.lastDebugMessage ?? '',
            modelStatus:      stats.modelStatus      ?? 'UNKNOWN',
            foregroundApp:    stats.foregroundApp    ?? '',
            blazeMaxScore:    stats.blazeMaxScore    ?? 0,
            blazeAboveCount:  stats.blazeAboveCount  ?? 0,
            blazeKeptCount:   stats.blazeKeptCount   ?? 0,
            overlayCount:     stats.overlayCount     ?? 0,
            genderModelLoaded: stats.genderModelLoaded ?? false,
          });
        }
      } catch (e) {
        console.warn('Poll error:', e);
      }
    };

    poll(); // immediate
    pollRef.current = setInterval(poll, 1500);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [running]);

  // ─────────────────────────────────────────────────────────────────────────
  // Init
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => { refresh(); }, [refresh]);

  return {
    config,
    permissions,
    running,
    status,
    modelStatus,
    liveStats,
    targetApps,
    installedApps,
    loading,
    refresh,
    updateConfig,
    start,
    stop,
    requestOverlay,
    requestProjection,
    loadInstalledApps,
    toggleTargetApp,
  };
}

export default usePureShield;
