import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sunrise, 
  Bell, 
  Users, 
  Moon,
  Flame,
  AlertCircle,
  Settings,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { RiseAlarmList } from '@/components/rise/RiseAlarmList';
import { RiseAnalytics } from '@/components/rise/RiseAnalytics';
import { RiseGroupWake } from '@/components/rise/RiseGroupWake';

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
  group_id: string | null;
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

  useEffect(() => {
    if (user) {
      loadRiseData();
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
        countdown: `Ring in ${hours}h ${minutes}m`
      });
    } else {
      setNextAlarm(null);
    }
  };

  const toggleAlarm = async (alarmId: string, enabled: boolean) => {
    await supabase
      .from('rise_alarms')
      .update({ is_enabled: enabled })
      .eq('id', alarmId);

    setAlarms(prev => prev.map(a => 
      a.id === alarmId ? { ...a, is_enabled: enabled } : a
    ));
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return { time: `${displayHour}:${minutes}`, ampm };
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-900/80 via-amber-800/60 to-yellow-700/40 text-white p-4 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Sunrise className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Rise</h1>
              <p className="text-sm text-white/70">Wake with Purpose</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-white/20 text-white">
              <Flame className="h-3 w-3 mr-1 text-orange-400" />
              {streak?.current_streak || 0} days
            </Badge>
          </div>
        </div>

        {/* Next Alarm Card */}
        {nextAlarm ? (
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <p className="text-sm text-white/70 mb-1">{nextAlarm.countdown}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{formatTime(nextAlarm.time).time}</span>
                <span className="text-lg text-white/70">{formatTime(nextAlarm.time).ampm}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <Moon className="h-8 w-8 mx-auto mb-2 text-white/50" />
              <p className="text-white/70">No alarms set</p>
            </CardContent>
          </Card>
        )}

        {/* Recovery Mode Banner */}
        {streak?.is_recovery_mode && (
          <div className="mt-3 p-3 bg-amber-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-300" />
            <div>
              <p className="text-sm font-medium">Recovery Mode Active</p>
              <p className="text-xs text-white/70">Gentler wake-up expectations</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="px-4 -mt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 h-12 rounded-2xl">
            <TabsTrigger value="alarms" className="rounded-xl data-[state=active]:bg-primary">
              <Bell className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="group" className="rounded-xl data-[state=active]:bg-primary">
              <Users className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-primary">
              <TrendingUp className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl data-[state=active]:bg-primary">
              <Settings className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alarms" className="mt-4 pb-24">
            <RiseAlarmList 
              alarms={alarms}
              onToggle={toggleAlarm}
              onRefresh={loadRiseData}
            />
          </TabsContent>

          <TabsContent value="group" className="mt-4 pb-24">
            <RiseGroupWake streak={streak} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 pb-24">
            <RiseAnalytics streak={streak} />
          </TabsContent>

          <TabsContent value="settings" className="mt-4 pb-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alarm Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Snooze Limit</p>
                    <p className="text-sm text-muted-foreground">Max snoozes before escalation</p>
                  </div>
                  <Badge>3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Group Notifications</p>
                    <p className="text-sm text-muted-foreground">Alert group if you oversleep</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Islamic Mode</p>
                    <p className="text-sm text-muted-foreground">Fajr-linked alarms</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}