import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Globe, Building2, MapPin, List, Map as MapIcon,
  Sunrise, Settings as SettingsIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNearbyWakers, type FilterMode } from '@/hooks/useNearbyWakers';
import { useWakeLocation } from '@/hooks/useWakeLocation';
import { useStreakSystem } from '@/hooks/useStreakSystem';
import { useWeeklyRecap } from '@/hooks/useWeeklyRecap';
import { NearbyWakerCard } from './NearbyWakerCard';
import { BangladeshMapView } from './BangladeshMapView';
import { LocationPrivacySheet } from './LocationPrivacySheet';
import { HeroStatsBar } from './HeroStatsBar';
import { OwnStatusCard } from './OwnStatusCard';
import { MilestoneBanner } from './MilestoneBanner';
import { WeeklyRecapSheet } from './WeeklyRecapSheet';
import { CommunitySettingsSheet } from './CommunitySettingsSheet';
import { useCommunitySettings } from '@/hooks/useCommunitySettings';
import { toast } from 'sonner';


const FILTERS: { mode: FilterMode; icon: any; label: string }[] = [
  { mode: 'global', icon: Globe, label: 'Global' },
  { mode: 'city', icon: Building2, label: 'City' },
  { mode: 'nearby', icon: MapPin, label: 'Nearby' },
];

