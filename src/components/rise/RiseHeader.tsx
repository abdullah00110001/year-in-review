import { Sunrise, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RiseHeaderProps {
  streak: number;
  nextAlarm: { time: string; countdown: string } | null;
}

export function RiseHeader({ streak, nextAlarm }: RiseHeaderProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return { time: `${displayHour}:${minutes}`, ampm };
  };

  return (
    <div className="bg-gradient-to-br from-amber-900/60 via-orange-800/40 to-rose-700/30 text-white p-4 pb-6 rounded-b-3xl">
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
        <Badge variant="outline" className="border-white/20 text-white bg-white/10">
          <Flame className="h-3 w-3 mr-1 text-orange-400" />
          {streak} days
        </Badge>
      </div>

      {/* Next Alarm Display */}
      {nextAlarm ? (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <p className="text-sm text-white/70 mb-1">{nextAlarm.countdown}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight">
              {formatTime(nextAlarm.time).time}
            </span>
            <span className="text-lg text-white/70">
              {formatTime(nextAlarm.time).ampm}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
          <p className="text-white/70">No alarms set</p>
        </div>
      )}
    </div>
  );
}
