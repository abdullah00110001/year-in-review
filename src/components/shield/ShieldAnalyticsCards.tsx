import { Card, CardContent } from '@/components/ui/card';
import { Clock, Rocket, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShieldAnalyticsCardsProps {
  screenTimeMinutes: number;
  screenTimeChange: number;
  appLaunches: number;
  appLaunchesChange: number;
  onScreenTimeClick: () => void;
  onAppLaunchesClick: () => void;
}

export function ShieldAnalyticsCards({
  screenTimeMinutes,
  screenTimeChange,
  appLaunches,
  appLaunchesChange,
  onScreenTimeClick,
  onAppLaunchesClick
}: ShieldAnalyticsCardsProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} mins`;
    return `${hours} hrs ${mins.toString().padStart(2, '0')} mins`;
  };

  const formatChange = (change: number, isTime?: boolean) => {
    const prefix = change >= 0 ? '+' : '';
    if (isTime) {
      return `${prefix}${change} percent`;
    }
    return `${prefix}${change} launches`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
          <Rocket className="h-4 w-4" />
        </div>
        <h2 className="font-semibold">Analytics</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Screen Time Card */}
        <Card 
          className="bg-muted/50 border-muted-foreground/20 cursor-pointer hover:bg-muted/70 transition-colors"
          onClick={onScreenTimeClick}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Screen Time</p>
            <p className="text-xl font-bold">{formatTime(screenTimeMinutes)}</p>
            <p className={cn(
              'text-xs mt-1',
              screenTimeChange >= 0 ? 'text-destructive' : 'text-emerald-500'
            )}>
              {formatChange(screenTimeChange, true)}
            </p>
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <span>View</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* App Launches Card */}
        <Card 
          className="bg-muted/50 border-muted-foreground/20 cursor-pointer hover:bg-muted/70 transition-colors"
          onClick={onAppLaunchesClick}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">App Launches</p>
            <p className="text-xl font-bold">{appLaunches}</p>
            <p className={cn(
              'text-xs mt-1',
              appLaunchesChange >= 0 ? 'text-destructive' : 'text-emerald-500'
            )}>
              {formatChange(appLaunchesChange)}
            </p>
            <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
              <span>View</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
