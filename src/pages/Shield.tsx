import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Zap,
  Target,
  BarChart3, 
  Users, 
  Pause,
  Flame
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShieldProfiles } from '@/components/shield/ShieldProfiles';
import { ShieldQuickActions } from '@/components/shield/ShieldQuickActions';
import { ShieldAnalytics } from '@/components/shield/ShieldAnalytics';
import { ShieldAccountability } from '@/components/shield/ShieldAccountability';

interface DisciplineProfile {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  strictness_level: string;
  is_active: boolean;
  blocked_apps: string[];
  blocked_websites: string[];
  blocked_keywords: string[];
  block_infinite_content: boolean;
  block_adult_content: boolean;
  default_duration_minutes: number;
}

interface DisciplineScore {
  current_score: number;
  current_streak_days: number;
  total_focus_minutes: number;
  total_time_saved_minutes: number;
  can_use_absolute_mode: boolean;
}

interface ShieldSession {
  id: string;
  profile_name: string;
  strictness_level: string;
  started_at: string;
  scheduled_end_at: string | null;
  status: string;
  bypass_attempts: number;
}

export default function ShieldPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profiles, setProfiles] = useState<DisciplineProfile[]>([]);
  const [disciplineScore, setDisciplineScore] = useState<DisciplineScore | null>(null);
  const [activeSession, setActiveSession] = useState<ShieldSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadShieldData();
    }
  }, [user]);

  const loadShieldData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data: profilesData } = await supabase
        .from('discipline_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let { data: scoreData } = await supabase
        .from('discipline_scores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!scoreData) {
        const { data: newScore } = await supabase
          .from('discipline_scores')
          .insert({ user_id: user.id })
          .select()
          .single();
        scoreData = newScore;
      }

      const { data: sessionData } = await supabase
        .from('shield_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      const mappedProfiles: DisciplineProfile[] = (profilesData || []).map(p => ({
        id: p.id,
        name: p.name,
        icon: p.icon || '🎯',
        description: p.description,
        strictness_level: p.strictness_level,
        is_active: p.is_active || false,
        blocked_apps: Array.isArray(p.blocked_apps) ? p.blocked_apps as string[] : [],
        blocked_websites: Array.isArray(p.blocked_websites) ? p.blocked_websites as string[] : [],
        blocked_keywords: Array.isArray(p.blocked_keywords) ? p.blocked_keywords as string[] : [],
        block_infinite_content: p.block_infinite_content || false,
        block_adult_content: p.block_adult_content || false,
        default_duration_minutes: p.default_duration_minutes || 60
      }));

      setProfiles(mappedProfiles);
      setDisciplineScore(scoreData);
      setActiveSession(sessionData);

      if (mappedProfiles.length === 0) {
        await createDefaultProfiles();
      }
    } catch (error) {
      console.error('Error loading shield data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultProfiles = async () => {
    if (!user) return;

    const defaultProfiles = [
      {
        user_id: user.id,
        name: 'Study Mode',
        icon: '📚',
        description: 'Block distractions while studying',
        strictness_level: 'hard',
        blocked_apps: ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Twitter'],
        blocked_websites: ['instagram.com', 'tiktok.com', 'facebook.com', 'twitter.com'],
        blocked_keywords: ['shorts', 'reels', 'stories'],
        block_infinite_content: true,
        block_adult_content: true,
        default_duration_minutes: 120,
        is_preset: true
      },
      {
        user_id: user.id,
        name: 'Deep Work',
        icon: '💼',
        description: 'Maximum focus for important work',
        strictness_level: 'absolute',
        blocked_apps: ['All Social Media', 'Games', 'Entertainment'],
        blocked_websites: ['*social*', '*game*', '*entertainment*'],
        blocked_keywords: [],
        block_infinite_content: true,
        block_adult_content: true,
        default_duration_minutes: 180,
        is_preset: true
      },
      {
        user_id: user.id,
        name: 'Sleep Mode',
        icon: '😴',
        description: 'Wind down before sleep',
        strictness_level: 'hard',
        blocked_apps: ['All Apps'],
        blocked_websites: ['*'],
        blocked_keywords: [],
        block_infinite_content: true,
        block_adult_content: true,
        default_duration_minutes: 480,
        is_preset: true
      },
      {
        user_id: user.id,
        name: 'Detox Mode',
        icon: '🧘',
        description: 'Complete digital detox',
        strictness_level: 'absolute',
        blocked_apps: ['Everything'],
        blocked_websites: ['*'],
        blocked_keywords: [],
        block_infinite_content: true,
        block_adult_content: true,
        default_duration_minutes: 1440,
        is_preset: true
      }
    ];

    const { data } = await supabase
      .from('discipline_profiles')
      .insert(defaultProfiles)
      .select();

    if (data) {
      const mappedProfiles: DisciplineProfile[] = data.map(p => ({
        id: p.id,
        name: p.name,
        icon: p.icon || '🎯',
        description: p.description,
        strictness_level: p.strictness_level,
        is_active: p.is_active || false,
        blocked_apps: Array.isArray(p.blocked_apps) ? p.blocked_apps as string[] : [],
        blocked_websites: Array.isArray(p.blocked_websites) ? p.blocked_websites as string[] : [],
        blocked_keywords: Array.isArray(p.blocked_keywords) ? p.blocked_keywords as string[] : [],
        block_infinite_content: p.block_infinite_content || false,
        block_adult_content: p.block_adult_content || false,
        default_duration_minutes: p.default_duration_minutes || 60
      }));
      setProfiles(mappedProfiles);
    }
  };

  const startSession = async (profile: DisciplineProfile) => {
    if (!user) return;

    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + profile.default_duration_minutes);

    const { data, error } = await supabase
      .from('shield_sessions')
      .insert({
        user_id: user.id,
        profile_id: profile.id,
        profile_name: profile.name,
        strictness_level: profile.strictness_level,
        scheduled_end_at: endTime.toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to start session');
      return;
    }

    await supabase
      .from('discipline_profiles')
      .update({ is_active: true })
      .eq('id', profile.id);

    setActiveSession(data);
    toast.success(`${profile.name} activated! Stay focused 🛡️`);
    loadShieldData();
  };

  const endSession = async (reason?: string) => {
    if (!activeSession || !user) return;

    await supabase
      .from('shield_sessions')
      .update({
        status: 'completed',
        actual_end_at: new Date().toISOString(),
        completed_successfully: !reason,
        early_exit_reason: reason
      })
      .eq('id', activeSession.id);

    await supabase
      .from('discipline_profiles')
      .update({ is_active: false })
      .eq('user_id', user.id);

    setActiveSession(null);
    toast.success('Shield session ended');
    loadShieldData();
  };

  const getStrictnessColor = (level: string) => {
    switch (level) {
      case 'normal': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'hard': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'absolute': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStrictnessIcon = (level: string) => {
    switch (level) {
      case 'normal': return <Unlock className="h-4 w-4" />;
      case 'hard': return <Lock className="h-4 w-4" />;
      case 'absolute': return <Shield className="h-4 w-4" />;
      default: return <Unlock className="h-4 w-4" />;
    }
  };

  const getRemainingTime = () => {
    if (!activeSession?.scheduled_end_at) return null;
    const end = new Date(activeSession.scheduled_end_at);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Completed';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-2xl" />
          <div className="h-48 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Shield</h1>
              <p className="text-sm text-white/70">Discipline Enforcement</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-white/20 text-white">
              <Flame className="h-3 w-3 mr-1" />
              Score: {disciplineScore?.current_score || 50}
            </Badge>
          </div>
        </div>

        {/* Active Session Card */}
        {activeSession ? (
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{activeSession.profile_name}</h3>
                    <p className="text-sm text-white/70">{getRemainingTime()}</p>
                  </div>
                </div>
                <Badge className={getStrictnessColor(activeSession.strictness_level)}>
                  {getStrictnessIcon(activeSession.strictness_level)}
                  <span className="ml-1 capitalize">{activeSession.strictness_level}</span>
                </Badge>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/5 rounded-xl p-2">
                  <p className="text-lg font-bold">{activeSession.bypass_attempts}</p>
                  <p className="text-xs text-white/60">Bypass Attempts</p>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                  <p className="text-lg font-bold">0</p>
                  <p className="text-xs text-white/60">Apps Blocked</p>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                  <p className="text-lg font-bold">0</p>
                  <p className="text-xs text-white/60">Sites Blocked</p>
                </div>
              </div>

              {activeSession.strictness_level === 'normal' && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-white/20 text-white hover:bg-white/10"
                  onClick={() => endSession()}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  End Session
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/10 border-white/20 text-white">
            <CardContent className="p-4 text-center">
              <Shield className="h-10 w-10 mx-auto mb-2 text-white/50" />
              <p className="text-white/70">No active shield</p>
              <p className="text-xs text-white/50">Select a profile below to start</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="px-4 -mt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 h-12 rounded-2xl">
            <TabsTrigger value="dashboard" className="rounded-xl data-[state=active]:bg-primary">
              <Target className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="profiles" className="rounded-xl data-[state=active]:bg-primary">
              <Zap className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl data-[state=active]:bg-primary">
              <BarChart3 className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="accountability" className="rounded-xl data-[state=active]:bg-primary">
              <Users className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4 space-y-4 pb-24">
            <ShieldQuickActions 
              profiles={profiles}
              onStartSession={startSession}
              activeSession={activeSession}
            />
          </TabsContent>

          <TabsContent value="profiles" className="mt-4 pb-24">
            <ShieldProfiles 
              profiles={profiles}
              onStartSession={startSession}
              activeSession={activeSession}
              onRefresh={loadShieldData}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 pb-24">
            <ShieldAnalytics disciplineScore={disciplineScore} />
          </TabsContent>

          <TabsContent value="accountability" className="mt-4 pb-24">
            <ShieldAccountability />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}