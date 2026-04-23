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
import { 
  scheduleRecurringAlarm, 
  cancelAlarmByUuid, 
} from '@/lib/capacitor/nativeAlarm';
import { cancelNativeAlarmShots, canScheduleExactAlarms, openExactAlarmSettings } from '@/lib/capacitor/riseAlarmBridge';
import { isNative } from '@/lib/capacitor/platform';
import { requestRisePermissions } from '@/lib/capacitor/permissions';

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

export default function RisePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('alarms');
  const [alarms, setAlarms] = useState<RiseAlarm[]>([]);
  const [streak, setStreak] = useState<RiseStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nextAlarm, setNextAlarm] = useState<{ time: string; countdown: string } | null>(null);
  void nextAlarm; // header no longer renders this; kept for backward compat
  
  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<RiseAlarm | null>(null);

  useEffect(() => {
    if (user) {
      loadRiseData();
      // Request native permissions on mount
      if (isNative) {
        requestRisePermissions().catch(console.error);
        // On Android 12+, exact alarm permission must be granted in system settings
        canScheduleExactAlarms().then((ok) => {
          if (!ok) {
            toast.warning('Tap to allow exact alarms (required for wake-up)', {
              action: { label: 'Open settings', onClick: () => openExactAlarmSettings() },
              duration: 8000,
            });
          }
        }).catch(() => {});
      }
    }
  }, [user]);

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
        is_enabled: a.is_enabled !== false,
        intention: a.intention || null,
        label: a.label || null,
        verification_type: a.verification_type || 'math',
        snooze_limit: a.snooze_limit ?? 3,
        snooze_interval_minutes: a.snooze_interval_minutes ?? 5,
        sound_type: a.sound_type || 'default',
        vibration_enabled: a.vibration_enabled ?? true,
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
      // Streaks still come from Supabase (these are accountability stats, not alarms)
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

      // Alarms are device-local only — no Supabase round-trip
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
      
      setNextAlarm({
        time: closestAlarm.alarm.alarm_time,
        countdown: `Ring in ${hours} hr. ${minutes} min`
      });
    } else {
      setNextAlarm(null);
    }
  };

  const toggleAlarm = async (alarmId: string, enabled: boolean) => {
    const alarm = alarms.find(a => a.id === alarmId);
    if (!alarm) return;

    // Update localStorage
    const updated = alarms.map(a => a.id === alarmId ? { ...a, is_enabled: enabled } : a);
    setAlarms(updated);
    saveLocalAlarms(updated);

    // Schedule/cancel native alarm
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
    // Editor already wrote to localStorage and scheduled the native alarm.
    // We only need to refresh the list here so the UI reflects the change.
    loadRiseData();
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    const target = alarms.find(a => a.id === alarmId);
    const remaining = alarms.filter(a => a.id !== alarmId);
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
      label: alarm.label ? `${alarm.label} (copy)` : null,
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
      {/* Header - shown on every tab so back button is always reachable */}
      <RiseHeader streak={streak?.current_streak || 0} />


      {/* Content Area */}
      <div className="px-4 mt-4">
        {activeTab === 'alarms' && (
          <div className="space-y-3">
            {/* Alarms List */}
            {alarms.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Sunrise className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <h3 className="font-semibold mb-1">No Alarms Set</h3>
                  <p className="text-sm text-muted-foreground">
                    Create an alarm to start your disciplined mornings
                  </p>
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

            {/* FAB */}
            <Button
              onClick={handleCreateAlarm}
              className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg bg-rose-500 hover:bg-rose-600"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        )}

        {activeTab === 'group' && (
          <RiseGroupWake />
        )}

        {activeTab === 'community' && (
          <CommunityWakeFeed />
        )}

        {activeTab === 'reports' && (
          <RiseReports />
        )}

        {activeTab === 'settings' && (
          <RiseSettings />
        )}
      </div>

      {/* Alarm Editor */}
      <RiseAlarmEditor
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingAlarm(null);
        }}
        onSave={handleSaveAlarm}
        initialData={editingAlarm ? {
          alarm_time: editingAlarm.alarm_time,
          days_of_week: editingAlarm.days_of_week,
          alarm_type: editingAlarm.alarm_type,
          intention: editingAlarm.intention || '',
          label: editingAlarm.label || '',
          verification_type: editingAlarm.verification_type,
          snooze_limit: editingAlarm.snooze_limit,
          snooze_interval_minutes: editingAlarm.snooze_interval_minutes || 5,
          sound_type: editingAlarm.sound_type || 'default',
          vibration_enabled: editingAlarm.vibration_enabled ?? true,
          volume: 80,
          gentle_wakeup_seconds: 30
        } : undefined}
        isEditing={!!editingAlarm}
      />

      {/* Bottom Navigation */}
      <RiseBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
