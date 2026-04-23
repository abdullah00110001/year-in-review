import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Pencil, Camera, Calculator, Footprints, QrCode, Brain, Keyboard, Dumbbell, Smartphone, Lock, Volume2, Vibrate, Play, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  scheduleRecurringAlarm,
  cancelAlarmByUuid,
  requestAllAlarmPermissions,
  checkAllAlarmPermissions
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
  days_of_week: [0, 1, 2, 3, 4, 5, 6],
  alarm_type: 'personal',
  intention: '',
  label: '',
  verification_type: 'photo',
  snooze_limit: 3,
  snooze_interval_minutes: 5,
  sound_type: 'default',
  vibration_enabled: true,
  volume: 80,
  gentle_wakeup_seconds: 30
};

const MISSIONS = [
  { id: 'photo', name: 'Photo', icon: Camera, locked: false },
  { id: 'math', name: 'Math', icon: Calculator, locked: false },
  { id: 'shake', name: 'Shake', icon: Smartphone, locked: false },
  { id: 'qr', name: 'QR Code', icon: QrCode, locked: false },
  { id: 'memory', name: 'Memory', icon: Brain, locked: false },
  { id: 'typing', name: 'Typing', icon: Keyboard, locked: false },
  { id: 'walking', name: 'Walking', icon: Footprints, locked: false },
  { id: 'squat', name: 'Squat', icon: Dumbbell, locked: false },
];

const SOUNDS = [
  { id: 'default', name: 'Rise & Shine' },
  { id: 'gentle', name: 'Gentle Morning' },
  { id: 'nature', name: 'Nature Sounds' },
  { id: 'adhan', name: 'Adhan (Fajr)' },
  { id: 'intense', name: 'Intense Alarm' },
];

