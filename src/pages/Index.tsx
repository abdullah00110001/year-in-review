import { useState, useMemo } from "react";
import { getDaysInYear, startOfYear, differenceInDays, isLeapYear } from "date-fns";
import { Calendar, Flame, Target, TrendingUp } from "lucide-react";
import { YearlyGrid } from "@/components/YearlyGrid";
import { StatsCard } from "@/components/StatsCard";
import { YearSelector } from "@/components/YearSelector";
import { useTrackedDays } from "@/hooks/useTrackedDays";

const Index = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { toggleDay, getTrackedDaysForYear } = useTrackedDays();

  const trackedDaysForYear = getTrackedDaysForYear(selectedYear);
  const totalDaysInYear = isLeapYear(new Date(selectedYear, 0, 1)) ? 366 : 365;
  
  const daysPassed = useMemo(() => {
    if (selectedYear < currentYear) return totalDaysInYear;
    if (selectedYear > currentYear) return 0;
    return differenceInDays(new Date(), startOfYear(new Date())) + 1;
  }, [selectedYear, currentYear, totalDaysInYear]);

  const trackedCount = trackedDaysForYear.length;
  const percentage = daysPassed > 0 
    ? Math.round((trackedCount / daysPassed) * 100) 
    : 0;

  // Calculate current streak
  const currentStreak = useMemo(() => {
    if (trackedDaysForYear.length === 0) return 0;
    
    const sortedDays = [...trackedDaysForYear].sort((a, b) => b.getTime() - a.getTime());
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedDays.length; i++) {
      const dayToCheck = new Date(today);
      dayToCheck.setDate(dayToCheck.getDate() - i);
      dayToCheck.setHours(0, 0, 0, 0);
      
      const sortedDay = new Date(sortedDays[i]);
      sortedDay.setHours(0, 0, 0, 0);
      
      if (sortedDay.getTime() === dayToCheck.getTime()) {
        streak++;
      } else if (i === 0) {
        // Check if yesterday was tracked (allow for not tracking today yet)
        dayToCheck.setDate(dayToCheck.getDate() - 1);
        if (sortedDay.getTime() === dayToCheck.getTime()) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    return streak;
  }, [trackedDaysForYear]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Yearly Tracker
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track your progress, one day at a time
              </p>
            </div>
            <YearSelector year={selectedYear} onYearChange={setSelectedYear} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatsCard
            title="Days Tracked"
            value={trackedCount}
            subtitle={`of ${daysPassed} days passed`}
            icon={<Target className="h-5 w-5" />}
          />
          <StatsCard
            title="Completion Rate"
            value={`${percentage}%`}
            subtitle="of days passed"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatsCard
            title="Current Streak"
            value={currentStreak}
            subtitle={currentStreak === 1 ? "day" : "days"}
            icon={<Flame className="h-5 w-5" />}
          />
          <StatsCard
            title="Days Remaining"
            value={totalDaysInYear - daysPassed}
            subtitle="in this year"
            icon={<Calendar className="h-5 w-5" />}
          />
        </div>

        {/* Progress Bar */}
        <div className="bg-card rounded-xl p-4 sm:p-6 border border-border/50 shadow-sm mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Year Progress</span>
            <span className="text-sm text-muted-foreground">
              {Math.round((daysPassed / totalDaysInYear) * 100)}% of year complete
            </span>
          </div>
          <div className="h-3 bg-accent rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
              style={{ width: `${(daysPassed / totalDaysInYear) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">Jan 1</span>
            <span className="text-xs text-muted-foreground">Dec 31</span>
          </div>
        </div>

        {/* Yearly Grid */}
        <div className="bg-card/30 rounded-xl p-4 sm:p-6 border border-border/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {selectedYear} Overview
            </h2>
            <p className="text-sm text-muted-foreground">
              Click any day to track it
            </p>
          </div>
          <YearlyGrid
            year={selectedYear}
            trackedDays={trackedDaysForYear}
            onToggleDay={toggleDay}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-accent/50 border border-border/50" />
            <span className="text-sm text-muted-foreground">Not tracked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-primary" />
            <span className="text-sm text-muted-foreground">Tracked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-accent/50 border border-border/50 ring-1 ring-primary ring-offset-1" />
            <span className="text-sm text-muted-foreground">Today</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-8">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-muted-foreground">
            Stay consistent, track daily, achieve your goals 🎯
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
