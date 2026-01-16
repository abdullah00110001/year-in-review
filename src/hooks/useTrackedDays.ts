import { useState, useEffect, useCallback } from "react";
import { isSameDay } from "date-fns";

const STORAGE_KEY = "yearly-tracker-days";

export function useTrackedDays() {
  const [trackedDays, setTrackedDays] = useState<Date[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((d: string) => new Date(d));
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(trackedDays.map((d) => d.toISOString()))
    );
  }, [trackedDays]);

  const toggleDay = useCallback((date: Date) => {
    setTrackedDays((prev) => {
      const exists = prev.some((d) => isSameDay(d, date));
      if (exists) {
        return prev.filter((d) => !isSameDay(d, date));
      }
      return [...prev, date];
    });
  }, []);

  const getTrackedDaysForYear = useCallback(
    (year: number) => {
      return trackedDays.filter((d) => d.getFullYear() === year);
    },
    [trackedDays]
  );

  return {
    trackedDays,
    toggleDay,
    getTrackedDaysForYear,
  };
}
