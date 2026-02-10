import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  Shield,
  Flame,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';

interface DisciplineScore {
  current_score: number;
  current_streak_days: number;
  total_focus_minutes: number;
  total_time_saved_minutes: number;
  can_use_absolute_mode: boolean;
}

interface ShieldAnalyticsProps {
  disciplineScore: DisciplineScore | null;
}

interface SessionLog {
  id: string;
  profile_name: string;
  status: string;
  started_at: string;
  actual_end_at: string | null;
  bypass_attempts: number;
}

export function ShieldAnalytics({ disciplineScore }: ShieldAnalyticsProps) {
  const { user } = useAuth();
  const score = disciplineScore?.current_score || 50;
  const [weeklyData, setWeeklyData] = useState<{ day: string; score: number; sessions: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<SessionLog[]>([]);
  const [totalBypassAttempts, setTotalBypassAttempts] = useState(0);
  const [yesterdayBypasses, setYesterdayBypasses] = useState(0);
  
  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      // Load last 7 days of sessions
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      
      const { data: sessions } = await supabase
        .from('shield_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', sevenDaysAgo)
        .order('started_at', { ascending: false });

      // Build weekly data from real sessions
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekData = days.map((day, i) => {
        const daySessions = (sessions || []).filter(s => new Date(s.started_at).getDay() === i);
        const completedSessions = daySessions.filter(s => s.status === 'completed');
        const dayScore = daySessions.length > 0 
          ? Math.round((completedSessions.length / daySessions.length) * 100)
          : 0;
        return { day, score: dayScore, sessions: daySessions.length };
      });
      setWeeklyData(weekData);

      // Recent activity (last 5 sessions)
      setRecentActivity((sessions || []).slice(0, 5) as SessionLog[]);

      // Bypass attempts
      const { data: bypassLogs } = await supabase
        .from('shield_bypass_logs')
        .select('id, created_at')
        .eq('user_id', user.id)
        .gte('created_at', format(startOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss"));

      setTotalBypassAttempts(bypassLogs?.length || 0);

      const { data: yesterdayLogs } = await supabase
        .from('shield_bypass_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', format(startOfDay(subDays(new Date(), 1)), "yyyy-MM-dd'T'HH:mm:ss"))
        .lt('created_at', format(startOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss"));

      setYesterdayBypasses(yesterdayLogs?.length || 0);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };
  
  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Work';
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const formatSessionTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return format(date, 'MMM d');
  };

  return (
    <div className="space-y-4">
      {/* Discipline Score Card */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Discipline Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-5xl font-bold ${getScoreColor()}`}>{score}</p>
              <p className="text-sm text-white/70">{getScoreLabel()}</p>
            </div>
            <div className="h-20 w-20 rounded-full border-4 border-white/20 flex items-center justify-center">
              <div className="text-center">
                <Flame className="h-6 w-6 mx-auto text-orange-500" />
                <p className="text-xs mt-1">{disciplineScore?.current_streak_days || 0} days</p>
              </div>
            </div>
          </div>
          <Progress value={score} className="h-2" />
          <p className="text-xs text-white/50 mt-2">
            {score >= 60 ? '✓ Absolute Mode unlocked' : `${60 - score} more points to unlock Absolute Mode`}
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">
              {formatMinutes(disciplineScore?.total_focus_minutes || 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Focus Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-2xl font-bold">
              {formatMinutes(disciplineScore?.total_time_saved_minutes || 0)}
            </p>
            <p className="text-xs text-muted-foreground">Time Saved</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly Discipline Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-32 gap-1">
            {weeklyData.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-primary/20 rounded-t-lg transition-all"
                  style={{ height: `${Math.max(day.score, 5)}%` }}
                >
                  <div 
                    className="w-full bg-primary rounded-t-lg"
                    style={{ height: '100%' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{day.day}</p>
              </div>
            ))}
          </div>
          {weeklyData.every(d => d.sessions === 0) && (
            <p className="text-xs text-muted-foreground text-center mt-2">No sessions this week yet</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity - from real data */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent sessions</p>
          ) : (
            recentActivity.map((session) => (
              <div key={session.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                {session.status === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : session.bypass_attempts > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{session.profile_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.status === 'completed' ? 'Completed' : session.status}
                    {session.bypass_attempts > 0 && ` • ${session.bypass_attempts} bypass attempts`}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{formatSessionTime(session.started_at)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Honest Insight - from real data */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            {totalBypassAttempts > 0 ? (
              <>
                You tried to escape focus <span className="font-bold text-foreground">{totalBypassAttempts} times</span> today. 
                Yesterday: <span className="font-bold text-foreground">{yesterdayBypasses} times</span>. 
                {totalBypassAttempts < yesterdayBypasses ? " You're improving. 💪" : " Stay strong! 🛡️"}
              </>
            ) : (
              <>No bypass attempts today. Keep it up! 🎯</>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
