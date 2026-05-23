import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Sunrise,
  TrendingUp,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { cn } from '@/lib/utils';

interface WakeReport {
  avgWakeTime: string;
  avgTimeToWake: string;
  totalWakes: number;
  onTimeWakes: number;
  dailyData: {
    day: string;
    wakeTime: string | null;
    status: 'on_time' | 'late' | 'missed';
  }[];
}

interface SleepReport {
  avgDuration: string;
  avgBedTime: string;
  totalNights: number;
  avgQuality: number;
  dailyData: { day: string; minutes: number; quality: number | null }[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function RiseReports() {
  const { user } = useAuth();

  // weekOffset: 0 = this week, -1 = last week, -2 = two weeks ago
  const [weekOffset, setWeekOffset] = useState(0);
  const [reportType, setReportType] = useState<'wake' | 'sleep'>('wake');
  const [report, setReport] = useState<WakeReport | null>(null);
  const [sleepReport, setSleepReport] = useState<SleepReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Correct week calculation: subWeeks goes back, weekOffset <= 0
  const baseDate = subWeeks(new Date(), -weekOffset); // weekOffset is 0 or negative
  const currentWeekStart = startOfWeek(baseDate, { weekStartsOn: 0 });
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

  const weekLabel =
    weekOffset === 0
      ? `This week  ${format(currentWeekStart, 'MMM d')} – ${format(currentWeekEnd, 'MMM d')}`
      : weekOffset === -1
      ? `Last week  ${format(currentWeekStart, 'MMM d')} – ${format(currentWeekEnd, 'MMM d')}`
      : `${format(currentWeekStart, 'MMM d')} – ${format(currentWeekEnd, 'MMM d')}`;

  useEffect(() => {
    if (user) {
      loadWakeData();
      loadSleepData();
    }
  }, [user, weekOffset]);

  // ── Wake data ───────────────────────────────────────────────────────────────
  const loadWakeData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const startIso = currentWeekStart.toISOString();
      const endIso = currentWeekEnd.toISOString();

      const { data: logs, error } = await supabase
        .from('rise_alarm_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const rows = logs || [];

      const wakeTimes = rows
        .filter((l) => l.actual_wake_time)
        .map((l) => {
          const t = new Date(l.actual_wake_time!);
          return t.getHours() * 60 + t.getMinutes();
        });

      const avgMinutes =
        wakeTimes.length > 0
          ? Math.round(wakeTimes.reduce((a, b) => a + b, 0) / wakeTimes.length)
          : null;

      const lateValues = rows
        .filter((l) => l.minutes_late !== null && l.minutes_late !== undefined)
        .map((l) => l.minutes_late as number);

      const avgLate =
        lateValues.length > 0
          ? lateValues.reduce((a, b) => a + b, 0) / lateValues.length
          : null;

      const dailyData = DAY_NAMES.map((day, i) => {
        const dayLog = rows.find((l) => new Date(l.created_at).getDay() === i);
        return {
          day,
          wakeTime: dayLog?.actual_wake_time
            ? format(new Date(dayLog.actual_wake_time), 'h:mm a')
            : null,
          status: (dayLog
            ? (dayLog.minutes_late || 0) <= 5
              ? 'on_time'
              : 'late'
            : 'missed') as 'on_time' | 'late' | 'missed',
        };
      });

      setReport({
        avgWakeTime:
          avgMinutes !== null
            ? (() => {
                const h = Math.floor(avgMinutes / 60);
                const m = avgMinutes % 60;
                const ampm = h >= 12 ? 'PM' : 'AM';
                const displayH = h % 12 || 12;
                return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
              })()
            : '--:--',
        avgTimeToWake:
          avgLate !== null
            ? avgLate < 60
              ? `${Math.round(avgLate)}m`
              : `${Math.floor(avgLate / 60)}h ${Math.round(avgLate % 60)}m`
            : '--',
        totalWakes: rows.length,
        onTimeWakes: rows.filter((l) => (l.minutes_late || 0) <= 5).length,
        dailyData,
      });
    } catch (e) {
      console.error('Wake report error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Sleep data ──────────────────────────────────────────────────────────────
  const loadSleepData = async () => {
    if (!user) return;
    try {
      const startIso = currentWeekStart.toISOString();
      const endIso = currentWeekEnd.toISOString();

      const { data: logs, error } = await (supabase as any)
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('bed_time', startIso)
        .lte('bed_time', endIso)
        .order('bed_time', { ascending: true });

      if (error) throw error;

      type SleepRow = {
        bed_time: string;
        wake_time: string | null;
        duration_minutes: number | null;
        quality_rating: number | null;
      };
      const arr: SleepRow[] = logs || [];

      const durations = arr.map((l) => l.duration_minutes || 0).filter(Boolean);
      const avgMin = durations.length
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null;

      const bedMinutes = arr
        .filter((l) => l.bed_time)
        .map((l) => {
          const d = new Date(l.bed_time);
          return d.getHours() * 60 + d.getMinutes();
        });
      const avgBed = bedMinutes.length
        ? Math.round(bedMinutes.reduce((a, b) => a + b, 0) / bedMinutes.length)
        : null;

      const qualities = arr.map((l) => l.quality_rating || 0).filter(Boolean);
      const avgQ = qualities.length
        ? qualities.reduce((a, b) => a + b, 0) / qualities.length
        : 0;

      setSleepReport({
        avgDuration:
          avgMin !== null
            ? `${Math.floor(avgMin / 60)}h ${avgMin % 60}m`
            : '--',
        avgBedTime:
          avgBed !== null
            ? (() => {
                const h = Math.floor(avgBed / 60) % 24;
                const m = avgBed % 60;
                const ampm = h >= 12 ? 'PM' : 'AM';
                const displayH = h % 12 || 12;
                return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
              })()
            : '--:--',
        totalNights: arr.length,
        avgQuality: Math.round(avgQ * 10) / 10,
        dailyData: DAY_NAMES.map((day, i) => {
          const dayLog = arr.find((l) => new Date(l.bed_time).getDay() === i);
          return {
            day,
            minutes: dayLog?.duration_minutes || 0,
            quality: dayLog?.quality_rating || null,
          };
        }),
      });
    } catch (e) {
      console.error('Sleep report error:', e);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getBarHeight = (status: string) => {
    switch (status) {
      case 'on_time': return '100%';
      case 'late':    return '60%';
      default:        return '8%';
    }
  };

  const getBarColor = (status: string) => {
    switch (status) {
      case 'on_time': return 'bg-amber-500';
      case 'late':    return 'bg-amber-500/50';
      default:        return 'bg-muted';
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Week selector */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekOffset((p) => p - 1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="font-medium text-sm text-center">{weekLabel}</span>
        {/* Disable forward navigation when already on current week */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekOffset((p) => p + 1)}
          disabled={weekOffset >= 0}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Report type toggle */}
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

      {isLoading && (
        <div className="text-center text-muted-foreground text-sm py-4">Loading…</div>
      )}

      {/* ── SLEEP REPORT ── */}
      {reportType === 'sleep' && !isLoading && (
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
                  const pct = day.minutes
                    ? Math.min(100, (day.minutes / 540) * 100)
                    : 5;
                  return (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full h-32 bg-muted/30 rounded-t-lg flex items-end">
                        <div
                          className={cn(
                            'w-full rounded-t-lg transition-all',
                            day.minutes ? 'bg-indigo-500' : 'bg-muted',
                          )}
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-xs',
                          i === new Date().getDay()
                            ? 'font-bold text-indigo-400'
                            : 'text-muted-foreground',
                        )}
                      >
                        {day.day[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Moon className="h-4 w-4" /> Sleep Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <span className="text-sm">Nights tracked</span>
                <span className="font-bold">{sleepReport?.totalNights || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <span className="text-sm">Avg. quality</span>
                <span className="font-bold text-indigo-400">
                  {sleepReport?.avgQuality ? `${sleepReport.avgQuality}/5` : '--'}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── WAKE REPORT ── */}
      {reportType === 'wake' && !isLoading && (
        <>
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

          <Card>
            <CardContent className="p-4">
              <div className="h-40 flex items-end justify-between gap-2">
                {report?.dailyData.map((day, i) => (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full h-32 bg-muted/30 rounded-t-lg flex items-end">
                      <div
                        className={cn('w-full rounded-t-lg transition-all', getBarColor(day.status))}
                        style={{ height: getBarHeight(day.status) }}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-xs',
                        i === new Date().getDay()
                          ? 'font-bold text-amber-500'
                          : 'text-muted-foreground',
                      )}
                    >
                      {day.day[0]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 mt-2">
                <div className="h-0.5 w-4 bg-amber-500 rounded" />
                <span className="text-xs text-amber-500">
                  Average {report?.avgWakeTime || '--:--'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Weekly Summary
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
                  {report?.totalWakes
                    ? `${Math.round((report.onTimeWakes / report.totalWakes) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
