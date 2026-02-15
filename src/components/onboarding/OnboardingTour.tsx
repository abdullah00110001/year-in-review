import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Target, 
  Calendar, 
  BarChart3, 
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Rocket,
  Shield,
  Brain,
  Heart,
  Bell,
  Flame,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppMode } from '@/contexts/AppModeContext';

interface OnboardingTourProps {
  isOpen: boolean;
  onComplete: () => void;
}

const tourSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Oporajeyo! 🎉',
    description: 'Your complete Life OS for tracking daily progress, building habits, and achieving your goals — spiritually and academically.',
    icon: Sparkles,
    tip: 'Takes only 3 minutes',
  },
  {
    id: 'daily-input',
    title: '📋 Daily Life Input',
    description: 'The heart of your tracking. Log every aspect of your day including prayers, study, sleep, exercise, screen time, and mood.',
    icon: Calendar,
    tip: 'Best done every evening before bed',
    features: [
      '🕌 Track all 5 daily prayers (On Time / Qaza / Missed)',
      '📖 Quran reading with surah & ayah tracking',
      '📚 Study hours, revision & skill learning',
      '📱 Screen time & social media tracking',
      '🏋️ Exercise type, intensity & duration',
      '😴 Sleep quality & duration',
      '🧠 Energy, focus & discipline levels',
      '✍️ Free reflection & daily regrets',
    ],
  },
  {
    id: 'habits',
    title: '✅ Habit Tracking',
    description: 'Create daily and weekly habits linked to your goals. Build unbreakable consistency with streak tracking.',
    icon: Target,
    tip: 'Start with 3 habits max, then expand',
    features: [
      'Daily & weekly habit creation',
      '🔥 Streak tracking with visual progress',
      'Link habits to specific goals',
      'Color-coded categories',
    ],
  },
  {
    id: 'insights',
    title: '🧠 Intelligence Engine & Insights',
    description: 'AI-powered analytics that understand your patterns. Get burnout alerts, life balance scores, and personalized suggestions.',
    icon: Brain,
    tip: 'Check weekly for best results',
    features: [
      'Mood-productivity correlation analysis',
      '🔴 Burnout detection & recovery mode',
      '⚖️ Life balance score (Iman vs Dunya)',
      'Predictive analytics & goal suggestions',
      'Cognitive load meter',
    ],
  },
  {
    id: 'islamic',
    title: '🕌 Islamic Dashboard',
    description: 'Dedicated spiritual tracking with Salah quality, Quran heatmap, Tahajjud analytics, and Nafs accountability.',
    icon: BookOpen,
    tip: 'Switch to Islamic mode for full features',
    features: [
      'Salah quality & khushu tracking',
      'Quran reading heatmap & progress',
      'Tahajjud & Sadaqah tracking',
      'Akhirah Ratio & Barakah Index',
      'Niyyah Validator & Tawbah Protocol',
    ],
  },
  {
    id: 'shield',
    title: '🛡️ Shield — Digital Discipline',
    description: 'Block distracting apps and websites. Focus timer with accountability partners and discipline scoring.',
    icon: Shield,
    tip: 'Set up Shield profiles for Study & Sleep',
    features: [
      'App & website blocking profiles',
      '⏱️ Focus timer with strict modes',
      'Usage stats & screen time analytics',
      'Accountability group support',
    ],
  },
  {
    id: 'life-calendar',
    title: '❤️ Life Calendar & Hayat Battery',
    description: 'Visualize your entire life in weeks. Track milestones, see your life battery percentage, and make every week count.',
    icon: Heart,
    tip: 'Add life milestones to mark important events',
    features: [
      'Life grid showing past & future weeks',
      '🔋 Hayat Battery — your life percentage',
      'Milestone timeline with icons',
      'Week detail view with reflections',
    ],
  },
  {
    id: 'more-features',
    title: '🔥 More Powerful Features',
    description: 'Challenges, leaderboards, journals, quarterly goals, future letters, knowledge shelf, and much more!',
    icon: Flame,
    tip: 'Explore the sidebar menu for all features',
    features: [
      '🏆 Challenges & Gamification',
      '📊 Comparative Analytics',
      '📝 Journal & Night Muhasaba',
      '🎯 Quarterly Goals & Monthly Reviews',
      '⏰ Rise — Smart Alarm System',
    ],
  },
  {
    id: 'ready',
    title: 'You\'re All Set! 🚀',
    description: 'Start your journey today. Consistency is the key — even small progress compounds over time. Begin with Daily Input!',
    icon: Rocket,
    tip: 'Tap the + button at the bottom to start',
  },
];

export default function OnboardingTour({ isOpen, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { mode } = useAppMode();
  const isIslamic = mode === 'islamic';

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('onboarding_tour_complete', 'true');
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_tour_complete', 'true');
    onComplete();
  };

  const accentColor = isIslamic ? 'emerald' : 'primary';

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg [&>button]:hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-t-lg overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-500 ease-out",
              isIslamic ? "bg-emerald-500" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        <DialogHeader className="text-center pt-4">
          <div className={cn(
            "mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300",
            isIslamic 
              ? "bg-emerald-100 dark:bg-emerald-900/50" 
              : "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-8 w-8 transition-all duration-300",
              isIslamic 
                ? "text-emerald-600 dark:text-emerald-400" 
                : "text-primary"
            )} />
          </div>
          <DialogTitle className="text-xl sm:text-2xl">{step.title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        {/* Features list */}
        {step.features && (
          <div className="py-4">
            <div className="space-y-2">
              {step.features.map((feature, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
                    "bg-muted/50 hover:bg-muted"
                  )}
                >
                  <CheckCircle2 className={cn(
                    "h-5 w-5 shrink-0",
                    isIslamic ? "text-emerald-500" : "text-primary"
                  )} />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tip badge */}
        <div className={cn(
          "flex items-center justify-center gap-2 py-2 px-4 rounded-full mx-auto w-fit",
          isIslamic 
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
            : "bg-primary/10 text-primary"
        )}>
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">{step.tip}</span>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-2">
            {currentStep > 0 ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handlePrev}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                Skip tour
              </Button>
            )}
          </div>
          
          {/* Step indicators */}
          <div className="flex gap-1.5">
            {tourSteps.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  idx === currentStep 
                    ? cn("w-6", isIslamic ? "bg-emerald-500" : "bg-primary")
                    : idx < currentStep 
                      ? cn("w-2", isIslamic ? "bg-emerald-300" : "bg-primary/50")
                      : "w-2 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          <Button 
            onClick={handleNext}
            size="sm"
            className={cn(
              "gap-2",
              isIslamic && "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
