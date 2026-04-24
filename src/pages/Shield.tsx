import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShieldBottomNav } from '@/components/shield/ShieldBottomNav';
import { ShieldHeader } from '@/components/shield/ShieldHeader';
import { ShieldProfilesSection } from '@/components/shield/ShieldProfilesSection';
import { ShieldModes } from '@/components/shield/ShieldModes';
import { ShieldSettings } from '@/components/shield/ShieldSettings';
import { ShieldBlockScreen } from '@/components/shield/ShieldBlockScreen';
import { ShieldAnalytics } from '@/components/shield/ShieldAnalytics';
import { ShieldAccountability } from '@/components/shield/ShieldAccountability';
import { ShieldUsageStats } from '@/components/shield/ShieldUsageStats';
import { ShieldFocusTimer } from '@/components/shield/ShieldFocusTimer';
import { ShieldQuickActions } from '@/components/shield/ShieldQuickActions';
import { isNative } from '@/lib/capacitor/platform';
import { App } from '@capacitor/app'; 
import { 
  startShieldSession as startNativeSession, 
  endShieldSession as endNativeSession,
  requestEmergencyBypass
} from '@/lib/capacitor/nativeShield';

// 🟢 Updated imports to match your EXACT permissions.ts file
import { 
  getAllPermissions,
  requestUsageStatsPermission,
  requestOverlayPermission,
  requestAccessibilityPermission,
  requestBatteryPermission
} from '@/lib/capacitor/permissions';

type StrictnessMode = 'normal' | 'lock' | 'strict';
type SubPage = 'main' | 'block-screen';

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

interface PermissionStatus {
  usageAccess: boolean;
  overlay: boolean;
  accessibility: boolean;
  battery: boolean;
}

