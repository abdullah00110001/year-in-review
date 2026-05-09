import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Settings, Users, LogOut, Bell, Sunrise, ShieldCheck, Flame, Trophy, Activity, Radio, Swords, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LifeosGroupType, useGroupDetail, useGroupLeaderboard, useActivityFeed, useLeaveGroup, useSendNudge, MemberStats } from '@/hooks/useLifeosGroups';
import { MemberStatsModal } from './MemberStatsModal';
import { LivePresenceStrip } from './LivePresenceStrip';
import { LiveRoomsPanel } from './LiveRoomsPanel';
import { ChallengesPanel } from './ChallengesPanel';
import { FailureWall } from './FailureWall';

interface Props { groupId: string; onBack: () => void; }

const rankBorder = (rank: number) =>
  rank === 0 ? 'ring-2 ring-amber-400'
  : rank === 1 ? 'ring-2 ring-slate-300'
  : rank === 2 ? 'ring-2 ring-orange-400'
  : 'ring-1 ring-border';

const activityIcon = (type: string) => {
  switch (type) {
    case 'wake_up': return <Sunrise className="h-4 w-4 text-amber-500" />;
    case 'streak': return <Trophy className="h-4 w-4 text-amber-500" />;
    case 'deep_work': return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
    case 'goal_hit': return <Flame className="h-4 w-4 text-rose-500" />;
    default: return <Activity className="h-4 w-4 text-primary" />;
  }
};

export function GroupDetailPage({ groupId, onBack }: Props) {
  const { data: group, isLoading: gLoading } = useGroupDetail(groupId);
  const { data: leaderboard, isLoading: lLoading } = useGroupLeaderboard(groupId, group?.type as LifeosGroupType | undefined);
  const { data: feed, isLoading: fLoading } = useActivityFeed(groupId);
  const leaveGroup = useLeaveGroup();
  const sendNudge = useSendNudge();
  const [selected, setSelected] = useState<MemberStats | null>(null);

  if (gLoading || !group) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const type = group.type;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-2 p-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold truncate">{group.name}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> {leaderboard?.length ?? 0} members
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><Settings className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => leaveGroup.mutate(groupId, { onSuccess: onBack })} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" /> Leave Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="leaderboard">
          <TabsList className="w-full grid grid-cols-5 h-auto">
            <TabsTrigger value="leaderboard" className="text-[11px] px-1"><Trophy className="h-3.5 w-3.5" /></TabsTrigger>
            <TabsTrigger value="rooms" className="text-[11px] px-1"><Radio className="h-3.5 w-3.5" /></TabsTrigger>
            <TabsTrigger value="challenges" className="text-[11px] px-1"><Swords className="h-3.5 w-3.5" /></TabsTrigger>
            <TabsTrigger value="activity" className="text-[11px] px-1"><Activity className="h-3.5 w-3.5" /></TabsTrigger>
            <TabsTrigger value="failures" className="text-[11px] px-1"><AlertTriangle className="h-3.5 w-3.5" /></TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <LivePresenceStrip groupId={groupId} selfStatus="idle" />
          </div>

          <TabsContent value="leaderboard" className="mt-4">
            {lLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
              </div>
            ) : (leaderboard?.length ?? 0) === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">No members yet</Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {leaderboard!.map((m, idx) => {
                  const initials = (m.display_name || 'M').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <button key={m.user_id} onClick={() => setSelected(m)}
                      className={cn("text-left p-3 rounded-2xl bg-card border transition-all hover:shadow-md", rankBorder(idx))}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                        {m.behind_target && (
                          <button onClick={(e) => { e.stopPropagation(); sendNudge.mutate({ group_id: groupId, recipient_id: m.user_id }); }}
                            className="p-1 rounded-md hover:bg-accent" title="Send nudge">
                            <Bell className="h-3.5 w-3.5 text-amber-500" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {initials}
                        </div>
                        <p className="text-sm font-semibold truncate flex-1">{m.display_name}</p>
                      </div>
                      {type === 'rise' ? (
                        <div className="space-y-1">
                          <p className="text-xs flex items-center gap-1"><Sunrise className="h-3 w-3 text-amber-500" />
                            {m.wake_time ? `Woke at ${m.wake_time.slice(0, 5)}` : 'Not yet'}
                          </p>
                          <p className="text-xs flex items-center gap-1 text-muted-foreground">
                            <Flame className="h-3 w-3 text-rose-500" /> {m.streak_days ?? 0} day streak
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" />
                            {Math.floor((m.focus_minutes ?? 0) / 60)}h {(m.focus_minutes ?? 0) % 60}m Focus
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{m.top_app}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rooms" className="mt-4">
            <LiveRoomsPanel groupId={groupId} defaultKind={type === 'rise' ? 'wake_up' : 'deep_work'} />
          </TabsContent>

          <TabsContent value="challenges" className="mt-4">
            <ChallengesPanel groupId={groupId} />
          </TabsContent>

          <TabsContent value="failures" className="mt-4">
            <FailureWall groupId={groupId} />
          </TabsContent>

          <TabsContent value="activity" className="mt-4 space-y-2">
            {fLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (feed?.length ?? 0) === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground">No activity yet</Card>
            ) : feed!.map((a: any) => (
              <Card key={a.id} className="p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {activityIcon(a.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{a.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      <MemberStatsModal
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        member={selected}
        groupId={groupId}
        type={type}
      />
    </div>
  );
}