/**
 * UnifiedGroupDetail — single YPT-style shell shared by both
 * LifeOS Groups (GroupDetailPage) and Rise Group Wake (RiseGroupDetail).
 *
 * Uses the existing dark/teal Rise YPT components:
 *   GroupWakeScreen (header + bottom nav)
 *   GroupWakeMemberGrid (Home)
 *   GroupWakeAttendance (Attendance)
 *   GroupWakeRankings (Rankings)
 *   GroupWakeChat (Chat)
 *
 * Both surfaces only need to map their own data into the simple
 * `UnifiedMember` shape — visuals and interactions stay identical.
 */

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GroupWakeScreen } from '@/components/rise/GroupWakeScreen';
import { GroupWakeMemberGrid } from '@/components/rise/GroupWakeMemberGrid';
import {
  GroupWakeAttendance,
  type AttendanceMember,
  type AttendanceDayRecord,
} from '@/components/rise/GroupWakeAttendance';
import {
  GroupWakeRankings,
  type RankingMember,
} from '@/components/rise/GroupWakeRankings';
import { GroupWakeChat, type ChatMessage } from '@/components/rise/GroupWakeChat';
import { useGroupChat, useSendChatMessage } from '@/hooks/useGroupChat';
import type { GroupWakeMemberStatus, WakeMemberStatusKind } from '@/hooks/useGroupWakeAlarm';
import { toast } from 'sonner';

export interface UnifiedMember {
  user_id: string;
  full_name: string | null;
  /** seconds active/awake/focused today */
  seconds_today?: number;
  /** met today's goal */
  goal_met?: boolean;
  /** currently active right now */
  is_active?: boolean;
  /** woken state for member grid */
  wake_status?: WakeMemberStatusKind;
  /** small label above name (e.g. region/subgroup) */
  region_label?: string;
  /** ordered Mon→Sun seconds for this week */
  week_seconds?: number[];
  /** ordered Mon→Sun goal-met flags for this week */
  week_checked?: boolean[];
}

interface Props {
  groupId: string;
  groupName: string;
  members: UnifiedMember[];
  /** Daily goal threshold in seconds (used for Attendance bar tile colour). */
  goalSeconds?: number;
  /** Optional override for goal pill text on Attendance/Rankings. */
  goalLabel?: string;
  /** Optional invite code to surface on the Invite tab. */
  inviteCode?: string;
  onBack?: () => void;
  /** Called when the local user fires a wake-up nudge at someone. */
  onSendWakeUp?: (member: UnifiedMember) => void;
}

function isoWeekLabel(d = new Date()): string {
  const day = d.getDay(); // 0 Sun..6 Sat
  const offsetToMon = (day + 6) % 7;
  const mon = new Date(d); mon.setDate(d.getDate() - offsetToMon);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const f = (x: Date) => `${x.getMonth() + 1}/${x.getDate()}`;
  return `${f(mon)} ~ ${f(sun)}`;
}

