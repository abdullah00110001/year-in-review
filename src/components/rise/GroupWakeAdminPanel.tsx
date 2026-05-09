import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Clock, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GroupWakeAlarm } from '@/hooks/useGroupWakeAlarm';

const DAYS = [
  { key: 0, label: 'S' },
  { key: 1, label: 'M' },
  { key: 2, label: 'T' },
  { key: 3, label: 'W' },
  { key: 4, label: 'T' },
  { key: 5, label: 'F' },
  { key: 6, label: 'S' },
];

const MISSIONS = [
  { value: 'none', label: 'Tap to dismiss' },
  { value: 'math', label: 'Math problem' },
  { value: 'shake', label: 'Shake phone' },
  { value: 'photo', label: 'Photo proof' },
  { value: 'barcode', label: 'Scan barcode' },
];

interface Props {
  alarm: GroupWakeAlarm | null;
  onSave: (input: { wake_time: string; days_of_week: number[]; mission_type: string }) => Promise<void> | void;
  onDisable?: () => Promise<void> | void;
}

export function GroupWakeAdminPanel({ alarm, onSave, onDisable }: Props) {
  const [time, setTime] = useState('05:00');
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [mission, setMission] = useState('math');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (alarm) {
      setTime(alarm.wake_time.slice(0, 5));
      setDays(alarm.days_of_week);
      setMission(alarm.mission_type);
      setActive(alarm.is_active);
    }
  }, [alarm?.id]);

  const toggleDay = (d: number) =>
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> Group Wake Alarm
        </CardTitle>
        <CardDescription>
          Fires on every member's phone at the same time. Mission required to dismiss.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Wake time</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="text-2xl font-bold tabular-nums h-14" />
        </div>

        <div className="space-y-2">
          <Label>Days</Label>
          <div className="flex justify-between gap-1">
            {DAYS.map((d) => (
              <button
                key={d.key}
                onClick={() => toggleDay(d.key)}
                className={cn(
                  'flex-1 h-11 rounded-xl text-sm font-bold transition-all',
                  days.includes(d.key)
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Mission to dismiss</Label>
          <div className="flex flex-wrap gap-2">
            {MISSIONS.map((m) => (
              <Badge
                key={m.value}
                variant={mission === m.value ? 'default' : 'outline'}
                className="cursor-pointer px-3 py-1.5"
                onClick={() => setMission(m.value)}
              >
                {m.label}
              </Badge>
            ))}
          </div>
        </div>

        {alarm && (
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="font-semibold text-sm">Active</p>
              <p className="text-xs text-muted-foreground">Disable to stop firing on all members.</p>
            </div>
            <Switch
              checked={active}
              onCheckedChange={async (v) => {
                setActive(v);
                if (!v && onDisable) await onDisable();
              }}
            />
          </div>
        )}

        <Button
          className="w-full h-12"
          onClick={() => onSave({ wake_time: `${time}:00`, days_of_week: days, mission_type: mission })}
          disabled={days.length === 0}
        >
          <Save className="h-4 w-4 mr-2" />
          {alarm ? 'Update group alarm' : 'Create group alarm'}
        </Button>
      </CardContent>
    </Card>
  );
}