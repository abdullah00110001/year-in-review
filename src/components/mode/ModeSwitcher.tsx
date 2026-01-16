import { useAppMode, AppMode } from '@/contexts/AppModeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModeSwitcherProps {
  showDescription?: boolean;
  className?: string;
}

export default function ModeSwitcher({ showDescription = true, className }: ModeSwitcherProps) {
  const { mode, setMode, labels } = useAppMode();

  const modes: { value: AppMode; label: string; description: string; icon: typeof Moon }[] = [
    {
      value: 'islamic',
      label: 'Islamic Mode',
      description: 'Faith-centered productivity with Quran, Salah tracking, and spiritual metrics',
      icon: Moon,
    },
    {
      value: 'regular',
      label: 'Regular Mode',
      description: 'Secular productivity with Stoic wisdom, habits, and performance metrics',
      icon: Sun,
    },
  ];

  return (
    <Card className={cn("transition-all duration-300", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5" />
          Experience Mode
        </CardTitle>
        {showDescription && (
          <CardDescription>
            Choose your productivity philosophy. You can switch anytime.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = mode === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all duration-200",
                  "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring",
                  isSelected
                    ? m.value === 'islamic'
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    isSelected
                      ? m.value === 'islamic'
                        ? "bg-emerald-100 dark:bg-emerald-900/50"
                        : "bg-blue-100 dark:bg-blue-900/50"
                      : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      isSelected
                        ? m.value === 'islamic'
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-semibold",
                      isSelected
                        ? m.value === 'islamic'
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-blue-700 dark:text-blue-300"
                        : "text-foreground"
                    )}>
                      {m.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {m.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className={cn(
                      "flex-shrink-0 w-2 h-2 rounded-full",
                      m.value === 'islamic' ? "bg-emerald-500" : "bg-blue-500"
                    )} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