export function RiseAlarmEditor({ open, onClose, onSave, initialData, isEditing = false }: RiseAlarmEditorProps) {
  const [alarm, setAlarm] = useState<AlarmData>({...DEFAULT_ALARM,...initialData});
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [permissionsOk, setPermissionsOk] = useState(false);

  useEffect(() => {
    if (open) {
      setAlarm({...DEFAULT_ALARM,...initialData});
      checkAllAlarmPermissions().then(perms => {
        setPermissionsOk(perms.notifications && perms.exactAlarm);
      });
    }
  }, [open, initialData]);

  const toggleDay = (day: number) => {
    setAlarm(prev => ({
...prev,
      days_of_week: prev.days_of_week.includes(day)? prev.days_of_week.filter(d => d!== day) : [...prev.days_of_week, day].sort()
    }));
  };

  const isAllDays = alarm.days_of_week.length === 7;

  const handleSave = async () => {
    if (!permissionsOk) {
      const granted = await requestAllAlarmPermissions();
      if (!granted) {
        toast.error('Enable permissions from Settings for alarms to work');
        return;
      }
      setPermissionsOk(true);
    }

    const alarmId = alarm.id || crypto.randomUUID();

    if (isEditing && alarm.id) {
      await cancelAlarmByUuid(alarm.id);
    }

    // Schedule native alarm (works on locked screen via setAlarmClock)
    await scheduleRecurringAlarm(
      alarmId,
      alarm.alarm_time,
      alarm.days_of_week,
      {
        title: alarm.label || 'Rise Alarm',
        body: alarm.intention || 'Time to wake up!',
        missionType: alarm.verification_type as any,
        snoozeMinutes: alarm.snooze_interval_minutes,
        // Always treat alarms as device-local; never tie them to a Supabase row
        alarmDbId: undefined,
      }
    );

    // ALWAYS persist to localStorage — alarms live on the device only
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

    toast.success(isEditing ? 'Alarm updated!' : 'Alarm set! ✅');
    onSave({ ...alarm, id: alarmId, is_local: true });
    onClose();
  };

  const getTimeUntilAlarm = () => {
    const now = new Date();
    const [hours, minutes] = alarm.alarm_time.split(':').map(Number);
    const alarmTime = new Date();
    alarmTime.setHours(hours, minutes, 0, 0);
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }
    const diff = alarmTime.getTime() - now.getTime();
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Ring in ${diffHours} hr. ${diffMinutes} min`;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[95vh] p-0 rounded-t-3xl">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b border-border flex-row items-center justify-between">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
            <SheetTitle>{isEditing? 'Edit Alarm' : 'Wake-up alarm'}</SheetTitle>
            <div className="w-10" />
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {!permissionsOk && (
                <div className="bg-destructive/10 border border-destructive rounded-xl p-3">
                  <p className="text-sm mb-2">Alarms need permissions to work when phone is locked</p>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      const granted = await requestAllAlarmPermissions();
                      setPermissionsOk(granted);
                      if (granted) toast.success('Permissions granted!');
                    }}
                  >
                    Grant Permissions
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowLabelInput(true)}>
                <span className="text-2xl">🌟</span>
                {showLabelInput? (
                  <Input
                    autoFocus
                    placeholder="Alarm label (e.g., Wake up early)"
                    value={alarm.label}
                    onChange={(e) => setAlarm(prev => ({...prev, label: e.target.value}))}
                    onBlur={() => setShowLabelInput(false)}
                    className="flex-1"
                  />
                ) : (
                  <span className="text-muted-foreground flex-1">
                    {alarm.label || 'Please fill in the alarm name'}
                  </span>
                )}
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="text-center py-4">
                <Input
                  type="time"
                  value={alarm.alarm_time}
                  onChange={(e) => setAlarm(prev => ({...prev, alarm_time: e.target.value}))}
                  className="text-5xl h-20 text-center font-bold border-0 bg-transparent focus:ring-0"
                />
                <p className="text-sm text-amber-500 mt-2">{getTimeUntilAlarm()}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Daily</span>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isAllDays}
                      onChange={() => {
                        setAlarm(prev => ({
                   ...prev,
                          days_of_week: isAllDays? [] : [0, 1, 2, 3, 4, 5, 6]
                        }));
                      }}
                      className="w-5 h-5 rounded border-amber-500 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm">Daily</span>
                  </label>
                </div>
                <div className="flex justify-between gap-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <Button
                      key={i}
                      variant={alarm.days_of_week.includes(i)? 'default' : 'outline'}
                      size="icon"
                      className={cn(
                        'h-11 w-11 rounded-full',
                        alarm.days_of_week.includes(i) && 'bg-amber-500 hover:bg-amber-600'
                      )}
                      onClick={() => toggleDay(i)}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Wake-up mission</span>
                  <span className="text-sm text-muted-foreground">
                    {MISSIONS.findIndex(m => m.id === alarm.verification_type) + 1}/{MISSIONS.length}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {MISSIONS.map((mission) => {
                    const Icon = mission.icon;
                    const isSelected = alarm.verification_type === mission.id;
                    return (
                      <button
                        key={mission.id}
                        onClick={() =>!mission.locked && setAlarm(prev => ({...prev, verification_type: mission.id}))}
                        className={cn(
                          'relative flex flex-col items-center gap-1 p-3 rounded-xl transition-all',
                          isSelected? 'bg-amber-500/20 border-2 border-amber-500' : 'bg-muted',
                          mission.locked && 'opacity-50'
                        )}
                      >
                        {mission.locked && (
                          <Lock className="absolute top-1 right-1 h-3 w-3 text-muted-foreground" />
                        )}
                        <Icon className={cn('h-6 w-6', isSelected && 'text-amber-500')} />
                        <span className="text-xs">{mission.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-card rounded-2xl p-4 space-y-4">
                <Label className="text-muted-foreground text-sm">Alarm sound</Label>
                <button className="w-full flex items-center justify-between p-3 bg-muted rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center">
                      <Play className="h-4 w-4" />
                    </div>
                    <span>{SOUNDS.find(s => s.id === alarm.sound_type)?.name || 'Rise & Shine'}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <div className="flex items-center gap-3">
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                  <Slider
                    value={[alarm.volume]}
                    onValueChange={([v]) => setAlarm(prev => ({...prev, volume: v}))}
                    max={100}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Vibrate className="h-5 w-5 text-muted-foreground" />
                    <Switch
                      checked={alarm.vibration_enabled}
                      onCheckedChange={(v) => setAlarm(prev => ({...prev, vibration_enabled: v}))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Gentle wake-up</span>
                  <button className="flex items-center gap-1 text-muted-foreground">
                    <span>{alarm.gentle_wakeup_seconds} seconds</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span>Snooze</span>
                  <button className="flex items-center gap-1 text-muted-foreground">
                    <span>{alarm.snooze_interval_minutes} min, {alarm.snooze_limit} times</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-4 space-y-2">
                <Label className="text-muted-foreground text-sm">Why are you waking up?</Label>
                <Input
                  placeholder="e.g., Fajr prayer and morning study"
                  value={alarm.intention}
                  onChange={(e) => setAlarm(prev => ({...prev, intention: e.target.value}))}
                  className="bg-muted border-0"
                />
                <p className="text-xs text-muted-foreground">This will appear when your alarm rings</p>
              </div>
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border">
            <Button
              onClick={handleSave}
              className="w-full h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-lg font-semibold"
            >
              Save
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}