import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Copy, 
  Check,
  Shield,
  Eye,
  Lock,
  MessageCircle,
  UserPlus,
  Crown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AccountabilityGroup {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  created_by: string;
  can_view_shield_status: boolean;
  can_approve_unlock: boolean;
  members?: GroupMember[];
}

interface GroupMember {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export function ShieldAccountability() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<AccountabilityGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Get groups user is a member of
      const { data: memberships } = await supabase
        .from('accountability_group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberships && memberships.length > 0) {
        const groupIds = memberships.map(m => m.group_id);
        const { data: groupsData } = await supabase
          .from('accountability_groups')
          .select('*')
          .in('id', groupIds);

        setGroups(groupsData || []);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createGroup = async () => {
    if (!user || !newGroupName) return;

    const inviteCode = `SH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data: group, error } = await supabase
      .from('accountability_groups')
      .insert({
        name: newGroupName,
        created_by: user.id,
        invite_code: inviteCode
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create group');
      return;
    }

    // Add creator as admin member
    await supabase
      .from('accountability_group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin'
      });

    toast.success('Group created!');
    setShowCreateDialog(false);
    setNewGroupName('');
    loadGroups();
  };

  const joinGroup = async () => {
    if (!user || !joinCode) return;

    // Find group by invite code
    const { data: group, error: findError } = await supabase
      .from('accountability_groups')
      .select('*')
      .eq('invite_code', joinCode.toUpperCase())
      .single();

    if (findError || !group) {
      toast.error('Invalid invite code');
      return;
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('accountability_group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      toast.error('You are already a member of this group');
      return;
    }

    // Join group
    const { error: joinError } = await supabase
      .from('accountability_group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member'
      });

    if (joinError) {
      toast.error('Failed to join group');
      return;
    }

    toast.success(`Joined ${group.name}!`);
    setShowJoinDialog(false);
    setJoinCode('');
    loadGroups();
  };

  const copyInviteCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="h-auto py-4 flex-col gap-2">
              <Plus className="h-5 w-5" />
              <span className="text-xs">Create Group</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Accountability Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Group Name</Label>
                <Input
                  placeholder="e.g., Study Buddies"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={createGroup}>
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <UserPlus className="h-5 w-5" />
              <span className="text-xs">Join Group</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join Accountability Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Invite Code</Label>
                <Input
                  placeholder="e.g., SH-ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={joinGroup}>
                Join Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups List */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="font-semibold mb-1">No Accountability Groups</h3>
            <p className="text-sm text-muted-foreground">
              Create or join a group to stay accountable with friends
            </p>
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <CardDescription>
                      {group.created_by === user?.id && (
                        <Badge variant="secondary" className="text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Creator
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Permissions */}
              <div className="flex gap-2">
                {group.can_view_shield_status && (
                  <Badge variant="outline" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    View Status
                  </Badge>
                )}
                {group.can_approve_unlock && (
                  <Badge variant="outline" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Approve Unlock
                  </Badge>
                )}
              </div>

              {/* Invite Code */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Invite Code:</span>
                <code className="flex-1 font-mono font-bold">{group.invite_code}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyInviteCode(group.invite_code)}
                >
                  {copied === group.invite_code ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Member Avatars (placeholder) */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <Avatar key={i} className="h-8 w-8 border-2 border-background">
                      <AvatarFallback className="text-xs">U{i}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <Button variant="ghost" size="sm">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* How It Works */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">How Accountability Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Eye className="h-3 w-3 text-primary" />
            </div>
            <p>Group members can see your Shield status (active/inactive)</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Lock className="h-3 w-3 text-primary" />
            </div>
            <p>In Hard/Absolute mode, you need group approval to unlock early</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Shield className="h-3 w-3 text-primary" />
            </div>
            <p>Bypass attempts are logged and visible to your group</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}