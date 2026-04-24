import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Sunrise } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RiseBottomNav } from '@/components/rise/RiseBottomNav';
import { RiseHeader } from '@/components/rise/RiseHeader';
import { RiseAlarmCard } from '@/components/rise/RiseAlarmCard';
import { RiseAlarmEditor } from '@/components/rise/RiseAlarmEditor';
import { RiseGroupWake } from '@/components/rise/RiseGroupWake';
import { RiseReports } from '@/components/rise/RiseReports';
import { RiseSettings } from '@/components/rise/RiseSettings';
import { CommunityWakeFeed } from '@/components/rise/CommunityWakeFeed';
import { Card, CardContent } from '@/components/ui/card';
import { scheduleRecurringAlarm, cancelAlarmByUuid, initializeAlarmChannel } from '@/lib/capacitor/nativeAlarm';
import { cancelNativeAlarmShots, canScheduleExactAlarms } from '@/lib/capacitor/riseAlarmBridge';
import { isNative } from '@/lib/capacitor/platform';
import { PermissionOnboarding } from '@/components/mobile/PermissionOnboarding';
import { Dialog } from '@capacitor/dialog';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';

interface RiseAlarm {
  id: string;
  alarm_time: string;
  days_of_week: number[];
  alarm_type: string;
  is_enabled: boolean;
  intention: string | null;
  label: string | null;
  verification_type: string;
  snooze_limit: number;
  snooze_interval_minutes?: number;
  sound_type?: string;
  vibration_enabled?: boolean;
}

interface RiseStreak {
  current_streak: number;
  longest_streak: number;
  total_on_time_wakes: number;
  total_alarms: number;
  is_recovery_mode: boolean;
}

const PERMISSION_KEY = 'rise_permissions_v2';

