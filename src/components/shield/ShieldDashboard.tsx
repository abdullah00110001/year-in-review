import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Clock, 
  Ban, 
  Zap,
  TrendingUp,
  Lock,
  Unlock,
  Play,
  ChevronRight,
  Coffee,
  Target,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DisciplineProfile {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  strictness_level: string;
  is_active: boolean;
  default_duration_minutes: number;
}

interface ShieldSession {
  id: string;
  profile_name: string;
  strictness_level: string;
  scheduled_end_at: string | null;
  bypass_attempts: number;
}

interface DisciplineScore {
  current_score: number;
  current_streak_days: number;
  total_focus_minutes: number;
  total_time_saved_minutes: number;
}

interface ShieldDashboardProps {
  profiles: DisciplineProfile[];
  activeSession: ShieldSession | null;
  disciplineScore: DisciplineScore | null;
  onStartSession: (profile: DisciplineProfile) => void;
  onEndSession: (reason?: string) => void;
  screenTime: number;
  dailyLimit: number;
}

export function ShieldDashboard({
  profiles,
  activeSession,
  disciplineScore,
  onStartSession,
  onEndSession,
  screenTime,
  dailyLimit
}: ShieldDashboardProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getRemainingTime = () => {
    if (!activeSession?.scheduled_end_at) return null;
    const end = new Date(activeSession.scheduled_end_at);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Completed';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const screenTimePercent = Math.min((screenTime / dailyLimit) * 100, 100);
  const quickStartProfiles = profiles.slice(0, 3);

  const breakDurations = [
    { label: '30 min', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '2 hours', minutes: 120 },
    { label: 'All Day', minutes: 1440 }
  ];

  return (
    <div className="space-y-4">
      {/* Active Session Display */}
      {activeSession && (
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold">{activeSession.profile_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getRemainingTime()} remaining
                  </p>
                </div>
              </div>
              <Badge 
                className={cn(
                  activeSession.strictness_level === 'absolute' 
                    ? 'bg-rose-500/20 text-rose-500' 
                    : activeSession.strictness_level === 'hard'
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'bg-emerald-500/20 text-emerald-500'
                )}
              >
                {activeSession.strictness_level === 'absolute' && <Lock className="h-3 w-3 mr-1" />}
                {activeSession.strictness_level}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-background/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold">{activeSession.bypass_attempts}</p>
                <p className="text-[10px] text-muted-foreground">Bypass Attempts</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold">0</p>
                <p className="text-[10px] text-muted-foreground">Apps Blocked</p>
              </div>
              <div className="bg-background/50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold">0</p>
                <p className="text-[10px] text-muted-foreground">Sites Blocked</p>
              </div>
            </div>

            {activeSession.strictness_level === 'normal' && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onEndSession()}
              >
                End Session
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Screen Time Overview */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-medium">Today's Screen Time</span>
            </div>
            <span className="text-2xl font-bold">{formatTime(screenTime)}</span>
          </div>
          <Progress 
            value={screenTimePercent} 
            className={`h-2 ${screenTimePercent >= 100 ? 'bg-destructive/20' : ''}`}
          />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{screenTimePercent.toFixed(0)}% of limit used</span>
            <span>Limit: {formatTime(dailyLimit)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Discipline Score */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5">
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-3xl font-bold">{disciplineScore?.current_score || 50}</p>
            <p className="text-xs text-muted-foreground">Discipline Score</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-500/5">
          <CardContent className="p-4 text-center">
            <Zap className="h-6 w-6 mx-auto mb-1 text-orange-500" />
            <p className="text-3xl font-bold">{disciplineScore?.current_streak_days || 0}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Profiles */}
      {!activeSession && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickStartProfiles.map((profile) => (
              <Button
                key={profile.id}
                variant="outline"
                className="w-full justify-between h-auto py-3"
                onClick={() => onStartSession(profile)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{profile.icon}</span>
                  <div className="text-left">
                    <p className="font-medium">{profile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.default_duration_minutes} min • {profile.strictness_level}
                    </p>
                  </div>
                </div>
                <Play className="h-4 w-4" />
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Take a Break */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Coffee className="h-4 w-4" />
            Take a Break
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {breakDurations.map((duration) => (
              <Button 
                key={duration.minutes} 
                variant="outline" 
                size="sm"
                className="flex-shrink-0"
                disabled={!!activeSession}
              >
                {duration.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Ban className="h-6 w-6 mx-auto mb-1 text-rose-500" />
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">Apps Blocked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-bold">{formatTime(disciplineScore?.total_time_saved_minutes || 0)}</p>
            <p className="text-xs text-muted-foreground">Time Saved</p>
          </CardContent>
        </Card>
      </div>

      {/* Honest Insight */}
      {activeSession?.bypass_attempts && activeSession.bypass_attempts > 0 && (
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <p className="text-sm">
                You've tried to escape focus <span className="font-bold">{activeSession.bypass_attempts} times</span> this session. 
                Stay strong! 💪
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
