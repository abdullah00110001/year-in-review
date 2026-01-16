import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Sun, Moon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BarakahSession {
  time: string;
  duration: number;
  value: number;
  barakahScore: number;
}

interface BarakahIndexProps {
  sessions: BarakahSession[];
  bestTimeSlot: string;
  averageBarakah: number;
}

export default function BarakahIndex({ sessions, bestTimeSlot, averageBarakah }: BarakahIndexProps) {
  const getTimeIcon = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 4 && hour < 7) return Sun; // Fajr time
    if (hour >= 7 && hour < 12) return Sun;
    if (hour >= 12 && hour < 17) return Clock;
    return Moon;
  };

  const getBarakahLevel = (score: number) => {
    if (score >= 8) return { label: 'Exceptional Barakah', color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900' };
    if (score >= 6) return { label: 'Good Barakah', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900' };
    if (score >= 4) return { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900' };
    return { label: 'Low Barakah', color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900' };
  };

  const barakahLevel = getBarakahLevel(averageBarakah);

  // Calculate barakah by time slots
  const timeSlotAnalysis = {
    fajr: sessions.filter(s => {
      const hour = parseInt(s.time.split(':')[0]);
      return hour >= 4 && hour < 7;
    }),
    morning: sessions.filter(s => {
      const hour = parseInt(s.time.split(':')[0]);
      return hour >= 7 && hour < 12;
    }),
    afternoon: sessions.filter(s => {
      const hour = parseInt(s.time.split(':')[0]);
      return hour >= 12 && hour < 17;
    }),
    evening: sessions.filter(s => {
      const hour = parseInt(s.time.split(':')[0]);
      return hour >= 17 || hour < 4;
    }),
  };

  const getSlotAverage = (slotSessions: BarakahSession[]) => {
    if (slotSessions.length === 0) return 0;
    return slotSessions.reduce((acc, s) => acc + s.barakahScore, 0) / slotSessions.length;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Barakah Index
          </CardTitle>
          <Badge className={cn("text-xs", barakahLevel.bg, barakahLevel.color)}>
            {averageBarakah.toFixed(1)}/10
          </Badge>
        </div>
        <CardDescription>Quality over Quantity — Output / Time Spent</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Barakah Meter */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{barakahLevel.label}</span>
            <span className="text-muted-foreground">{(averageBarakah * 10).toFixed(0)}%</span>
          </div>
          <Progress value={averageBarakah * 10} className="h-3" />
        </div>

        {/* Best Time Insight */}
        {bestTimeSlot && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-emerald-800 dark:text-emerald-200">
              ✨ <strong>Peak Barakah Time:</strong> Your output is highest {bestTimeSlot}.
              {bestTimeSlot.includes('Fajr') && (
                <span className="block mt-1 text-xs italic">
                  "The early morning has been blessed for my Ummah" — Hadith
                </span>
              )}
            </p>
          </div>
        )}

        {/* Time Slot Breakdown */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'fajr', label: 'After Fajr', icon: '🌅' },
            { key: 'morning', label: 'Morning', icon: '☀️' },
            { key: 'afternoon', label: 'Afternoon', icon: '🌤️' },
            { key: 'evening', label: 'Evening', icon: '🌙' },
          ].map(slot => {
            const avg = getSlotAverage(timeSlotAnalysis[slot.key as keyof typeof timeSlotAnalysis]);
            const level = getBarakahLevel(avg);
            return (
              <div 
                key={slot.key}
                className={cn(
                  "p-2 rounded-lg border text-center",
                  avg > 0 ? level.bg : "bg-muted/30"
                )}
              >
                <span className="text-lg">{slot.icon}</span>
                <p className="text-xs font-medium">{slot.label}</p>
                <p className={cn("text-sm font-bold", avg > 0 ? level.color : "text-muted-foreground")}>
                  {avg > 0 ? avg.toFixed(1) : '-'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Recent Sessions</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {sessions.slice(0, 5).map((session, idx) => {
                const Icon = getTimeIcon(session.time);
                const level = getBarakahLevel(session.barakahScore);
                return (
                  <div 
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      <span>{session.time}</span>
                      <span className="text-muted-foreground">({session.duration}min)</span>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", level.color)}>
                      {session.barakahScore.toFixed(1)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2 border-t">
          Barakah = (Session Value Rating / Time Spent) × Niyyah Multiplier
        </p>
      </CardContent>
    </Card>
  );
}
