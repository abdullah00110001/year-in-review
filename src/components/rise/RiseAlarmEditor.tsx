import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Camera,
  Calculator,
  QrCode,
  Smartphone,
  Volume2,
  Vibrate,
  ChevronRight,
  Music,
  Bed,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  scheduleRecurringAlarm,
  cancelAlarmByUuid,
  requestAllAlarmPermissions,
  checkAllAlarmPermissions,
} from '@/lib/capacitor/nativeAlarm';

interface AlarmData {
  id?: string;
  alarm_time: string;
  days_of_week: number[];
  alarm_type: string;
  intention: string;
  label: string;
  verification_type: string;
  snooze_limit: number;
  snooze_interval_minutes: number;
  sound_type: string;
  vibration_enabled: boolean;
  volume: number;
  gentle_wakeup_seconds: number;
  is_local?: boolean;
  is_enabled?: boolean;
}

interface RiseAlarmEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: AlarmData) => void;
  initialData?: Partial<AlarmData>;
  isEditing?: boolean;
}

const DEFAULT_ALARM: AlarmData = {
  alarm_time: '06:00',
  days_of_week: [1, 2, 3, 4, 5],
  alarm_type: 'personal',
  intention: '',
  label: '',
  verification_type: 'math',
  snooze_limit: 3,
  snooze_interval_minutes: 5,
  sound_type: 'default',
  vibration_enabled: true,
  volume: 80,
  gentle_wakeup_seconds: 30,
};