export default function RisePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('alarms');
  const [alarms, setAlarms] = useState<RiseAlarm[]>([]);
  const [streak, setStreak] = useState<RiseStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nextAlarm, setNextAlarm] = useState<{ time: string; countdown: string } | null>(null);
  void nextAlarm;
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<RiseAlarm | null>(null);
  const [permOpen, setPermOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadRiseData();
      // FIX: Rise এ ঢুকলেই পারমিশন চাইবে
      if (isNative) {
        requestAllRisePermissions();
      }
    }
  }, [user]);

  // FIX: ফুল পারমিশন ফ্লো
  const requestAllRisePermissions = async () => {
    const { value } = await Preferences.get({ key: PERMISSION_KEY });
    if (value === 'done') return;

    const info = await Device.getInfo();
    const androidVersion = parseInt(info.osVersion);

    // 1. Notification চ্যানেল বানাও
    await initializeAlarmChannel();

    // 2. Notification পারমিশন - Android 13+
    if (androidVersion >= 13) {
      const notifPerm = await LocalNotifications.requestPermissions();
      if (notifPerm.display!== 'granted') {
        await Dialog.alert({
          title: 'Notification লাগবে',
          message: 'Alarm বাজার সময় নোটিফিকেশন দেখানোর জন্য Permission দিন।'
        });
        return;
      }
    }

    // 3. Exact Alarm পারমিশন - Android 12+
    if (androidVersion >= 12) {
      const canExact = await canScheduleExactAlarms();
      if (!canExact) {
        const { value } = await Dialog.confirm({
          title: 'Enable Exact Alarms',
          message: 'Rise Alarm ঠিক টাইমে বাজানোর জন্য "Alarms & reminders" অন করুন। না হলে 10-15 মিনিট লেট হবে।',
          okButtonTitle: 'Open Settings',
          cancelButtonTitle: 'Skip'
        });
        if (value) {
          await Dialog.alert({
            title: 'Settings খুলছে',
            message: 'Alarms & reminders > Allow setting alarms and reminders অন করুন'
          });
        }
      }
    }

    // 4. Overlay + Battery
    if (androidVersion >= 10) {
      await Dialog.alert({
        title: 'Full Screen Alarm চালু করুন',
        message: 'ফোন লক থাকলেও Alarm দেখানোর জন্য:\n1. Settings > Apps > LifeOS > Appear on top অন করুন\n2. Battery > Unrestricted করুন'
      });
    }

    await Preferences.set({ key: PERMISSION_KEY, value: 'done' });
    toast.success('Permissions setup done! 🎉');
  };

  useEffect(() => {
    updateNextAlarm();
    const interval = setInterval(updateNextAlarm, 60000);
    return () => clearInterval(interval);
  }, [alarms]);

  const loadLocalAlarms = (): RiseAlarm[] => {
    try {
      const raw = localStorage.getItem('local_alarms');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return (parsed as any[]).map((a) => ({
        id: a.id,
        alarm_time: a.alarm_time,
        days_of_week: a.days_of_week || [],
        alarm_type: a.alarm_type || 'personal',
        is_enabled: a.is_enabled!== false,
        intention: a.intention || null,
        label: a.label || null,
        verification_type: a.verification_type || 'math',
        snooze_limit: a.snooze_limit?? 3,
        snooze_interval_minutes: a.snooze_interval_minutes?? 5,
        sound_type: a.sound_type || 'default',
        vibration_enabled: a.vibration_enabled?? true,
      }));
    } catch (e) {
      console.warn('Failed to read local alarms', e);
      return [];
    }
  };

  const saveLocalAlarms = (list: RiseAlarm[]) => {
    try {
      localStorage.setItem('local_alarms', JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to persist local alarms', e);
    }
  };

  const loadRiseData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      let { data: streakData } = await supabase
       .from('rise_streaks')
       .select('*')
       .eq('user_id', user.id)
       .single();
      if (!streakData) {
        const { data: newStreak } = await supabase
         .from('rise_streaks')
         .insert({ user_id: user.id })
         .select()
         .single();
        streakData = newStreak;
      }
      const local = loadLocalAlarms();
      setAlarms(local.sort((a, b) => a.alarm_time.localeCompare(b.alarm_time)));
      setStreak(streakData);
    } catch (error) {
      console.error('Error loading rise data:', error);
      setAlarms(loadLocalAlarms());
    } finally {
      setIsLoading(false);
    }
  };

  const updateNextAlarm = () => {
    const enabledAlarms = alarms.filter(a => a.is_enabled);
    if (enabledAlarms.length === 0) {
      setNextAlarm(null);
      return;
    }
    const now = new Date();
    const today = now.getDay();
    let closestAlarm: { alarm: RiseAlarm; date: Date } | null = null;
    enabledAlarms.forEach(alarm => {
      const [hours, minutes] = alarm.alarm_time.split(':').map(Number);
      for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
        const checkDay = (today + dayOffset) % 7;
        if (alarm.days_of_week.includes(checkDay)) {
          const alarmDate = new Date(now);
          alarmDate.setDate(alarmDate.getDate() + dayOffset);
          alarmDate.setHours(hours, minutes, 0, 0);
          if (alarmDate > now) {
            if (!closestAlarm || alarmDate < closestAlarm.date) {
              closestAlarm = { alarm, date: alarmDate };
            }
            break;
          }
        }
      }
    });
    if (closestAlarm) {
      const diff = closestAlarm.date.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setNextAlarm({ time: closestAlarm.alarm.alarm_time, countdown: `Ring in ${hours} hr. ${minutes} min` });
    } else {
      setNextAlarm(null);
    }
  };

  const toggleAlarm = async (alarmId: string, enabled: boolean) => {
    // পারমিশন চেক করো
    if (enabled) {
      const canExact = await canScheduleExactAlarms();
      if (!canExact) {
        toast.error('Exact Alarm permission লাগবে', {
          action: { label: 'Enable', onClick: () => requestAllRisePermissions() }
        });
        return;
      }
    }

    const alarm = alarms.find(a => a.id === alarmId);
    if (!alarm) return;
    const updated = alarms.map(a => a.id === alarmId? {...a, is_enabled: enabled } : a);
    setAlarms(updated);
    saveLocalAlarms(updated);
    if (isNative) {
      if (enabled) {
        await scheduleRecurringAlarm(
          alarmId,
          alarm.alarm_time,
          alarm.days_of_week,
          {
            title: alarm.label || 'Rise Alarm',
            body: alarm.intention || 'Time to wake up!',
            missionType: alarm.verification_type as any,
            intention: alarm.intention || undefined,
            snoozeMinutes: alarm.snooze_interval_minutes || 5
          }
        );
      } else {
        await cancelAlarmByUuid(alarmId);
        await cancelNativeAlarmShots(alarmId, alarm.alarm_time, alarm.days_of_week);
      }
    }
  };

  const handleEditAlarm = (alarm: RiseAlarm) => {
    setEditingAlarm(alarm);
    setEditorOpen(true);
  };

  const handleCreateAlarm = () => {
    setEditingAlarm(null);
    setEditorOpen(true);
  };

  const handleSaveAlarm = async (data: any) => {
    loadRiseData();
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    const target = alarms.find(a => a.id === alarmId);
    const remaining = alarms.filter(a => a.id!== alarmId);
    setAlarms(remaining);
    saveLocalAlarms(remaining);
    if (isNative) {
      await cancelAlarmByUuid(alarmId);
      if (target) {
        await cancelNativeAlarmShots(alarmId, target.alarm_time, target.days_of_week);
      }
    }
    toast.success('Alarm deleted');
  };

  const handleDuplicateAlarm = async (alarm: RiseAlarm) => {
    const copy: RiseAlarm = {
     ...alarm,
      id: crypto.randomUUID(),
      label: alarm.label? `${alarm.label} (copy)` : null,
      is_enabled: false,
    };
    const next = [...alarms, copy];
    setAlarms(next);
    saveLocalAlarms(next);
    toast.success('Alarm duplicated');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-2xl" />
          <div className="h-48 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <RiseHeader streak={streak?.current_streak || 0} />
      <div className="px-4 mt-4">
        {isNative && (
          <Button variant="outline" size="sm" className="mb-3 w-full" onClick={requestAllRisePermissions}>
            Setup Alarm Permissions
          </Button>
        )}
        {activeTab === 'alarms' && (
          <div className="space-y-3">
            {alarms.length === 0? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Sunrise className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <h3 className="font-semibold mb-1">No Alarms Set</h3>
                  <p className="text-sm text-muted-foreground">Create an alarm to start your disciplined mornings</p>
                </CardContent>
              </Card>
            ) : (
              alarms.map((alarm) => (
                <RiseAlarmCard
                  key={alarm.id}
                  alarm={alarm}
                  onToggle={toggleAlarm}
                  onEdit={handleEditAlarm}
                  onDelete={handleDeleteAlarm}
                  onDuplicate={handleDuplicateAlarm}
                />
              ))
            )}
            <Button
              onClick={handleCreateAlarm}
              className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg bg-rose-500 hover:bg-rose-600"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        )}
        {activeTab === 'group' && <RiseGroupWake />}
        {activeTab === 'community' && <CommunityWakeFeed />}
        {activeTab === 'reports' && <RiseReports />}
        {activeTab === 'settings' && <RiseSettings />}
      </div>
      <RiseAlarmEditor
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingAlarm(null);
        }}
        onSave={handleSaveAlarm}
        initialData={
          editingAlarm
           ? {
                alarm_time: editingAlarm.alarm_time,
                days_of_week: editingAlarm.days_of_week,
                alarm_type: editingAlarm.alarm_type,
                intention: editingAlarm.intention || '',
                label: editingAlarm.label || '',
                verification_type: editingAlarm.verification_type,
                snooze_limit: editingAlarm.snooze_limit,
                snooze_interval_minutes: editingAlarm.snooze_interval_minutes || 5,
                sound_type: editingAlarm.sound_type || 'default',
                vibration_enabled: editingAlarm.vibration_enabled?? true,
                volume: 80,
                gentle_wakeup_seconds: 30
              }
            : undefined
        }
        isEditing={!!editingAlarm}
      />
      <PermissionOnboarding open={permOpen} onClose={() => setPermOpen(false)} feature="rise" />
      <RiseBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
