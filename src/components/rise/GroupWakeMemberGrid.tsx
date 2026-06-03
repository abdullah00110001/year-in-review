import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { deriveAgedStatus, type GroupWakeMemberStatus, type WakeMemberStatusKind } from '@/hooks/useGroupWakeAlarm';

interface MemberLite {
  user_id: string;
  full_name: string | null;
}

interface Props {
  members: MemberLite[];
  statuses: GroupWakeMemberStatus[];
  currentUserId: string;
  onSendWakeUp: (member: MemberLite) => void;
}

// ── SVG icons ──────────────────────────────────────────────────────────────

// Alarm clock (still sleeping / pending)
const AlarmClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {/* bell-legs */}
    <line x1="10" y1="10" x2="6" y2="6" />
    <line x1="38" y1="10" x2="42" y2="6" />
    {/* clock body */}
    <circle cx="24" cy="26" r="15" />
    {/* hands */}
    <line x1="24" y1="18" x2="24" y2="26" />
    <line x1="24" y1="26" x2="30" y2="30" />
    {/* alarm feet */}
    <line x1="18" y1="40" x2="14" y2="44" />
    <line x1="30" y1="40" x2="34" y2="44" />
  </svg>
);

// Alarm ringing (sleeping-in / missed)
const AlarmRingingIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="10" y1="10" x2="6" y2="6" />
    <line x1="38" y1="10" x2="42" y2="6" />
    <circle cx="24" cy="26" r="15" />
    <line x1="24" y1="18" x2="24" y2="26" />
    <line x1="24" y1="26" x2="30" y2="30" />
    <line x1="18" y1="40" x2="14" y2="44" />
    <line x1="30" y1="40" x2="34" y2="44" />
    {/* ringing waves */}
    <path d="M5 20 Q2 24 5 28" />
    <path d="M43 20 Q46 24 43 28" />
  </svg>
);

// Sun rising (active / awake)
const SunRisingIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {/* horizon */}
    <line x1="4" y1="36" x2="44" y2="36" />
    {/* sun arc */}
    <path d="M10 36 A14 14 0 0 1 38 36" />
    {/* rays */}
    <line x1="24" y1="10" x2="24" y2="6" />
    <line x1="36" y1="14" x2="39" y2="11" />
    <line x1="12" y1="14" x2="9" y2="11" />
    <line x1="40" y1="26" x2="44" y2="26" />
    <line x1="8"  y1="26" x2="4"  y2="26" />
  </svg>
);

// Check with sparkle (mission done)
const CheckSparkleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="24" cy="24" r="16" />
    <polyline points="16,24 21,30 32,18" />
    {/* sparkles */}
    <line x1="6"  y1="8"  x2="6"  y2="12" />
    <line x1="4"  y1="10" x2="8"  y2="10" />
    <line x1="40" y1="36" x2="40" y2="40" />
    <line x1="38" y1="38" x2="42" y2="38" />
  </svg>
);

// Moon (no status / silent)
const MoonIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M32 8 A16 16 0 1 0 32 40 A12 12 0 0 1 32 8Z" />
  </svg>
);

// Bell with plus (wake up button icon)
const BellPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2a6 6 0 0 1 6 6v3l1.5 2.5H2.5L4 11V8a6 6 0 0 1 6-6Z" />
    <path d="M8.5 16.5a1.5 1.5 0 0 0 3 0" />
    <line x1="13" y1="6" x2="17" y2="6" />
    <line x1="15" y1="4" x2="15" y2="8" />
  </svg>
);

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_META: Record<
  WakeMemberStatusKind,
  {
    label: string;
    cardBorder: string;
    iconColor: string;
    timeColor: string;
    Icon: (p: { className?: string }) => JSX.Element;
    pulse?: boolean;
  }
