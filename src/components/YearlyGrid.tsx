import { useState, useMemo } from "react";
import { format, startOfYear, endOfYear, eachDayOfInterval, getMonth, isToday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface YearlyGridProps {
  year: number;
  trackedDays: Date[];
  onToggleDay: (date: Date) => void;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function YearlyGrid({ year, trackedDays, onToggleDay }: YearlyGridProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const daysInYear = useMemo(() => {
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 0, 1));
    return eachDayOfInterval({ start, end });
  }, [year]);

  const monthGroups = useMemo(() => {
    const groups: Date[][] = Array.from({ length: 12 }, () => []);
    daysInYear.forEach((day) => {
      groups[getMonth(day)].push(day);
    });
    return groups;
  }, [daysInYear]);

  const isTracked = (date: Date) => {
    return trackedDays.some((d) => isSameDay(d, date));
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {monthGroups.map((days, monthIndex) => (
        <div key={monthIndex} className="bg-card rounded-lg p-3 shadow-sm border border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-2 text-center">
            {MONTHS[monthIndex]}
          </h3>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((day, i) => (
              <div key={i} className="text-[9px] text-muted-foreground text-center font-medium">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {/* Empty cells for offset */}
            {Array.from({ length: days[0]?.getDay() || 0 }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const tracked = isTracked(day);
              const today = isToday(day);
              const isHovered = hoveredDate && isSameDay(hoveredDate, day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onToggleDay(day)}
                  onMouseEnter={() => setHoveredDate(day)}
                  onMouseLeave={() => setHoveredDate(null)}
                  className={cn(
                    "aspect-square rounded-sm text-[10px] font-medium transition-all duration-200 relative",
                    "hover:scale-125 hover:z-10",
                    tracked
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-accent/50 text-accent-foreground hover:bg-accent",
                    today && !tracked && "ring-1 ring-primary ring-offset-1 ring-offset-card",
                    today && tracked && "ring-1 ring-primary-foreground/50"
                  )}
                  title={format(day, "MMMM d, yyyy")}
                >
                  {isHovered && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap z-20 shadow-md">
                      {format(day, "MMM d")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
