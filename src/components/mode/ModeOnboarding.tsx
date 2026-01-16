import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppMode, AppMode } from '@/contexts/AppModeContext';
import { Moon, Sun, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModeOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function ModeOnboarding({ isOpen, onComplete }: ModeOnboardingProps) {
  const { setMode } = useAppMode();
  const [selectedMode, setSelectedMode] = useState<AppMode | null>(null);

  const handleConfirm = () => {
    if (selectedMode) {
      setMode(selectedMode);
      localStorage.setItem('mode_onboarding_complete', 'true');
      onComplete();
    }
  };

  const modes = [
    {
      value: 'islamic' as AppMode,
      label: 'Islamic Mode',
      icon: Moon,
      description: 'Faith-centered productivity',
      features: [
        '🕌 Salah & Quran tracking',
        '📿 Niyyah (intention) validator',
        '🌙 Tahajjud analytics',
        '☪️ Akhirah-weighted scoring',
        '📖 Quranic mood anchors',
      ],
      color: 'emerald',
    },
    {
      value: 'regular' as AppMode,
      label: 'Regular Mode',
      icon: Sun,
      description: 'Secular productivity',
      features: [
        '⏰ Morning routine tracking',
        '🎯 Purpose validator',
        '🌅 5 AM Club analytics',
        '⚖️ Legacy-weighted scoring',
        '📚 Stoic wisdom anchors',
      ],
      color: 'blue',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl [&>button]:hidden">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Choose Your Experience</DialogTitle>
          <DialogDescription>
            Select a mode that aligns with your values. You can change this anytime in Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedMode === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setSelectedMode(m.value)}
                className={cn(
                  "p-5 rounded-xl border-2 text-left transition-all duration-200",
                  "hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring",
                  isSelected
                    ? m.color === 'emerald'
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-lg"
                      : "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "p-2.5 rounded-full",
                    isSelected
                      ? m.color === 'emerald'
                        ? "bg-emerald-100 dark:bg-emerald-900/50"
                        : "bg-blue-100 dark:bg-blue-900/50"
                      : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "h-6 w-6",
                      isSelected
                        ? m.color === 'emerald'
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{m.label}</h3>
                    <p className="text-sm text-muted-foreground">{m.description}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {m.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleConfirm}
            disabled={!selectedMode}
            className={cn(
              "min-w-[200px]",
              selectedMode === 'islamic' && "bg-emerald-600 hover:bg-emerald-700",
              selectedMode === 'regular' && "bg-blue-600 hover:bg-blue-700"
            )}
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
