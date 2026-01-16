import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DayData {
  date: string;
  completed: number;
  total: number;
}

export default function Calendar() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayData, setDayData] = useState<Map<string, DayData>>(new Map());
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCalendarData();
  }, [user, currentMonth]);

  const fetchCalendarData = async () => {
    setLoading(true);
    
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    // Fetch habits
    const { data: habitsData } = await supabase
      .from('habits')
      .select('id, name, color')
      .eq('user_id', user!.id)
      .eq('is_active', true);

    // Fetch entries for the month
    const { data: entriesData } = await supabase
      .from('habit_entries')
      .select('date, completed')
      .eq('user_id', user!.id)
      .gte('date', start)
      .lte('date', end);

    setHabits(habitsData || []);

    // Group entries by date
    const dataMap = new Map<string, DayData>();
    const totalHabits = habitsData?.length || 0;

    entriesData?.forEach((entry) => {
      const existing = dataMap.get(entry.date) || { date: entry.date, completed: 0, total: totalHabits };
      if (entry.completed) {
        existing.completed += 1;
      }
      dataMap.set(entry.date, existing);
    });

    setDayData(dataMap);
    setLoading(false);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getCompletionColor = (completed: number, total: number) => {
    if (total === 0) return 'bg-muted';
    const ratio = completed / total;
    if (ratio === 1) return 'bg-primary';
    if (ratio >= 0.75) return 'bg-primary/75';
    if (ratio >= 0.5) return 'bg-primary/50';
    if (ratio >= 0.25) return 'bg-primary/25';
    if (ratio > 0) return 'bg-primary/10';
    return 'bg-muted';
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t('calendar.title')}</h1>
          <p className="mt-1 text-muted-foreground">
            {t('calendar.subtitle')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  {t('calendar.today')}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Day headers */}
                <div className="mb-2 grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before month start */}
                  {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const data = dayData.get(dateStr);
                    const completed = data?.completed || 0;
                    const total = habits.length;

                    return (
                      <div
                        key={dateStr}
                        className={cn(
                          'relative flex aspect-square flex-col items-center justify-center rounded-lg transition-colors',
                          getCompletionColor(completed, total),
                          isToday(day) && 'ring-2 ring-primary ring-offset-2'
                        )}
                      >
                        <span
                          className={cn(
                            'text-sm font-medium',
                            completed === total && total > 0 ? 'text-primary-foreground' : 'text-foreground'
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                        {total > 0 && (
                          <span
                            className={cn(
                              'text-xs',
                              completed === total ? 'text-primary-foreground/80' : 'text-muted-foreground'
                            )}
                          >
                            {completed}/{total}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-6 flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-muted" />
                    <span className="text-sm text-muted-foreground">{t('calendar.noHabits')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-primary/25" />
                    <span className="text-sm text-muted-foreground">{t('calendar.some')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-primary" />
                    <span className="text-sm text-muted-foreground">{t('calendar.allDone')}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
