import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Smartphone, Clock, Zap, ArrowUpRight, BarChart3 } from 'lucide-react';
import Shield from '@/lib/capacitor/shieldPlugin';
import { isNative } from '@/lib/capacitor/platform';
import { Skeleton } from '@/components/ui/skeleton';

interface AppStat {
  packageName: string;
  appName: string;
  usageMinutes: number;
  launchCount: number;
  lastUsed: number;
}

export function ShieldUsageStats() {
  const [stats, setStats] = useState<AppStat[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsageStats = async () => {
      if (!isNative) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await Shield.getScreenTimeStats();
        if (data && data.apps) {
          // সবচেয়ে বেশি ব্যবহৃত অ্যাপগুলো আগে দেখাবে
          const sortedApps = [...data.apps].sort((a, b) => b.usageMinutes - a.usageMinutes);
          setStats(sortedApps.slice(0, 5)); // টপ ৫ অ্যাপ দেখাবে
          setTotalMinutes(data.totalMinutes || 0);
        }
      } catch (error) {
        console.error("Error fetching usage stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsageStats();
    // প্রতি ২ মিনিটে ডেটা আপডেট করবে
    const interval = setInterval(fetchUsageStats, 120000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40 bg-white/5" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full bg-white/5 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          Today's Screen Time
        </h2>
        <div className="text-sm font-bold text-indigo-300">
          Total: {formatTime(totalMinutes)}
        </div>
      </div>

      <div className="grid gap-3">
        {stats.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-8 text-center text-white/40">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>No usage data found yet.</p>
            </CardContent>
          </Card>
        ) : (
          stats.map((app) => (
            <Card key={app.packageName} className="bg-white/5 border-white/10 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{app.appName}</p>
                      <p className="text-xs text-white/40">{app.packageName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatTime(app.usageMinutes)}</p>
                    <p className="text-[10px] text-emerald-400 flex items-center justify-end">
                      <Zap className="h-3 w-3 mr-0.5" /> Active
                    </p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>Usage limit</span>
                    <span>{Math.round((app.usageMinutes / (totalMinutes || 1)) * 100)}% of total</span>
                  </div>
                  <Progress 
                    value={(app.usageMinutes / (totalMinutes || 1)) * 100} 
                    className="h-1.5 bg-white/5" 
                    // @ts-ignore
                    indicatorClassName="bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
