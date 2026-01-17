import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { useAdvancedInsights } from '@/hooks/useAdvancedInsights';
import HabitFrictionSystem from '@/components/insights/HabitFrictionSystem';
import MoodProductivityCorrelation from '@/components/insights/MoodProductivityCorrelation';
import CognitiveLoadMeter from '@/components/insights/CognitiveLoadMeter';
import SalahQualityCard from '@/components/insights/SalahQualityCard';
import QuranHeatmap from '@/components/insights/QuranHeatmap';
import LifeBalanceScore from '@/components/insights/LifeBalanceScore';
import BurnoutAlert from '@/components/insights/BurnoutAlert';
import RecoveryMode from '@/components/insights/RecoveryMode';
import GoalAdjustmentCard from '@/components/insights/GoalAdjustmentCard';
import MirrorMode from '@/components/insights/MirrorMode';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Heart, Activity, BookOpen, Target, Sparkles, Loader2 } from 'lucide-react';

export default function Insights() {
  const { user } = useAuth();
  const { 
    loading, 
    cognitiveLoad, 
    salahQuality, 
    lifeBalance, 
    burnoutPrediction,
    recoveryMode,
    goalAdjustments,
    mirrorMode,
    moodCorrelation
  } = useAdvancedInsights();

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-24 lg:pb-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Advanced Insights
          </h1>
          <p className="text-muted-foreground">
            Deep analysis of your habits, health, and spiritual growth
          </p>
        </div>

        {/* Critical Alerts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <BurnoutAlert 
            riskLevel={burnoutPrediction.riskLevel}
            daysAtRisk={burnoutPrediction.daysAtRisk}
            warning={burnoutPrediction.warning}
          />
          <RecoveryMode 
            isActive={recoveryMode.isActive}
            missedDays={recoveryMode.missedDays}
            recoveryPlan={recoveryMode.recoveryPlan}
            streakProtected={recoveryMode.streakProtected}
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 w-full h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="text-xs px-2 py-2">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">View</span>
            </TabsTrigger>
            <TabsTrigger value="mental" className="text-xs px-2 py-2">
              <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              Mental
            </TabsTrigger>
            <TabsTrigger value="spiritual" className="text-xs px-2 py-2">
              <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              Spiritual
            </TabsTrigger>
            <TabsTrigger value="balance" className="text-xs px-2 py-2">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              Balance
            </TabsTrigger>
            <TabsTrigger value="quran" className="text-xs px-2 py-2">
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              Qur'an
            </TabsTrigger>
            <TabsTrigger value="goals" className="text-xs px-2 py-2">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
              Goals
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <CognitiveLoadMeter 
                score={cognitiveLoad.score}
                status={cognitiveLoad.status}
                warning={cognitiveLoad.warning}
              />
              <LifeBalanceScore 
                score={lifeBalance.score}
                status={lifeBalance.status}
                daily={lifeBalance.daily}
                weekly={lifeBalance.weekly}
                monthly={lifeBalance.monthly}
              />
            </div>
            <MirrorMode 
              dueDate={mirrorMode.dueDate}
              lastGenerated={mirrorMode.lastGenerated}
              summary={mirrorMode.summary}
              traits={mirrorMode.traits}
              improvements={mirrorMode.improvements}
              strengths={mirrorMode.strengths}
            />
          </TabsContent>

          {/* Mental Health Tab */}
          <TabsContent value="mental" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <CognitiveLoadMeter 
                score={cognitiveLoad.score}
                status={cognitiveLoad.status}
                warning={cognitiveLoad.warning}
              />
              <MoodProductivityCorrelation 
                lowMoodHighDevice={moodCorrelation.lowMoodHighDevice}
                highMoodHighProductivity={moodCorrelation.highMoodHighProductivity}
                insights={moodCorrelation.insights}
              />
            </div>
          </TabsContent>

          {/* Spiritual Tab */}
          <TabsContent value="spiritual" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <SalahQualityCard 
                totalCompleted={salahQuality.totalCompleted}
                onTimeCount={salahQuality.onTimeCount}
                avgKhushu={salahQuality.avgKhushu}
                consistencyScore={salahQuality.consistencyScore}
                qualityScore={salahQuality.qualityScore}
              />
            </div>
          </TabsContent>

          {/* Balance Tab */}
          <TabsContent value="balance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <LifeBalanceScore 
                score={lifeBalance.score}
                status={lifeBalance.status}
                daily={lifeBalance.daily}
                weekly={lifeBalance.weekly}
                monthly={lifeBalance.monthly}
              />
              <MoodProductivityCorrelation 
                lowMoodHighDevice={moodCorrelation.lowMoodHighDevice}
                highMoodHighProductivity={moodCorrelation.highMoodHighProductivity}
                insights={moodCorrelation.insights}
              />
            </div>
          </TabsContent>

          {/* Qur'an Tab */}
          <TabsContent value="quran" className="space-y-4">
            <QuranHeatmap />
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            <GoalAdjustmentCard adjustments={goalAdjustments} />
            {goalAdjustments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No goal adjustments needed right now.</p>
                <p className="text-sm">Keep up the great work! 🌟</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
