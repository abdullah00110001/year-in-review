import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_CONFIG, NightToRiseConfig, STORAGE_KEY } from './types';
import { nightToRiseBridge } from '@/lib/capacitor/nightToRiseBridge';


function load(): NightToRiseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function parseHM(s: string): { h: number; m: number } {
  const [h, m] = s.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}

function minutesNow(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}

export function useNightToRise(riseAlarmTime?: string | null) {
  const [config, setConfig] = useState<NightToRiseConfig>(load);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const update = useCallback((patch: Partial<NightToRiseConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch, configured: true };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      // Push to Android native side (no-op on web/iOS).
      void nightToRiseBridge.setConfig(next);
      return next;
    });
  }, []);

  // Push current config to native once on mount (after restart).
  useEffect(() => { void nightToRiseBridge.setConfig(config); /* eslint-disable-next-line */ }, []);

  const status = useMemo(() => {
    if (!config.enabled || !config.configured) {
      return { phase: 'off' as const, label: null as string | null, endsAt: null as Date | null };
    }
    if (config.pausedUntil && new Date(config.pausedUntil) > now) {
      return { phase: 'paused' as const, label: 'Paused tonight', endsAt: new Date(config.pausedUntil) };
    }
    const day = now.getDay();
    const active = config.scheduleMode === 'everyday'
      ? true
      : config.scheduleMode === 'weekdays'
        ? day >= 1 && day <= 5
        : config.scheduleDays.includes(day);

    if (!active) return { phase: 'inactive-day' as const, label: 'Not scheduled today', endsAt: null };

    const cur = minutesNow(now);
    const sleep = parseHM(config.sleepTime);
    const sleepStart = (sleep.h * 60 + sleep.m - config.sleepLockMinutesBefore + 24 * 60) % (24 * 60);
    const sleepEnd = (sleep.h * 60 + sleep.m + 30) % (24 * 60); // grace
    const sleepActive = sleepStart <= sleepEnd
      ? cur >= sleepStart && cur < sleepEnd
      : cur >= sleepStart || cur < sleepEnd;
    if (sleepActive) {
      return { phase: 'sleep-lock' as const, label: 'Sleep lock active', endsAt: null };
    }

    if (riseAlarmTime) {
      const a = parseHM(riseAlarmTime);
      const riseStart = a.h * 60 + a.m;
      const riseEnd = (riseStart + config.riseLockMinutesAfter) % (24 * 60);
      const riseActive = riseStart <= riseEnd
        ? cur >= riseStart && cur < riseEnd
        : cur >= riseStart || cur < riseEnd;
      if (riseActive) return { phase: 'rise-lock' as const, label: 'Rise lock active', endsAt: null };
    }

    return { phase: 'armed' as const, label: 'Armed', endsAt: null };
  }, [config, now, riseAlarmTime]);

  const pauseTonight = useCallback(() => {
    const next = new Date();
    next.setHours(12, 0, 0, 0);
    if (next < new Date()) next.setDate(next.getDate() + 1);
    update({ pausedUntil: next.toISOString() });
  }, [update]);

  return { config, update, status, pauseTonight };
}