export default function ShieldPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [subPage, setSubPage] = useState<SubPage>('main');
  const [profiles, setProfiles] = useState<DisciplineProfile[]>([]);
  const [disciplineScore, setDisciplineScore] = useState<DisciplineScore | null>(null);
  const [activeSession, setActiveSession] = useState<ShieldSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [permissions, setPermissions] = useState<PermissionStatus>({
    usageAccess: true, 
    overlay: true,
    accessibility: true,
    battery: true,
  });
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const [strictnessMode, setStrictnessMode] = useState<StrictnessMode>('normal');
  
  const [settings, setSettings] = useState({
    pauseDurationEnabled: true,
    blockSplitScreen: false,
    blockPowerOff: false,
    blockRecentApps: false,
    lowTimeAlert: true,
    pomodoroBreak: true,
  });
  
  const [selectedBlockScreen, setSelectedBlockScreen] = useState('default');

  const allBlockedApps = [...new Set(profiles.flatMap(p => p.blocked_apps))];
  const allBlockedWebsites = [...new Set(profiles.flatMap(p => p.blocked_websites))];
  const allBlockedKeywords = [...new Set(profiles.flatMap(p => p.blocked_keywords))];
  const reelsBlockEnabled = profiles.some(p => p.block_infinite_content);
  const adultBlockEnabled = profiles.some(p => p.block_adult_content);

  useEffect(() => {
    if (user) {
      loadShieldData();
      loadSettings();
      
      if (isNative) {
        verifyPermissions();

        const listener = App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            verifyPermissions();
          }
        });

        return () => {
          listener.then(l => l.remove());
        };
      }
    }
  }, [user]);

  // 🟢 Updated verifyPermissions to use your exact functions
  const verifyPermissions = async () => {
    try {
      const status = await getAllPermissions();
      
      setPermissions({
        usageAccess: status.usageStats === 'granted',
        overlay: status.overlay === 'granted',
        accessibility: status.accessibility === 'granted',
        battery: status.battery === 'granted'
      });
      
      if (status.usageStats !== 'granted' || status.overlay !== 'granted' || status.accessibility !== 'granted') {
        setShowPermissionModal(true);
      } else {
        setShowPermissionModal(false);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

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

  const loadSettings = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['shield_settings', 'shield_strictness_mode', 'shield_block_screen']);

      if (data) {
        for (const setting of data) {
          if (setting.key === 'shield_settings' && typeof setting.value === 'object') {
            setSettings(prev => ({ ...prev, ...setting.value as any }));
          }
          if (setting.key === 'shield_strictness_mode' && typeof setting.value === 'object') {
            const val = (setting.value as any).mode;
            if (val) setStrictnessMode(val as StrictnessMode);
          }
          if (setting.key === 'shield_block_screen' && typeof setting.value === 'object') {
            const val = (setting.value as any).screen;
            if (val) setSelectedBlockScreen(val);
          }
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettingToDB = useCallback(async (key: string, value: any) => {
    if (!user) return;
    try {
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', key)
        .single();

      if (existing) {
        await supabase.from('app_settings').update({ value, updated_by: user.id }).eq('key', key);
      } else {
        await supabase.from('app_settings').insert({ key, value, updated_by: user.id });
      }
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  }, [user]);

  const createDefaultProfiles = async () => {
    if (!user) return;
    const defaultProfiles = [
      {
        user_id: user.id,
        name: 'Study Mode',
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
        name: 'Deep Work',
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
    if (showPermissionModal) {
      toast.error('Please grant all required permissions first!');
      return;
    }
    
    if (!user) return;

    const now = new Date();
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

    if (isNative && data) {
      await startNativeSession({
        id: data.id,
        profileId: profile.id,
        profileName: profile.name,
        strictnessLevel: profile.strictness_level as any,
        startedAt: now,
        scheduledEndAt: endTime,
        blockedApps: profile.blocked_apps,
        blockedWebsites: profile.blocked_websites,
        blockedKeywords: profile.blocked_keywords,
        blockInfiniteContent: profile.block_infinite_content,
        blockAdultContent: profile.block_adult_content,
      }, user.id);
    }

    await supabase
      .from('discipline_profiles')
      .update({ is_active: true })
      .eq('id', profile.id);

    setActiveSession(data);
    toast.success(`${profile.name} activated! Stay focused 🛡️`);
    loadShieldData();
  };

  const handleEndSession = async (reason?: string) => {
    if (!user || !activeSession) return;

    try {
      if (isNative) {
        await endNativeSession(reason, user.id);
      }

      await supabase
        .from('shield_sessions')
        .update({ 
          status: 'completed',
          actual_end_at: new Date().toISOString()
        })
        .eq('id', activeSession.id);

      setActiveSession(null);
      toast.success('Session ended');
      loadShieldData();
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    }
  };

  const handleSettingChange = (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettingToDB('shield_settings', newSettings);
  };

  const handleModeChange = (mode: StrictnessMode) => {
    setStrictnessMode(mode);
    saveSettingToDB('shield_strictness_mode', { mode });
  };

  const handleBlockScreenChange = (screen: string) => {
    setSelectedBlockScreen(screen);
    saveSettingToDB('shield_block_screen', { screen });
  };

  const handleReelsToggle = async (enabled: boolean) => {
    if (!user) return;
    for (const profile of profiles) {
      await supabase
        .from('discipline_profiles')
        .update({ block_infinite_content: enabled })
        .eq('id', profile.id);
    }
    loadShieldData();
    toast.success(enabled ? 'Reels & Shorts blocked' : 'Reels & Shorts unblocked');
  };

  const handleAdultToggle = async (enabled: boolean) => {
    if (!user) return;
    for (const profile of profiles) {
      await supabase
        .from('discipline_profiles')
        .update({ block_adult_content: enabled })
        .eq('id', profile.id);
    }
    loadShieldData();
    toast.success(enabled ? 'Adult content blocked' : 'Adult content filter off');
  };

  const handleNavigate = (page: string) => {
    if (page === 'block-screen') {
      setSubPage(page as SubPage);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSubPage('main');
  };

  const handleBreakStart = (minutes: number) => {
    toast.success(`Break started for ${minutes} minutes`);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (subPage === 'block-screen') {
    return (
      <ShieldBlockScreen 
        onBack={() => setSubPage('main')}
        selectedScreen={selectedBlockScreen}
        onSelectScreen={handleBlockScreenChange}
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
    <div className="min-h-screen bg-background pb-24 relative">
      
      {showPermissionModal && (
        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col pt-10 px-6 h-screen overflow-y-auto">
          <div className="text-center mb-8 mt-10">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🛡️</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Shield Requires Setup</h2>
            <p className="text-muted-foreground text-sm">
              To powerfully block apps and track your screen time, Shield needs the following core permissions.
            </p>
          </div>

          <div className="space-y-4 pb-20">
            {/* 🟢 Updated onClick Handlers */}
            <div className={`p-4 rounded-xl border ${permissions.usageAccess ? 'bg-green-500/10 border-green-500/50' : 'bg-card border-border'}`}>
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-lg">📊 Usage Access</h3>
                {permissions.usageAccess && <span className="text-green-500 font-bold">✓ Granted</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-3">Required to track screen time and detect when you open a blocked app.</p>
              {!permissions.usageAccess && (
                <button onClick={requestUsageStatsPermission} className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium">
                  Grant Permission
                </button>
              )}
            </div>

            <div className={`p-4 rounded-xl border ${permissions.overlay ? 'bg-green-500/10 border-green-500/50' : 'bg-card border-border'}`}>
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-lg">🛑 Overlay Permission</h3>
                {permissions.overlay && <span className="text-green-500 font-bold">✓ Granted</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-3">Required to show the "Blocked" screen over other apps.</p>
              {!permissions.overlay && (
                <button onClick={requestOverlayPermission} className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium">
                  Grant Permission
                </button>
              )}
            </div>

            <div className={`p-4 rounded-xl border ${permissions.accessibility ? 'bg-green-500/10 border-green-500/50' : 'bg-card border-border'}`}>
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-lg">👁️ Accessibility</h3>
                {permissions.accessibility && <span className="text-green-500 font-bold">✓ Granted</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-3">Required to prevent bypassing the block and to enforce Strict Mode.</p>
              {!permissions.accessibility && (
                <button onClick={requestAccessibilityPermission} className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium">
                  Grant Permission
                </button>
              )}
            </div>

            <div className={`p-4 rounded-xl border ${permissions.battery ? 'bg-green-500/10 border-green-500/50' : 'bg-card border-border'}`}>
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-lg">🔋 Run in Background</h3>
                {permissions.battery && <span className="text-green-500 font-bold">✓ Granted</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-3">Ensures Android doesn't kill the Shield when your phone is locked.</p>
              {!permissions.battery && (
                <button onClick={requestBatteryPermission} className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium">
                  Grant Permission
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ShieldHeader />
      
      <div className={`px-4 py-4 space-y-4 ${showPermissionModal ? 'opacity-50 pointer-events-none' : ''}`}>
        {activeTab === 'dashboard' && (
          <>
            <div className="mb-2">
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="text-2xl font-bold">{getGreeting()}</h1>
            </div>

            <ShieldUsageStats onViewDetails={() => handleTabChange('analytics')} />

            <ShieldFocusTimer 
              isSessionActive={!!activeSession}
              onStartBreak={handleBreakStart}
              disabled={!!activeSession}
            />

            <ShieldProfilesSection
              profiles={profiles}
              onActivate={startSession}
              activeSession={activeSession}
              onRefresh={loadShieldData}
            />

            <ShieldQuickActions
              blockedAppsCount={allBlockedApps.length}
              blockedSitesCount={allBlockedWebsites.length}
              blockedKeywordsCount={allBlockedKeywords.length}
              reelsBlockEnabled={reelsBlockEnabled}
              adultBlockEnabled={adultBlockEnabled}
              onReelsToggle={handleReelsToggle}
              onAdultToggle={handleAdultToggle}
              onManageApps={() => handleTabChange('modes')}
              onManageSites={() => handleTabChange('modes')}
              onManageKeywords={() => handleTabChange('modes')}
            />
          </>
        )}

        {activeTab === 'modes' && (
          <ShieldModes
            activeMode={strictnessMode}
            onModeChange={handleModeChange}
            disciplineScore={disciplineScore?.current_score}
          />
        )}

        {activeTab === 'analytics' && (
          <ShieldAnalytics disciplineScore={disciplineScore} />
        )}

        {activeTab === 'account' && (
          <ShieldAccountability />
        )}

        {activeTab === 'settings' && (
          <ShieldSettings 
            settings={settings}
            onSettingChange={handleSettingChange}
            onNavigate={handleNavigate}
          />
        )}
      </div>

      <ShieldBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
