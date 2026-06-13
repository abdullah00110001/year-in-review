/**
 * NightToRiseGuard — global full-screen overlay shown whenever the Night-to-Rise
 * lock window is active. Mounted once at the App root. Reads config from
 * localStorage via useNightToRise and the next rise alarm from local_alarms.
 */

import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Lock, Smartphone, ShieldOff, Flame, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNightToRise } from './useNightToRise';
import { useNightToRiseStreak } from './useNightToRiseStreak';
import { cn } from '@/lib/utils';

function readNextAlarmTime(): string | null {
  try {
    const raw = localStorage.getItem('local_alarms');
    if (!raw) return null;
    const list = JSON.parse(raw) as Array<{ enabled?: boolean; time?: string }>;
    const found = list.find((a) => a.enabled && a.time);
    return found?.time ?? null;
  } catch { return null; }
}

const EXEMPT_ROUTES = ['/rise/ring', '/auth', '/reset-password'];

export function NightToRiseGuard() {
  const { pathname } = useLocation();
  const [alarmTime, setAlarmTime] = useState<string | null>(readNextAlarmTime);
  const { config, status } = useNightToRise(alarmTime);
  const { streak, recordBreak, recordCleanNight } = useNightToRiseStreak();
  const [now, setNow] = useState(new Date());
  const [overridden, setOverridden] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'local_alarms') setAlarmTime(readNextAlarmTime());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isExempt = EXEMPT_ROUTES.some((r) => pathname.startsWith(r));
  const phase = status.phase;
  const isLocked = (phase === 'sleep-lock' || phase === 'rise-lock') && !isExempt && !overridden;

  // When phase transitions off after a lock, record a clean night.
  useEffect(() => {
    if (phase === 'armed' || phase === 'off' || phase === 'inactive-day') {
      if (alarmTime) recordCleanNight();
    }
  }, [phase, alarmTime, recordCleanNight]);

  // Reset override when window ends
  useEffect(() => { if (!isLocked) setOverridden(false); }, [isLocked]);

  const message = phase === 'sleep-lock' ? config.sleepBlockMessage : config.riseBlockMessage;

  const endTime = useMemo(() => {
    if (phase === 'sleep-lock') {
      const [h, m] = config.sleepTime.split(':').map(Number);
      const end = new Date();
      end.setHours(h, m + 30, 0, 0);
      if (end < now) end.setDate(end.getDate() + 1);
      return end;
    }
    if (phase === 'rise-lock' && alarmTime) {
      const [h, m] = alarmTime.split(':').map(Number);
      const end = new Date();
      end.setHours(h, m + config.riseLockMinutesAfter, 0, 0);
      if (end < now) end.setDate(end.getDate() + 1);
      return end;
    }
    return null;
  }, [phase, alarmTime, config, now]);

  const remaining = endTime ? Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000)) : 0;
  const hh = Math.floor(remaining / 3600);
  const mm = Math.floor((remaining % 3600) / 60);
  const ss = remaining % 60;
  const countdown = hh > 0
    ? `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    : `${mm}:${String(ss).padStart(2, '0')}`;

  const handleEmergencyUnlock = () => {
    if (config.strictMode) return;
    // PIN: stored at 'app_lock_pin'; fall back to allowing override without PIN
    let storedPin: string | null = null;
    try { storedPin = localStorage.getItem('app_lock_pin'); } catch {}
    if (storedPin && pinInput !== storedPin) return;
    recordBreak();
    setOverridden(true);
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 text-white">
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
          <Lock className="h-9 w-9 text-indigo-200" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{phase === 'sleep-lock' ? 'Night Mode' : 'Rise Mode'}</h1>
        <p className="mt-3 max-w-sm text-base text-indigo-100/80">{message}</p>

        <div className="mt-8 rounded-2xl bg-white/5 px-6 py-4 ring-1 ring-white/10">
          <div className="text-xs uppercase tracking-wider text-indigo-200/70">Ends in</div>
          <div className="mt-1 font-mono text-4xl font-bold tabular-nums text-white">{countdown}</div>
        </div>

        {config.showStreakOnBlock && streak > 0 && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-4 py-1.5 text-sm font-medium text-amber-200 ring-1 ring-amber-400/30">
            <Flame className="h-4 w-4" /> {streak} morning{streak === 1 ? '' : 's'} protected
          </div>
        )}

        {config.allowedApps.length > 0 && (
          <div className="mt-8 w-full max-w-sm">
            <div className="mb-2 text-xs uppercase tracking-wider text-indigo-200/60">Allowed</div>
            <div className="flex flex-wrap justify-center gap-2">
              {config.allowedApps.map((a) => (
                <div key={a.id} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs">
                  <Smartphone className="h-3 w-3" /> {a.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative px-6 pb-8">
        {!config.strictMode ? (
          showPin ? (
            <div className="mx-auto max-w-xs space-y-2">
              <input
                type="password"
                inputMode="numeric"
                placeholder="Emergency PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-center text-lg tracking-widest text-white placeholder:text-white/40"
              />
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 text-white/70" onClick={() => { setShowPin(false); setPinInput(''); }}>Cancel</Button>
                <Button className="flex-1" onClick={handleEmergencyUnlock}>Unlock</Button>
              </div>
              <p className="text-center text-[11px] text-white/40">Breaking the lock resets your streak</p>
            </div>
          ) : (
            <button
              onClick={() => setShowPin(true)}
              className="mx-auto block text-xs text-white/50 underline-offset-4 hover:underline"
            >
              Emergency unlock
            </button>
          )
        ) : (
          <div className={cn('mx-auto flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs text-white/60 ring-1 ring-white/10')}>
            <ShieldOff className="h-3 w-3" /> Strict mode — no override
          </div>
        )}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-widest text-white/30">
          <Sparkles className="h-3 w-3" /> Sleep to Rise
        </div>
      </div>
    </div>
  );
}
