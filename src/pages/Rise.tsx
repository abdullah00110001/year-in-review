import { useEffect, useState } from 'react';
import { AlarmClock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  scheduleRiseAlarm,
  cancelRiseAlarm,
  canScheduleExactAlarms,
  openExactAlarmSettings,
} from '@/lib/capacitor/riseAlarmBridge';

interface Alarm {
  id: number;
  timeString: string;
  timeInMillis: number;
  isActive: boolean;
}

const RISE_LOCAL_STORAGE_KEY = 'rise-local-alarms';

const loadStoredAlarms = (): Alarm[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(RISE_LOCAL_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[Rise] Failed to read local alarms', error);
    return [];
  }
};

export default function Rise() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('04:00');

  useEffect(() => {
    setAlarms(loadStoredAlarms());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(RISE_LOCAL_STORAGE_KEY, JSON.stringify(alarms));
  }, [alarms]);

  const handleSetAlarm = async () => {
    try {
      const hasPermission = await canScheduleExactAlarms();
      if (!hasPermission) {
        toast.error('Exact Alarm permission required!');
        await openExactAlarmSettings();
        return;
      }

      const now = new Date();
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const alarmDate = new Date();
      alarmDate.setHours(hours, minutes, 0, 0);

      if (alarmDate.getTime() <= now.getTime()) {
        alarmDate.setDate(alarmDate.getDate() + 1);
      }

      const timeInMillis = alarmDate.getTime();
      const alarmId = Date.now();
      const success = await scheduleRiseAlarm(
        alarmId,
        timeInMillis,
        'Rise & Shine!',
        "It's time to wake up and conquer the day!",
      );

      if (!success) {
        toast.error('Failed to set alarm in native engine');
        return;
      }

      const newAlarm: Alarm = {
        id: alarmId,
        timeString: selectedTime,
        timeInMillis,
        isActive: true,
      };

      setAlarms((prev) => [...prev, newAlarm].sort((a, b) => a.timeInMillis - b.timeInMillis));
      toast.success(`Alarm set for ${alarmDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (error) {
      console.error('[Rise] Set alarm failed', error);
      toast.error('An error occurred while setting the alarm');
    }
  };

  const handleDeleteAlarm = async (id: number) => {
    const success = await cancelRiseAlarm(id);
    if (!success) {
      toast.error('Failed to cancel alarm');
      return;
    }

    setAlarms((prev) => prev.filter((alarm) => alarm.id !== id));
    toast.info('Alarm cancelled successfully');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="pt-14 pb-6 px-6 bg-slate-900/50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/20">
            <AlarmClock className="h-7 w-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rise</h1>
            <p className="text-xs font-medium mt-1 text-amber-400/80">Master your morning routine</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-6">
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="bg-transparent text-5xl font-bold text-center text-white focus:outline-none w-full"
              />

              <Button
                onClick={handleSetAlarm}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-12 text-lg font-medium shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Set Alarm
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white/60 px-1">Active Alarms</h3>

          {alarms.length === 0 ? (
            <div className="p-8 text-center text-white/30 border border-white/5 border-dashed rounded-2xl">
              <AlarmClock className="h-8 w-8 mx-auto mb-3 opacity-20" />
              <p>No alarms set.</p>
            </div>
          ) : (
            alarms.map((alarm) => (
              <Card key={alarm.id} className="bg-white/5 border-white/10">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">{alarm.timeString}</h2>
                    <p className="text-xs text-white/40 mt-1">{new Date(alarm.timeInMillis).toLocaleDateString()}</p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAlarm(alarm.id)}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-12 w-12 rounded-full"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
