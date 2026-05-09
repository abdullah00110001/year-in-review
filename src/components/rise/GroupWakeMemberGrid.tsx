import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BellRing, CheckCircle2, Moon, Sunrise, Volume2, VolumeX } from 'lucide-react';
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

const STATUS_META: Record<WakeMemberStatusKind, { label: string; ring: string; bg: string; icon: any }> = {
  pending:      { label: 'Asleep',     ring: 'ring-muted',                   bg: 'bg-muted/50',              icon: Moon },
  mission_done: { label: 'Awake',      ring: 'ring-emerald-500',             bg: 'bg-emerald-500/10',        icon: CheckCircle2 },
  active:       { label: 'Active',     ring: 'ring-primary',                 bg: 'bg-primary/10',            icon: Sunrise },
  silent:       { label: 'No status',  ring: 'ring-amber-500',               bg: 'bg-amber-500/10',          icon: VolumeX },
  sleeping:     { label: 'Slept in',   ring: 'ring-destructive animate-pulse', bg: 'bg-destructive/10',     icon: Moon },
};

export function GroupWakeMemberGrid({ members, statuses, currentUserId, onSendWakeUp }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3">
      {members.map((m) => {
        const s = statuses.find((x) => x.user_id === m.user_id);
        const kind: WakeMemberStatusKind = s ? deriveAgedStatus(s, now) : 'pending';
        const meta = STATUS_META[kind];
        const Icon = meta.icon;
        const isMe = m.user_id === currentUserId;
        const canCall = !isMe && (kind === 'pending' || kind === 'sleeping' || kind === 'silent');
        const initials = (m.full_name || '?').slice(0, 2).toUpperCase();

        return (
          <div
            key={m.user_id}
            className={cn(
              'relative rounded-2xl border p-3 flex flex-col items-center text-center gap-2 transition-all',
              meta.bg
            )}
          >
            <Avatar className={cn('h-14 w-14 ring-2 ring-offset-2 ring-offset-background', meta.ring)}>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 w-full">
              <p className="text-sm font-semibold truncate">
                {isMe ? 'You' : m.full_name || 'Member'}
              </p>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Icon className="h-3 w-3" />
                <span className="truncate">{s?.status_text || meta.label}</span>
              </div>
            </div>
            {canCall && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => onSendWakeUp(m)}
              >
                <BellRing className="h-3 w-3 mr-1" /> Wake up
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}