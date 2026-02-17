import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Rocket, Send, Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface AppUpdate {
  id: string;
  version: string;
  title: string;
  description: string;
  update_type: string;
  is_mandatory: boolean;
  download_url: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminAppUpdates() {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newUpdate, setNewUpdate] = useState({
    version: '',
    title: '',
    description: '',
    update_type: 'feature',
    is_mandatory: false,
    download_url: '',
  });

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('*')
      .eq('key', 'app_updates')
      .maybeSingle();

    if (data?.value) {
      setUpdates((data.value as any).updates || []);
    }
    setLoading(false);
  };

  const pushUpdate = async () => {
    if (!newUpdate.version || !newUpdate.title || !newUpdate.description) {
      toast.error('Please fill version, title, and description');
      return;
    }
    setSaving(true);

    const update: AppUpdate = {
      id: crypto.randomUUID(),
      ...newUpdate,
      download_url: newUpdate.download_url || null,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const updatedList = [update, ...updates];

    const { error } = await supabase
      .from('app_settings')
      .upsert({
        key: 'app_updates',
        value: { updates: updatedList, latest_version: newUpdate.version } as any,
        updated_by: user?.id,
      }, { onConflict: 'key' });

    if (error) {
      toast.error('Failed to push update');
    } else {
      // Send notification to all users about the update
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('user_id');

      if (allUsers) {
        const notifications = allUsers.map(u => ({
          user_id: u.user_id,
          title: `🚀 App Update v${newUpdate.version}`,
          message: `${newUpdate.title}: ${newUpdate.description.slice(0, 100)}`,
          type: 'app_update',
          metadata: { version: newUpdate.version, mandatory: newUpdate.is_mandatory },
        }));

        // Insert in batches of 50
        for (let i = 0; i < notifications.length; i += 50) {
          await supabase.from('notifications').insert(notifications.slice(i, i + 50));
        }
      }

      toast.success(`Update v${newUpdate.version} pushed to all users!`);
      setUpdates(updatedList);
      setNewUpdate({ version: '', title: '', description: '', update_type: 'feature', is_mandatory: false, download_url: '' });
    }
    setSaving(false);
  };

  const toggleUpdate = async (id: string) => {
    const updatedList = updates.map(u => 
      u.id === id ? { ...u, is_active: !u.is_active } : u
    );
    
    await supabase
      .from('app_settings')
      .upsert({
        key: 'app_updates',
        value: { updates: updatedList, latest_version: updatedList.find(u => u.is_active)?.version || '' } as any,
        updated_by: user?.id,
      }, { onConflict: 'key' });

    setUpdates(updatedList);
    toast.success('Update status changed');
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Push New Update */}
      <Card>
        <CardHeader>
          <CardTitle className="text-subtitle flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Push App Update
          </CardTitle>
          <CardDescription className="text-caption">
            Create and push a new update notification to all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Version</Label>
              <Input placeholder="e.g. 2.1.0" value={newUpdate.version} onChange={e => setNewUpdate(p => ({ ...p, version: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Update Type</Label>
              <Select value={newUpdate.update_type} onValueChange={v => setNewUpdate(p => ({ ...p, update_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">✨ Feature</SelectItem>
                  <SelectItem value="bugfix">🐛 Bug Fix</SelectItem>
                  <SelectItem value="security">🔒 Security</SelectItem>
                  <SelectItem value="performance">⚡ Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="What's new in this update?" value={newUpdate.title} onChange={e => setNewUpdate(p => ({ ...p, title: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="Describe the changes..." rows={3} value={newUpdate.description} onChange={e => setNewUpdate(p => ({ ...p, description: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Download URL (optional)</Label>
            <Input placeholder="https://play.google.com/..." value={newUpdate.download_url} onChange={e => setNewUpdate(p => ({ ...p, download_url: e.target.value }))} />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={newUpdate.is_mandatory} onCheckedChange={v => setNewUpdate(p => ({ ...p, is_mandatory: v }))} />
            <Label>Mandatory Update</Label>
          </div>

          <Button onClick={pushUpdate} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Push Update to All Users
          </Button>
        </CardContent>
      </Card>

      {/* Update History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-subtitle">Update History</CardTitle>
          <CardDescription className="text-caption">{updates.length} updates pushed</CardDescription>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No updates pushed yet</p>
          ) : (
            <div className="space-y-3">
              {updates.map(update => (
                <div key={update.id} className="p-4 rounded-xl border bg-card flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline">v{update.version}</Badge>
                      <Badge variant="secondary" className="capitalize">{update.update_type}</Badge>
                      {update.is_mandatory && <Badge variant="destructive">Mandatory</Badge>}
                      {update.is_active ? (
                        <Badge className="bg-green-500/10 text-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>
                      ) : (
                        <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Inactive</Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm">{update.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{update.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {format(new Date(update.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <Switch checked={update.is_active} onCheckedChange={() => toggleUpdate(update.id)} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
