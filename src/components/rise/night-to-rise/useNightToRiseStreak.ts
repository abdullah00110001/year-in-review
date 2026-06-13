/**
 * useNightToRiseStreak — tracks consecutive nights the user did NOT break the
 * Night to Rise lock. Stored entirely in localStorage as approved in the plan.
 *
 * Storage key: `night_to_rise_sessions_v1` → Array<{ date: 'YYYY-MM-DD'; broken: boolean }>
 * Call `recordBreak()` whenever the user uses the emergency unlock or opens a
 * disallowed app from within the guard. Call `recordCleanNight()` once per day
 * when the rise-lock window ends without a break.
 */

import { useCallback, useEffect, useState } from 'react';

interface SessionRow {
  date: string;       // YYYY-MM-DD
  broken: boolean;
}

const KEY = 'night_to_rise_sessions_v1';

function read(): SessionRow[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionRow[];
  } catch { return []; }
}

function write(rows: SessionRow[]) {
  try { localStorage.setItem(KEY, JSON.stringify(rows.slice(-90))); } catch {}
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function calcStreak(rows: SessionRow[]): number {
  if (rows.length === 0) return 0;
  const map = new Map(rows.map((r) => [r.date, r.broken]));
  let streak = 0;
  const d = new Date();
  // walk backwards starting yesterday
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 90; i++) {
    const key = d.toISOString().slice(0, 10);
    if (!map.has(key)) break;
    if (map.get(key) === true) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function useNightToRiseStreak() {
  const [rows, setRows] = useState<SessionRow[]>(read);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setRows(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const recordBreak = useCallback(() => {
    setRows((prev) => {
      const t = todayKey();
      const next = [...prev.filter((r) => r.date !== t), { date: t, broken: true }];
      write(next);
      return next;
    });
  }, []);

  const recordCleanNight = useCallback(() => {
    setRows((prev) => {
      const t = todayKey();
      if (prev.find((r) => r.date === t)) return prev;
      const next = [...prev, { date: t, broken: false }];
      write(next);
      return next;
    });
  }, []);

  return { streak: calcStreak(rows), recordBreak, recordCleanNight };
}
