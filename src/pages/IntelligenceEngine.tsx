import { useState, useEffect } from 'react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, TrendingUp, TrendingDown, Target, Zap, 
  AlertTriangle, CheckCircle2, Clock, BookOpen,
  Smartphone, Moon, Activity
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface InsightData {
  productivityScore: number;
  deenScore: number;
  disciplineScore: number;
  focusScore: number;
  consistencyScore: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  topHabit: string;
  harmfulPattern: string;
  focusDropDetected: boolean;
  recommendations: string[];
}

interface RadarDataPoint {
  subject: string;
  value: number;
  fullMark: number;
}

export default function IntelligenceEngine() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [radarData, setRadarData] = useState<RadarDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) analyzeData();
  }, [user]);

  const analyzeData = async () => {
    if (!user) return;
    setLoading(true);

    const last30Days = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const last7Days = format(subDays(new Date(), 7), 'yyyy-MM-dd');

    // Fetch recent entries
    const { data: entries } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', last30Days)
      .order('date', { ascending: false });

    // Fetch user scores
    const { data: scores } = await supabase
      .from('user_scores')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', last7Days)
      .order('date', { ascending: false });

    if (!entries || entries.length === 0) {
      setInsights(null);
      setLoading(false);
      return;
    }

    // Calculate productivity score (0-100)
    const avgStudy = entries.reduce((sum, e) => 
      sum + (e.focused_study_minutes || 0) + (e.revision_minutes || 0), 0) / entries.length;
    const avgDevice = entries.reduce((sum, e) => sum + (e.device_time_minutes || 0), 0) / entries.length;
    const productivityScore = Math.min(100, Math.max(0, 
      Math.round((avgStudy / 3) - (avgDevice / 10) + 50)
    ));

    // Calculate deen score
    const avgSalah = entries.reduce((sum, e) => {
      const count = [e.fajr_completed, e.dhuhr_completed, e.asr_completed, e.maghrib_completed, e.isha_completed]
        .filter(Boolean).length;
      return sum + count;
    }, 0) / entries.length;
    const quranDays = entries.filter(e => e.quran_read).length;
    const deenScore = Math.round((avgSalah / 5 * 70) + (quranDays / entries.length * 30));

    // Calculate discipline score
    const avgDiscipline = entries.reduce((sum, e) => sum + (e.discipline_level || 0), 0) / entries.length;
    const disciplineScore = Math.round(avgDiscipline * 20);

    // Calculate focus score
    const avgFocus = entries.reduce((sum, e) => sum + (e.focus_level || 0), 0) / entries.length;
    const focusScore = Math.round(avgFocus * 20);

    // Calculate consistency
    const daysTracked = entries.length;
    const consistencyScore = Math.round((daysTracked / 30) * 100);

    // Mood/Energy trend analysis
    const recentEntries = entries.slice(0, 7);
    const olderEntries = entries.slice(7, 14);
    const recentAvgEnergy = recentEntries.reduce((sum, e) => sum + (e.energy_level || 0), 0) / (recentEntries.length || 1);
    const olderAvgEnergy = olderEntries.length > 0 
      ? olderEntries.reduce((sum, e) => sum + (e.energy_level || 0), 0) / olderEntries.length 
      : recentAvgEnergy;
    
    const moodTrend: 'improving' | 'stable' | 'declining' = 
      recentAvgEnergy > olderAvgEnergy + 0.5 ? 'improving' :
      recentAvgEnergy < olderAvgEnergy - 0.5 ? 'declining' : 'stable';

    // Detect focus drop
    const focusDropDetected = recentEntries.some((e, i) => 
      i > 0 && (e.focus_level || 0) < (recentEntries[i-1]?.focus_level || 0) - 2
    );

    // Identify patterns
    const topHabit = quranDays > entries.length * 0.7 ? (language === 'bn' ? 'কুরআন পাঠ' : 'Quran Reading') :
                     avgSalah > 4 ? (language === 'bn' ? 'নামাজ' : 'Salah') :
                     avgStudy > 120 ? (language === 'bn' ? 'পড়াশোনা' : 'Study') : 
                     (language === 'bn' ? 'ধারাবাহিকতা' : 'Consistency');

    const harmfulPattern = avgDevice > 180 ? (language === 'bn' ? 'অতিরিক্ত স্ক্রিন টাইম' : 'Excessive screen time') :
                          entries.filter(e => (e.shorts_reels_minutes || 0) > 30).length > entries.length * 0.5 
                            ? (language === 'bn' ? 'শর্টস/রিলস অভ্যাস' : 'Shorts/Reels habit') :
                          (language === 'bn' ? 'কোন বড় সমস্যা নেই' : 'No major issues');

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (avgSalah < 4) {
      recommendations.push(language === 'bn' 
        ? 'প্রতিদিন ৫ ওয়াক্ত নামাজ পড়ার চেষ্টা করুন'
        : 'Try to complete all 5 daily prayers');
    }
    
    if (avgDevice > 180) {
      recommendations.push(language === 'bn'
        ? 'দৈনিক স্ক্রিন টাইম ৩ ঘণ্টার নিচে রাখুন'
        : 'Keep daily screen time under 3 hours');
    }
    
    if (avgStudy < 60) {
      recommendations.push(language === 'bn'
        ? 'প্রতিদিন কমপক্ষে ১ ঘণ্টা মনোযোগী পড়াশোনা করুন'
        : 'Aim for at least 1 hour of focused study daily');
    }
    
    if (quranDays < entries.length * 0.5) {
      recommendations.push(language === 'bn'
        ? 'প্রতিদিন অন্তত কিছু আয়াত তিলাওয়াত করুন'
        : 'Read at least a few verses of Quran daily');
    }

    if (focusDropDetected) {
      recommendations.push(language === 'bn'
        ? '⚠️ ফোকাস হ্রাস সনাক্ত হয়েছে। বিশ্রাম নিন।'
        : '⚠️ Focus drop detected. Consider taking breaks.');
    }

    setInsights({
      productivityScore,
      deenScore,
      disciplineScore,
      focusScore,
      consistencyScore,
      moodTrend,
      topHabit,
      harmfulPattern,
      focusDropDetected,
      recommendations: recommendations.slice(0, 4),
    });

    setRadarData([
      { subject: language === 'bn' ? 'উৎপাদনশীলতা' : 'Productivity', value: productivityScore, fullMark: 100 },
      { subject: language === 'bn' ? 'দ্বীন' : 'Deen', value: deenScore, fullMark: 100 },
      { subject: language === 'bn' ? 'শৃঙ্খলা' : 'Discipline', value: disciplineScore, fullMark: 100 },
      { subject: language === 'bn' ? 'ফোকাস' : 'Focus', value: focusScore, fullMark: 100 },
      { subject: language === 'bn' ? 'ধারাবাহিকতা' : 'Consistency', value: consistencyScore, fullMark: 100 },
    ]);

    setLoading(false);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'declining': return <TrendingDown className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getTrendText = (trend: string) => {
    if (language === 'bn') {
      return trend === 'improving' ? 'উন্নতি হচ্ছে' : trend === 'declining' ? 'হ্রাস পাচ্ছে' : 'স্থিতিশীল';
    }
    return trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Declining' : 'Stable';
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            {language === 'bn' ? 'ইন্টেলিজেন্স ইঞ্জিন' : 'Intelligence Engine'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'bn' ? 'AI-চালিত অন্তর্দৃষ্টি ও বিশ্লেষণ' : 'AI-powered insights and analysis'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !insights ? (
          <Card className="p-12 text-center">
            <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {language === 'bn' 
                ? 'বিশ্লেষণের জন্য পর্যাপ্ত ডেটা নেই। দৈনিক এন্ট্রি জমা দিন।'
                : 'Not enough data for analysis. Submit daily entries to see insights.'}
            </p>
          </Card>
        ) : (
          <>
            {/* Score Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'উৎপাদনশীলতা' : 'Productivity'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(insights.productivityScore)}`}>
                    {insights.productivityScore}
                  </div>
                  <Progress value={insights.productivityScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'দ্বীন স্কোর' : 'Deen Score'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(insights.deenScore)}`}>
                    {insights.deenScore}
                  </div>
                  <Progress value={insights.deenScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'শৃঙ্খলা' : 'Discipline'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(insights.disciplineScore)}`}>
                    {insights.disciplineScore}
                  </div>
                  <Progress value={insights.disciplineScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'ফোকাস' : 'Focus'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(insights.focusScore)}`}>
                    {insights.focusScore}
                  </div>
                  <Progress value={insights.focusScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'ধারাবাহিকতা' : 'Consistency'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(insights.consistencyScore)}`}>
                    {insights.consistencyScore}%
                  </div>
                  <Progress value={insights.consistencyScore} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Radar Chart & Patterns */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === 'bn' ? 'পারফরম্যান্স রাডার' : 'Performance Radar'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'bn' ? 'সার্বিক কর্মক্ষমতা বিশ্লেষণ' : 'Overall performance analysis'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" className="text-xs" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar 
                          name="Score" 
                          dataKey="value" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))" 
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Pattern Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === 'bn' ? 'প্যাটার্ন বিশ্লেষণ' : 'Pattern Analysis'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Mood Trend */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {language === 'bn' ? 'এনার্জি ট্রেন্ড' : 'Energy Trend'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'bn' ? 'গত সপ্তাহে' : 'Last 7 days'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(insights.moodTrend)}
                      <span className="font-medium">{getTrendText(insights.moodTrend)}</span>
                    </div>
                  </div>

                  {/* Top Habit */}
                  <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
                    <div>
                      <p className="font-medium text-green-700">
                        {language === 'bn' ? 'সেরা অভ্যাস' : 'Top Habit'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-700 border-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {insights.topHabit}
                    </Badge>
                  </div>

                  {/* Harmful Pattern */}
                  <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg">
                    <div>
                      <p className="font-medium text-red-700">
                        {language === 'bn' ? 'উন্নতির জায়গা' : 'Area to Improve'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-red-700 border-red-500">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {insights.harmfulPattern}
                    </Badge>
                  </div>

                  {/* Focus Alert */}
                  {insights.focusDropDetected && (
                    <div className="flex items-center gap-3 p-4 bg-yellow-500/10 rounded-lg">
                      <Zap className="h-5 w-5 text-yellow-600" />
                      <p className="text-yellow-700">
                        {language === 'bn' 
                          ? 'সম্প্রতি ফোকাস হ্রাস সনাক্ত হয়েছে'
                          : 'Focus drop detected recently'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  {language === 'bn' ? 'AI সুপারিশ' : 'AI Recommendations'}
                </CardTitle>
                <CardDescription>
                  {language === 'bn' 
                    ? 'আপনার ডেটা বিশ্লেষণের উপর ভিত্তি করে'
                    : 'Based on your data analysis'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {insights.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
