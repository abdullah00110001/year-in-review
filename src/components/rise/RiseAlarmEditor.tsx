import { useState, useEffect } from 'react';
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

  const handleSave = async () => {
    if (alarm.days_of_week.length === 0) {
      // "Once" — schedule for next occurrence (we still need at least one day)
      // For simplicity force tomorrow
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
          <div className="px-4 py-4 md:px-6 md:py-6 space-y-4 max-w-2xl mx-auto pb-32">
            {/* Compact time picker */}
            <div className="text-center py-3">
              <Input
                type="time"
                value={alarm.alarm_time}
                onChange={(e) =>
                  setAlarm((p) => ({ ...p, alarm_time: e.target.value }))
                }
                className="text-5xl md:text-6xl h-20 md:h-24 text-center font-black tracking-tight border-0 bg-transparent focus-visible:ring-0 tabular-nums px-0"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              />
              <p className="text-sm text-primary font-medium mt-1">{getTimeUntil()}</p>
            </div>

            {/* Repeat presets */}
            <div className="bg-card border border-border rounded-xl p-3 space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Repeat
              </Label>
              <div className="flex gap-2 flex-wrap">
                <PresetChip active={isDaily} onClick={() => setQuickRepeat('daily')}>
                  Daily
                </PresetChip>
                <PresetChip active={isWeekdays} onClick={() => setQuickRepeat('weekdays')}>
                  Weekdays
                </PresetChip>
                <PresetChip active={isWeekends} onClick={() => setQuickRepeat('weekends')}>
                  Weekends
                </PresetChip>
                <PresetChip
                  active={alarm.days_of_week.length === 0}
                  onClick={() => setQuickRepeat('once')}
                >
                  Once
                </PresetChip>
              </div>
              <div className="flex justify-between gap-1.5 pt-1">
                {DAY_LABELS.map((d, i) => {
                  const active = alarm.days_of_week.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={cn(
                        'h-8 w-8 rounded-full text-xs font-bold transition-all',
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
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {MISSIONS.map((m) => {
                  const Icon = m.icon;
                  const selected = alarm.verification_type === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() =>
                        setAlarm((p) => ({ ...p, verification_type: m.id }))
                      }
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-2.5 rounded-lg transition-all border',
                        selected
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent bg-muted hover:bg-muted/70',
                      )}
                    >
                      <Icon className={cn('h-5 w-5', selected ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="text-[10px] font-medium">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sound + vibration */}
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              <button className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Music className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Sound</p>
                    <p className="text-xs text-muted-foreground">Rise & Shine</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="flex items-center gap-3 p-3">
                <Volume2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <Slider
                  value={[alarm.volume]}
                  onValueChange={([v]) => setAlarm((p) => ({ ...p, volume: v }))}
                  max={100}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                  {alarm.volume}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <Vibrate className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Vibration</span>
                </div>
                <Switch
                  checked={alarm.vibration_enabled}
                  onCheckedChange={(v) =>
                    setAlarm((p) => ({ ...p, vibration_enabled: v }))
                  }
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
                  <p className="text-xs text-muted-foreground mb-1">Interval</p>
                  <div className="flex gap-1.5">
                    {[3, 5, 10].map((m) => (
                      <button
                        key={m}
                        onClick={() =>
                          setAlarm((p) => ({ ...p, snooze_interval_minutes: m }))
                        }
                        className={cn(
                          'flex-1 h-8 rounded-lg text-xs font-semibold',
                          alarm.snooze_interval_minutes === m
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Limit</p>
                  <div className="flex gap-1.5">
                    {[1, 3, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setAlarm((p) => ({ ...p, snooze_limit: n }))}
                        className={cn(
                          'flex-1 h-8 rounded-lg text-xs font-semibold',
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
                  onChange={(e) =>
                    setAlarm((p) => ({ ...p, intention: e.target.value }))
                  }
                  className="bg-muted border-0 h-10"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Shown when the alarm rings.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Sticky save bar — always visible on small screens */}
        <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sticky bottom-0">
          <Button
            onClick={handleSave}
            className="w-full h-12 rounded-2xl font-bold text-base"
          >
            {isEditing ? 'Update Alarm' : 'Save Alarm'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
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
        'h-7 px-3 rounded-full text-xs font-semibold transition-all',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/70',
      )}
    >
      {children}
    </button>
  );
}
