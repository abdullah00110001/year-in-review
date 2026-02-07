import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { 
  Moon, 
  Sun, 
  Volume2, 
  Mic,
  Clock,
  TrendingUp,
  TrendingDown,
  CloudRain,
  Waves,
  Wind,
  Music,
  Play,
  Pause,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SleepData {
  avgDuration: number;
  sleepScore: number;
  bedtime: string;
  wakeTime: string;
}

interface RiseSleepTrackerProps {
  sleepData: SleepData;
}

export function RiseSleepTracker({ sleepData }: RiseSleepTrackerProps) {
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [snoreDetection, setSnoreDetection] = useState(false);
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  const sleepSounds = [
    { id: 'rain', name: 'Rain', icon: <CloudRain className="h-5 w-5" />, duration: '8h loop' },
    { id: 'ocean', name: 'Ocean Waves', icon: <Waves className="h-5 w-5" />, duration: '8h loop' },
    { id: 'wind', name: 'White Noise', icon: <Wind className="h-5 w-5" />, duration: '8h loop' },
    { id: 'music', name: 'Calm Music', icon: <Music className="h-5 w-5" />, duration: '1h timer' },
  ];

  const weeklyData = [
    { day: 'Mon', hours: 7.5, score: 82 },
    { day: 'Tue', hours: 6.2, score: 65 },
    { day: 'Wed', hours: 8.0, score: 90 },
    { day: 'Thu', hours: 5.5, score: 55 },
    { day: 'Fri', hours: 7.0, score: 75 },
    { day: 'Sat', hours: 9.0, score: 85 },
    { day: 'Sun', hours: 7.8, score: 80 },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-4">
      {/* Sleep Score Card */}
      <Card className="bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border-indigo-500/30">
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <div className="flex justify-center mb-2">
              <div className="h-24 w-24 rounded-full border-4 border-indigo-500/50 flex items-center justify-center bg-background">
                <div className="text-center">
                  <p className={cn('text-3xl font-bold', getScoreColor(sleepData.sleepScore))}>
                    {sleepData.sleepScore}
                  </p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Last Night's Sleep</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-background/50 rounded-xl p-3">
              <Moon className="h-4 w-4 mx-auto mb-1 text-indigo-400" />
              <p className="text-sm font-bold">{sleepData.bedtime}</p>
              <p className="text-[10px] text-muted-foreground">Bedtime</p>
            </div>
            <div className="bg-background/50 rounded-xl p-3">
              <Clock className="h-4 w-4 mx-auto mb-1 text-indigo-400" />
              <p className="text-sm font-bold">{formatHours(sleepData.avgDuration)}</p>
              <p className="text-[10px] text-muted-foreground">Duration</p>
            </div>
            <div className="bg-background/50 rounded-xl p-3">
              <Sun className="h-4 w-4 mx-auto mb-1 text-amber-400" />
              <p className="text-sm font-bold">{sleepData.wakeTime}</p>
              <p className="text-[10px] text-muted-foreground">Wake Up</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Sleep Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly Sleep Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-32 gap-1 mb-2">
            {weeklyData.map((day, i) => {
              const maxHours = 10;
              const height = (day.hours / maxHours) * 100;
              const isToday = i === weeklyData.length - 1;

              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{day.hours}h</span>
                  <div 
                    className={cn(
                      'w-full rounded-t-lg transition-all',
                      isToday ? 'bg-indigo-500' : 'bg-indigo-500/40'
                    )}
                    style={{ height: `${height}%` }}
                  />
                  <p className={cn(
                    'text-xs',
                    isToday ? 'font-bold' : 'text-muted-foreground'
                  )}>
                    {day.day}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              Avg: {formatHours(sleepData.avgDuration)}
            </span>
            <span>Goal: 8h</span>
          </div>
        </CardContent>
      </Card>

      {/* Sleep Tracking Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sleep Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="font-medium text-sm">Auto Sleep Tracking</p>
                <p className="text-xs text-muted-foreground">Track sleep automatically</p>
              </div>
            </div>
            <Switch 
              checked={trackingEnabled}
              onCheckedChange={setTrackingEnabled}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <div className="flex items-center gap-3">
              <Mic className="h-5 w-5 text-rose-500" />
              <div>
                <p className="font-medium text-sm">Snore Detection</p>
                <p className="text-xs text-muted-foreground">Record & analyze snoring</p>
              </div>
            </div>
            <Switch 
              checked={snoreDetection}
              onCheckedChange={setSnoreDetection}
            />
          </div>
        </CardContent>
      </Card>

      {/* Snore Report Preview */}
      {snoreDetection && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Last Night's Snore Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-muted rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-rose-500">23</p>
                <p className="text-xs text-muted-foreground">Snore Events</p>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">18m</p>
                <p className="text-xs text-muted-foreground">Total Duration</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" size="sm">
              <Volume2 className="h-4 w-4 mr-2" />
              Play Recording
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sleep Sounds */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Sleep Sounds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {sleepSounds.map((sound) => (
              <button
                key={sound.id}
                onClick={() => setPlayingSound(
                  playingSound === sound.id ? null : sound.id
                )}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl transition-all',
                  playingSound === sound.id 
                    ? 'bg-primary/20 border-2 border-primary' 
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                <div className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center',
                  playingSound === sound.id ? 'bg-primary/20' : 'bg-background'
                )}>
                  {playingSound === sound.id ? (
                    <Pause className="h-5 w-5 text-primary" />
                  ) : (
                    sound.icon
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{sound.name}</p>
                  <p className="text-[10px] text-muted-foreground">{sound.duration}</p>
                </div>
              </button>
            ))}
          </div>

          {playingSound && (
            <div className="mt-4 p-3 bg-primary/10 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Now Playing</span>
                <span className="text-xs text-muted-foreground">Timer: 1h</span>
              </div>
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4" />
                <Slider defaultValue={[70]} max={100} className="flex-1" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sleep Insights */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm">
            <span className="font-bold">💡 Insight:</span> You got{' '}
            <span className="text-emerald-500 font-bold">45 minutes</span> more sleep 
            than last week's average. Keep it up!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
