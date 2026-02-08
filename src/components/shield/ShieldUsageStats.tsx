import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Smartphone,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScreenTime } from '@/hooks/useScreenTime';

interface ShieldUsageStatsProps {
  onViewDetails?: () => void;
}

export function ShieldUsageStats({ onViewDetails }: ShieldUsageStatsProps) {
  const { totalScreenTimeMinutes, totalAppLaunches, appUsage, isLoading } = useScreenTime();

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  // Calculate change from yesterday (mock for now)
  const screenTimeChange = 8; // percentage
  const launchesChange = -12;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 bg-muted animate-pulse rounded-2xl" />
        <div className="h-28 bg-muted animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card 
          className="cursor-pointer active:scale-[0.98] transition-transform overflow-hidden"
          onClick={onViewDetails}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Screen Time</span>
            </div>
            <p className="text-2xl font-bold">{formatTime(totalScreenTimeMinutes)}</p>
            <div className={cn(
              'flex items-center gap-1 mt-1 text-xs',
              screenTimeChange > 0 ? 'text-destructive' : 'text-primary'
            )}>
              {screenTimeChange > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(screenTimeChange)}% vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer active:scale-[0.98] transition-transform overflow-hidden"
          onClick={onViewDetails}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center">
                <Smartphone className="h-4 w-4 text-secondary-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">App Opens</span>
            </div>
            <p className="text-2xl font-bold">{totalAppLaunches}</p>
            <div className={cn(
              'flex items-center gap-1 mt-1 text-xs',
              launchesChange > 0 ? 'text-destructive' : 'text-primary'
            )}>
              {launchesChange > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(launchesChange)}% vs yesterday</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Apps */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-medium mb-3">Top Apps Today</h3>
          <div className="space-y-3">
            {appUsage.slice(0, 4).map((app, index) => (
              <div key={app.packageName} className="flex items-center gap-3">
                <div className="w-5 text-center">
                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                </div>
                <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center text-xs font-medium">
                  {app.appName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{app.appName}</p>
                  <Progress 
                    value={(app.usageMinutes / totalScreenTimeMinutes) * 100} 
                    className="h-1.5 mt-1"
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatTime(app.usageMinutes)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
