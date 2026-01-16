import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAppMode } from '@/contexts/AppModeContext';
import ModeOnboarding from '@/components/mode/ModeOnboarding';
import AppLayout from '@/components/layout/AppLayout';
import NiyyahValidator from '@/components/islamic/NiyyahValidator';
import BarakahIndex from '@/components/islamic/BarakahIndex';
import NafsCounter from '@/components/islamic/NafsCounter';
import TawbahProtocol from '@/components/islamic/TawbahProtocol';
import GhaflahMeter from '@/components/islamic/GhaflahmMeter';
import SadaqahTracker from '@/components/islamic/SadaqahTracker';
import QuranicAnchorSystem from '@/components/islamic/QuranicAnchor';
import MawtMode from '@/components/islamic/MawtMode';
import TahajjudAnalytics from '@/components/islamic/TahajjudAnalytics';
import AkhirahRatio from '@/components/islamic/AkhirahRatio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UnifiedDashboard() {
  const { user } = useAuth();
  const { mode, labels, isLoading } = useAppMode();
  const navigate = useNavigate();
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMawtMode, setShowMawtMode] = useState(false);

  // Check if onboarding needed
  useEffect(() => {
    const onboardingComplete = localStorage.getItem('mode_onboarding_complete');
    if (!onboardingComplete && user) {
      setShowOnboarding(true);
    }
  }, [user]);

  // Check if Friday for Mawt mode
  useEffect(() => {
    const today = new Date();
    const isFriday = today.getDay() === 5;
    const lastMawtCheck = localStorage.getItem('last_mawt_check');
    const todayStr = today.toISOString().split('T')[0];
    
    if (isFriday && lastMawtCheck !== todayStr) {
      setShowMawtMode(true);
    }
  }, []);

  const handleMawtSubmit = (preparedness: number) => {
    localStorage.setItem('last_mawt_check', new Date().toISOString().split('T')[0]);
    console.log('Mawt preparedness:', preparedness);
  };

  // Sample data for demonstration
  const sampleData = {
    sessions: [],
    tahajjudData: [],
    serviceLogs: [],
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Sparkles className="h-8 w-8 animate-pulse text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ModeOnboarding 
        isOpen={showOnboarding} 
        onComplete={() => setShowOnboarding(false)} 
      />
      
      <MawtMode
        isOpen={showMawtMode}
        onClose={() => setShowMawtMode(false)}
        onSubmit={handleMawtSubmit}
      />

      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              {mode === 'islamic' ? <Moon className="h-7 w-7" /> : <Sun className="h-7 w-7" />}
              {mode === 'islamic' ? 'Islamic Dashboard' : 'Productivity Dashboard'}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {mode === 'islamic' 
                ? 'Track your spiritual and worldly progress'
                : 'Track your goals, habits, and performance'}
            </p>
          </div>
          <Badge variant="outline" className={cn(
            "text-sm px-3 py-1",
            mode === 'islamic' 
              ? "border-emerald-500 text-emerald-600" 
              : "border-blue-500 text-blue-600"
          )}>
            {labels.modeName}
          </Badge>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Weighted Score */}
          <AkhirahRatio
            worshipScore={75}
            duniaScore={60}
            salahCompleted={4}
            quranMinutes={20}
            sadaqahDone={true}
            studyMinutes={90}
            exerciseMinutes={30}
          />

          {/* Quality Index */}
          <BarakahIndex
            sessions={sampleData.sessions}
            bestTimeSlot={mode === 'islamic' ? 'After Fajr' : 'Early Morning'}
            averageBarakah={7.2}
          />

          {/* Impulse Control */}
          <NafsCounter
            urgesResisted={12}
            urgesSuccumbed={3}
          />

          {/* Early Rising */}
          <TahajjudAnalytics
            data={sampleData.tahajjudData}
            tahajjudPerformed={false}
            onTahajjudToggle={(val) => console.log('Tahajjud:', val)}
          />

          {/* Dopamine Meter */}
          <GhaflahMeter
            activeLearningMinutes={90}
            mindlessScrollingMinutes={45}
          />

          {/* Emotional Anchor */}
          <QuranicAnchorSystem />

          {/* Service Tracker */}
          <SadaqahTracker
            totalHours={8.5}
            serviceLogs={sampleData.serviceLogs}
            onLogService={(data) => console.log('Service:', data)}
          />

          {/* Day Reset */}
          <TawbahProtocol
            currentScore={35}
            targetScore={100}
            currentHour={new Date().getHours()}
            dayResetUsed={false}
            onReset={() => console.log('Day reset')}
          />
        </div>
      </div>
    </AppLayout>
  );
}
