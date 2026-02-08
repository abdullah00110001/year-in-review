import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Flame
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShieldBottomNav } from '@/components/shield/ShieldBottomNav';
import { ShieldHeader } from '@/components/shield/ShieldHeader';
import { ShieldAnalyticsCards } from '@/components/shield/ShieldAnalyticsCards';
import { ShieldTakeABreak } from '@/components/shield/ShieldTakeABreak';
import { ShieldStrictnessCard } from '@/components/shield/ShieldStrictnessCard';
import { ShieldProfilesSection } from '@/components/shield/ShieldProfilesSection';
import { ShieldQuickActionsCard } from '@/components/shield/ShieldQuickActionsCard';
import { ShieldModes } from '@/components/shield/ShieldModes';
import { ShieldSettings } from '@/components/shield/ShieldSettings';
import { ShieldBlockScreen } from '@/components/shield/ShieldBlockScreen';
import { ShieldOrganiseDashboard } from '@/components/shield/ShieldOrganiseDashboard';
import { ShieldAnalytics } from '@/components/shield/ShieldAnalytics';
import { ShieldAccountability } from '@/components/shield/ShieldAccountability';

type StrictnessMode = 'normal' | 'lock' | 'strict';
type SubPage = 'main' | 'settings' | 'block-screen' | 'organise';

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
  const [subPage, setSubPage] = useState<SubPage>('main');
  const [profiles, setProfiles] = useState<DisciplineProfile[]>([]);
  const [disciplineScore, setDisciplineScore] = useState<DisciplineScore | null>(null);
  const [activeSession, setActiveSession] = useState<ShieldSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Screen time and usage data
  const [screenTime, setScreenTime] = useState(789); // 13h 9m in minutes
  const [appLaunches, setAppLaunches] = useState(317);
  
  // Strictness mode
  const [strictnessMode, setStrictnessMode] = useState<StrictnessMode>('normal');
  
  // Blocking state
  const [blockedApps, setBlockedApps] = useState<string[]>(['Instagram', 'TikTok']);
  const [blockedWebsites, setBlockedWebsites] = useState<string[]>(['instagram.com', 'tiktok.com']);
  const [blockedKeywords, setBlockedKeywords] = useState<string[]>(['shorts', 'reels']);
  const [keywordsEnabled, setKeywordsEnabled] = useState(true);
  const [adultBlockEnabled, setAdultBlockEnabled] = useState(false);
  const [reelsBlockEnabled, setReelsBlockEnabled] = useState(true);
  
  // Settings state
  const [settings, setSettings] = useState({
    pauseDurationEnabled: true,
    blockUnsupportedBrowsers: false,
    blockSplitScreen: false,
    blockPowerOff: false,
    blockRecentApps: false,
    lowTimeAlert: true,
    pomodoroBreak: true,
  });
  
  // Block screen selection
  const [selectedBlockScreen, setSelectedBlockScreen] = useState('default');
  
  // Dashboard organization
  const [dashboardItems, setDashboardItems] = useState([
    { id: 'profiles', label: 'Profiles' },
    { id: 'apps', label: 'Apps Blocked' },
    { id: 'sites', label: 'Sites Blocked' },
    { id: 'keywords', label: 'Keywords Blocked' },
    { id: 'adult', label: 'Block Adult Content' },
    { id: 'reels', label: 'Block Reels/Shorts' },
  ]);

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
        strictness_level: p.strictness_level || 'normal',
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
        name: 'Study',
        icon: '📚',
        description: 'Block distractions while studying',
        strictness_level: 'hard',
        blocked_apps: ['Instagram', 'TikTok', 'YouTube', 'Facebook'],
        blocked_websites: ['instagram.com', 'tiktok.com', 'facebook.com'],
        blocked_keywords: ['shorts', 'reels', 'stories'],
        block_infinite_content: true,
        block_adult_content: true,
        default_duration_minutes: 120,
        is_preset: true
      },
      {
        user_id: user.id,
        name: 'study 11',
        icon: '💼',
        description: 'Maximum focus for important work',
        strictness_level: 'absolute',
        blocked_apps: ['All Social Media', 'Games', 'Entertainment'],
        blocked_websites: ['facebook.com'],
        blocked_keywords: [],
        block_infinite_content: true,
        block_adult_content: true,
        default_duration_minutes: 180,
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
        strictness_level: p.strictness_level || 'normal',
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

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleNavigate = (page: string) => {
    if (page === 'settings' || page === 'block-screen' || page === 'organise') {
      setSubPage(page as SubPage);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Render sub-pages
  if (subPage === 'settings') {
    return (
      <ShieldSettings 
        onBack={() => setSubPage('main')}
        settings={settings}
        onSettingChange={handleSettingChange}
      />
    );
  }

  if (subPage === 'block-screen') {
    return (
      <ShieldBlockScreen 
        onBack={() => setSubPage('main')}
        selectedScreen={selectedBlockScreen}
        onSelectScreen={setSelectedBlockScreen}
      />
    );
  }

  if (subPage === 'organise') {
    return (
      <ShieldOrganiseDashboard 
        onBack={() => setSubPage('main')}
        items={dashboardItems}
        onReorder={setDashboardItems}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-muted rounded-2xl" />
          <div className="h-32 bg-muted rounded-2xl" />
          <div className="h-48 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <ShieldHeader 
        onNavigate={handleNavigate}
      />
      
      {/* Content Area */}
      <div className="px-4 py-4 space-y-4">
        {activeTab === 'dashboard' && (
          <>
            {/* Welcome Message */}
            <div className="mb-2">
              <p className="text-sm text-muted-foreground">Welcome</p>
              <h1 className="text-2xl font-bold">{getGreeting()}</h1>
            </div>

            {/* Analytics Cards */}
            <ShieldAnalyticsCards
              screenTimeMinutes={screenTime}
              screenTimeChange={8}
              appLaunches={appLaunches}
              appLaunchesChange={6}
              onScreenTimeClick={() => setActiveTab('analytics')}
              onAppLaunchesClick={() => setActiveTab('analytics')}
            />

            {/* Take a Break */}
            <ShieldTakeABreak 
              onBreakStart={(minutes) => console.log('Break started:', minutes)}
              disabled={!!activeSession}
            />

            {/* Strictness Level Card */}
            <ShieldStrictnessCard 
              activeMode={strictnessMode}
              onClick={() => setActiveTab('modes')}
            />

            {/* Profiles Section */}
            <ShieldProfilesSection
              profiles={profiles}
              onActivate={startSession}
              activeSession={activeSession}
              onRefresh={loadShieldData}
            />

            {/* Quick Actions */}
            <ShieldQuickActionsCard
              appsBlocked={blockedApps.length}
              sitesBlocked={blockedWebsites.length}
              keywordsBlocked={blockedKeywords.length}
              keywordsEnabled={keywordsEnabled}
              adultBlockEnabled={adultBlockEnabled}
              reelsBlockEnabled={reelsBlockEnabled}
              onKeywordsToggle={setKeywordsEnabled}
              onAdultBlockToggle={setAdultBlockEnabled}
              onReelsBlockToggle={setReelsBlockEnabled}
              onAppsClick={() => {}}
              onSitesClick={() => {}}
              onKeywordsClick={() => {}}
              onAdultClick={() => {}}
              onReelsClick={() => {}}
            />
          </>
        )}

        {activeTab === 'modes' && (
          <ShieldModes
            activeMode={strictnessMode}
            onModeChange={setStrictnessMode}
            disciplineScore={disciplineScore?.current_score}
          />
        )}

        {activeTab === 'analytics' && (
          <ShieldAnalytics disciplineScore={disciplineScore} />
        )}

        {activeTab === 'account' && (
          <ShieldAccountability />
        )}
      </div>

      {/* Bottom Navigation */}
      <ShieldBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}