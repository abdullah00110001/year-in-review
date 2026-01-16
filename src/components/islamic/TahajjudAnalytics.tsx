import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Moon, Sun, Zap, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';

interface TahajjudData {
  date: string;
  tahajjud: boolean;
  energyLevel: number;
  productivityScore: number;
}

interface TahajjudAnalyticsProps {
  data: TahajjudData[];
  tahajjudPerformed: boolean;
  onTahajjudToggle: (performed: boolean) => void;
  sleepStart?: string;
  sleepEnd?: string;
  onSleepTimeChange?: (start: string, end: string) => void;
}

export default function TahajjudAnalytics({ 
  data, 
  tahajjudPerformed, 
  onTahajjudToggle,
}: TahajjudAnalyticsProps) {
  // Calculate correlation
  const tahajjudDays = data.filter(d => d.tahajjud);
  const nonTahajjudDays = data.filter(d => !d.tahajjud);

  const avgEnergyWithTahajjud = tahajjudDays.length > 0
    ? tahajjudDays.reduce((acc, d) => acc + d.energyLevel, 0) / tahajjudDays.length
    : 0;

  const avgEnergyWithoutTahajjud = nonTahajjudDays.length > 0
    ? nonTahajjudDays.reduce((acc, d) => acc + d.energyLevel, 0) / nonTahajjudDays.length
    : 0;

  const avgProductivityWithTahajjud = tahajjudDays.length > 0
    ? tahajjudDays.reduce((acc, d) => acc + d.productivityScore, 0) / tahajjudDays.length
    : 0;

  const avgProductivityWithoutTahajjud = nonTahajjudDays.length > 0
    ? nonTahajjudDays.reduce((acc, d) => acc + d.productivityScore, 0) / nonTahajjudDays.length
    : 0;

  const energyBoost = avgEnergyWithTahajjud - avgEnergyWithoutTahajjud;
  const productivityBoost = avgProductivityWithTahajjud - avgProductivityWithoutTahajjud;

  // Prepare chart data
  const chartData = [
    {
      metric: 'Energy',
      'With Tahajjud': avgEnergyWithTahajjud.toFixed(1),
      'Without Tahajjud': avgEnergyWithoutTahajjud.toFixed(1),
    },
    {
      metric: 'Productivity',
      'With Tahajjud': avgProductivityWithTahajjud.toFixed(1),
      'Without Tahajjud': avgProductivityWithoutTahajjud.toFixed(1),
    },
  ];

  const hasEnoughData = data.length >= 7;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-500" />
            Tahajjud Analytics
          </CardTitle>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              tahajjudPerformed 
                ? "border-emerald-500 text-emerald-600" 
                : "border-muted text-muted-foreground"
            )}
          >
            {tahajjudPerformed ? '✓ Prayed Tonight' : 'Not Yet'}
          </Badge>
        </div>
        <CardDescription>Sleep Cycles vs. Night Prayer Impact</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Toggle */}
        <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-500" />
            <Label htmlFor="tahajjud-toggle" className="text-sm font-medium">
              Tahajjud Tonight
            </Label>
          </div>
          <Switch
            id="tahajjud-toggle"
            checked={tahajjudPerformed}
            onCheckedChange={onTahajjudToggle}
          />
        </div>

        {/* Stats Comparison */}
        {hasEnoughData ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className={cn(
                "p-3 rounded-lg text-center",
                energyBoost > 0 
                  ? "bg-emerald-50 dark:bg-emerald-950/30" 
                  : "bg-muted"
              )}>
                <Zap className={cn(
                  "h-5 w-5 mx-auto mb-1",
                  energyBoost > 0 ? "text-emerald-500" : "text-muted-foreground"
                )} />
                <p className={cn(
                  "text-lg font-bold",
                  energyBoost > 0 ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"
                )}>
                  {energyBoost > 0 ? '+' : ''}{energyBoost.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Energy Boost</p>
              </div>
              <div className={cn(
                "p-3 rounded-lg text-center",
                productivityBoost > 0 
                  ? "bg-emerald-50 dark:bg-emerald-950/30" 
                  : "bg-muted"
              )}>
                <TrendingUp className={cn(
                  "h-5 w-5 mx-auto mb-1",
                  productivityBoost > 0 ? "text-emerald-500" : "text-muted-foreground"
                )} />
                <p className={cn(
                  "text-lg font-bold",
                  productivityBoost > 0 ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"
                )}>
                  {productivityBoost > 0 ? '+' : ''}{productivityBoost.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">Productivity Boost</p>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="metric" tick={{ fontSize: 10 }} width={70} />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 12,
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="With Tahajjud" fill="#10b981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Without Tahajjud" fill="#6b7280" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Insight */}
            {energyBoost > 0 && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  📊 <strong>Data Proof:</strong> Your energy is {((energyBoost / avgEnergyWithoutTahajjud) * 100).toFixed(0)}% higher 
                  on days you pray Tahajjud!
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 italic">
                  "Arise [to pray] the night, except for a little... Indeed, the hours of the night are more effective for concurrence [of heart and tongue]." — Al-Muzzammil 73:2-6
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            <Moon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Track at least 7 days to see correlation insights</p>
            <p className="text-xs mt-1">{data.length}/7 days recorded</p>
          </div>
        )}

        {/* Tahajjud Days Counter */}
        <div className="flex justify-between items-center text-sm pt-2 border-t">
          <span className="text-muted-foreground">Tahajjud Days (Last 30)</span>
          <span className="font-medium">{tahajjudDays.length} nights</span>
        </div>
      </CardContent>
    </Card>
  );
}
