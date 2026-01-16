import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStreak } from '@/hooks/useStreak';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Target, CheckCircle2, TrendingUp, Flame, Plus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import TimeAwareness from '@/components/dashboard/TimeAwareness';
import SmallWinsWidget from '@/components/dashboard/SmallWinsWidget';
import LifeDistributionWidget from '@/components/dashboard/LifeDistributionWidget';

interface DashboardStats {
  totalGoals: number;
  totalHabits: number;
  todayCompleted: number;
  todayTotal: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { currentStreak, consistencyScore, loading: streakLoading } = useStreak();
  const [stats, setStats] = useState<DashboardStats>({
    totalGoals: 0,
    totalHabits: 0,
    todayCompleted: 0,
    todayTotal: 0,
  });
  const [recentHabits, setRecentHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');

    // Fetch goals count
    const { count: goalsCount } = await supabase
      .from('goals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id);

    // Fetch habits
    const { data: habits, count: habitsCount } = await supabase
      .from('habits')
      .select('*', { count: 'exact' })
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .limit(5);

    // Fetch today's entries
    const { data: todayEntries } = await supabase
      .from('habit_entries')
      .select('*')
      .eq('user_id', user!.id)
      .eq('date', today);

    const completedToday = todayEntries?.filter(e => e.completed).length || 0;

    setStats({
      totalGoals: goalsCount || 0,
      totalHabits: habitsCount || 0,
      todayCompleted: completedToday,
      todayTotal: habitsCount || 0,
    });

    setRecentHabits(habits || []);
    setLoading(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greeting.morning');
    if (hour < 18) return t('dashboard.greeting.afternoon');
    return t('dashboard.greeting.evening');
  };

  const completionRate = stats.todayTotal > 0 
    ? Math.round((stats.todayCompleted / stats.todayTotal) * 100) 
    : 0;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting()}, {user?.email?.split('@')[0]}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Time Awareness Hero */}
        <TimeAwareness />

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.todayProgress')}
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayCompleted}/{stats.todayTotal}</div>
              <Progress value={completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.activeGoals')}
              </CardTitle>
              <Target className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalGoals}</div>
              <p className="text-xs text-muted-foreground">{t('common.for')} {new Date().getFullYear()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.currentStreak')}
              </CardTitle>
              <Flame className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {streakLoading ? '...' : currentStreak} {t('dashboard.days')}
              </div>
              <p className="text-xs text-muted-foreground">{t('dashboard.keepGoing')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.consistency')}
              </CardTitle>
              <Sparkles className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{streakLoading ? '...' : consistencyScore}%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Habits */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's Habits */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('dashboard.todayHabits')}</CardTitle>
                  <CardDescription>{t('dashboard.completeDaily')}</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/habits">{t('dashboard.viewAll')}</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentHabits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 rounded-full bg-muted p-3">
                    <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('dashboard.noHabits')}</p>
                  <Button asChild className="mt-4" size="sm">
                    <Link to="/habits/new">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('dashboard.createFirst')}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentHabits.map((habit) => (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: habit.color }}
                        />
                        <span className="font-medium">{habit.name}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <CheckCircle2 className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goals Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('dashboard.goalsOverview')}</CardTitle>
                  <CardDescription>{t('dashboard.yearlyObjectives')}</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/goals">{t('dashboard.viewAll')}</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stats.totalGoals === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 rounded-full bg-muted p-3">
                    <Target className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('dashboard.noGoals')}</p>
                  <Button asChild className="mt-4" size="sm">
                    <Link to="/goals/new">
                      <Plus className="mr-2 h-4 w-4" />
                      {t('dashboard.setFirst')}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground">
                    You have {stats.totalGoals} active goal{stats.totalGoals !== 1 ? 's' : ''}
                  </p>
                  <Button asChild className="mt-4" size="sm">
                    <Link to="/goals">
                      <Target className="mr-2 h-4 w-4" />
                      {t('dashboard.viewAll')}
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Small Wins & Life Distribution */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <SmallWinsWidget />
          <LifeDistributionWidget />
        </div>
      </div>
    </AppLayout>
  );
}
