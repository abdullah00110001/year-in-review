import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import type { WakerProfile } from '@/hooks/useNearbyWakers';

interface Props {
  waker: WakerProfile;
  showDistance?: boolean;
  isCurrentUser?: boolean;
}

function ringStyle(woke_at: string, hasStatus: boolean) {
  const ageMin = (Date.now() - new Date(woke_at).getTime()) / 60000;
  if (ageMin > 120) return { ring: 'ring-white/10', glow: '', dot: 'bg-white/30' };
  if (hasStatus) return {
    ring: 'ring-2 ring-[#00E676]',
    glow: 'shadow-[0_0_12px_rgba(0,230,118,0.4)]',
    dot: 'bg-[#00E676]',
  };
  return {
    ring: 'ring-2 ring-[#FFD740]',
    glow: 'shadow-[0_0_12px_rgba(255,215,64,0.3)]',
    dot: 'bg-[#FFD740]',
  };
}

export function NearbyWakerCard({ waker, showDistance, isCurrentUser }: Props) {
  const hasStatus = !!waker.status_text;
  const { ring, glow, dot } = ringStyle(waker.woke_at, hasStatus);
  const ageMin = (Date.now() - new Date(waker.woke_at).getTime()) / 60000;
  const isNew = ageMin < 5;
  const time = new Date(waker.woke_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const initial = (waker.display_name || '?').charAt(0).toUpperCase();
  const locLine = waker.is_anonymous
    ? `Someone in ${waker.city || 'unknown'}${waker.distance_km != null ? ` • ${waker.distance_km} km` : ''}`
    : showDistance && waker.distance_km != null
      ? `${waker.city || ''} • ${waker.distance_km} km`
      : waker.city || waker.country || '—';

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-xl bg-[#111118] border border-white/[0.06] transition-all',
        'animate-in fade-in slide-in-from-bottom-2',
        isCurrentUser && 'border-[#6C63FF]/40 bg-[#6C63FF]/5'
      )}
    >
      <div className={cn('relative')}>
        {waker.is_anonymous ? (
          <div className={cn('h-12 w-12 rounded-full ring-offset-2 ring-offset-[#111118]', ring, glow,
            'bg-gradient-to-br from-[#6C63FF] to-[#FF5252] flex items-center justify-center text-white font-bold')}>
            ?
          </div>
        ) : (
          <Avatar className={cn('h-12 w-12 ring-offset-2 ring-offset-[#111118]', ring, glow)}>
            {waker.avatar_url ? <AvatarImage src={waker.avatar_url} alt="" /> : null}
            <AvatarFallback className="bg-[#6C63FF]/20 text-[#6C63FF] font-bold">{initial}</AvatarFallback>
          </Avatar>
        )}
        <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#111118]', dot)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn('font-semibold text-sm truncate', waker.is_anonymous && 'text-white/70')}>
              {isCurrentUser ? 'You' : (waker.is_anonymous ? 'Anonymous' : waker.display_name)}
            </span>
            {isNew && (
              <Badge className="h-4 px-1.5 text-[9px] bg-[#00E676] text-black hover:bg-[#00E676]">NEW</Badge>
            )}
          </div>
          <span className="text-xs text-white/40 shrink-0">{time}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/50 mt-0.5">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{locLine}</span>
        </div>
        {hasStatus && (
          <div className="mt-1.5 flex items-center gap-2">
            {waker.status_emoji && <span className="text-lg leading-none">{waker.status_emoji}</span>}
            <span className="text-sm italic text-white/75">{waker.status_text}</span>
          </div>
        )}
        <div className="mt-1 flex items-center gap-2">
          {waker.mission_type && (
            <Badge variant="outline" className="h-5 text-[10px] border-white/10 text-white/60">
              {waker.mission_type} ✓
            </Badge>
          )}
          <span className="text-[10px] text-white/30">{formatDistanceToNow(new Date(waker.woke_at), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  );
}
