/**
 * RiseGroupDetail — thin adapter that renders the unified YPT-style
 * group shell for a Rise wake group. Hardware-back interception
 * (red flash) is handled by the parent Rise page.
 */

import { useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { isNative } from '@/lib/capacitor/platform';
import { UnifiedGroupDetail, type UnifiedMember } from '@/components/groups/UnifiedGroupDetail';

interface Member {
  id: string;
  username: string;
  avatarUrl?: string;
  wakeTime?: string;
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

function wakeToSeconds(wake?: string): number {
  if (!wake) return 0;
  // Active seconds since wake-up (rough proxy: 6h max if early, less if late).
  const [h, m] = wake.split(':').map(Number);
  const now = new Date();
  const w = new Date(); w.setHours(h, m, 0, 0);
  return Math.max(0, Math.floor((now.getTime() - w.getTime()) / 1000));
}

export default function RiseGroupDetail({
  groupId,
  groupName = 'Fajr Risers',
  members = DEMO_MEMBERS,
  onExit,
}: RiseGroupDetailProps) {
  const [, setBackFlash] = useState(false);

  // Android hardware-back interception (parent Rise page also has its own; safe no-op).
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

  const unified: UnifiedMember[] = members.map((m) => {
    const sec = wakeToSeconds(m.wakeTime);
    return {
      user_id: m.id,
      full_name: m.username,
      seconds_today: sec,
      goal_met: sec >= 6 * 3600 || !!m.wakeTime,
      is_active: !!m.wakeTime,
      wake_status: m.wakeTime ? 'mission_done' : 'pending',
      region_label: m.isLeader ? '★ Leader' : undefined,
    };
  });

  return (
    <UnifiedGroupDetail
      groupId={groupId}
      groupName={groupName}
      members={unified}
      goalSeconds={6 * 3600}
      goalLabel="6h wake goal"
      onBack={onExit}
    />
  );
}
