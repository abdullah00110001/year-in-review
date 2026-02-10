import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Shield, AlertTriangle, Trash2, Settings, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface GroupData {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  member_count: number;
  can_view_shield_status: boolean;
  can_approve_unlock: boolean;
  can_send_encouragement: boolean;
  notification_level: string;
}

export default function AdminGroupControl() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, totalMembers: 0, avgSize: 0 });

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data: groupsData, error } = await supabase
        .from('accountability_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enriched = await Promise.all(
        (groupsData || []).map(async (g) => {
          const { count } = await supabase
            .from('accountability_group_members')
            .select('id', { count: 'exact', head: true })
            .eq('group_id', g.id);
          return { ...g, member_count: count || 0 };
        })
      );

      setGroups(enriched);

      const totalMembers = enriched.reduce((a, g) => a + g.member_count, 0);
      setStats({
        total: enriched.length,
        active: enriched.filter(g => g.member_count > 1).length,
        totalMembers,
        avgSize: enriched.length > 0 ? totalMembers / enriched.length : 0,
      });
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const dissolveGroup = async (groupId: string) => {
    try {
      await supabase.from('accountability_group_members').delete().eq('group_id', groupId);
      await supabase.from('accountability_groups').delete().eq('id', groupId);
      
      await supabase.from('system_audit_logs').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'group_dissolved',
        resource_type: 'accountability_group',
        resource_id: groupId,
      });

      toast.success('Group dissolved');
      fetchGroups();
    } catch (error) {
      toast.error('Failed to dissolve group');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Groups', value: stats.total, icon: Users, color: 'bg-primary/10 text-primary' },
          { label: 'Active Groups', value: stats.active, icon: UserCheck, color: 'bg-green-500/10 text-green-500' },
          { label: 'Total Members', value: stats.totalMembers, icon: TrendingUp, color: 'bg-blue-500/10 text-blue-500' },
          { label: 'Avg Size', value: stats.avgSize.toFixed(1), icon: Settings, color: 'bg-amber-500/10 text-amber-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.color.split(' ')[0]}`}>
                  <s.icon className={`h-5 w-5 ${s.color.split(' ')[1]}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Management
          </CardTitle>
          <CardDescription>Monitor and manage accountability groups</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Notification</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : groups.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">No groups found</TableCell></TableRow>
              ) : (
                groups.map(group => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-xs text-muted-foreground">{group.description || 'No description'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={group.member_count > 1 ? 'default' : 'secondary'}>
                        {group.member_count} members
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {group.can_view_shield_status && <Badge variant="outline" className="text-xs"><Shield className="h-3 w-3" /></Badge>}
                        {group.can_approve_unlock && <Badge variant="outline" className="text-xs">🔓</Badge>}
                        {group.can_send_encouragement && <Badge variant="outline" className="text-xs">💬</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{group.notification_level}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(group.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => dissolveGroup(group.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Abuse Prevention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Max group size', value: '10 members', desc: 'Prevent spam groups' },
            { label: 'Min account age to create', value: '7 days', desc: 'Require established accounts' },
            { label: 'Max groups per user', value: '3 groups', desc: 'Prevent abuse' },
          ].map(rule => (
            <div key={rule.label} className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">{rule.label}</p>
                <p className="text-xs text-muted-foreground">{rule.desc}</p>
              </div>
              <Badge variant="outline">{rule.value}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
