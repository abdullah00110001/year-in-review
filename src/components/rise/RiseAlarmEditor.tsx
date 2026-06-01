import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  ImageIcon,
  Trash2,
  Zap,
  Bell,
  Clock,
  Download,
  Play,
  Check,
  FileAudio
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
  wallpaper_url?: string | null;
  extra_loud?: boolean;
  label_reminder?: boolean;
  time_reminder?: boolean;
  ringtone_url?: string | null;
  ringtone_name?: string | null;
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
  wallpaper_url: null,
  extra_loud: false,
  label_reminder: false,
  time_reminder: false,
  ringtone_url: null,
  ringtone_name: null,
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
  const [showRingtonePicker, setShowRingtonePicker] = useState(false);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setAlarm({ ...DEFAULT_ALARM, ...initialData });
      checkAllAlarmPermissions().then((perms) =>
        setPermissionsOk(perms.notifications && perms.exactAlarm),
      );
    }
  }, [open, initialData]);

  useEffect(() => {
    if (!open) setShowTimePicker(false);
  }, [open]);

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
    if (!alarm.alarm_time || !alarm.alarm_time.includes(':')) return '';
    const now = new Date();
    const parts = alarm.alarm_time.split(':').map(Number);
    if (parts.some(isNaN)) return '';
    
    const [h, m] = parts;
    const t = new Date();
    t.setHours(h, m, 0, 0);
    if (t <= now) t.setDate(t.getDate() + 1);
    const diff = t.getTime() - now.getTime();
    const hrs = Math.floor(diff / 3.6e6);
    const mins = Math.floor((diff % 3.6e6) / 6e4);
    return `Rings in ${hrs}h ${mins}m`;
  };

  const formatDisplayTime = () => {
    if (!alarm.alarm_time || !alarm.alarm_time.includes(':')) return '06:00 AM';
    const parts = alarm.alarm_time.split(':').map(Number);
    if (parts.some(isNaN)) return '06:00 AM';

    const [h, m] = parts;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const handleWallpaperSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (alarm.wallpaper_url && alarm.wallpaper_url.startsWith('blob:')) {
      URL.revokeObjectURL(alarm.wallpaper_url);
    }
    const url = URL.createObjectURL(file);
    setAlarm((p) => ({ ...p, wallpaper_url: url }));
    e.target.value = '';
  };

  const handleWallpaperRemove = () => {
    if (alarm.wallpaper_url && alarm.wallpaper_url.startsWith('blob:')) {
      URL.revokeObjectURL(alarm.wallpaper_url);
    }
    setAlarm((p) => ({ ...p, wallpaper_url: null }));
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
      extraLoud: alarm.extra_loud ?? false,
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
          className="h-[100dvh] max-h-[100dvh] w-full p-0 border-0 rounded-none flex flex-col bg-background text-foreground sm:max-w-md sm:mx-auto sm:rounded-t-3xl sm:h-[95vh] sm:max-h-[95vh]"
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
                <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                  <PresetChip active={isDaily} onClick={() => setQuickRepeat('daily')}>Daily</PresetChip>
                  <PresetChip active={isWeekdays} onClick={() => setQuickRepeat('weekdays')}>Weekdays</PresetChip>
                  <PresetChip active={isWeekends} onClick={() => setQuickRepeat('weekends')}>Weekends</PresetChip>
                  <PresetChip active={alarm.days_of_week.length === 0} onClick={() => setQuickRepeat('once')}>Once</PresetChip>
                </div>
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

              {/* Mission picker */}
              <div className="bg-card border border-border rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Wake-up Mission
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {MISSIONS.find((m) => m.id === alarm.verification_type)?.name}
                  </span>
                </div>
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

              {/* Sound + vibration + extras */}
              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                  onClick={() => setShowRingtonePicker(true)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Music className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">Sound</p>
                      <p className="text-xs text-muted-foreground">
                        {alarm.ringtone_name || 'Rise & Shine'}
                      </p>
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

                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Zap className={cn('h-4 w-4 shrink-0', alarm.extra_loud ? 'text-yellow-500' : 'text-muted-foreground')} />
                    <div>
                      <p className="text-sm font-medium">Extra Loud</p>
                      <p className="text-xs text-muted-foreground">Crescendo effect — volume builds up</p>
                    </div>
                  </div>
                  <Switch
                    checked={!!alarm.extra_loud}
                    onCheckedChange={(v) => setAlarm((p) => ({ ...p, extra_loud: v }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Bell className={cn('h-4 w-4 shrink-0', alarm.label_reminder ? 'text-primary' : 'text-muted-foreground')} />
                    <div>
                      <p className="text-sm font-medium">Label Reminder</p>
                      <p className="text-xs text-muted-foreground">Show label text when alarm rings</p>
                    </div>
                  </div>
                  <Switch
                    checked={!!alarm.label_reminder}
                    onCheckedChange={(v) => setAlarm((p) => ({ ...p, label_reminder: v }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Clock className={cn('h-4 w-4 shrink-0', alarm.time_reminder ? 'text-primary' : 'text-muted-foreground')} />
                    <div>
                      <p className="text-sm font-medium">Time Reminder</p>
                      <p className="text-xs text-muted-foreground">Announce current time by voice</p>
                    </div>
                  </div>
                  <Switch
                    checked={!!alarm.time_reminder}
                    onCheckedChange={(v) => setAlarm((p) => ({ ...p, time_reminder: v }))}
                  />
                </div>
              </div>

              {/* Snooze */}
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
                    placeholder="কেন উঠছো? (optional)"
                    value={alarm.label}
                    maxLength={50}
                    onChange={(e) => setAlarm((p) => ({ ...p, label: e.target.value.slice(0, 50) }))}
                    className="bg-muted border-0 h-10"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { label: 'Fajr 🤲', value: 'Fajr prayer 🤲' },
                      { label: 'Gym 💪', value: 'আজ gym যাবো 💪' },
                      { label: 'Study 📚', value: 'পরীক্ষা আছে 📚' },
                      { label: 'Work 💼', value: 'Early work 💼' },
                      { label: 'Walk 🌿', value: 'Morning walk 🌿' },
                    ].map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setAlarm((p) => ({ ...p, label: s.value }))}
                        className="text-[11px] px-2 py-1 rounded-full bg-muted hover:bg-primary/20 text-foreground/80 transition-colors"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

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

              {/* Wallpaper */}
              <div className="bg-card border border-border rounded-xl p-3 space-y-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="h-3 w-3" /> Alarm Wallpaper
                </Label>

                {alarm.wallpaper_url ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ height: 160 }}>
                    <img
                      src={alarm.wallpaper_url}
                      alt="Wallpaper preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3">
                      <button
                        onClick={() => wallpaperInputRef.current?.click()}
                        className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-white/30 transition-all"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        Change
                      </button>
                      <button
                        onClick={handleWallpaperRemove}
                        className="flex items-center gap-1.5 bg-red-500/70 backdrop-blur-sm text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-red-500/90 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => wallpaperInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                    style={{ height: 120 }}
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Choose from gallery</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Shown as background when alarm rings
                      </p>
                    </div>
                  </button>
                )}

                <input
                  ref={wallpaperInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleWallpaperSelect}
                />
              </div>

            </div>
          </ScrollArea>

          {/* Sticky save bar */}
          <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3 pb-[max(env(safe-area-inset-top),0.75rem)] sticky bottom-0">
            <Button onClick={handleSave} className="w-full h-12 rounded-2xl font-bold text-base">
              {isEditing ? 'Update Alarm' : 'Save Alarm'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {showTimePicker && (
        <ScrollTimePicker
          value={alarm.alarm_time}
          onSaveTime={(t) => setAlarm((p) => ({ ...p, alarm_time: t }))}
          onClose={() => setShowTimePicker(false)}
        />
      )}

      {showRingtonePicker && (
        <RingtoneSheet
          selectedId={alarm.ringtone_url ?? undefined}
          onSelect={(uri, name) => {
            setAlarm((p) => ({ ...p, ringtone_url: uri, ringtone_name: name, sound_type: 'custom' }));
            setShowRingtonePicker(false);
          }}
          onClose={() => setShowRingtonePicker(false)}
        />
      )}
    </>
  );
}

// ─── Scroll / Drum-roll Time Picker (Fixed) ──────────────────────────────────────────

const ITEM_H = 56;

function ColScroll<T extends string | number>({
  items,
  selected,
  onSelect,
  format = (v: T) => String(v).padStart(2, '0'),
}: {
  items: readonly T[];
  selected: T;
  onSelect: (v: T) => void;
  format?: (v: T) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only sync scrollTop on first mount (or if items array changes).
  // Re-syncing on every `selected` change fights the user's touch/momentum scroll.
  useEffect(() => {
    if (!ref.current) return;
    const idx = items.indexOf(selected);
    if (idx >= 0) ref.current.scrollTop = idx * ITEM_H;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleScroll = () => {
    if (!ref.current) return;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      const target = clamped * ITEM_H;
      if (Math.abs(ref.current.scrollTop - target) > 1) {
        ref.current.scrollTop = target;
      }
      if (items[clamped] !== selected) onSelect(items[clamped]);
    }, 120);
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="scrollbar-none"
      style={{
        height: ITEM_H * 3,
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
      } as React.CSSProperties}
    >
      <div style={{ height: ITEM_H, flexShrink: 0 }} />
      {items.map((v) => {
        const isSel = v === selected;
        return (
          <div
            key={v}
            style={{
              height: ITEM_H,
              scrollSnapAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isSel ? 40 : 24,
              fontWeight: 700,
              opacity: isSel ? 1 : 0.3,
              transition: 'font-size 0.1s, opacity 0.1s',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            className={isSel ? "text-primary" : "text-muted-foreground"}
            onClick={() => {
              if (ref.current) {
                ref.current.scrollTo({
                  top: items.indexOf(v) * ITEM_H,
                  behavior: 'smooth',
                });
              }
              onSelect(v);
            }}
          >
            {format(v)}
          </div>
        );
      })}
      <div style={{ height: ITEM_H, flexShrink: 0 }} />
    </div>
  );
}

function ScrollTimePicker({
  value,
  onSaveTime,
  onClose,
}: {
  value: string;
  onSaveTime: (t: string) => void;
  onClose: () => void;
}) {
  const [h, m] = value.split(':').map(Number);
  const [selHour, setSelHour] = useState(h % 12 || 12);
  const [selMin, setSelMin] = useState(m);
  const [isAM, setIsAM] = useState(h < 12);

  const hourItems = Array.from({ length: 12 }, (_, i) => i + 1);
  const minuteItems = Array.from({ length: 60 }, (_, i) => i);

  const handleComplete = () => {
    let h24 = selHour % 12;
    if (!isAM) h24 += 12;
    const timeString = `${String(h24).padStart(2, '0')}:${String(selMin).padStart(2, '0')}`;
    onSaveTime(timeString);
    onClose();
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-card text-card-foreground border-t border-border"
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: '24px 24px 0 0',
          overflow: 'hidden',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center py-3">
          <div className="bg-muted w-10 h-1 rounded-full" />
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px',
            height: ITEM_H * 3,
          }}
        >
          {/* Central Highlight Indicator */}
          <div
            className="bg-muted/60"
            style={{
              position: 'absolute',
              left: 20,
              right: 20,
              top: ITEM_H,
              height: ITEM_H,
              borderRadius: 12,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <div style={{ flex: 1, zIndex: 1 }}>
            <ColScroll
              items={hourItems}
              selected={selHour}
              onSelect={(v) => setSelHour(v)}
            />
          </div>

          <div
            className="text-foreground flex items-center justify-center font-bold pb-2"
            style={{ fontSize: 32, width: 20, userSelect: 'none', zIndex: 1 }}
          >
            :
          </div>

          <div style={{ flex: 1, zIndex: 1 }}>
            <ColScroll
              items={minuteItems}
              selected={selMin}
              onSelect={(v) => setSelMin(v)}
            />
          </div>

          <div style={{ width: 64, marginLeft: 12, zIndex: 1 }}>
            <ColScroll<string>
              items={['AM', 'PM']}
              selected={isAM ? 'AM' : 'PM'}
              onSelect={(v) => setIsAM(v === 'AM')}
              format={(v) => v}
            />
          </div>
        </div>

        <div className="p-4">
          <Button
            onClick={handleComplete}
            className="w-full rounded-2xl font-bold text-base h-12"
          >
            Complete
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Ringtone Sheet (wraps the dynamic Supabase-backed RingtonePicker) ──────

import { RingtonePicker as DynamicRingtonePicker } from './RingtonePicker';

function RingtoneSheet({
  selectedId,
  onSelect,
  onClose,
}: {
  selectedId?: string;
  onSelect: (uri: string, name: string) => void;
  onClose: () => void;
}) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-background text-foreground border-t border-border"
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: '24px 24px 0 0',
          height: '85dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div>
            <p className="font-bold text-base">Ringtones</p>
            <p className="text-xs text-muted-foreground">Select your wake-up sound</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <DynamicRingtonePicker selectedId={selectedId} onSelect={(uri, rt) => onSelect(uri, rt.name)} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

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
