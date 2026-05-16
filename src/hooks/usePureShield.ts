import { useCallback, useEffect, useState } from 'react';
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
  blurOpacity: 100,
  blurPaddingPct: 15,
  minFaceSizePct: 2,
  debugOverlay: false,
  enabled: false,
  pauseOnBatteryBelow20: true,
};

export function usePureShield() {
  const [config, setConfig] = useState<PureShieldConfig>(DEFAULT_CONFIG);
  const [permissions, setPermissions] = useState<PermissionStatus>({ overlay: false, projection: false });
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<AdaptiveStatus | null>(null);
  const [targetApps, setTargetApps] = useState<string[]>([]);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus>({ status: 'UNKNOWN' });

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
    try { await PureShieldPlugin.stopPureShield(); setRunning(false); }
    finally { setLoading(false); }
  }, []);

  const requestOverlay = useCallback(async () => {
    const r = await PureShieldPlugin.requestOverlayPermission();
    setPermissions(p => ({ ...p, overlay: r.granted }));
    return r.granted;
  }, []);

  const requestProjection = useCallback(async () => {
    const r = await PureShieldPlugin.requestMediaProjection();
    setPermissions(p => ({ ...p, projection: r.granted }));
    return r.granted;
  }, []);

  const loadInstalledApps = useCallback(async () => {
    try {
      const { apps } = await PureShieldPlugin.getInstalledApps();
      setInstalledApps(apps);
    } catch (e) { console.warn(e); }
  }, []);

  const toggleTargetApp = useCallback(async (pkg: string) => {
    const next = targetApps.includes(pkg) ? targetApps.filter(p => p !== pkg) : [...targetApps, pkg];
    setTargetApps(next);
    try { await PureShieldPlugin.setTargetApps({ packages: next }); } catch (e) { console.warn(e); }
  }, [targetApps]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(async () => {
      try { setStatus(await PureShieldPlugin.getAdaptiveStatus()); } catch {}
      try { setModelStatus(await PureShieldPlugin.getModelStatus()); } catch {}
    }, 2000);
    return () => clearInterval(id);
  }, [running]);

  return {
    config, permissions, running, status, modelStatus,
    targetApps, installedApps, loading,
    refresh, updateConfig, start, stop,
    requestOverlay, requestProjection,
    loadInstalledApps, toggleTargetApp,
  };
}

export default usePureShield;
