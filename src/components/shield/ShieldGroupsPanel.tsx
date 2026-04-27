import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Copy, Crown, Link2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface ShieldGroup {
  id: string;
  name: string;
  invite_code: string;
  member_count: number;
  is_admin: boolean;
  connected_rise_group_id?: string | null;
  created_at: string;
}

const STORAGE_KEY = 'shield_groups_v2';

function loadGroups(): ShieldGroup[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveGroups(g: ShieldGroup[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(g)); }

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function ShieldGroupsPanel() {
  const [groups, setGroups] = useState<ShieldGroup[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => { setGroups(loadGroups()); }, []);

  const create = () => {
    if (!name.trim()) return;
    const g: ShieldGroup = {
      id: crypto.randomUUID(),
      name: name.trim(),
      invite_code: genCode(),
      member_count: 1,
      is_admin: true,
      created_at: new Date().toISOString(),
    };
    const next = [g, ...groups];
    setGroups(next); saveGroups(next);
    setName(''); setCreateOpen(false);
    toast.success(`Group "${g.name}" created`);
  };

  const join = () => {
    if (!code.trim()) return;
    const g: ShieldGroup = {
      id: crypto.randomUUID(),
      name: `Group ${code.toUpperCase()}`,
      invite_code: code.toUpperCase(),
      member_count: 2,
      is_admin: false,
      created_at: new Date().toISOString(),
    };
    const next = [g, ...groups];
    setGroups(next); saveGroups(next);
    setCode(''); setJoinOpen(false);
    toast.success('Joined group');
  };

  const connectRise = (id: string) => {
    const riseId = window.prompt('Enter your Rise group ID to link with this Shield group:');
    if (!riseId) return;
    const next = groups.map(g => g.id === id ? { ...g, connected_rise_group_id: riseId } : g);
    setGroups(next); saveGroups(next);
    toast.success('Linked with Rise group');
  };

  const copyInvite = (g: ShieldGroup) => {
    navigator.clipboard.writeText(g.invite_code);
    toast.success('Invite code copied');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => setCreateOpen(true)} className="flex-1 h-11 rounded-xl">
          <Plus className="h-4 w-4 mr-2" /> Create
        </Button>
        <Button onClick={() => setJoinOpen(true)} variant="outline" className="flex-1 h-11 rounded-xl">
          <Users className="h-4 w-4 mr-2" /> Join
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-8 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-bold text-sm">No Shield groups yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create one to stay accountable with friends and family.</p>
        </CardContent></Card>
      ) : (
        groups.map(g => (
          <Card key={g.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base truncate">{g.name}</h3>
                    {g.is_admin && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{g.member_count} member{g.member_count !== 1 && 's'}</p>
                </div>
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <code className="flex-1 text-xs font-mono">{g.invite_code}</code>
                <Button size="sm" variant="ghost" onClick={() => copyInvite(g)} className="h-7">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>

              {g.is_admin && (
                <Button
                  variant={g.connected_rise_group_id ? 'secondary' : 'outline'}
                  size="sm"
                  className="w-full"
                  onClick={() => connectRise(g.id)}
                >
                  <Link2 className="h-3.5 w-3.5 mr-2" />
                  {g.connected_rise_group_id ? 'Linked with Rise group' : 'Connect to a Rise group'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Shield group</DialogTitle></DialogHeader>
          <Input placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={create}>Create</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Join Shield group</DialogTitle></DialogHeader>
          <Input placeholder="Invite code" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button onClick={join}>Join</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}