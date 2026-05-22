import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PureShieldPlugin,
  type PureShieldConfig,
  type PermissionStatus,
  type AdaptiveStatus,
  type InstalledApp,
  type ModelStatus,
} from '@/lib/capacitor/pureShieldPlugin';

const DEFAULT_CONFIG: PureShieldConfig = {
  blurGender: 'FEMALE',
  blurStyle: 'PIXELATE',
  confidenceThreshold: 0.72,
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
}

export function usePureShield() {
  const [config, setConfig] = useState<PureShieldConfig>(DEFAULT_CONFIG);
  const [permissions, setPermissions] = useState<PermissionStatus>({ overlay: false, projection: false });
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<AdaptiveStatus | null>(null);
  const [targetApps, setTargetApps] = useState<string[]>([]);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus>({ status: 'UNKNOWN' });

  // ✅ Live stats
  const [liveStats, setLiveStats] = useState<LiveStats>({
    totalFrames: 0,
    totalFaces: 0,
    totalBlurred: 0,
    lastInferenceMs: 0,
    lastDebugMessage: 'Not started yet',
    modelStatus: 'UNKNOWN',
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      setConfig({ ...DEFAULT_CONFIG, ...c });
      setRunning(r.running);
      setTargetApps(t.packages);
      setModelStatus(m);
    } catch (e) {
      console.warn('PureShield refresh failed', e);
    }
  }, []);

  const updateConfig = useCallback(async (patch: Partial<PureShieldConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    try { await PureShieldPlugin.setConfig(patch); } catch (e) { console.warn(e); }
  }, [config]);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PureShieldPlugin.startPureShield();
      setRunning(!!res.started);
      return !!res.started;
    } finally { setLoading(false); }
  }, []);

  const stop = useCallback(async () => {
    setLoading(true);
    try {
      await PureShieldPlugin.stopPureShield();
      setRunning(false);
      // Reset live stats on stop
      setLiveStats({
        totalFrames: 0,
        totalFaces: 0,
        totalBlurred: 0,
        lastInferenceMs: 0,
        lastDebugMessage: 'Stopped',
        modelStatus: 'UNKNOWN',
      });
      setStatus(null);
    } finally { setLoading(false); }
  }, []);

  const requestOverlay = useCallback(async () => {
    const r = await PureShieldPlugin.requestOverlayPermission();
    setPermissions(p => ({ ...p, overlay: r.granted }));
    return r.granted;
  }, []);

  const requestProjection = useCallback(async () => {
    const r = await PureShieldPlugin.requestMediaProjection();
    if (r.granted) {
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

  const loadInstalledApps = useCallback(async () => {
    try {
      const { apps } = await PureShieldPlugin.getInstalledApps();
      setInstalledApps(apps);
    } catch (e) { console.warn(e); }
  }, []);

  const toggleTargetApp = useCallback(async (pkg: string) => {
    const next = targetApps.includes(pkg)
      ? targetApps.filter(p => p !== pkg)
      : [...targetApps, pkg];
    setTargetApps(next);
    try { await PureShieldPlugin.setTargetApps({ packages: next }); } catch (e) { console.warn(e); }
  }, [targetApps]);

  // ✅ Poll live stats when running
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);

    if (!running) return;

    const poll = async () => {
      try {
        const [adaptive, model, stats] = await Promise.all([
          PureShieldPlugin.getAdaptiveStatus().catch(() => null),
          PureShieldPlugin.getModelStatus().catch(() => null),
          // ✅ getLiveStats — add to pureShieldPlugin.ts
          (PureShieldPlugin as any).getLiveStats?.().catch(() => null),
        ]);

        if (adaptive) setStatus(adaptive);
        if (model) setModelStatus(model);
        if (stats) {
          setLiveStats({
            totalFrames: stats.totalFrames ?? 0,
            totalFaces: stats.totalFaces ?? 0,
            totalBlurred: stats.totalBlurred ?? 0,
            lastInferenceMs: stats.lastInferenceMs ?? 0,
            lastDebugMessage: stats.lastDebugMessage ?? '',
            modelStatus: stats.modelStatus ?? 'UNKNOWN',
          });
        }
      } catch (e) {
        console.warn('Poll error:', e);
      }
    };

    poll(); // immediate first call
    pollRef.current = setInterval(poll, 1500); // poll every 1.5s

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [running]);

  useEffect(() => { refresh(); }, [refresh]);

  return {
    config,
    permissions,
    running,
    status,
    modelStatus,
    liveStats,        // ✅ NEW
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
