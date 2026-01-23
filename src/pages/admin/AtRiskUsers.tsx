import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  Loader2, 
  User,
  Mail,
  MessageSquare,
  ChevronRight,
  Clock,
  TrendingDown,
  Send,
  Users
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Link } from 'react-router-dom';
import BatchEncouragementModal from '@/components/admin/BatchEncouragementModal';

interface AtRiskUser {
  user_id: string;
  full_name: string | null;
  app_mode: string | null;
  days_inactive: number;
  last_entry_date: string | null;
  last_score: number | null;
  declining: boolean;
}

export default function AtRiskUsers() {
  const [users, setUsers] = useState<AtRiskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  useEffect(() => {
    fetchAtRiskUsers();
  }, []);

  const fetchAtRiskUsers = async () => {
    try {
      const threeAgo = format(subDays(new Date(), 3), 'yyyy-MM-dd');

      // Get all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, app_mode');

      // Get recent entries
      const { data: recentEntries } = await supabase
        .from('daily_entries')
        .select('user_id, date')
        .gte('date', threeAgo);

      const activeUserIds = new Set(recentEntries?.map(e => e.user_id));
      const atRiskList: AtRiskUser[] = [];

      for (const profile of profiles || []) {
        if (!activeUserIds.has(profile.user_id)) {
          // Get last entry
          const { data: lastEntry } = await supabase
            .from('daily_entries')
            .select('date, weighted_daily_score')
            .eq('user_id', profile.user_id)
            .order('date', { ascending: false })
            .limit(1)
            .single();

          const daysInactive = lastEntry?.date 
            ? Math.floor((new Date().getTime() - new Date(lastEntry.date).getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          if (daysInactive >= 3) {
            // Check for declining trend
            const twoWeeksAgo = format(subDays(new Date(), 14), 'yyyy-MM-dd');
            const { data: recentScores } = await supabase
              .from('daily_entries')
              .select('weighted_daily_score')
              .eq('user_id', profile.user_id)
              .gte('date', twoWeeksAgo)
              .order('date', { ascending: true });

            let declining = false;
            if (recentScores && recentScores.length >= 5) {
              const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2));
              const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2));
              const avgFirst = firstHalf.reduce((s, e) => s + (e.weighted_daily_score || 0), 0) / firstHalf.length;
              const avgSecond = secondHalf.reduce((s, e) => s + (e.weighted_daily_score || 0), 0) / secondHalf.length;
              declining = avgSecond < avgFirst * 0.8;
            }

            atRiskList.push({
              user_id: profile.user_id,
              full_name: profile.full_name,
              app_mode: profile.app_mode,
              days_inactive: daysInactive,
              last_entry_date: lastEntry?.date || null,
              last_score: lastEntry?.weighted_daily_score || null,
              declining
            });
          }
        }
      }

      // Sort by days inactive
      atRiskList.sort((a, b) => b.days_inactive - a.days_inactive);
      setUsers(atRiskList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching at-risk users:', error);
      setLoading(false);
    }
  };

  const getSeverity = (days: number) => {
    if (days >= 14) return { label: 'Critical', variant: 'destructive' as const };
    if (days >= 7) return { label: 'High', variant: 'destructive' as const };
    return { label: 'Medium', variant: 'secondary' as const };
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.user_id)));
    }
  };

  const getSelectedUsersList = () => {
    return users.filter(u => selectedUsers.has(u.user_id));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-headline font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-7 w-7 text-destructive" />
              At-Risk Users
            </h1>
            <p className="text-body text-muted-foreground">
              Users who haven't logged data for 3+ days and may need support
            </p>
          </div>
          {selectedUsers.size > 0 && (
            <Button onClick={() => setShowBatchModal(true)} className="shrink-0">
              <Send className="h-4 w-4 mr-2" />
              Send to {selectedUsers.size} Selected
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-display font-bold text-destructive">{users.length}</p>
              <p className="text-caption text-muted-foreground">Total At-Risk</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-display font-bold text-orange-500">
                {users.filter(u => u.days_inactive >= 7).length}
              </p>
              <p className="text-caption text-muted-foreground">7+ Days Inactive</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-display font-bold text-red-600">
                {users.filter(u => u.declining).length}
              </p>
              <p className="text-caption text-muted-foreground">Declining Trend</p>
            </CardContent>
          </Card>
        </div>

        {/* User List */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-subtitle">At-Risk User List</CardTitle>
                <CardDescription className="text-caption">
                  Sorted by days inactive (highest first)
                </CardDescription>
              </div>
              {users.length > 0 && (
                <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                  <Users className="h-4 w-4 mr-2" />
                  {selectedUsers.size === users.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-subtitle font-semibold mb-2">All Users Active!</h3>
                <p className="text-body text-muted-foreground">
                  Great news! No users have been inactive for 3+ days.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => {
                  const severity = getSeverity(user.days_inactive);
                  const isSelected = selectedUsers.has(user.user_id);
                  return (
                    <div 
                      key={user.user_id} 
                      className={`flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors ${
                        isSelected ? 'border-primary/50 bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectUser(user.user_id)}
                          className="shrink-0"
                        />
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          severity.label === 'Critical' ? 'bg-red-500/10' : 
                          severity.label === 'High' ? 'bg-orange-500/10' : 'bg-yellow-500/10'
                        }`}>
                          <AlertTriangle className={`h-6 w-6 ${
                            severity.label === 'Critical' ? 'text-red-500' : 
                            severity.label === 'High' ? 'text-orange-500' : 'text-yellow-500'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-body">{user.full_name || `User ${user.user_id.slice(0, 6)}`}</p>
                            {user.declining && (
                              <Badge variant="outline" className="text-red-500 border-red-500">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                Declining
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-caption text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last: {user.last_entry_date ? format(new Date(user.last_entry_date), 'MMM d') : 'Never'}
                            </span>
                            <span>
                              {user.app_mode === 'islamic' ? '🌙' : '☀️'} {user.app_mode || 'Regular'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant={severity.variant}>
                          {user.days_inactive} days
                        </Badge>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/admin/feedback?user=${user.user_id}`}>
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Send
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/admin/users?id=${user.user_id}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Batch Encouragement Modal */}
      <BatchEncouragementModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        users={getSelectedUsersList()}
        onSuccess={() => {
          setSelectedUsers(new Set());
          fetchAtRiskUsers();
        }}
      />
    </AdminLayout>
  );
}
