import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Home, BookOpen, Plus, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface ServiceLog {
  date: string;
  hours: number;
  type: string;
  moodBefore: number;
  moodAfter: number;
}

interface SadaqahTrackerProps {
  totalHours: number;
  serviceLogs: ServiceLog[];
  onLogService: (data: { type: string; hours: number; moodBefore: number; moodAfter: number }) => void;
}

const serviceTypes = [
  { value: 'family', label: 'Family Service', icon: Home },
  { value: 'community', label: 'Community Work', icon: Users },
  { value: 'teaching', label: 'Teaching/Mentoring', icon: BookOpen },
  { value: 'charity', label: 'Charity Work', icon: Heart },
];

export default function SadaqahTracker({ totalHours, serviceLogs, onLogService }: SadaqahTrackerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [serviceType, setServiceType] = useState('');
  const [hours, setHours] = useState('');
  const [moodBefore, setMoodBefore] = useState(5);
  const [moodAfter, setMoodAfter] = useState(5);

  // Calculate mood correlation
  const moodImpact = serviceLogs.length > 0
    ? serviceLogs.reduce((acc, log) => acc + (log.moodAfter - log.moodBefore), 0) / serviceLogs.length
    : 0;

  const handleSubmit = () => {
    if (serviceType && hours) {
      onLogService({
        type: serviceType,
        hours: parseFloat(hours),
        moodBefore,
        moodAfter,
      });
      setIsOpen(false);
      setServiceType('');
      setHours('');
      setMoodBefore(5);
      setMoodAfter(5);
    }
  };

  // Prepare chart data
  const chartData = serviceLogs.slice(-7).map((log, idx) => ({
    day: `Day ${idx + 1}`,
    moodBefore: log.moodBefore,
    moodAfter: log.moodAfter,
    hours: log.hours,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500" />
            Sadaqah of Time
          </CardTitle>
          <Badge variant="outline" className="text-xs border-rose-300 text-rose-600">
            {totalHours.toFixed(1)} hours
          </Badge>
        </div>
        <CardDescription>Track time spent serving others (Khidmat)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-center">
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{totalHours.toFixed(1)}</p>
            <p className="text-xs text-rose-600 dark:text-rose-400">Total Service Hours</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg text-center",
            moodImpact > 0 
              ? "bg-emerald-50 dark:bg-emerald-950/30" 
              : "bg-muted"
          )}>
            <p className={cn(
              "text-2xl font-bold",
              moodImpact > 0 
                ? "text-emerald-700 dark:text-emerald-300" 
                : "text-muted-foreground"
            )}>
              {moodImpact > 0 ? '+' : ''}{moodImpact.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Avg Mood Boost</p>
          </div>
        </div>

        {/* Mood Correlation Chart */}
        {chartData.length > 0 && (
          <div className="h-32">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Mood Before & After Service
            </p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    fontSize: 12,
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="moodBefore" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  name="Before"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="moodAfter" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="After"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Insight */}
        {moodImpact > 0 && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4" />
              <p className="text-sm font-medium">
                Serving others improves your mood by {(moodImpact / 10 * 100).toFixed(0)}%
              </p>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 italic">
              "The best of people are those who are most beneficial to people." — Hadith
            </p>
          </div>
        )}

        {/* Log Service Button */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Log Service Time
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Service (Khidmat)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type of Service</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Hours Spent</Label>
                <Input 
                  type="number" 
                  step="0.5" 
                  min="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="e.g., 1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mood Before (1-10)</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="10"
                    value={moodBefore}
                    onChange={(e) => setMoodBefore(parseInt(e.target.value) || 5)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mood After (1-10)</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="10"
                    value={moodAfter}
                    onChange={(e) => setMoodAfter(parseInt(e.target.value) || 5)}
                  />
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={!serviceType || !hours}>
                Save Service Log
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Service Type Breakdown */}
        <div className="grid grid-cols-4 gap-2">
          {serviceTypes.map(type => {
            const Icon = type.icon;
            const typeHours = serviceLogs
              .filter(log => log.type === type.value)
              .reduce((acc, log) => acc + log.hours, 0);
            return (
              <div key={type.value} className="text-center p-2 rounded-lg bg-muted/30">
                <Icon className="h-4 w-4 mx-auto text-rose-500 mb-1" />
                <p className="text-xs font-medium">{typeHours.toFixed(1)}h</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
