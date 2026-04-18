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
      }
    }
  }, [user]);

  useEffect(() => {
    updateNextAlarm();
    const interval = setInterval(updateNextAlarm, 60000);
    return () => clearInterval(interval);
  }, [alarms]);

  const loadRiseData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data: alarmsData } = await supabase
        .from('rise_alarms')
        .select('*')
        .eq('user_id', user.id)
        .order('alarm_time', { ascending: true });

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

      setAlarms(alarmsData as RiseAlarm[] || []);
      setStreak(streakData);
    } catch (error) {
      console.error('Error loading rise data:', error);
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

    await supabase
      .from('rise_alarms')
      .update({ is_enabled: enabled })
      .eq('id', alarmId);

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
      }
    }

    setAlarms(prev => prev.map(a => 
      a.id === alarmId ? { ...a, is_enabled: enabled } : a
    ));
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
    if (!user) return;

    try {
      if (editingAlarm) {
        // Update existing alarm
        const { error } = await supabase
          .from('rise_alarms')
          .update({
            alarm_time: data.alarm_time,
            days_of_week: data.days_of_week,
            alarm_type: data.alarm_type,
            intention: data.intention || null,
            label: data.label || null,
            verification_type: data.verification_type,
            snooze_limit: data.snooze_limit,
            snooze_interval_minutes: data.snooze_interval_minutes,
            sound_type: data.sound_type,
            vibration_enabled: data.vibration_enabled
          })
          .eq('id', editingAlarm.id);

        if (error) throw error;

        // Reschedule native alarm
        if (isNative) {
          await cancelAlarmByUuid(editingAlarm.id);
          await scheduleRecurringAlarm(
            editingAlarm.id,
            data.alarm_time,
            data.days_of_week,
            {
              title: data.label || 'Rise Alarm',
              body: data.intention || 'Time to wake up!',
              missionType: data.verification_type as any,
              intention: data.intention || undefined,
              snoozeMinutes: data.snooze_interval_minutes || 5
            }
          );
        }

        toast.success('Alarm updated!');
      } else {
        // Create new alarm
        const { data: newAlarm, error } = await supabase
          .from('rise_alarms')
          .insert({
            user_id: user.id,
            alarm_time: data.alarm_time,
            days_of_week: data.days_of_week,
            alarm_type: data.alarm_type,
            intention: data.intention || null,
            label: data.label || null,
            verification_type: data.verification_type,
            snooze_limit: data.snooze_limit,
            snooze_interval_minutes: data.snooze_interval_minutes,
            is_enabled: true
          })
          .select()
          .single();

        if (error) throw error;

        // Schedule native alarm for new alarm
        if (isNative && newAlarm) {
          await scheduleRecurringAlarm(
            newAlarm.id,
            data.alarm_time,
            data.days_of_week,
            {
              title: data.label || 'Rise Alarm',
              body: data.intention || 'Time to wake up!',
              missionType: data.verification_type as any,
              intention: data.intention || undefined,
              snoozeMinutes: data.snooze_interval_minutes || 5
            }
          );
        }

        toast.success('Alarm created!');
      }

      loadRiseData();
    } catch (error) {
      console.error('Error saving alarm:', error);
      toast.error('Failed to save alarm');
    }
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    const { error } = await supabase
      .from('rise_alarms')
      .delete()
      .eq('id', alarmId);

    if (error) {
      toast.error('Failed to delete alarm');
      return;
    }

    // Cancel native alarm
    if (isNative) {
      await cancelAlarmByUuid(alarmId);
    }

    toast.success('Alarm deleted');
    loadRiseData();
  };

  const handleDuplicateAlarm = async (alarm: RiseAlarm) => {
    if (!user) return;

    const { error } = await supabase
      .from('rise_alarms')
      .insert({
        user_id: user.id,
        alarm_time: alarm.alarm_time,
        days_of_week: alarm.days_of_week,
        alarm_type: alarm.alarm_type,
        intention: alarm.intention,
        label: alarm.label ? `${alarm.label} (copy)` : null,
        verification_type: alarm.verification_type,
        snooze_limit: alarm.snooze_limit,
        snooze_interval_minutes: alarm.snooze_interval_minutes,
        is_enabled: false
      });

    if (error) {
      toast.error('Failed to duplicate alarm');
      return;
    }

    toast.success('Alarm duplicated');
    loadRiseData();
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
