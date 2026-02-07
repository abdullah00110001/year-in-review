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

export function ShieldAnalytics({ disciplineScore }: ShieldAnalyticsProps) {
  const score = disciplineScore?.current_score || 50;
  
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

  const weeklyData = [
    { day: 'Mon', score: 72, sessions: 3 },
    { day: 'Tue', score: 78, sessions: 4 },
    { day: 'Wed', score: 65, sessions: 2 },
    { day: 'Thu', score: 85, sessions: 5 },
    { day: 'Fri', score: 70, sessions: 3 },
    { day: 'Sat', score: 55, sessions: 1 },
    { day: 'Sun', score: score, sessions: 2 }
  ];

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
                  style={{ height: `${day.score}%` }}
                >
                  <div 
                    className="w-full bg-primary rounded-t-lg"
                    style={{ height: `${Math.min(day.score, score)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{day.day}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-2 bg-emerald-500/10 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Study Mode completed</p>
              <p className="text-xs text-muted-foreground">2 hours focused</p>
            </div>
            <p className="text-xs text-muted-foreground">2h ago</p>
          </div>
          
          <div className="flex items-center gap-3 p-2 bg-amber-500/10 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Bypass attempt blocked</p>
              <p className="text-xs text-muted-foreground">Tried to access Instagram</p>
            </div>
            <p className="text-xs text-muted-foreground">5h ago</p>
          </div>
          
          <div className="flex items-center gap-3 p-2 bg-emerald-500/10 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Deep Work completed</p>
              <p className="text-xs text-muted-foreground">3 hours focused</p>
            </div>
            <p className="text-xs text-muted-foreground">Yesterday</p>
          </div>
        </CardContent>
      </Card>

      {/* Honest Insight */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            "You tried to escape focus <span className="font-bold text-foreground">2 times</span> today. 
            Yesterday: <span className="font-bold text-foreground">4 times</span>. 
            You're improving."
          </p>
        </CardContent>
      </Card>
    </div>
  );
}