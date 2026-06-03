import { Skeleton } from '@/components/ui/skeleton';
import { LifeosGroupType, useGroupDetail, useGroupLeaderboard } from '@/hooks/useLifeosGroups';
import { UnifiedGroupDetail, type UnifiedMember } from './UnifiedGroupDetail';

interface Props { groupId: string; onBack: () => void; }

/**
 * GroupDetailPage — LifeOS Groups detail screen.
 * Renders the unified YPT-style group shell (Home / Attendance / Rankings / Invite / Chat)
 * with real leaderboard data.
 */
export function GroupDetailPage({ groupId, onBack }: Props) {
  const { data: group, isLoading: gLoading } = useGroupDetail(groupId);
  const { data: leaderboard, isLoading: lLoading } = useGroupLeaderboard(
    groupId,
    group?.type as LifeosGroupType | undefined,
  );

  if (gLoading || !group || lLoading) {
    return (
      <div className="p-4 space-y-3 bg-[#080810] min-h-screen">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isRise = group.type === 'rise';
  const goalSeconds = isRise ? 6 * 3600 : 2 * 3600;

  const members: UnifiedMember[] = (leaderboard ?? []).map((m) => {
    const secondsToday = isRise
      ? (m.wake_time ? 4 * 3600 : 0) // proxy: presence today
      : (m.focus_minutes ?? 0) * 60;
    return {
      user_id: m.user_id,
      full_name: m.display_name,
      seconds_today: secondsToday,
      goal_met: isRise ? !!m.on_time : (m.focus_minutes ?? 0) * 60 >= goalSeconds,
      is_active: isRise ? !!m.wake_time : (m.status === 'focusing'),
      wake_status: isRise
        ? (m.on_time ? 'mission_done' : m.wake_time ? 'active' : m.behind_target ? 'sleeping' : 'pending')
        : ((m.focus_minutes ?? 0) > 0 ? 'active' : 'pending'),
    };
  });

  return (
    <UnifiedGroupDetail
      groupId={groupId}
      groupName={group.name}
      members={members}
      goalSeconds={goalSeconds}
      goalLabel={isRise ? '6h wake goal' : '2h focus goal'}
      inviteCode={group.invite_code}
      onBack={onBack}
    />
  );
}
