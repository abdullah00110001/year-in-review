import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Bell,
  CheckCircle2,
  Clock,
  Zap,
  Moon,
  Sunrise,
  Plus,
  Copy,
  Crown,
  UserMinus,
  Trash2,
  Settings,
  LogOut
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string | null;
  created_by: string;
  created_at: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: string | null;
  joined_at: string;
  profile?: {
    full_name: string | null;
  };
}

interface WakeStatus {
  id: string;
  user_id: string;
  group_id: string;
  wake_date: string;
  status: string | null;
  scheduled_time: string | null;
  woke_at: string | null;
  confirmed_at: string | null;
  needs_help: boolean | null;
}

export function RiseGroupWake() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [wakeStatuses, setWakeStatuses] = useState<WakeStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
  
  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupMembers(selectedGroup.id);
      loadWakeStatuses(selectedGroup.id);
      
      // Set up realtime subscription for wake statuses
      const channel = supabase
        .channel(`group-wake-${selectedGroup.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'group_wake_status',
          filter: `group_id=eq.${selectedGroup.id}`
        }, () => {
          loadWakeStatuses(selectedGroup.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Get groups where user is a member
      const { data: memberData } = await supabase
        .from('accountability_group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberData && memberData.length > 0) {
        const groupIds = memberData.map(m => m.group_id);
        const { data: groupsData } = await supabase
          .from('accountability_groups')
          .select('*')
          .in('id', groupIds);

        setGroups(groupsData || []);
        if (groupsData && groupsData.length > 0 && !selectedGroup) {
          setSelectedGroup(groupsData[0]);
        }
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    const { data } = await supabase
      .from('accountability_group_members')
      .select(`
        *,
        profile:profiles!accountability_group_members_user_id_fkey(full_name)
      `)
      .eq('group_id', groupId);

    // Handle the join manually since the FK might not work
    if (data) {
      const membersWithProfiles = await Promise.all(
        data.map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', member.user_id)
            .single();
          return { ...member, profile };
        })
      );
      setMembers(membersWithProfiles);
    }
  };

  const loadWakeStatuses = async (groupId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('group_wake_status')
      .select('*')
      .eq('group_id', groupId)
      .eq('wake_date', today);

    setWakeStatuses(data || []);
  };

  const createGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    try {
      // Generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: groupData, error: groupError } = await supabase
        .from('accountability_groups')
        .insert({
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || null,
          created_by: user.id,
          invite_code: inviteCode
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin
      await supabase
        .from('accountability_group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'admin'
        });

      toast.success('Group created!');
      setCreateDialogOpen(false);
      setNewGroupName('');
      setNewGroupDescription('');
      loadGroups();
      setSelectedGroup(groupData);
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  const joinGroup = async () => {
    if (!user || !joinCode.trim()) return;

    try {
      const { data: groupData, error: findError } = await supabase
        .from('accountability_groups')
        .select('*')
        .eq('invite_code', joinCode.trim().toUpperCase())
        .single();

      if (findError || !groupData) {
        toast.error('Invalid invite code');
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('accountability_group_members')
        .select('id')
        .eq('group_id', groupData.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        toast.error('You are already a member of this group');
        return;
      }

      await supabase
        .from('accountability_group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'member'
        });

      toast.success(`Joined ${groupData.name}!`);
      setJoinDialogOpen(false);
      setJoinCode('');
      loadGroups();
      setSelectedGroup(groupData);
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Failed to join group');
    }
  };

  const leaveGroup = async () => {
    if (!user || !selectedGroup) return;

    try {
      await supabase
        .from('accountability_group_members')
        .delete()
        .eq('group_id', selectedGroup.id)
        .eq('user_id', user.id);

      toast.success('Left group');
      setSelectedGroup(null);
      loadGroups();
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
    }
  };

  const deleteGroup = async () => {
    if (!user || !selectedGroup) return;

    try {
      // Delete all members first
      await supabase
        .from('accountability_group_members')
        .delete()
        .eq('group_id', selectedGroup.id);

      // Delete wake statuses
      await supabase
        .from('group_wake_status')
        .delete()
        .eq('group_id', selectedGroup.id);

      // Delete group
      await supabase
        .from('accountability_groups')
        .delete()
        .eq('id', selectedGroup.id);

      toast.success('Group deleted');
      setDeleteConfirmOpen(false);
      setSettingsDialogOpen(false);
      setSelectedGroup(null);
      loadGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const toggleAdmin = async (member: GroupMember) => {
    if (!user || !selectedGroup) return;

    const newRole = member.role === 'admin' ? 'member' : 'admin';
    
    try {
      await supabase
        .from('accountability_group_members')
        .update({ role: newRole })
        .eq('id', member.id);

      toast.success(newRole === 'admin' ? 'Made admin' : 'Removed admin');
      loadGroupMembers(selectedGroup.id);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const removeMember = async () => {
    if (!memberToRemove || !selectedGroup) return;

    try {
      await supabase
        .from('accountability_group_members')
        .delete()
        .eq('id', memberToRemove.id);

      toast.success('Member removed');
      setMemberToRemove(null);
      loadGroupMembers(selectedGroup.id);
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const sendWakeSignal = async (targetUserId: string) => {
    if (!user || !selectedGroup) return;

    try {
      // Update or create wake status with needs_help = true
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data: existing } = await supabase
        .from('group_wake_status')
        .select('id')
        .eq('group_id', selectedGroup.id)
        .eq('user_id', targetUserId)
        .eq('wake_date', today)
        .single();

      if (existing) {
        await supabase
          .from('group_wake_status')
          .update({ needs_help: true })
          .eq('id', existing.id);
      }

      // Send notification (would integrate with push notifications)
      toast.success('Wake signal sent! 🔔');
    } catch (error) {
      console.error('Error sending wake signal:', error);
    }
  };

  const confirmAwake = async () => {
    if (!user || !selectedGroup) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date().toISOString();

      const { data: existing } = await supabase
        .from('group_wake_status')
        .select('id')
        .eq('group_id', selectedGroup.id)
        .eq('user_id', user.id)
        .eq('wake_date', today)
        .single();

      if (existing) {
        await supabase
          .from('group_wake_status')
          .update({ 
            status: 'confirmed',
            confirmed_at: now,
            needs_help: false
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('group_wake_status')
          .insert({
            group_id: selectedGroup.id,
            user_id: user.id,
            wake_date: today,
            status: 'confirmed',
            confirmed_at: now
          });
      }

      toast.success("You're awake! 🌅");
      loadWakeStatuses(selectedGroup.id);
    } catch (error) {
      console.error('Error confirming awake:', error);
    }
  };

  const copyInviteCode = () => {
    if (selectedGroup?.invite_code) {
      navigator.clipboard.writeText(selectedGroup.invite_code);
      toast.success('Invite code copied!');
    }
  };

  const isAdmin = members.find(m => m.user_id === user?.id)?.role === 'admin';
  const isCreator = selectedGroup?.created_by === user?.id;

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500 text-white';
      case 'awake': return 'bg-blue-500 text-white';
      case 'waking': return 'bg-amber-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="h-3 w-3" />;
      case 'awake': return <Sunrise className="h-3 w-3" />;
      case 'waking': return <Clock className="h-3 w-3" />;
      default: return <Moon className="h-3 w-3" />;
    }
  };

  const getMemberStatus = (userId: string) => {
    return wakeStatuses.find(ws => ws.user_id === userId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  // No groups view
  if (groups.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="text-center py-8">
          <CardContent>
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold mb-2">No Wake Groups</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a group or join one with an invite code
            </p>
            <div className="flex gap-2 justify-center">
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Wake Group</DialogTitle>
                    <DialogDescription>
                      Start a group to wake up together with friends
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Group Name</Label>
                      <Input
                        placeholder="Fajr Warriors"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Textarea
                        placeholder="Wake up for Fajr together"
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={createGroup} disabled={!newGroupName.trim()}>
                      Create Group
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Join Group</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join Wake Group</DialogTitle>
                    <DialogDescription>
                      Enter the invite code to join a group
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Invite Code</Label>
                      <Input
                        placeholder="ABC123"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        className="text-center text-lg tracking-widest"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={joinGroup} disabled={!joinCode.trim()}>
                      Join Group
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Group Selector & Actions */}
      <div className="flex items-center justify-between gap-2">
        <select
          value={selectedGroup?.id || ''}
          onChange={(e) => {
            const group = groups.find(g => g.id === e.target.value);
            setSelectedGroup(group || null);
          }}
          className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm"
        >
          {groups.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Wake Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Group Name</Label>
                <Input
                  placeholder="Fajr Warriors"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Wake up for Fajr together"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createGroup} disabled={!newGroupName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedGroup && (isAdmin || isCreator) && (
          <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Group Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">Invite Code</p>
                    <p className="text-lg font-mono tracking-widest">{selectedGroup.invite_code}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={copyInviteCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {isCreator && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Group
                  </Button>
                )}

                {!isCreator && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={leaveGroup}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave Group
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {selectedGroup && (
        <>
          {/* Group Status Overview */}
          <Card className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border-amber-500/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {selectedGroup.name}
                </CardTitle>
                <Badge variant="outline" className="border-amber-500/30">
                  {members.length} members
                </Badge>
              </div>
              {selectedGroup.description && (
                <CardDescription>{selectedGroup.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around py-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-500">
                    {wakeStatuses.filter(ws => ws.status === 'confirmed').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">
                    {wakeStatuses.filter(ws => ws.status === 'awake').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Awake</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">
                    {members.length - wakeStatuses.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Sleeping</p>
                </div>
              </div>

              <Button className="w-full mt-3" onClick={confirmAwake}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                I'm Awake!
              </Button>
            </CardContent>
          </Card>

          {/* Group Members */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium px-1">Members</h3>
            {members.map((member) => {
              const status = getMemberStatus(member.user_id);
              const isSelf = member.user_id === user?.id;
              const memberIsAdmin = member.role === 'admin';

              return (
                <Card key={member.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {(member.profile?.full_name || 'U').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {member.profile?.full_name || 'User'}
                              {isSelf && ' (You)'}
                            </p>
                            {memberIsAdmin && (
                              <Crown className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {status?.scheduled_time && (
                              <>
                                <Clock className="h-3 w-3" />
                                <span>{status.scheduled_time}</span>
                              </>
                            )}
                            {status?.confirmed_at && (
                              <span className="text-emerald-500">
                                ✓ {format(new Date(status.confirmed_at), 'h:mm a')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", getStatusColor(status?.status || null))}>
                          {getStatusIcon(status?.status || null)}
                          <span className="ml-1 capitalize">{status?.status || 'sleeping'}</span>
                        </Badge>
                        
                        {!isSelf && !status?.status && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendWakeSignal(member.user_id)}
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                        )}

                        {(isAdmin || isCreator) && !isSelf && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toggleAdmin(member)}>
                                <Crown className="h-4 w-4 mr-2" />
                                {memberIsAdmin ? 'Remove Admin' : 'Make Admin'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setMemberToRemove(member)}
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove from Group
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Needs Help Alert */}
          {wakeStatuses.filter(ws => ws.needs_help).map(ws => {
            const member = members.find(m => m.user_id === ws.user_id);
            if (!member || member.user_id === user?.id) return null;

            return (
              <Card key={ws.id} className="bg-amber-500/10 border-amber-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {member.profile?.full_name || 'Someone'} needs help waking up!
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Send them a wake signal
                      </p>
                    </div>
                    <Button size="sm" onClick={() => sendWakeSignal(ws.user_id)}>
                      <Zap className="h-4 w-4 mr-1" />
                      Wake
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Join Code Card */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Invite Code</p>
                  <p className="text-lg font-mono tracking-widest">{selectedGroup.invite_code}</p>
                </div>
                <Button variant="outline" size="sm" onClick={copyInviteCode}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the group and remove all members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteGroup} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {memberToRemove?.profile?.full_name || 'this member'} from the group?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeMember} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
