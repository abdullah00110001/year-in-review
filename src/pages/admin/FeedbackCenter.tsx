import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Loader2, 
  User,
  Send,
  Search,
  Heart,
  AlertCircle,
  Lightbulb,
  Bell,
  Trash2,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface UserProfile {
  user_id: string;
  full_name: string | null;
}

interface FeedbackItem {
  id: string;
  user_id: string;
  user_name: string | null;
  message: string;
  feedback_type: string;
  date: string;
  is_private: boolean;
  created_at: string;
}

const feedbackTypes = [
  { value: 'encouragement', label: 'Encouragement', icon: Heart, color: 'text-pink-500' },
  { value: 'concern', label: 'Concern', icon: AlertCircle, color: 'text-orange-500' },
  { value: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-yellow-500' },
  { value: 'reminder', label: 'Reminder', icon: Bell, color: 'text-blue-500' },
];

export default function FeedbackCenter() {
  const { user: adminUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  const [newFeedback, setNewFeedback] = useState({
    message: '',
    type: 'encouragement',
    isPrivate: false
  });

  useEffect(() => {
    fetchUsers();
    fetchAllFeedback();
  }, []);

  useEffect(() => {
    const userId = searchParams.get('user');
    if (userId && users.length > 0) {
      const user = users.find(u => u.user_id === userId);
      if (user) {
        setSelectedUser(user);
        setShowComposer(true);
      }
    }
  }, [searchParams, users]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredUsers(users.filter(u => 
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .order('full_name');
    setUsers(data || []);
    setFilteredUsers(data || []);
  };

  const fetchAllFeedback = async () => {
    const { data: feedback } = await supabase
      .from('admin_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (feedback) {
      // Get user names
      const userIds = [...new Set(feedback.map(f => f.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]));

      setFeedbackHistory(feedback.map((f, idx) => ({
        ...f,
        // Use profile name, fallback to partial user_id
        user_name: profileMap.get(f.user_id) || `User ${f.user_id.slice(0, 8)}`
      })));
    }

    setLoading(false);
  };

  const sendFeedback = async () => {
    if (!selectedUser || !newFeedback.message.trim() || !adminUser) {
      toast.error('Please select a user and enter a message');
      return;
    }

    setSending(true);

    try {
      // Insert feedback
      const { error: feedbackError } = await supabase.from('admin_feedback').insert({
        user_id: selectedUser.user_id,
        admin_id: adminUser.id,
        message: newFeedback.message,
        feedback_type: newFeedback.type,
        is_private: newFeedback.isPrivate,
        date: format(new Date(), 'yyyy-MM-dd')
      });

      if (feedbackError) throw feedbackError;

      // Send notification to user (only if not private)
      if (!newFeedback.isPrivate) {
        const feedbackTypeLabels: Record<string, string> = {
          encouragement: '💚 Encouragement',
          concern: '💭 Concern',
          suggestion: '💡 Suggestion',
          reminder: '🔔 Reminder'
        };
        
        await supabase.from('notifications').insert({
          user_id: selectedUser.user_id,
          title: feedbackTypeLabels[newFeedback.type] || 'Admin Feedback',
          message: newFeedback.message,
          type: 'admin_feedback',
          metadata: { feedback_type: newFeedback.type }
        });
      }

      toast.success('Feedback sent successfully!');
      setNewFeedback({ message: '', type: 'encouragement', isPrivate: false });
      setSelectedUser(null);
      setShowComposer(false);
      fetchAllFeedback();
    } catch (error: any) {
      console.error('Error sending feedback:', error);
      toast.error(`Failed to send feedback: ${error?.message || 'Unknown error'}`);
    }

    setSending(false);
  };

  const deleteFeedback = async (id: string) => {
    const { error } = await supabase
      .from('admin_feedback')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete feedback');
    } else {
      toast.success('Feedback deleted');
      setFeedbackHistory(prev => prev.filter(f => f.id !== id));
    }
  };

  const getFeedbackIcon = (type: string) => {
    const found = feedbackTypes.find(t => t.value === type);
    if (!found) return MessageSquare;
    return found.icon;
  };

  const getFeedbackColor = (type: string) => {
    const found = feedbackTypes.find(t => t.value === type);
    return found?.color || 'text-muted-foreground';
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
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-headline font-bold tracking-tight">Feedback Center</h1>
            <p className="text-body text-muted-foreground">
              Send encouragement and guidance to users
            </p>
          </div>
          <Button onClick={() => setShowComposer(true)} className="gap-2">
            <Send className="h-4 w-4" />
            New Feedback
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {feedbackTypes.map(type => {
            const count = feedbackHistory.filter(f => f.feedback_type === type.value).length;
            const Icon = type.icon;
            return (
              <Card key={type.value}>
                <CardContent className="p-4 text-center">
                  <Icon className={cn('h-6 w-6 mx-auto mb-2', type.color)} />
                  <p className="text-title font-bold">{count}</p>
                  <p className="text-caption text-muted-foreground">{type.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feedback History */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-subtitle">Recent Feedback</CardTitle>
            <CardDescription className="text-caption">
              All feedback sent to users
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {feedbackHistory.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-subtitle font-semibold mb-2">No Feedback Yet</h3>
                <p className="text-body text-muted-foreground">
                  Start by sending encouragement to your users
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbackHistory.map((feedback) => {
                  const Icon = getFeedbackIcon(feedback.feedback_type);
                  return (
                    <div key={feedback.id} className="p-4 rounded-xl border bg-card">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'h-10 w-10 rounded-full flex items-center justify-center bg-muted',
                          )}>
                            <Icon className={cn('h-5 w-5', getFeedbackColor(feedback.feedback_type))} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-body">{feedback.user_name}</span>
                              <Badge variant="outline" className="capitalize">
                                {feedback.feedback_type}
                              </Badge>
                              {feedback.is_private && (
                                <Badge variant="secondary">Private</Badge>
                              )}
                            </div>
                            <p className="text-body text-foreground">{feedback.message}</p>
                            <p className="text-caption text-muted-foreground mt-2 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(feedback.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteFeedback(feedback.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compose Dialog */}
        <Dialog open={showComposer} onOpenChange={setShowComposer}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-title">Send Feedback</DialogTitle>
              <DialogDescription className="text-caption">
                Write a personalized message to help the user on their journey
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* User Search */}
              <div className="space-y-2">
                <Label>Select User</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {searchQuery && (
                  <div className="max-h-32 overflow-y-auto border rounded-lg">
                    {filteredUsers.slice(0, 5).map(user => (
                      <button
                        key={user.user_id}
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center gap-2 p-2 hover:bg-muted text-left"
                      >
                        <User className="h-4 w-4" />
                        {user.full_name || `User ${user.user_id.slice(0, 8)}`}
                      </button>
                    ))}
                  </div>
                )}
                {selectedUser && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedUser.full_name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto h-6"
                      onClick={() => setSelectedUser(null)}
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>

              {/* Feedback Type */}
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={newFeedback.type} 
                  onValueChange={(v) => setNewFeedback(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {feedbackTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <Icon className={cn('h-4 w-4', type.color)} />
                            {type.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Write your feedback here..."
                  value={newFeedback.message}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Private Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={newFeedback.isPrivate}
                  onChange={(e) => setNewFeedback(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="private" className="text-caption">
                  Private note (only visible to admins)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowComposer(false)}>
                Cancel
              </Button>
              <Button onClick={sendFeedback} disabled={sending || !selectedUser}>
                {sending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Send className="h-4 w-4 mr-2" />
                Send Feedback
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