function dailyDateLabel(d = new Date()): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function UnifiedGroupDetail({
  groupId,
  groupName,
  members,
  goalSeconds = 6 * 3600,
  goalLabel,
  inviteCode,
  onBack,
  onSendWakeUp,
}: Props) {
  const { user } = useAuth();
  const myId = user?.id ?? '';

  // ── Chat (real-time) ───────────────────────────────────────────────────
  const { data: chatRows = [] } = useGroupChat(groupId);
  const sendMsg = useSendChatMessage(groupId);

  const chatMessages: ChatMessage[] = useMemo(
    () =>
      chatRows.map((r) => ({
        id: r.id,
        user_id: r.user_id,
        full_name: r.author_name ?? 'Member',
        text: r.content,
        sent_at: r.created_at,
        is_system: r.is_system,
      })),
    [chatRows],
  );

  // ── Member Home grid ───────────────────────────────────────────────────
  const gridStatuses: GroupWakeMemberStatus[] = useMemo(
    () =>
      members.map((m) => ({
        id: m.user_id,
        session_id: groupId,
        user_id: m.user_id,
        group_id: groupId,
        status: (m.wake_status ?? (m.goal_met ? 'mission_done' : m.is_active ? 'active' : 'pending')) as any,
        status_text: null,
        mission_completed_at: m.goal_met ? new Date().toISOString() : null,
        status_updated_at: new Date().toISOString(),
        wake_up_calls_received: 0,
      })),
    [members, groupId],
  );

  const gridMembers = useMemo(
    () => members.map((m) => ({ user_id: m.user_id, full_name: m.full_name })),
    [members],
  );

  // ── Rankings ───────────────────────────────────────────────────────────
  const rankingMembers: RankingMember[] = useMemo(() => {
    const sorted = [...members].sort((a, b) => (b.seconds_today ?? 0) - (a.seconds_today ?? 0));
    return sorted.map((m, i) => ({
      user_id: m.user_id,
      full_name: m.full_name,
      rank: i + 1,
      wake_seconds: m.seconds_today ?? 0,
      is_active: m.is_active ?? false,
      goal_met: m.goal_met ?? false,
      is_me: m.user_id === myId,
      region_label: m.region_label,
    }));
  }, [members, myId]);

  const totalSeconds = rankingMembers.reduce((s, m) => s + m.wake_seconds, 0);
  const avgSeconds = rankingMembers.length ? Math.round(totalSeconds / rankingMembers.length) : 0;
  const myRank = rankingMembers.find((m) => m.is_me)?.rank ?? null;
  const myGoalMet = rankingMembers.find((m) => m.is_me)?.goal_met ?? false;

  // ── Attendance ─────────────────────────────────────────────────────────
  const attendanceMembers: AttendanceMember[] = useMemo(() => {
    const sorted = [...members].sort((a, b) => {
      const aw = (a.week_seconds ?? []).reduce((s, v) => s + v, 0);
      const bw = (b.week_seconds ?? []).reduce((s, v) => s + v, 0);
      return bw - aw;
    });
    return sorted.map((m, i) => {
      const wk = m.week_seconds ?? [m.seconds_today ?? 0, 0, 0, 0, 0, 0, 0];
      const ck = m.week_checked ?? wk.map((s) => s >= goalSeconds);
      const days: AttendanceDayRecord[] = wk.map((sec, idx) => ({
        date: `d${idx}`,
        wake_seconds: sec,
        checked: !!ck[idx],
      }));
      return {
        user_id: m.user_id,
        full_name: m.full_name,
        rank: i + 1,
        total_seconds: wk.reduce((s, v) => s + v, 0),
        days,
        is_me: m.user_id === myId,
      };
    });
  }, [members, goalSeconds, myId]);

  const totalAttendance = attendanceMembers.reduce(
    (s, m) => s + m.days.filter((d) => d.checked).length,
    0,
  );
  const maxPossible = attendanceMembers.length * 7;
  const averagePct = maxPossible ? Math.round((totalAttendance / maxPossible) * 100) : 0;
  const myAttRank = attendanceMembers.find((m) => m.is_me)?.rank ?? null;

  // ── Invite ─────────────────────────────────────────────────────────────
  const inviteContent = (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center h-full min-h-[300px]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1e1e2e] border border-[#2a2a3a]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7 text-[#2dd4bf]">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      </div>
      <div>
        <p className="text-white font-semibold mb-1">Invite members</p>
        <p className="text-sm text-[#5a5a7a]">
          {inviteCode ? 'Share this code with your group' : 'Sharing link coming soon'}
        </p>
      </div>
      {inviteCode && (
        <button
          onClick={() => {
            navigator.clipboard?.writeText(inviteCode);
            toast.success('Invite code copied');
          }}
          className="rounded-full bg-[#2dd4bf] text-[#080810] font-semibold px-6 py-2 text-sm hover:bg-[#14b8a6] transition-colors tracking-widest"
        >
          {inviteCode}
        </button>
      )}
    </div>
  );

  return (
    <GroupWakeScreen
      groupName={groupName}
      chatUnread={0}
      homeContent={
        <div className="bg-[#080810] min-h-full p-3">
          <div className="mb-4 flex items-center gap-2 text-xs text-[#7a7a9a]">
            <span className="font-semibold text-white">Studying</span>
            <span className="text-[#2dd4bf]">
              {members.filter((m) => m.is_active).length} members
            </span>
          </div>
          <GroupWakeMemberGrid
            members={gridMembers}
            statuses={gridStatuses}
            currentUserId={myId}
            onSendWakeUp={(m) => {
              const target = members.find((x) => x.user_id === m.user_id);
              if (target) onSendWakeUp?.(target);
            }}
          />
        </div>
      }
      attendanceContent={
        <GroupWakeAttendance
          weekLabel={isoWeekLabel()}
          goalLabel={goalLabel ?? `${Math.round(goalSeconds / 3600)}h done`}
          totalAttendance={totalAttendance}
          averageAttendancePct={averagePct}
          myRank={myAttRank}
          members={attendanceMembers}
          onPrevWeek={() => {}}
          onNextWeek={() => {}}
        />
      }
      rankingsContent={
        <GroupWakeRankings
          dateLabel={dailyDateLabel()}
          periodLabel="Daily"
          goalLabel={goalLabel ?? `${Math.round(goalSeconds / 3600)}h done`}
          totalSeconds={totalSeconds}
          averageSeconds={avgSeconds}
          myRank={myRank}
          myGoalMet={myGoalMet}
          members={rankingMembers}
          onPrevDay={() => {}}
          onNextDay={() => {}}
        />
      }
      inviteContent={inviteContent}
      chatContent={
        <GroupWakeChat
          groupName={groupName}
          messages={chatMessages}
          currentUserId={myId}
          onSend={(text) => sendMsg.mutate({ content: text })}
        />
      }
    />
  );
}
