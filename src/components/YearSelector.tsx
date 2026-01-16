import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface YearSelectorProps {
  year: number;
  onYearChange: (year: number) => void;
}

export function YearSelector({ year, onYearChange }: YearSelectorProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onYearChange(year - 1)}
        className="h-8 w-8 rounded-full"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-xl sm:text-2xl font-bold text-foreground min-w-[80px] text-center">
        {year}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onYearChange(year + 1)}
        disabled={year >= currentYear}
        className="h-8 w-8 rounded-full"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
