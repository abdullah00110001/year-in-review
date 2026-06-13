/**
 * NightToRise — full-page route at /rise/night-to-rise.
 * Reuses the existing NightToRisePage content (which already includes the
 * sticky header + Switch + all sections) but unwrapped from the Sheet so it
 * occupies the whole viewport.
 */

import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Moon, Sunrise, Smartphone, MessageSquare, CalendarDays, Plus, X, PauseCircle, Shield, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNightToRise } from '@/components/rise/night-to-rise/useNightToRise';
import AppLayout from '@/components/layout/AppLayout';
import { useNightToRiseStreak } from '@/components/rise/night-to-rise/useNightToRiseStreak';
import type { AllowedApp, ScheduleMode } from '@/components/rise/night-to-rise/types';
import { isNative } from '@/lib/capacitor/platform';
import { OfflineBadge } from '@/components/OfflineGuard';
import { Badge } from '@/components/ui/badge';
import { Flame } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function readNextAlarm(): string | null {
  try {
    const raw = localStorage.getItem('local_alarms');
    if (!raw) return null;
    const list = JSON.parse(raw) as Array<{ enabled?: boolean; time?: string }>;
    return list.find((a) => a.enabled && a.time)?.time ?? null;
  } catch { return null; }
}

export default function NightToRisePage() {
  const navigate = useNavigate();
  const riseAlarmTime = readNextAlarm();
  const { config, update, status, pauseTonight } = useNightToRise(riseAlarmTime);
  const { streak } = useNightToRiseStreak();
  const [newApp, setNewApp] = useState('');

  const toggleDay = (d: number) => {
    const set = new Set(config.scheduleDays);
    set.has(d) ? set.delete(d) : set.add(d);
    update({ scheduleDays: Array.from(set).sort() });
  };

  const addApp = () => {
    const name = newApp.trim();
    if (!name) return;
    const app: AllowedApp = { id: name.toLowerCase().replace(/\s+/g, '-'), name };
    update({ allowedApps: [...config.allowedApps, app] });
    setNewApp('');
  };

  const removeApp = (id: string) =>
    update({ allowedApps: config.allowedApps.filter((a) => a.id !== id) });

  return (
    <AppLayout hideMobileHeader>
    <div className="min-h-screen bg-background pb-24">
      {/* Header — matches RiseHeader style for cross-page consistency */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Back"
              className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0 text-foreground/70 hover:text-foreground hover:bg-accent transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sunrise className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate text-foreground">Sleep to Rise</h1>
              <p className="text-xs text-muted-foreground truncate">Sleep & Wake Protection</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <OfflineBadge />
            {streak > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                <Flame className="h-3 w-3 mr-1" />
                {streak}d
              </Badge>
            )}
            <Switch checked={config.enabled} onCheckedChange={(v) => update({ enabled: v })} />
          </div>
        </div>

        {(status.phase !== 'off' || isNative) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {status.phase !== 'off' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                <span className={cn(
                  'h-2 w-2 rounded-full',
                  status.phase === 'sleep-lock' || status.phase === 'rise-lock' ? 'bg-emerald-500 animate-pulse' :
                  status.phase === 'paused' ? 'bg-amber-500' : 'bg-primary',
                )} />
                {status.label ?? 'Armed'}
              </span>
            )}
            {isNative && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-3 w-3" /> Native blocking
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 p-4 max-w-2xl mx-auto">

        <Section icon={<Moon className="h-4 w-4" />} title="Sleep Guard" subtitle="Lock distracting apps before bed">
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Target sleep time</Label>
              <Input type="time" value={config.sleepTime}
                onChange={(e) => update({ sleepTime: e.target.value })} className="mt-1" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-xs">Lock starts before sleep</Label>
                <span className="text-xs font-medium text-primary">{config.sleepLockMinutesBefore} min</span>
              </div>
              <Slider min={0} max={120} step={5} value={[config.sleepLockMinutesBefore]}
                onValueChange={([v]) => update({ sleepLockMinutesBefore: v })} />
            </div>
          </div>
        </Section>

        <Section icon={<Sunrise className="h-4 w-4" />} title="Rise Guard" subtitle="Stay focused after waking up">
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/50 p-3 text-xs">
              <span className="text-muted-foreground">Alarm time: </span>
              <span className="font-medium">{riseAlarmTime ?? 'No alarm set'}</span>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-xs">Lock stays for</Label>
                <span className="text-xs font-medium text-primary">{config.riseLockMinutesAfter} min</span>
              </div>
              <Slider min={5} max={120} step={5} value={[config.riseLockMinutesAfter]}
                onValueChange={([v]) => update({ riseLockMinutesAfter: v })} />
            </div>
          </div>
        </Section>

        <Section icon={<Smartphone className="h-4 w-4" />} title="Allowed Apps" subtitle="These work during locked windows">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {config.allowedApps.map((a) => (
                <div key={a.id} className="group inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  {a.name}
                  <button onClick={() => removeApp(a.id)} className="opacity-60 hover:opacity-100" aria-label={`Remove ${a.name}`}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Add app name (e.g. Spotify)" value={newApp}
                onChange={(e) => setNewApp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addApp()} />
              <Button size="icon" onClick={addApp} aria-label="Add app"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>
        </Section>

        <Section icon={<MessageSquare className="h-4 w-4" />} title="Block Screen" subtitle="Customize the lock messages">
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Sleep window message</Label>
              <Textarea value={config.sleepBlockMessage}
                onChange={(e) => update({ sleepBlockMessage: e.target.value })}
                rows={2} className="mt-1 resize-none" />
            </div>
            <div>
              <Label className="text-xs">Rise window message</Label>
              <Textarea value={config.riseBlockMessage}
                onChange={(e) => update({ riseBlockMessage: e.target.value })}
                rows={2} className="mt-1 resize-none" />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <div>
                <p className="text-sm font-medium">Show streak on block screen</p>
                <p className="text-xs text-muted-foreground">"7 mornings protected in a row 🔥"</p>
              </div>
              <Switch checked={config.showStreakOnBlock}
                onCheckedChange={(v) => update({ showStreakOnBlock: v })} />
            </div>
          </div>
        </Section>

        <Section icon={<CalendarDays className="h-4 w-4" />} title="Schedule" subtitle="When Sleep to Rise runs">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {(['everyday', 'weekdays', 'custom'] as ScheduleMode[]).map((m) => (
                <button key={m} onClick={() => update({ scheduleMode: m })}
                  className={cn('rounded-lg border px-2 py-2 text-xs font-medium capitalize transition-colors',
                    config.scheduleMode === m
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50')}>{m}</button>
              ))}
            </div>
            {config.scheduleMode === 'custom' && (
              <div className="flex gap-1">
                {DAYS.map((d, i) => (
                  <button key={d} onClick={() => toggleDay(i)}
                    className={cn('flex-1 rounded-md border py-2 text-[11px] font-medium transition-colors',
                      config.scheduleDays.includes(i)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground')}>{d}</button>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full"
              onClick={() => { pauseTonight(); toast.success('Paused for tonight'); }}>
              <PauseCircle className="mr-2 h-4 w-4" /> Pause for one night
            </Button>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium">Strict mode</p>
                  <p className="text-xs text-muted-foreground">No PIN override allowed</p>
                </div>
              </div>
              <Switch checked={config.strictMode} onCheckedChange={(v) => update({ strictMode: v })} />
            </div>
          </div>
        </Section>

        {!isNative && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
            On the web preview, the lock shows an in-app overlay. Install the Android app to enforce OS-level blocking.
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  );
}

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <span className="text-primary">{icon}</span>
          {title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
