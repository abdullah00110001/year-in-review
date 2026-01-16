import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Scale, Star, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AkhirahRatioProps {
  worshipScore: number; // Out of 100
  duniaScore: number; // Out of 100
  salahCompleted: number; // 0-5
  quranMinutes: number;
  sadaqahDone: boolean;
  studyMinutes: number;
  exerciseMinutes: number;
}

export default function AkhirahRatio({
  worshipScore,
  duniaScore,
  salahCompleted,
  quranMinutes,
  sadaqahDone,
  studyMinutes,
  exerciseMinutes,
}: AkhirahRatioProps) {
  // Weighted calculation: Worship 60%, Dunya 40%
  const akhirahWeight = 0.6;
  const duniaWeight = 0.4;
  
  const weightedTotal = (worshipScore * akhirahWeight) + (duniaScore * duniaWeight);
  
  // Day status based on worship priority
  const isDayFailed = salahCompleted < 3; // Less than 3 prayers = failed day
  const isDaySuccessful = worshipScore >= 60 && weightedTotal >= 50;

  const getStatusConfig = () => {
    if (isDayFailed) {
      return {
        status: 'Failed Day',
        color: 'text-rose-500',
        bgColor: 'bg-rose-50 dark:bg-rose-950/30',
        borderColor: 'border-rose-300 dark:border-rose-700',
        message: 'High work output with missed prayers results in a failed day.',
        icon: AlertTriangle,
      };
    }
    if (isDaySuccessful) {
      return {
        status: 'Blessed Day',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
        borderColor: 'border-emerald-300 dark:border-emerald-700',
        message: 'You prioritized your Akhirah while maintaining worldly duties.',
        icon: CheckCircle2,
      };
    }
    return {
      status: 'Average Day',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-300 dark:border-amber-700',
      message: 'Room for improvement in worship activities.',
      icon: Scale,
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // Calculate individual scores
  const salahScore = (salahCompleted / 5) * 100;
  const quranScore = Math.min(100, (quranMinutes / 30) * 100); // 30 min = 100%
  const sadaqahScore = sadaqahDone ? 100 : 0;

  const calculateWorshipBreakdown = () => {
    return ((salahScore * 0.5) + (quranScore * 0.3) + (sadaqahScore * 0.2)).toFixed(0);
  };

  return (
    <Card className={cn("transition-all", config.borderColor)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Scale className="h-4 w-4 text-indigo-500" />
            Akhirah Ratio
          </CardTitle>
          <Badge variant="outline" className={cn("text-xs", config.color)}>
            {config.status}
          </Badge>
        </div>
        <CardDescription>Weighted Daily Score: Worship 60% | Dunya 40%</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Score Display */}
        <div className="text-center py-4">
          <div className="relative inline-block">
            <svg className="w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={352}
                strokeDashoffset={352 - (352 * weightedTotal / 100)}
                className={cn(
                  "transform -rotate-90 origin-center transition-all duration-1000",
                  isDayFailed ? "text-rose-500" : 
                  isDaySuccessful ? "text-emerald-500" : "text-amber-500"
                )}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-3xl font-bold", config.color)}>
                {weightedTotal.toFixed(0)}
              </span>
              <span className="text-xs text-muted-foreground">weighted</span>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {/* Akhirah Score */}
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Akhirah (60%)</span>
              <Star className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {worshipScore.toFixed(0)}
            </p>
            <Progress value={worshipScore} className="h-1.5 mt-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Salah: {salahCompleted}/5</span>
              <span>Quran: {quranMinutes}m</span>
            </div>
          </div>

          {/* Dunya Score */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Dunya (40%)</span>
              <Scale className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
              {duniaScore.toFixed(0)}
            </p>
            <Progress value={duniaScore} className="h-1.5 mt-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Study: {studyMinutes}m</span>
              <span>Exercise: {exerciseMinutes}m</span>
            </div>
          </div>
        </div>

        {/* Status Alert */}
        <Alert className={cn(config.bgColor, config.borderColor)}>
          <Icon className={cn("h-4 w-4", config.color)} />
          <AlertDescription className={cn("text-sm", config.color.replace('text-', 'text-').replace('500', '800 dark:text-').replace('800', '200'))}>
            {config.message}
          </AlertDescription>
        </Alert>

        {/* Formula Display */}
        <div className="p-2 bg-muted/30 rounded text-center">
          <p className="text-xs text-muted-foreground">
            Score = (Worship × 0.6) + (Work/Study × 0.4)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            = ({worshipScore.toFixed(0)} × 0.6) + ({duniaScore.toFixed(0)} × 0.4) = <strong>{weightedTotal.toFixed(0)}</strong>
          </p>
        </div>

        {/* Reminder */}
        <p className="text-xs text-muted-foreground text-center italic">
          "But seek, through that which Allah has given you, the home of the Hereafter; 
          and [yet], do not forget your share of the world." — Al-Qasas 28:77
        </p>
      </CardContent>
    </Card>
  );
}
