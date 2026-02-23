import { useState, useEffect } from 'react';
import { useDashboardData, calculateScores } from '@/hooks/useDashboardData';
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
import { toast } from 'sonner';

export default function IslamicDashboard() {
  const { todayEntry, studySessions, serviceLogs, nafsLogs, tahajjudData } = useDashboardData();
  const [showNiyyah, setShowNiyyah] = useState(false);
  const [showMawt, setShowMawt] = useState(false);

  const currentHour = new Date().getHours();
  const isFriday = new Date().getDay() === 5;

  const scores = calculateScores(todayEntry);

  // Derive live values from real data
  const urgesResisted = todayEntry?.urges_resisted ?? nafsLogs.filter(n => n.resisted).length;
  const urgesSuccumbed = todayEntry?.urges_succumbed ?? nafsLogs.filter(n => !n.resisted).length;
  const quranMinutes = todayEntry?.quran_minutes ?? 0;
  const sadaqahDone = (todayEntry?.service_hours ?? 0) > 0;
  const focusedStudy = todayEntry?.focused_study_minutes ?? 0;
  const exerciseMinutes = 0; // from daily_entries if tracked
  const totalServiceHours = serviceLogs.reduce((sum, s) => sum + s.hours, 0);
  const activeLearning = focusedStudy;
  const mindlessScrolling = todayEntry?.mindless_scrolling_minutes ?? 0;
  const dayResetUsed = todayEntry?.day_reset_used ?? false;
  const overallScore = todayEntry?.weighted_daily_score ?? scores.overallScore;
  const tahajjudPerformed = todayEntry?.tahajjud_performed ?? false;

  useEffect(() => {
    if (isFriday && !localStorage.getItem('mawt_shown_' + new Date().toDateString())) {
      setShowMawt(true);
      localStorage.setItem('mawt_shown_' + new Date().toDateString(), 'true');
    }
  }, [isFriday]);

  const handleNiyyahConfirm = (niyyah: string, multiplier: number) => {
    toast.success(`Session started with ${multiplier}x multiplier`);
    setShowNiyyah(false);
  };

  const handleMawtSubmit = (_preparedness: number) => {
    toast.success('Reflection saved. May Allah grant you readiness.');
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Islamic Productivity Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AkhirahRatio
          worshipScore={scores.worshipScore}
          duniaScore={scores.productivityScore}
          salahCompleted={scores.salahCompleted}
          quranMinutes={quranMinutes}
          sadaqahDone={sadaqahDone}
          studyMinutes={focusedStudy}
          exerciseMinutes={exerciseMinutes}
        />
        <NafsCounter urgesResisted={urgesResisted} urgesSuccumbed={urgesSuccumbed} />
        <QuranicAnchorSystem />
        <TahajjudAnalytics
          data={tahajjudData.map(t => ({ date: t.date, tahajjud: t.performed, energyLevel: t.energyLevel, productivityScore: 0 }))}
          tahajjudPerformed={tahajjudPerformed}
          onTahajjudToggle={() => {}}
        />
        <GhaflahMeter activeLearningMinutes={activeLearning} mindlessScrollingMinutes={mindlessScrolling} />
        <SadaqahTracker
          totalHours={totalServiceHours}
          serviceLogs={serviceLogs.map(s => ({ date: s.date, hours: s.hours, type: s.service_type, moodBefore: s.mood_before ?? 5, moodAfter: s.mood_after ?? 5 }))}
          onLogService={() => {}}
        />
        <TawbahProtocol
          currentScore={overallScore}
          targetScore={100}
          currentHour={currentHour}
          dayResetUsed={dayResetUsed}
          onReset={() => toast.success('Fresh start activated!')}
        />
        <BarakahIndex
          sessions={studySessions.map(s => ({ time: s.started_at, duration: s.duration_minutes, value: s.niyyah_multiplier, barakahScore: s.barakah_score }))}
          bestTimeSlot="After Fajr"
          averageBarakah={studySessions.length > 0 ? studySessions.reduce((sum, s) => sum + s.barakah_score, 0) / studySessions.length : 0}
        />
      </div>

      <NiyyahValidator isOpen={showNiyyah} onClose={() => setShowNiyyah(false)} onConfirm={handleNiyyahConfirm} />
      <MawtMode isOpen={showMawt} onClose={() => setShowMawt(false)} onSubmit={handleMawtSubmit} />
    </div>
  );
}