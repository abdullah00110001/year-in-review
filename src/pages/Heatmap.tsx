import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Flame, Calendar, TrendingUp } from 'lucide-react';
import HeatmapCalendar from '@/components/HeatmapCalendar';
import { useStreak } from '@/hooks/useStreak';

export default function Heatmap() {
  const { t } = useLanguage();
  const [year, setYear] = useState(new Date().getFullYear());
  const { currentStreak, bestStreak, totalActiveDays, consistencyScore, loading } = useStreak();

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t('heatmap.title')}</h1>
          <p className="mt-1 text-muted-foreground">
            {t('heatmap.subtitle')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.currentStreak')}
              </CardTitle>
              <Flame className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : currentStreak}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.days')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('heatmap.bestStreak')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : bestStreak}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.days')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('heatmap.totalDays')}
              </CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : totalActiveDays}</div>
              <p className="text-xs text-muted-foreground">{year}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.consistency')}
              </CardTitle>
              <div className="text-primary">%</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : consistencyScore}%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{year}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setYear(year - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setYear(new Date().getFullYear())}
                  disabled={year === new Date().getFullYear()}
                >
                  {t('calendar.today')}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setYear(year + 1)}
                  disabled={year >= new Date().getFullYear()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <HeatmapCalendar year={year} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