export function CommunityWakeFeed() {
  const {
    wakers, myEvent, filterMode, setFilterMode, isLoading,
    totalToday, cityCount, nearbyCount, userLocation,
    updateMyStatus, refreshFeed,
  } = useNearbyWakers();
  const { locationSettings, requestGPSPermission, saveLocationSettings } = useWakeLocation();
  const { streakData } = useStreakSystem();
  const { recap, recapOpen, setRecapOpen } = useWeeklyRecap();
  const { settings: communitySettings } = useCommunitySettings();

  const [view, setView] = useState<'feed' | 'map'>('feed');

  const [statusInput, setStatusInput] = useState('');
  const [emojiInput, setEmojiInput] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nearbyPromptOpen, setNearbyPromptOpen] = useState(false);

  const handleSelectFilter = async (mode: FilterMode) => {
    if (mode !== 'nearby') {
      if (mode === 'city' && cityCount === 0 && totalToday > 0) {
        setFilterMode('global');
        return;
      }
      setFilterMode(mode);
      return;
    }
    const asked = sessionStorage.getItem('rise_nearby_asked') === '1';
    const alreadyEnabled = locationSettings?.location_mode === 'nearby';
    if (alreadyEnabled || asked) {
      setFilterMode('nearby');
      return;
    }
    setNearbyPromptOpen(true);
  };

  const handleNearbyAllow = async () => {
    sessionStorage.setItem('rise_nearby_asked', '1');
    setNearbyPromptOpen(false);
    const granted = await requestGPSPermission();
    if (!granted) {
      toast.error('Location অনুমতি পাওয়া যায়নি — City তে দেখাচ্ছি');
      setFilterMode(cityCount > 0 ? 'city' : 'global');
      return;
    }
    try { await saveLocationSettings('nearby', locationSettings?.is_anonymous ?? false); } catch {}
    setFilterMode('nearby');
  };

  const handleNearbyDeny = () => {
    sessionStorage.setItem('rise_nearby_asked', '1');
    setNearbyPromptOpen(false);
    setFilterMode(cityCount > 0 ? 'city' : 'global');
  };

  // Auto-fallback if Nearby tab loads empty
  useEffect(() => {
    if (filterMode === 'nearby' && !isLoading && wakers.length === 0 && nearbyCount === 0) {
      if (cityCount > 0) setFilterMode('city');
      else if (totalToday > 0) setFilterMode('global');
    }
  }, [filterMode, isLoading, wakers.length, nearbyCount, cityCount, totalToday, setFilterMode]);

  const tab = (active: boolean) =>
    cn(
      'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-medium transition-all',
      active
        ? 'bg-[#6C63FF] text-white shadow-[0_0_18px_rgba(108,99,255,0.4)]'
        : 'text-white/60 hover:text-white',
    );

  // Check if user is first in their area today
  const isFirstInArea = myEvent
    ? wakers.filter(w =>
        w.city === myEvent.city && w.id !== myEvent.id
      ).length === 0
    : false;

  return (
    <div className="space-y-3 text-white">
      {/* Milestone banner — fixed position overlay */}
      <MilestoneBanner globalCount={totalToday} />

      {/* Header */}
      <div className="rounded-2xl bg-[#111118] border border-white/[0.06] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sunrise className="h-4 w-4 text-[#FFD740]" />
            <span className="text-base font-semibold">আজকের Wakers</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="text-white/60 hover:text-white h-8 w-8"
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Hero Stats Bar — tappable counts */}
        <HeroStatsBar
          globalCount={totalToday}
          cityCount={cityCount}
          nearbyCount={nearbyCount}
          activeFilter={filterMode}
          onTabClick={handleSelectFilter}
        />

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mt-3 p-1 bg-black/30 rounded-full">
          {FILTERS.map((f) => (
            <button
              key={f.mode}
              onClick={() => handleSelectFilter(f.mode)}
              className={tab(filterMode === f.mode)}
            >
              <f.icon className="h-3.5 w-3.5" /> {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Own Status Card — always visible */}
      <OwnStatusCard
        myEvent={myEvent}
        streak={streakData.currentStreak}
        isFirstInArea={isFirstInArea}
        areaName={myEvent?.city ?? userLocation?.city}
      />

      {/* My status update input — only if woken */}
      {myEvent && (
        <Card className="bg-[#111118] border-[#6C63FF]/20">
          <CardContent className="p-3">
            <div className="text-xs text-white/40 mb-2">Status update করো</div>
            <div className="flex gap-2">
              <Input
                value={emojiInput}
                onChange={(e) => setEmojiInput(e.target.value)}
                placeholder="🕌"
                className="w-14 bg-black/30 border-white/10 text-center text-base"
                maxLength={2}
              />
              <Input
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                placeholder={myEvent.status_text || 'কী করছেন এখন?'}
                className="bg-black/30 border-white/10 text-white"
                maxLength={60}
              />
              <Button
                onClick={() =>
                  statusInput.trim() &&
                  updateMyStatus(statusInput.trim(), emojiInput.trim() || undefined)
                }
                className="bg-[#6C63FF] hover:bg-[#5b52ff] shrink-0"
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View toggle: Feed / Map */}
      <div className="flex gap-1 p-1 bg-[#111118] border border-white/[0.06] rounded-full">
        <button onClick={() => setView('feed')} className={tab(view === 'feed')}>
          <List className="h-3.5 w-3.5" /> Feed
        </button>
        <button onClick={() => setView('map')} className={tab(view === 'map')}>
          <MapIcon className="h-3.5 w-3.5" /> Map
        </button>
      </div>

      {/* Content */}
      {view === 'map' ? (
        <BangladeshMapView
          wakers={wakers}
          myLat={userLocation?.lat ?? null}
          myLng={userLocation?.lng ?? null}
        />
      ) : (
        <div className="space-y-2">
          {isLoading && wakers.length === 0 ? (
            <div className="text-center text-white/40 text-sm py-8">Loading…</div>
          ) : wakers.length === 0 ? (
            <Card className="bg-[#111118] border-white/[0.06]">
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-2">🌙</div>
                <div className="text-sm font-medium">
                  এখনো কেউ {filterMode === 'nearby' ? 'কাছে' : 'এখানে'} নেই
                </div>
                <div className="text-xs text-white/50 mt-1">আপনিই প্রথম! 🎉</div>
                {filterMode !== 'global' && (
                  <div className="flex gap-2 justify-center mt-3">
                    {filterMode === 'nearby' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white text-xs"
                        onClick={() => setFilterMode('city')}
                      >
                        City দেখো
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white text-xs"
                      onClick={() => setFilterMode('global')}
                    >
                      Global দেখো
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            wakers.map((w) => (
              <NearbyWakerCard
                key={w.id}
                waker={w}
                showDistance={filterMode === 'nearby'}
                isCurrentUser={myEvent?.id === w.id}
                showAlarmLabel={communitySettings.show_alarm_label}
              />
            ))
          )}
        </div>
      )}

      {/* Community settings sheet */}
      <CommunitySettingsSheet
        open={settingsOpen}
        onOpenChange={(v) => {
          setSettingsOpen(v);
          if (!v) void refreshFeed();
        }}
      />


      {/* Weekly Recap sheet */}
      <WeeklyRecapSheet
        open={recapOpen}
        onOpenChange={setRecapOpen}
        data={recap ? { ...recap, currentStreak: streakData.currentStreak } : null}
      />



      {/* Nearby permission explainer (asked only once per session) */}
      <Dialog open={nearbyPromptOpen} onOpenChange={setNearbyPromptOpen}>
        <DialogContent className="bg-[#0A0A0F] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#00E676]" />
              কাছের Wakers দেখবে?
            </DialogTitle>
            <DialogDescription className="text-white/60 leading-relaxed">
              আপনার কাছের wakers দেখতে একবার location দরকার।
              আপনার exact location কখনো save হবে না — শুধু এলাকা।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button variant="ghost" className="flex-1 text-white/60 hover:text-white" onClick={handleNearbyDeny}>
              এখন না
            </Button>
            <Button className="flex-1 bg-[#6C63FF] hover:bg-[#5b52ff]" onClick={handleNearbyAllow}>
              অনুমতি দাও
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
