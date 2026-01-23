import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppMode, AppMode } from '@/contexts/AppModeContext';
import { Moon, Sun, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
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
        { text: 'Salah & Quran tracking', emoji: '🕌' },
        { text: 'Niyyah (intention) validator', emoji: '📿' },
        { text: 'Tahajjud analytics', emoji: '🌙' },
        { text: 'Akhirah-weighted scoring', emoji: '☪️' },
        { text: 'Quranic mood anchors', emoji: '📖' },
      ],
      gradient: 'from-emerald-500 to-teal-600',
      lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderActive: 'border-emerald-500',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
      value: 'regular' as AppMode,
      label: 'Regular Mode',
      icon: Sun,
      description: 'Secular productivity',
      features: [
        { text: 'Morning routine tracking', emoji: '⏰' },
        { text: 'Purpose validator', emoji: '🎯' },
        { text: '5 AM Club analytics', emoji: '🌅' },
        { text: 'Legacy-weighted scoring', emoji: '⚖️' },
        { text: 'Stoic wisdom anchors', emoji: '📚' },
      ],
      gradient: 'from-blue-500 to-indigo-600',
      lightBg: 'bg-blue-50 dark:bg-blue-950/30',
      borderActive: 'border-blue-500',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      buttonClass: 'bg-blue-600 hover:bg-blue-700',
    },
  ];

  const selectedModeData = modes.find(m => m.value === selectedMode);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl [&>button]:hidden overflow-hidden">
        {/* Animated background gradient */}
        <div 
          className={cn(
            "absolute inset-0 opacity-10 transition-all duration-700",
            selectedMode === 'islamic' && "bg-gradient-to-br from-emerald-500 to-teal-600",
            selectedMode === 'regular' && "bg-gradient-to-br from-blue-500 to-indigo-600",
            !selectedMode && "bg-gradient-to-br from-primary/20 to-accent/20"
          )}
        />

        <DialogHeader className="text-center relative z-10">
          <div className={cn(
            "mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500",
            selectedMode 
              ? selectedModeData?.iconBg 
              : "bg-primary/10"
          )}>
            <Sparkles className={cn(
              "h-7 w-7 transition-all duration-500",
              selectedMode 
                ? selectedModeData?.iconColor 
                : "text-primary"
            )} />
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-bold">Choose Your Experience</DialogTitle>
          <DialogDescription className="text-base sm:text-lg">
            Select a mode that aligns with your values. You can change this anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 relative z-10">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedMode === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setSelectedMode(m.value)}
                className={cn(
                  "p-5 rounded-2xl border-2 text-left transition-all duration-300",
                  "hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring",
                  "transform hover:scale-[1.02]",
                  isSelected
                    ? cn(m.borderActive, m.lightBg, "shadow-xl scale-[1.02]")
                    : "border-border hover:border-muted-foreground/50 bg-card/50"
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "p-3 rounded-xl transition-all duration-300",
                    isSelected ? m.iconBg : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "h-6 w-6 transition-all duration-300",
                      isSelected ? m.iconColor : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{m.label}</h3>
                    <p className="text-sm text-muted-foreground">{m.description}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className={cn("h-5 w-5 ml-auto", m.iconColor)} />
                  )}
                </div>
                <ul className="space-y-2.5">
                  {m.features.map((feature, idx) => (
                    <li 
                      key={idx} 
                      className={cn(
                        "text-sm flex items-center gap-2.5 p-2 rounded-lg transition-all duration-300",
                        isSelected ? "bg-background/60" : "bg-transparent"
                      )}
                    >
                      <span className="text-base">{feature.emoji}</span>
                      <span className={cn(
                        "transition-colors duration-300",
                        isSelected ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-3 relative z-10">
          <Button
            size="lg"
            onClick={handleConfirm}
            disabled={!selectedMode}
            className={cn(
              "min-w-[220px] h-12 text-base font-semibold transition-all duration-300",
              selectedMode && selectedModeData?.buttonClass
            )}
          >
            Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-xs text-muted-foreground">
            You can change this later in Settings
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}