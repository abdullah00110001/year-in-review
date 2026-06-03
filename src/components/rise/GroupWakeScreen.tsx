import { useState } from 'react';
import { Home, CalendarDays, BarChart2, UserPlus, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import all sub-screens
// (In your project, import from their respective files)
// import { GroupWakeMemberGrid } from './GroupWakeMemberGrid';
// import { GroupWakeAttendance } from './GroupWakeAttendance';
// import { GroupWakeRankings } from './GroupWakeRankings';
// import { GroupWakeChat } from './GroupWakeChat';

// ── Tab definition ─────────────────────────────────────────────────────────

type Tab = 'home' | 'attendance' | 'rankings' | 'invite' | 'chat';

const TABS: { id: Tab; label: string; Icon: any }[] = [
  { id: 'home',       label: 'Home',       Icon: Home },
  { id: 'attendance', label: 'Attendance', Icon: CalendarDays },
  { id: 'rankings',   label: 'Rankings',   Icon: BarChart2 },
  { id: 'invite',     label: 'Invite',     Icon: UserPlus },
  { id: 'chat',       label: 'Chat',       Icon: MessageCircle },
];

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  groupName: string;
  homeContent: React.ReactNode;
  attendanceContent: React.ReactNode;
  rankingsContent: React.ReactNode;
  inviteContent?: React.ReactNode;
  chatContent: React.ReactNode;
  defaultTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  /** Optional: unread chat count */
  chatUnread?: number;
}

// ── Main ───────────────────────────────────────────────────────────────────

export function GroupWakeScreen({
  groupName,
  homeContent,
  attendanceContent,
  rankingsContent,
  inviteContent,
  chatContent,
  defaultTab = 'home',
  onTabChange,
  chatUnread = 0,
}: Props) {
  const [active, setActive] = useState<Tab>(defaultTab);

  function go(tab: Tab) {
    setActive(tab);
    onTabChange?.(tab);
  }

  const content: Record<Tab, React.ReactNode> = {
    home:       homeContent,
    attendance: attendanceContent,
    rankings:   rankingsContent,
    invite:     inviteContent ?? <InvitePlaceholder />,
    chat:       chatContent,
  };

  return (
    <div className="flex flex-col bg-[#080810] h-full w-full overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-[#1a1a2a] bg-[#0d0d18] px-4 py-3 shrink-0">
        <button className="text-[#5a5a7a] hover:text-white transition-colors text-xl leading-none">‹</button>
        <h1 className="text-base font-bold text-white tracking-wide">{groupName}</h1>
        <button className="text-[#5a5a7a] hover:text-white transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
            <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {content[active]}
      </div>

      {/* ── Bottom nav ── */}
      <div className="border-t border-[#1a1a2a] bg-[#0d0d18] px-2 py-1.5 shrink-0">
        <div className="flex items-center justify-around">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = active === id;
            const showBadge = id === 'chat' && chatUnread > 0;
            return (
              <button
                key={id}
                onClick={() => go(id)}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all',
                  isActive ? 'text-[#2dd4bf]' : 'text-[#3a3a5a] hover:text-[#7a7a9a]',
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
                {showBadge && (
                  <span className="absolute -top-0.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#f87171] text-[9px] font-bold text-white">
                    {chatUnread > 9 ? '9+' : chatUnread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Invite placeholder ─────────────────────────────────────────────────────

function InvitePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center h-full min-h-[300px]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1e1e2e] border border-[#2a2a3a]">
        <UserPlus className="h-7 w-7 text-[#2dd4bf]" />
      </div>
      <div>
        <p className="text-white font-semibold mb-1">Invite members</p>
        <p className="text-sm text-[#5a5a7a]">Share a link to grow your wake group</p>
      </div>
      <button className="rounded-full bg-[#2dd4bf] text-[#080810] font-semibold px-6 py-2 text-sm hover:bg-[#14b8a6] transition-colors">
        Copy invite link
      </button>
    </div>
  );
}
