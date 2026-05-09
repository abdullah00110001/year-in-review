import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft,
  ChevronRight,
  Sunrise,
  TrendingUp,
  Moon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { cn } from '@/lib/utils';

interface WakeReport {
  avgWakeTime: string;
  avgTimeToWake: string;
  totalWakes: number;
  onTimeWakes: number;
  dailyData: { day: string; wakeTime: string | null; status: 'on_time' | 'late' | 'missed' }[];
}

interface SleepReport {
  avgDuration: string;
  avgBedTime: string;
  totalNights: number;
  avgQuality: number;
  dailyData: { day: string; minutes: number; quality: number | null }[];
}

export function RiseReports() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [reportType, setReportType] = useState<'wake' | 'sleep'>('wake');
  const [report, setReport] = useState<WakeReport | null>(null);
  const [sleepReport, setSleepReport] = useState<SleepReport | null>(null);

  const currentWeekStart = startOfWeek(subWeeks(new Date(), -weekOffset), { weekStartsOn: 0 });
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

  useEffect(() => {
    if (user) {
      loadReportData();
      loadSleepData();
    }
  }, [user, weekOffset]);

  const loadReportData = async () => {
    if (!user) return;

    try {
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(currentWeekEnd, 'yyyy-MM-dd');

      const { data: logs } = await supabase
        .from('rise_alarm_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (logs && logs.length > 0) {
        const wakeTimes = logs
          .filter(l => l.actual_wake_time)
          .map(l => {
            const time = new Date(l.actual_wake_time!);
            return time.getHours() * 60 + time.getMinutes();
          });
        
        const avgMinutes = wakeTimes.length > 0 
          ? Math.round(wakeTimes.reduce((a, b) => a + b, 0) / wakeTimes.length)
          : 0;
        
        const avgHours = Math.floor(avgMinutes / 60);
        const avgMins = avgMinutes % 60;

        const avgTimeToWakeMinutes = logs
          .filter(l => l.minutes_late !== null)
          .reduce((acc, l) => acc + (l.minutes_late || 0), 0) / (logs.length || 1);

        setReport({
          avgWakeTime: `${avgHours}:${avgMins.toString().padStart(2, '0')} AM`,
          avgTimeToWake: `${Math.floor(avgTimeToWakeMinutes / 60)}h ${Math.round(avgTimeToWakeMinutes % 60)}m`,
          totalWakes: logs.length,
          onTimeWakes: logs.filter(l => (l.minutes_late || 0) <= 5).length,
          dailyData: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
            const dayLog = logs.find(l => new Date(l.created_at).getDay() === i);
            return {
              day,
              wakeTime: dayLog?.actual_wake_time 
                ? format(new Date(dayLog.actual_wake_time), 'h:mm a')
                : null,
              status: dayLog 
                ? (dayLog.minutes_late || 0) <= 5 ? 'on_time' : 'late'
                : 'missed'
            };
          })
        });
      } else {
        setReport({
          avgWakeTime: '--:--',
          avgTimeToWake: '--',
          totalWakes: 0,
          onTimeWakes: 0,
          dailyData: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => ({
            day,
            wakeTime: null,
            status: 'missed'
          }))
        });
      }
    } catch (error) {
      console.error('Error loading report:', error);
    }
  };

  const loadSleepData = async () => {
    if (!user) return;
    try {
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(currentWeekEnd, 'yyyy-MM-dd');
      const { data: logs } = await (supabase as any)
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('bed_time', startDate)
        .lte('bed_time', endDate + 'T23:59:59')
        .order('bed_time', { ascending: true });

      const arr = (logs || []) as Array<{ bed_time: string; wake_time: string | null; duration_minutes: number | null; quality_rating: number | null }>;
      const durations = arr.map(l => l.duration_minutes || 0).filter(Boolean);
      const avgMin = durations.length ? Math.round(durations.reduce((a,b)=>a+b,0)/durations.length) : 0;
      const bedMinutes = arr.map(l => { const d = new Date(l.bed_time); return d.getHours()*60+d.getMinutes(); });
      const avgBed = bedMinutes.length ? Math.round(bedMinutes.reduce((a,b)=>a+b,0)/bedMinutes.length) : 0;
      const qualities = arr.map(l=>l.quality_rating||0).filter(Boolean);
      const avgQ = qualities.length ? qualities.reduce((a,b)=>a+b,0)/qualities.length : 0;

      setSleepReport({
        avgDuration: avgMin ? `${Math.floor(avgMin/60)}h ${avgMin%60}m` : '--',
        avgBedTime: avgMin ? `${Math.floor(avgBed/60)%12 || 12}:${(avgBed%60).toString().padStart(2,'0')} ${avgBed>=720?'PM':'AM'}` : '--:--',
        totalNights: arr.length,
        avgQuality: Math.round(avgQ * 10) / 10,
        dailyData: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, i) => {
          const dayLog = arr.find(l => new Date(l.bed_time).getDay() === i);
          return { day, minutes: dayLog?.duration_minutes || 0, quality: dayLog?.quality_rating || null };
        }),
      });
    } catch (e) {
      console.error('Error loading sleep data:', e);
    }
  };

  const getBarHeight = (status: string) => {
    switch (status) {
      case 'on_time': return '100%';
      case 'late': return '60%';
      default: return '10%';
    }
  };

  const getBarColor = (status: string) => {
    switch (status) {
      case 'on_time': return 'bg-amber-500';
      case 'late': return 'bg-amber-500/50';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-4">
      {/* Week Selector */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset(prev => prev - 1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="font-medium">
          This week {format(currentWeekStart, 'MMM d')} - {format(currentWeekEnd, 'MMM d')}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setWeekOffset(prev => prev + 1)}
          disabled={weekOffset >= 0}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Report Type Toggle */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant={reportType === 'wake' ? 'default' : 'ghost'}
          size="sm"
          className={cn(reportType === 'wake' && 'bg-amber-500 hover:bg-amber-600')}
          onClick={() => setReportType('wake')}
        >
          <Sunrise className="h-4 w-4 mr-2" />
          Wake up report
        </Button>
        <Button
          variant={reportType === 'sleep' ? 'default' : 'ghost'}
          size="sm"
          className={cn(reportType === 'sleep' && 'bg-indigo-500 hover:bg-indigo-600')}
          onClick={() => setReportType('sleep')}
        >
          <Moon className="h-4 w-4 mr-2" />
          Sleep report
        </Button>
      </div>

      {reportType === 'sleep' ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-indigo-900/30 to-violet-800/20 border-indigo-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{sleepReport?.avgDuration || '--'}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg. sleep</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-indigo-900/30 to-violet-800/20 border-indigo-500/20">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{sleepReport?.avgBedTime || '--:--'}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg. bedtime</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="h-40 flex items-end justify-between gap-2">
                {sleepReport?.dailyData.map((day, i) => {
                  const pct = day.minutes ? Math.min(100, (day.minutes / 540) * 100) : 5;
                  return (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full h-32 bg-muted/30 rounded-t-lg relative flex items-end">
                        <div className={cn('w-full rounded-t-lg transition-all', day.minutes ? 'bg-indigo-500' : 'bg-muted')} style={{ height: `${pct}%` }} />
                      </div>
                      <span className={cn('text-xs', i === new Date().getDay() ? 'font-bold text-indigo-400' : 'text-muted-foreground')}>{day.day[0]}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Moon className="h-4 w-4" /> Sleep Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl"><span className="text-sm">Nights tracked</span><span className="font-bold">{sleepReport?.totalNights || 0}</span></div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl"><span className="text-sm">Avg. quality</span><span className="font-bold text-indigo-400">{sleepReport?.avgQuality ? `${sleepReport.avgQuality}/5` : '--'}</span></div>
            </CardContent>
          </Card>
        </>
      ) : (
      <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-800/20 border-amber-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{report?.avgWakeTime || '--:--'}</p>
            <p className="text-xs text-muted-foreground mt-1">Avg. wake-up time</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-900/30 to-orange-800/20 border-amber-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{report?.avgTimeToWake || '--'}</p>
            <p className="text-xs text-muted-foreground mt-1">Avg. time to wake up</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card>
        <CardContent className="p-4">
          <div className="h-40 flex items-end justify-between gap-2">
            {report?.dailyData.map((day, i) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full h-32 bg-muted/30 rounded-t-lg relative flex items-end">
                  <div 
                    className={cn(
                      'w-full rounded-t-lg transition-all',
                      getBarColor(day.status)
                    )}
                    style={{ height: getBarHeight(day.status) }}
                  />
                </div>
                <span className={cn(
                  'text-xs',
                  i === new Date().getDay() ? 'font-bold text-amber-500' : 'text-muted-foreground'
                )}>
                  {day.day[0]}
                </span>
              </div>
            ))}
          </div>
          
          {/* Average Line */}
          <div className="flex items-center justify-end gap-2 mt-2">
            <div className="h-0.5 w-4 bg-amber-500 rounded" />
            <span className="text-xs text-amber-500">Average {report?.avgWakeTime}</span>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Weekly Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <span className="text-sm">Total wake-ups</span>
            <span className="font-bold">{report?.totalWakes || 0}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <span className="text-sm">On-time wake-ups</span>
            <span className="font-bold text-primary">{report?.onTimeWakes || 0}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <span className="text-sm">Success rate</span>
            <span className="font-bold text-amber-500">
              {report?.totalWakes ? Math.round((report.onTimeWakes / report.totalWakes) * 100) : 0}%
            </span>
          </div>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}