const MISSIONS = [
  { id: 'math', name: 'Math', icon: Calculator },
  { id: 'shake', name: 'Shake', icon: Smartphone },
  { id: 'qr', name: 'QR/Bar', icon: QrCode },
  { id: 'photo', name: 'Photo', icon: Camera },
  { id: 'none', name: 'None', icon: X },
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function RiseAlarmEditor({
  open,
  onClose,
  onSave,
  initialData,
  isEditing = false,
}: RiseAlarmEditorProps) {
  const [alarm, setAlarm] = useState<AlarmData>({ ...DEFAULT_ALARM, ...initialData });
  const [permissionsOk, setPermissionsOk] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (open) {
      setAlarm({ ...DEFAULT_ALARM, ...initialData });
      checkAllAlarmPermissions().then((perms) =>
        setPermissionsOk(perms.notifications && perms.exactAlarm),
      );
    }
  }, [open, initialData]);

  const toggleDay = (day: number) => {
    setAlarm((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day].sort(),
    }));
  };

  const setQuickRepeat = (preset: 'daily' | 'weekdays' | 'weekends' | 'once') => {
    const map = {
      daily: [0, 1, 2, 3, 4, 5, 6],
      weekdays: [1, 2, 3, 4, 5],
      weekends: [0, 6],
      once: [],
    };
    setAlarm((p) => ({ ...p, days_of_week: map[preset] }));
  };

  const isDaily = alarm.days_of_week.length === 7;
  const isWeekdays =
    alarm.days_of_week.length === 5 &&
    [1, 2, 3, 4, 5].every((d) => alarm.days_of_week.includes(d));
  const isWeekends =
    alarm.days_of_week.length === 2 &&
    [0, 6].every((d) => alarm.days_of_week.includes(d));

  const getTimeUntil = () => {
    const now = new Date();
    const [h, m] = alarm.alarm_time.split(':').map(Number);
    const t = new Date();
    t.setHours(h, m, 0, 0);
    if (t <= now) t.setDate(t.getDate() + 1);
    const diff = t.getTime() - now.getTime();
    const hrs = Math.floor(diff / 3.6e6);
    const mins = Math.floor((diff % 3.6e6) / 6e4);
    return `Rings in ${hrs}h ${mins}m`;
  };

  const formatDisplayTime = () => {
    const [h, m] = alarm.alarm_time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const handleSave = async () => {
    if (alarm.days_of_week.length === 0) {
      toast.info('One-time alarm scheduled for the next occurrence.');
    }
    if (!permissionsOk) {
      requestAllAlarmPermissions();
    }

    const alarmId = alarm.id || crypto.randomUUID();

    if (isEditing && alarm.id) {
      await cancelAlarmByUuid(alarm.id);
    }

    const days = alarm.days_of_week.length === 0 ? [0, 1, 2, 3, 4, 5, 6] : alarm.days_of_week;

    await scheduleRecurringAlarm(alarmId, alarm.alarm_time, days, {
      title: alarm.label || 'Rise Alarm',
      body: alarm.intention || 'Time to wake up!',
      missionType: alarm.verification_type as any,
      snoozeMinutes: alarm.snooze_interval_minutes,
      alarmDbId: undefined,
    });

    const localAlarms = JSON.parse(localStorage.getItem('local_alarms') || '[]');
    const updatedAlarm = { ...alarm, id: alarmId, is_local: true, is_enabled: true };

    if (isEditing) {
      const index = localAlarms.findIndex((a: AlarmData) => a.id === alarm.id);
      if (index >= 0) localAlarms[index] = updatedAlarm;
      else localAlarms.push(updatedAlarm);
    } else {
      localAlarms.push(updatedAlarm);
    }

    localStorage.setItem('local_alarms', JSON.stringify(localAlarms));
    window.dispatchEvent(new Event('localAlarmsUpdated'));

    toast.success(isEditing ? 'Alarm updated ✓' : 'Alarm set ✓');
    onSave({ ...alarm, id: alarmId, is_local: true });
    onClose();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[100dvh] max-h-[100dvh] w-full p-0 border-0 rounded-none flex flex-col bg-background sm:max-w-md sm:mx-auto sm:rounded-t-3xl sm:h-[95vh] sm:max-h-[95vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 pt-[max(env(safe-area-inset-top),0.75rem)] bg-background/95 backdrop-blur-sm sticky top-0 z-10">
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-10 w-10">
              <X className="h-5 w-5" />
            </Button>
            <h2 className="text-base font-bold">{isEditing ? 'Edit Alarm' : 'New Alarm'}</h2>
            <div className="w-10" />
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 py-4 space-y-4 w-full pb-32">

              {/* Time display */}
              <div className="text-center py-3">
                <button
                  onClick={() => setShowTimePicker(true)}
                  className="text-5xl font-black tracking-tight tabular-nums text-foreground hover:text-primary transition-colors active:scale-95"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatDisplayTime()}
                </button>
                <p className="text-sm text-primary font-medium mt-1">{getTimeUntil()}</p>
              </div>

              {/* Repeat presets */}
              <div className="bg-card border border-border rounded-xl p-3 space-y-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Repeat
                </Label>
                {/* Preset chips — scrollable row so they never overflow */}
                <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                  <PresetChip active={isDaily} onClick={() => setQuickRepeat('daily')}>Daily</PresetChip>
                  <PresetChip active={isWeekdays} onClick={() => setQuickRepeat('weekdays')}>Weekdays</PresetChip>
                  <PresetChip active={isWeekends} onClick={() => setQuickRepeat('weekends')}>Weekends</PresetChip>
                  <PresetChip active={alarm.days_of_week.length === 0} onClick={() => setQuickRepeat('once')}>Once</PresetChip>
                </div>
                {/* Day circles — evenly spaced, never cut off */}
                <div className="grid grid-cols-7 gap-1 pt-1">
                  {DAY_LABELS.map((d, i) => {
                    const active = alarm.days_of_week.includes(i);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleDay(i)}
                        className={cn(
                          'aspect-square w-full rounded-full text-xs font-bold transition-all flex items-center justify-center',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/70',
                        )}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mission picker — 5-col grid, all visible */}
              <div className="bg-card border border-border rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Wake-up Mission
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {MISSIONS.find((m) => m.id === alarm.verification_type)?.name}
                  </span>
                </div>
                {/* Always 5 equal columns so nothing is cut off */}
                <div className="grid grid-cols-5 gap-1.5">
                  {MISSIONS.map((m) => {
                    const Icon = m.icon;
                    const selected = alarm.verification_type === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setAlarm((p) => ({ ...p, verification_type: m.id }))}
                        className={cn(
                          'flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg transition-all border',
                          selected
                            ? 'border-primary bg-primary/10'
                            : 'border-transparent bg-muted hover:bg-muted/70',
                        )}
                      >
                        <Icon className={cn('h-4 w-4', selected ? 'text-primary' : 'text-muted-foreground')} />
                        <span className="text-[9px] font-medium leading-tight text-center">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sound + vibration */}
              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                <button className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Music className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">Sound</p>
                      <p className="text-xs text-muted-foreground">Rise & Shine</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>

                <div className="flex items-center gap-3 p-3">
                  <Volume2 className="h-5 w-5 text-muted-foreground shrink-0" />
                  <Slider
                    value={[alarm.volume]}
                    onValueChange={([v]) => setAlarm((p) => ({ ...p, volume: v }))}
                    max={100}
                    className="flex-1 min-w-0"
                  />
                  <span className="text-xs text-muted-foreground tabular-nums w-9 text-right shrink-0">
                    {alarm.volume}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Vibrate className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">Vibration</span>
                  </div>
                  <Switch
                    checked={alarm.vibration_enabled}
                    onCheckedChange={(v) => setAlarm((p) => ({ ...p, vibration_enabled: v }))}
                  />
                </div>
              </div>

              {/* Snooze — full width, no overflow */}
              <div className="bg-card border border-border rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <Bed className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Snooze</Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Interval</p>
                    <div className="grid grid-cols-3 gap-1">
                      {[3, 5, 10].map((mn) => (
                        <button
                          key={mn}
                          onClick={() => setAlarm((p) => ({ ...p, snooze_interval_minutes: mn }))}
                          className={cn(
                            'h-9 rounded-xl text-xs font-semibold w-full',
                            alarm.snooze_interval_minutes === mn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {mn}m
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Limit</p>
                    <div className="grid grid-cols-3 gap-1">
                      {[1, 3, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setAlarm((p) => ({ ...p, snooze_limit: n }))}
                          className={cn(
                            'h-9 rounded-xl text-xs font-semibold w-full',
                            alarm.snooze_limit === n
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          ×{n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Label & intention */}
              <div className="bg-card border border-border rounded-xl p-3 space-y-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                    <Tag className="h-3 w-3" /> Label
                  </Label>
                  <Input
                    placeholder="e.g., Wake up early"
                    value={alarm.label}
                    onChange={(e) => setAlarm((p) => ({ ...p, label: e.target.value }))}
                    className="bg-muted border-0 h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                    Why are you waking up?
                  </Label>
                  <Input
                    placeholder="Fajr prayer and morning study"
                    value={alarm.intention}
                    onChange={(e) => setAlarm((p) => ({ ...p, intention: e.target.value }))}
                    className="bg-muted border-0 h-10"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Shown when the alarm rings.
                  </p>
                </div>
              </div>

            </div>
          </ScrollArea>

          {/* Sticky save bar */}
          <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sticky bottom-0">
            <Button onClick={handleSave} className="w-full h-12 rounded-2xl font-bold text-base">
              {isEditing ? 'Update Alarm' : 'Save Alarm'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Scroll Time Picker — outside Sheet to avoid z-index issues */}
      {showTimePicker && (
        <ScrollTimePicker
          value={alarm.alarm_time}
          onChange={(t) => setAlarm((p) => ({ ...p, alarm_time: t }))}
          onClose={() => setShowTimePicker(false)}
        />
      )}
    </>
  );
}

// ─── Scroll / Drum-roll Time Picker ──────────────────────────────────────────

const ITEM_H = 56;

function ColScroll({
  items,
  selected,
  onSelect,
  format = (v: number) => String(v).padStart(2, '0'),
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
  format?: (v: number) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (ref.current && idx >= 0) {
      ref.current.scrollTop = idx * ITEM_H;
    }
  }, []);

  const handleScroll = () => {
    if (!ref.current) return;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      ref.current.scrollTop = clamped * ITEM_H;
      onSelect(items[clamped]);
    }, 120);
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      style={{
        height: ITEM_H * 3,
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      } as React.CSSProperties}
    >
      <div style={{ height: ITEM_H }} />
      {items.map((v) => {
        const isSelected = v === selected;
        return (
          <div
            key={v}
            style={{
              height: ITEM_H,
              scrollSnapAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isSelected ? 42 : 26,
              fontWeight: 'bold',
              transition: 'font-size 0.15s, opacity 0.15s',
              opacity: isSelected ? 1 : 0.3,
              cursor: 'pointer',
              userSelect: 'none',
            }}
            className={isSelected ? 'text-foreground' : 'text-foreground'}
            onClick={() => {
              if (ref.current) {
                const idx = items.indexOf(v);
                ref.current.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
              }
              onSelect(v);
            }}
          >
            {format(v)}
          </div>
        );
      })}
      <div style={{ height: ITEM_H }} />
    </div>
  );
}

function ScrollTimePicker({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (t: string) => void;
  onClose: () => void;
}) {
  const [h, m] = value.split(':').map(Number);
  const [selHour, setSelHour] = useState(h % 12 || 12);
  const [selMin, setSelMin] = useState(m);
  const [isAM, setIsAM] = useState(h < 12);

  const hourItems = Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteItems = Array.from({ length: 60 }, (_, i) => i);

  const commit = (hr: number, mn: number, am: boolean) => {
    let h24 = hr % 12;
    if (!am) h24 += 12;
    onChange(`${String(h24).padStart(2, '0')}:${String(mn).padStart(2, '0')}`);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Uses bg-background + border so it matches app theme (light or dark) */}
      <div className="w-full max-w-sm bg-background border-t border-border rounded-t-3xl overflow-hidden shadow-2xl">

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Picker row */}
        <div className="relative flex items-center justify-center px-6 py-2 gap-2">
          {/* Selected highlight band — uses card color */}
          <div
            className="absolute left-6 right-6 rounded-xl bg-muted pointer-events-none"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              height: ITEM_H,
            }}
          />

          {/* Hours */}
          <div className="flex-1">
            <ColScroll
              items={hourItems}
              selected={selHour}
              onSelect={(v) => { setSelHour(v); commit(v, selMin, isAM); }}
            />
          </div>

          {/* Colon */}
          <span className="text-4xl font-black text-foreground/60 pb-1 select-none">:</span>

          {/* Minutes */}
          <div className="flex-1">
            <ColScroll
              items={minuteItems}
              selected={selMin}
              onSelect={(v) => { setSelMin(v); commit(selHour, v, isAM); }}
            />
          </div>

          {/* AM / PM */}
          <div className="flex flex-col gap-1.5 ml-3">
            {(['AM', 'PM'] as const).map((label) => {
              const active = (label === 'AM') === isAM;
              return (
                <button
                  key={label}
                  onClick={() => {
                    const am = label === 'AM';
                    setIsAM(am);
                    commit(selHour, selMin, am);
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-bold transition-all',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Complete button — uses primary color from theme */}
        <div className="px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-3">
          <Button
            onClick={onClose}
            className="w-full h-14 rounded-2xl font-bold text-lg"
          >
            Complete
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Preset chip ─────────────────────────────────────────────────────────────

function PresetChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-7 px-3 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/70',
      )}
    >
      {children}
    </button>
  );
}
