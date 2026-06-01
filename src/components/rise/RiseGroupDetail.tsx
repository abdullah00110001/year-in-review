/**
 * RiseGroupDetail — world-class mobile group screen for the Rise alarm app.
 *
 * Self-contained: dark UI, sunrise-glow woken members, leader actions,
 * inner tabs (Members / Chat / Settings), in-group bottom nav (Home / Attendance /
 * Rankings / Chat) that REPLACES the Rise main bottom nav while inside a group.
 *
 * Wire it in by rendering <RiseGroupDetail groupId={id} onExit={() => ...} />
 * from a parent route. While this screen is mounted, the parent should hide
 * its own bottom navigation.
 */

import { useEffect, useMemo, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { isNative } from '@/lib/capacitor/platform';
import {
  ArrowLeft, Settings, Share2, Sunrise, Star, Bell, Send,
  Home as HomeIcon, CalendarDays, Trophy, MessageCircle, Crown, Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

/* ---------- Types ---------- */

interface Member {
  id: string;
  username: string;
  avatarUrl?: string;
  wakeTime?: string;   // 'HH:mm' if woken today, else undefined
  streak: number;
  isLeader?: boolean;
}

interface RiseGroupDetailProps {
  groupId: string;
  groupName?: string;
  isLeader?: boolean;
  members?: Member[];
  onExit?: () => void;
}

type InnerTab = 'members' | 'chat' | 'settings';
type BottomTab = 'home' | 'attendance' | 'rankings' | 'chat';
type Period = 'day' | 'week' | 'month';

/* ---------- Demo fallback data ---------- */

const DEMO_MEMBERS: Member[] = [
  { id: '1', username: 'Rashed',  wakeTime: '04:52', streak: 27, isLeader: true },
  { id: '2', username: 'Mim',     wakeTime: '04:58', streak: 19 },
  { id: '3', username: 'Tanvir',  wakeTime: '05:03', streak: 14 },
  { id: '4', username: 'Sumaiya', wakeTime: '05:11', streak: 22 },
  { id: '5', username: 'Akib',    streak: 5 },
  { id: '6', username: 'Nila',    streak: 11 },
  { id: '7', username: 'Faisal',  wakeTime: '05:24', streak: 8 },
  { id: '8', username: 'Rumi',    streak: 0 },
];

/* ---------- Helpers ---------- */

const initials = (n: string) => n.slice(0, 2).toUpperCase();

const periodLabel: Record<Period, string> = {
  day: 'Today',
  week: 'Week',
  month: 'Month',
};

/* ---------- Member Tile (sunrise glow for woken) ---------- */

function MemberTile({ m, isFirstWaker }: { m: Member; isFirstWaker: boolean }) {
  const woken = !!m.wakeTime;
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* sunrise glow */}
      {woken && (
        <div
          aria-hidden
          className="absolute -inset-1 rounded-2xl blur-xl opacity-70 pointer-events-none animate-pulse"
          style={{
            background:
              'radial-gradient(60% 60% at 50% 35%, rgba(255,215,64,0.55) 0%, rgba(255,140,40,0.25) 45%, transparent 75%)',
          }}
        />
      )}
      <div
        className={cn(
          'relative h-16 w-16 rounded-2xl flex items-center justify-center',
          woken
            ? 'ring-2 ring-[#FFD740]/70 shadow-[0_0_24px_-2px_rgba(255,215,64,0.55)]'
            : 'ring-1 ring-white/5'
        )}
      >
        <Avatar className={cn('h-16 w-16 rounded-2xl', !woken && 'grayscale opacity-60')}>
          {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt={m.username} />}
          <AvatarFallback
            className={cn(
              'rounded-2xl text-sm font-bold',
              woken ? 'bg-gradient-to-br from-amber-400/30 to-orange-500/20 text-amber-100' : 'bg-white/5 text-white/60'
            )}
          >
            {initials(m.username)}
          </AvatarFallback>
        </Avatar>
        {isFirstWaker && woken && (
          <span
            className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-amber-400 text-[#0A0A0F] flex items-center justify-center shadow-md"
            aria-label="First waker of the day"
          >
            <Star className="h-3.5 w-3.5 fill-current" />
          </span>
        )}
        {m.isLeader && (
          <span className="absolute -bottom-1 -left-1 h-5 w-5 rounded-full bg-[#6C63FF] text-white flex items-center justify-center shadow-md">
            <Crown className="h-3 w-3" />
          </span>
        )}
      </div>
      <p className={cn('mt-2 text-xs font-semibold truncate w-full', woken ? 'text-white' : 'text-white/50')}>
        {m.username}
      </p>
      <p
        className={cn(
          'text-[11px] tabular-nums font-mono',
          woken ? 'text-[#FFD740]' : 'text-white/30'
        )}
      >
        {woken ? m.wakeTime : '--'}
      </p>
    </div>
  );
}

/* ---------- Header ---------- */

function GroupHeader({
  name,
  memberCount,
  wokenCount,
  isLeader,
  backFlash,
  onBack,
  onWakeAll,
}: {
  name: string;
  memberCount: number;
  wokenCount: number;
  isLeader: boolean;
  backFlash: boolean;
  onBack: () => void;
  onWakeAll: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5">
      {/* sunrise band */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#6C63FF]/60 to-transparent"
      />
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className={cn(
              'h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200',
              backFlash
                ? 'text-red-500 bg-red-500/20 scale-110 shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10 rounded-xl">
              <AvatarFallback className="rounded-xl bg-[#6C63FF]/20 text-[#6C63FF] font-bold">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white truncate leading-tight">{name}</h1>
              <p className="text-[11px] text-white/50 truncate">{memberCount} members</p>
            </div>
          </div>

          <button className="h-9 w-9 rounded-xl text-white/60 hover:text-white hover:bg-white/5 flex items-center justify-center" aria-label="Share">
            <Share2 className="h-4 w-4" />
          </button>
          <button className="h-9 w-9 rounded-xl text-white/60 hover:text-white hover:bg-white/5 flex items-center justify-center" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 rounded-2xl bg-gradient-to-br from-[#6C63FF]/15 via-[#6C63FF]/5 to-transparent border border-[#6C63FF]/20 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Sunrise className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-bold text-white tabular-nums">{wokenCount}</span>
              <span className="text-xs text-white/70">জন উঠেছে today</span>
            </div>
          </div>
          {isLeader && (
            <Button
              onClick={onWakeAll}
              size="sm"
              className="h-10 rounded-2xl bg-[#6C63FF] hover:bg-[#5b53e6] text-white font-semibold shadow-lg shadow-[#6C63FF]/30"
            >
              <Bell className="h-4 w-4 mr-1.5" />
              Wake All
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

/* ---------- Inner tab bar ---------- */

function InnerTabs({ tab, onChange }: { tab: InnerTab; onChange: (t: InnerTab) => void }) {
  const tabs: { id: InnerTab; label: string }[] = [
    { id: 'members', label: 'Members' },
    { id: 'chat', label: 'Chat' },
    { id: 'settings', label: 'Settings' },
  ];
  return (
    <div className="px-4 pt-3">
      <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              'flex-1 h-9 rounded-xl text-xs font-semibold transition-all',
              tab === t.id
                ? 'bg-[#6C63FF] text-white shadow-md'
                : 'text-white/55 hover:text-white hover:bg-white/5'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Leaderboard ---------- */

function Leaderboard({ members }: { members: Member[] }) {
  const [period, setPeriod] = useState<Period>('day');

  const ranked = useMemo(() => {
    // demo: sort by wake time then streak
    const woken = members
      .filter((m) => m.wakeTime)
      .sort((a, b) => (a.wakeTime! < b.wakeTime! ? -1 : 1));
    const sleeping = members.filter((m) => !m.wakeTime).sort((a, b) => b.streak - a.streak);
    return [...woken, ...sleeping].slice(0, 10);
  }, [members]);

  return (
    <div className="px-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-amber-400" /> Leaderboard
        </h3>
        <div className="flex gap-1 p-1 rounded-full bg-white/5 border border-white/5">
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 h-7 rounded-full text-[11px] font-semibold transition-colors',
                period === p ? 'bg-[#6C63FF] text-white' : 'text-white/55 hover:text-white'
              )}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-1.5">
        {ranked.map((m, i) => {
          const rank = i + 1;
          return (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <div
                className={cn(
                  'h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold tabular-nums',
                  rank === 1 && 'bg-amber-400/20 text-amber-300',
                  rank === 2 && 'bg-slate-300/20 text-slate-200',
                  rank === 3 && 'bg-orange-400/20 text-orange-300',
                  rank > 3 && 'bg-white/5 text-white/60'
                )}
              >
                {rank}
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-white/5 text-white/70 text-xs">{initials(m.username)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{m.username}</p>
                <p className="text-[11px] text-white/45 flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-400" /> {m.streak}d streak
                </p>
              </div>
              <span className={cn('text-sm font-mono tabular-nums', m.wakeTime ? 'text-[#FFD740]' : 'text-white/30')}>
                {m.wakeTime ?? '--:--'}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Chat (placeholder) ---------- */

function GroupChat() {
  const [msg, setMsg] = useState('');
  return (
    <div className="flex flex-col h-[calc(100vh-280px)] px-4 mt-3">
      <div className="flex-1 overflow-y-auto space-y-2 py-2">
        <div className="text-center text-xs text-white/30 py-4">Today</div>
        <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-white/5 px-3 py-2 text-sm text-white/85">
          Good morning team! 🌅
        </div>
        <div className="max-w-[75%] ml-auto rounded-2xl rounded-br-md bg-[#6C63FF] px-3 py-2 text-sm text-white">
          Up at 4:52 — let's go!
        </div>
      </div>
      <div className="sticky bottom-0 flex items-center gap-2 py-3 bg-[#0A0A0F]">
        <Input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Message the group…"
          className="h-10 rounded-full bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
        <Button
          size="icon"
          className="h-10 w-10 rounded-full bg-[#6C63FF] hover:bg-[#5b53e6]"
          onClick={() => setMsg('')}
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ---------- Group settings (placeholder) ---------- */

function GroupSettingsPanel() {
  return (
    <div className="px-4 mt-3 space-y-2">
      {['Notifications', 'Wake-up window', 'Privacy', 'Leave group'].map((label) => (
        <button
          key={label}
          className="w-full flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-white/85 hover:bg-white/5"
        >
          {label}
          <span className="text-white/30">›</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- In-group bottom nav (replaces Rise main nav) ---------- */

function InGroupBottomNav({
  tab, onChange, period, onPeriod,
}: {
  tab: BottomTab;
  onChange: (t: BottomTab) => void;
  period: Period;
  onPeriod: (p: Period) => void;
}) {
  const items: { id: BottomTab; label: string; icon: typeof HomeIcon; hasPeriod?: boolean }[] = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'attendance', label: 'Attendance', icon: CalendarDays, hasPeriod: true },
    { id: 'rankings', label: 'Rankings', icon: Trophy, hasPeriod: true },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
  ];
  const showPeriod = (tab === 'attendance' || tab === 'rankings');
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 bg-[#0A0A0F]/95 backdrop-blur-xl border-t border-white/5">
      {showPeriod && (
        <div className="flex justify-center gap-1 py-2 border-b border-white/5">
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => onPeriod(p)}
              className={cn(
                'px-3 h-7 rounded-full text-[11px] font-semibold transition-colors',
                period === p ? 'bg-[#6C63FF] text-white' : 'text-white/55 hover:text-white bg-white/5'
              )}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>
      )}
      <ul className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <li key={id}>
              <button
                onClick={() => onChange(id)}
                className={cn(
                  'w-full flex flex-col items-center gap-1 py-2.5 transition-colors',
                  active ? 'text-[#6C63FF]' : 'text-white/45 hover:text-white/80'
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'drop-shadow-[0_0_6px_rgba(108,99,255,0.7)]')} />
                <span className="text-[10px] font-semibold">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ---------- Main screen ---------- */

export default function RiseGroupDetail({
  groupId,
  groupName = 'Fajr Risers',
  isLeader = true,
  members = DEMO_MEMBERS,
  onExit,
}: RiseGroupDetailProps) {
  const [innerTab, setInnerTab] = useState<InnerTab>('members');
  const [bottomTab, setBottomTab] = useState<BottomTab>('home');
  const [period, setPeriod] = useState<Period>('day');
  const [backFlash, setBackFlash] = useState(false);

  /* Android hardware back interception — suppress nav, flash red. */
  useEffect(() => {
    if (!isNative) return;
    let off: (() => void) | undefined;
    let t: ReturnType<typeof setTimeout> | undefined;
    CapacitorApp.addListener('backButton', () => {
      setBackFlash(true);
      if (t) clearTimeout(t);
      t = setTimeout(() => setBackFlash(false), 600);
    }).then((h) => { off = () => h.remove(); });
    return () => { if (t) clearTimeout(t); off?.(); };
  }, []);

  const wokenCount = members.filter((m) => m.wakeTime).length;
  const firstWakerId = useMemo(() => {
    const woken = members.filter((m) => m.wakeTime).sort((a, b) => (a.wakeTime! < b.wakeTime! ? -1 : 1));
    return woken[0]?.id;
  }, [members]);

  const renderBody = () => {
    if (bottomTab === 'rankings') return <Leaderboard members={members} />;
    if (bottomTab === 'attendance') {
      return (
        <div className="px-4 mt-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-xs text-white/50 mb-2">{periodLabel[period]} attendance</p>
            <p className="text-3xl font-black tabular-nums text-white">
              {wokenCount}<span className="text-white/30 text-lg">/{members.length}</span>
            </p>
            <p className="text-xs text-white/60 mt-1">members up on time</p>
          </div>
        </div>
      );
    }
    if (bottomTab === 'chat') return <GroupChat />;

    // home — inner tab content
    return (
      <>
        <InnerTabs tab={innerTab} onChange={setInnerTab} />
        {innerTab === 'members' && (
          <div className="px-4 mt-4">
            <div className="grid grid-cols-4 gap-3 gap-y-4">
              {members.map((m) => (
                <MemberTile key={m.id} m={m} isFirstWaker={m.id === firstWakerId} />
              ))}
            </div>
          </div>
        )}
        {innerTab === 'chat' && <GroupChat />}
        {innerTab === 'settings' && <GroupSettingsPanel />}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white pb-28">
      <GroupHeader
        name={groupName}
        memberCount={members.length}
        wokenCount={wokenCount}
        isLeader={isLeader}
        backFlash={backFlash}
        onBack={() => onExit?.()}
        onWakeAll={() => {
          /* hook up to your wake broadcast RPC here */
          console.log('Wake all triggered for group', groupId);
        }}
      />

      {renderBody()}

      <InGroupBottomNav
        tab={bottomTab}
        onChange={setBottomTab}
        period={period}
        onPeriod={setPeriod}
      />
    </div>
  );
}