> = {
  pending: {
    label: 'Sleeping',
    cardBorder: 'border-[#2a2a3a]',
    iconColor: 'text-[#5a5a7a]',
    timeColor: 'text-[#5a5a7a]',
    Icon: AlarmClockIcon,
  },
  active: {
    label: 'Awake',
    cardBorder: 'border-[#1e6b5e]',
    iconColor: 'text-[#2dd4bf]',
    timeColor: 'text-[#2dd4bf]',
    Icon: SunRisingIcon,
  },
  mission_done: {
    label: 'Done ✓',
    cardBorder: 'border-[#1a5c3a]',
    iconColor: 'text-[#4ade80]',
    timeColor: 'text-[#4ade80]',
    Icon: CheckSparkleIcon,
  },
  sleeping: {
    label: 'Slept in!',
    cardBorder: 'border-[#7f1d1d]',
    iconColor: 'text-[#f87171]',
    timeColor: 'text-[#f87171]',
    Icon: AlarmRingingIcon,
    pulse: true,
  },
  silent: {
    label: 'No update',
    cardBorder: 'border-[#3a2e1a]',
    iconColor: 'text-[#a16207]',
    timeColor: 'text-[#a16207]',
    Icon: MoonIcon,
  },
};

// ── Time display ───────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

// ── Component ──────────────────────────────────────────────────────────────

export function GroupWakeMemberGrid({ members, statuses, currentUserId, onSendWakeUp }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3 p-1">
      {members.map((m) => {
        const s = statuses.find((x) => x.user_id === m.user_id);
        const kind: WakeMemberStatusKind = s ? deriveAgedStatus(s, now) : 'pending';
        const meta = STATUS_META[kind];
        const { Icon } = meta;
        const isMe = m.user_id === currentUserId;
        const canWake = !isMe && (kind === 'pending' || kind === 'sleeping' || kind === 'silent');
        const initials = (m.full_name || '?').slice(0, 2).toUpperCase();

        // elapsed wake time in seconds (if they have a wakeTime recorded)
        const elapsedSec = s?.wake_time_epoch
          ? Math.max(0, Math.floor((now - s.wake_time_epoch * 1000) / 1000))
          : null;

        return (
          <div
            key={m.user_id}
            className={cn(
              'relative flex flex-col items-center gap-2.5 rounded-2xl border bg-[#111118] p-3 pt-4 text-center transition-all',
              meta.cardBorder,
              meta.pulse && 'animate-pulse-subtle',
            )}
          >
            {/* ── Icon area (replaces YPT's study-desk SVG) ── */}
            <div className="relative flex h-16 w-16 items-center justify-center">
              {/* subtle glow behind icon */}
              <div
                className={cn(
                  'absolute inset-0 rounded-full opacity-20 blur-md',
                  kind === 'active'       && 'bg-teal-400',
                  kind === 'mission_done' && 'bg-green-400',
                  kind === 'sleeping'     && 'bg-red-500',
                  kind === 'silent'       && 'bg-amber-400',
                  kind === 'pending'      && 'bg-slate-600',
                )}
              />
              <Icon className={cn('relative h-12 w-12', meta.iconColor)} />
            </div>

            {/* ── Avatar + name ── */}
            <div className="flex flex-col items-center gap-1 w-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-[#1e1e2e] text-[#9090b0]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-semibold text-white leading-tight truncate w-full px-1">
                {isMe ? 'You' : m.full_name || 'Member'}
              </p>
            </div>

            {/* ── Time / status line ── */}
            <div className={cn('text-xs font-mono font-medium tabular-nums', meta.timeColor)}>
              {elapsedSec !== null && kind !== 'pending'
                ? formatElapsed(elapsedSec)
                : <span className="text-[#3a3a5a]">{meta.label}</span>
              }
            </div>

            {/* ── Wake-up button ── */}
            {canWake && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-full px-2 text-xs border border-[#2a2a4a] text-[#8888cc] hover:bg-[#1e1e3a] hover:text-white transition-colors"
                onClick={() => onSendWakeUp(m)}
              >
                <BellPlusIcon className="h-3.5 w-3.5 mr-1" />
                Wake up
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
