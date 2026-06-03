import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

export interface AttendanceDayRecord {
  date: string;       // 'YYYY-MM-DD'
  wake_seconds: number; // seconds they were awake/active that day
  checked: boolean;   // met the daily goal?
}

export interface AttendanceMember {
  user_id: string;
  full_name: string | null;
  rank: number;
  total_seconds: number;
  days: AttendanceDayRecord[]; // ordered Mon→Sun for the week
  is_me?: boolean;
}

interface Props {
  weekLabel: string;           // e.g. "6/1 ~ 6/7"
  goalLabel: string;           // e.g. "6h alarm goal"
  totalAttendance: number;
  averageAttendancePct: number;
  myRank: number | null;
  members: AttendanceMember[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  activeTab?: 'wake_time' | 'goal';
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtHMS(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ── Day Tile ───────────────────────────────────────────────────────────────

function DayTile({ record, dayLabel }: { record?: AttendanceDayRecord; dayLabel: string }) {
  if (!record) {
    // future day
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#2a2a3a] text-xs text-[#3a3a5a] shrink-0">
        {dayLabel}
      </div>
    );
  }
  const h = Math.floor(record.wake_seconds / 3600);
  const m = Math.floor((record.wake_seconds % 3600) / 60);
  const label = record.wake_seconds === 0 ? '' : h > 0 ? `${h}:${String(m).padStart(2,'0')}` : `0:${String(m).padStart(2,'0')}`;

  return (
    <div
      className={cn(
        'flex h-8 min-w-[2rem] items-center justify-center rounded-md px-1.5 text-xs font-mono font-semibold shrink-0 transition-all',
        record.wake_seconds > 0 && record.checked
          ? 'bg-[#0e4f3f] text-[#2dd4bf] border border-[#1a7a60]'
          : record.wake_seconds > 0
          ? 'bg-[#1e2a1e] text-[#6ee7b7] border border-[#2a4a2a]'
          : 'border border-[#2a2a3a] text-[#3a3a5a]',
      )}
    >
      {label || dayLabel}
    </div>
  );
}

// ── Member Row ─────────────────────────────────────────────────────────────

function MemberRow({ m }: { m: AttendanceMember }) {
  const initials = (m.full_name || '?').slice(0, 2).toUpperCase();

  return (
    <div className={cn(
      'flex flex-col gap-2 rounded-xl border p-3 transition-all',
      m.is_me ? 'border-[#1e4a6e] bg-[#0a1a2e]' : 'border-[#1e1e2e] bg-[#0d0d14]',
    )}>
      {/* top row: rank + avatar + name + total */}
      <div className="flex items-center gap-2">
        <span className="w-5 text-center text-xs font-bold text-[#5a5a7a]">{m.rank}</span>
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="text-[10px] bg-[#1e1e30] text-[#8080b0]">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className={cn('flex-1 truncate text-sm font-semibold', m.is_me ? 'text-[#7dd3fc]' : 'text-white')}>
          {m.is_me ? 'You' : m.full_name || 'Member'}
        </span>
        <span className="font-mono text-sm font-bold text-[#2dd4bf] tabular-nums shrink-0">
          {fmtHMS(m.total_seconds)}
        </span>
      </div>

      {/* day tiles row */}
      <div className="flex items-center gap-1 pl-7 overflow-x-auto scrollbar-none">
        {DAY_LABELS.map((label, i) => (
          <DayTile key={i} record={m.days[i]} dayLabel={label} />
        ))}
        {/* checkmark count */}
        <div className="ml-auto flex items-center gap-1 pl-2 shrink-0">
          <span className="text-xs text-[#5a5a7a]">✓</span>
          <span className="text-xs font-semibold text-[#2dd4bf]">
            {m.days.filter(d => d.checked).length}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export function GroupWakeAttendance({
  weekLabel,
  goalLabel,
  totalAttendance,
  averageAttendancePct,
  myRank,
  members,
  onPrevWeek,
  onNextWeek,
  activeTab = 'wake_time',
}: Props) {
  const [tab, setTab] = useState<'wake_time' | 'goal'>(activeTab);

  return (
    <div className="flex flex-col gap-4 bg-[#080810] min-h-full p-4">

      {/* ── Week navigator ── */}
      <div className="flex items-center justify-between rounded-xl bg-[#0f0f1a] border border-[#1e1e2e] px-4 py-2.5">
        <button onClick={onPrevWeek} className="text-[#5a5a7a] hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-white">{weekLabel}</span>
        <button onClick={onNextWeek} className="text-[#5a5a7a] hover:text-white transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="ml-3 rounded-lg bg-[#1e1e30] px-3 py-1 text-xs text-[#8080b0]">
          Weekly ▾
        </div>
      </div>

      {/* ── Tab pills ── */}
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
            'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
            tab === 'goal'
              ? 'bg-[#2dd4bf] text-[#080810]'
              : 'bg-[#1e1e2e] text-[#8080b0] hover:text-white border border-[#2a2a3a]',
          )}
        >
          {goalLabel}
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-4 text-sm">
        <div>
          <span className="text-[#5a5a7a]">Total attendance </span>
          <span className="font-bold text-[#2dd4bf]">{totalAttendance}</span>
        </div>
        <div>
          <span className="text-[#5a5a7a]">Average </span>
          <span className="font-bold text-[#2dd4bf]">{averageAttendancePct}%</span>
        </div>
        {myRank !== null && (
          <div className="ml-auto">
            <span className="text-[#5a5a7a]">My rank </span>
            <span className="font-bold text-[#7dd3fc]">#{myRank}</span>
          </div>
        )}
      </div>

      {/* ── Member list ── */}
      <div className="flex flex-col gap-2">
        {members.map((m) => (
          <MemberRow key={m.user_id} m={m} />
        ))}
      </div>
    </div>
  );
}
