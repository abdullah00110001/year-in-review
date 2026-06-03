import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

export interface RankingMember {
  user_id: string;
  full_name: string | null;
  rank: number;
  wake_seconds: number;   // today's awake duration
  is_active: boolean;     // currently active/awake
  goal_met: boolean;      // met the daily alarm goal
  is_me?: boolean;
  region_label?: string;  // e.g. "উ. মা." — optional label above name
}

interface Props {
  dateLabel: string;         // e.g. "Jun 3"
  periodLabel?: string;      // e.g. "Daily"
  goalLabel: string;         // e.g. "6h alarm goal"
  totalSeconds: number;
  averageSeconds: number;
  myRank: number | null;
  myGoalMet: boolean;
  members: RankingMember[];
  onPrevDay: () => void;
  onNextDay: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtHMS(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function fmtHM(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}:${String(m).padStart(2,'0')}`;
}

// ── Status icon next to member (replaces YPT's study desk) ────────────────

const ActiveBellIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-[#2dd4bf]">
    <path d="M16 4a8 8 0 0 1 8 8v4l2 3H6l2-3v-4a8 8 0 0 1 8-8Z" />
    <path d="M13 22a3 3 0 0 0 6 0" />
    <line x1="20" y1="4" x2="24" y2="2" />
    <line x1="24" y1="2" x2="24" y2="6" />
  </svg>
);

const SleepingIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-[#3a3a5a]">
    <circle cx="16" cy="16" r="10" />
    <line x1="16" y1="10" x2="16" y2="16" />
    <line x1="16" y1="16" x2="21" y2="20" />
    <path d="M24 8 Q26 10 24 12" strokeDasharray="2 1" />
    <path d="M8 8 Q6 10 8 12" strokeDasharray="2 1" />
  </svg>
);

const GoalMetIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-[#4ade80]">
    <circle cx="16" cy="16" r="10" />
    <polyline points="11,16 14,20 21,12" />
  </svg>
);

// ── Rank badge ─────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#b45309] text-white font-black text-lg shadow-lg shadow-amber-900/40">
      1
    </div>
  );
  if (rank === 2) return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#374151] text-[#d1d5db] font-black text-lg">
      2
    </div>
  );
  if (rank === 3) return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#292524] text-[#a87d5a] font-black text-lg">
      3
    </div>
  );
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2dd4bf] text-[#2dd4bf] font-bold text-base">
      {rank}
    </div>
  );
}

// ── Member Row ─────────────────────────────────────────────────────────────

function RankRow({ m, maxSec }: { m: RankingMember; maxSec: number }) {
  const pct = maxSec > 0 ? Math.max(4, Math.round((m.wake_seconds / maxSec) * 100)) : 4;
  const StatusIcon = m.goal_met ? GoalMetIcon : m.is_active ? ActiveBellIcon : SleepingIcon;

  return (
    <div className={cn(
      'flex flex-col gap-1.5 rounded-xl border px-3 py-2.5 transition-all',
      m.is_me ? 'border-[#1e4a6e] bg-[#0a1a2e]' : 'border-[#1a1a28] bg-[#0d0d14]',
    )}>
      <div className="flex items-center gap-3">
        <RankBadge rank={m.rank} />

        {/* name block */}
        <div className="flex-1 min-w-0">
          {m.region_label && (
            <p className="text-[10px] text-[#2dd4bf] leading-none mb-0.5">{m.region_label}</p>
          )}
          <p className={cn('truncate text-sm font-semibold', m.is_me ? 'text-[#7dd3fc]' : 'text-white')}>
            {m.is_me ? 'You' : m.full_name || 'Member'}
          </p>
        </div>

        {/* time */}
        <span className="font-mono text-sm font-bold text-[#2dd4bf] tabular-nums shrink-0">
          {fmtHMS(m.wake_seconds)}
        </span>

        {/* status icon */}
        <div className="shrink-0">
          <StatusIcon />
        </div>
      </div>

      {/* progress bar */}
      <div className="h-1.5 rounded-full bg-[#1a1a2a] overflow-hidden ml-[52px]">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            m.goal_met ? 'bg-[#4ade80]' : m.is_active ? 'bg-[#2dd4bf]' : 'bg-[#374151]',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export function GroupWakeRankings({
  dateLabel,
  periodLabel = 'Daily',
  goalLabel,
  totalSeconds,
  averageSeconds,
  myRank,
  myGoalMet,
  members,
  onPrevDay,
  onNextDay,
}: Props) {
  const [tab, setTab] = useState<'wake_time' | 'goal'>('wake_time');
  const maxSec = members.reduce((a, m) => Math.max(a, m.wake_seconds), 0);

  return (
    <div className="flex flex-col gap-4 bg-[#080810] min-h-full p-4">

      {/* ── Day navigator ── */}
      <div className="flex items-center justify-between rounded-xl bg-[#0f0f1a] border border-[#1e1e2e] px-4 py-2.5">
        <button onClick={onPrevDay} className="text-[#5a5a7a] hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-white">{dateLabel}</span>
        <button onClick={onNextDay} className="text-[#5a5a7a] hover:text-white transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="ml-3 rounded-lg bg-[#1e1e30] px-3 py-1 text-xs text-[#8080b0]">
          {periodLabel} ▾
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('wake_time')}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
            tab === 'wake_time'
              ? 'bg-[#2dd4bf] text-[#080810]'
              : 'bg-[#1e1e2e] text-[#8080b0] hover:text-white',
          )}
        >
          Wake time
        </button>
        <button
          onClick={() => setTab('goal')}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-all border',
            tab === 'goal'
              ? 'bg-[#2dd4bf] text-[#080810] border-transparent'
              : 'border-[#2a2a3a] text-[#8080b0] hover:text-white',
          )}
        >
          {goalLabel}
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="flex items-center gap-4 text-sm">
        <div>
          <span className="text-[#5a5a7a]">Total time </span>
          <span className="font-bold text-[#2dd4bf]">{fmtHMS(totalSeconds)}</span>
        </div>
        <div>
          <span className="text-[#5a5a7a]">Average </span>
          <span className="font-bold text-[#2dd4bf]">{fmtHM(averageSeconds)}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[#5a5a7a] text-xs">
            {myRank !== null ? `My rank #${myRank}` : 'My rank -'}
          </span>
          <div className={cn(
            'flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold',
            myGoalMet ? 'bg-[#2dd4bf] text-[#080810]' : 'bg-[#1e1e2e] border border-[#2a2a3a] text-[#5a5a7a]',
          )}>
            ✓
          </div>
        </div>
      </div>

      {/* ── Leaderboard ── */}
      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <RankRow key={m.user_id} m={m} maxSec={maxSec} />
        ))}
      </div>
    </div>
  );
}
