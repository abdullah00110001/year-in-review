import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, Building2, MapPin, List, Map as MapIcon, Sunrise, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNearbyWakers, type FilterMode } from '@/hooks/useNearbyWakers';
import { useWakeLocation } from '@/hooks/useWakeLocation';
import { NearbyWakerCard } from './NearbyWakerCard';
import { BangladeshMapView } from './BangladeshMapView';
import { LocationPrivacySheet } from './LocationPrivacySheet';

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
  const { locationSettings } = useWakeLocation();

  const [view, setView] = useState<'feed' | 'map'>('feed');
  const [statusInput, setStatusInput] = useState('');
  const [emojiInput, setEmojiInput] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const tab = (active: boolean) =>
    cn(
      'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-medium transition-all',
      active
        ? 'bg-[#6C63FF] text-white shadow-[0_0_18px_rgba(108,99,255,0.4)]'
        : 'text-white/60 hover:text-white',
    );

  return (
    <div className="space-y-3 text-white">

      {/* Header */}
      <div className="rounded-2xl bg-[#111118] border border-white/[0.06] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold flex items-center gap-2">
              <Sunrise className="h-4 w-4 text-[#FFD740]" /> আজকের Wakers
            </div>
            <div className="text-xs text-white/50 mt-0.5">
              {totalToday} জন উঠেছে{' '}
              {filterMode === 'global'
                ? 'সারা বিশ্বে'
                : filterMode === 'city'
                ? `${userLocation?.city || 'your city'}-এ`
                : '5 km এ'}
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="text-white/60 hover:text-white"
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 mt-3 p-1 bg-black/30 rounded-full">
          {FILTERS.map((f) => (
            <button key={f.mode} onClick={() => setFilterMode(f.mode)} className={tab(filterMode === f.mode)}>
              <f.icon className="h-3.5 w-3.5" /> {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* My status */}
      {myEvent && (
        <Card className="bg-[#111118] border-[#6C63FF]/30">
          <CardContent className="p-3">
            <div className="text-xs text-white/60 mb-2">Your status</div>
            <div className="flex gap-2">
              <Input
                value={emojiInput}
                onChange={(e) => setEmojiInput(e.target.value)}
                placeholder="🕌"
                className="w-14 bg-black/30 border-white/10 text-center"
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
                className="bg-[#6C63FF] hover:bg-[#5b52ff]"
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 border-white/20 text-white"
                    onClick={() => setFilterMode('global')}
                  >
                    Switch to Global feed
                  </Button>
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
              />
            ))
          )}
        </div>
      )}

      <LocationPrivacySheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSaved={() => void refreshFeed()}
      />
    </div>
  );
}