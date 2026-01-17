import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Heart, 
  AlertCircle, 
  Lightbulb, 
  Bell,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';

interface AdminFeedback {
  id: string;
  message: string;
  feedback_type: string;
  created_at: string;
  date: string;
}

const feedbackIcons: Record<string, React.ReactNode> = {
  encouragement: <Heart className="h-4 w-4 text-pink-500" />,
  concern: <AlertCircle className="h-4 w-4 text-orange-500" />,
  suggestion: <Lightbulb className="h-4 w-4 text-yellow-500" />,
  reminder: <Bell className="h-4 w-4 text-blue-500" />,
};

const feedbackColors: Record<string, string> = {
  encouragement: 'bg-pink-500/10 border-pink-500/20',
  concern: 'bg-orange-500/10 border-orange-500/20',
  suggestion: 'bg-yellow-500/10 border-yellow-500/20',
  reminder: 'bg-blue-500/10 border-blue-500/20',
};

const feedbackLabels: Record<string, string> = {
  encouragement: 'Encouragement',
  concern: 'Check-in',
  suggestion: 'Suggestion',
  reminder: 'Reminder',
};

export default function AdminFeedbackNotifications() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<AdminFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchFeedback();
    }
  }, [user]);

  const fetchFeedback = async () => {
    try {
      // Get feedback from last 30 days that isn't private
      const { data, error } = await supabase
        .from('admin_feedback')
        .select('id, message, feedback_type, created_at, date')
        .eq('user_id', user!.id)
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const visibleFeedback = feedback.filter(f => !dismissed.has(f.id));

  if (loading || visibleFeedback.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4 sm:mb-6 border-2 border-primary/20 bg-primary/5">
      <CardHeader className="p-3 sm:p-4 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-primary/10">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-body font-medium">
              Messages from Your Mentor
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {visibleFeedback.length} new
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="p-3 sm:p-4 pt-3">
          <div className="space-y-2">
            {visibleFeedback.map((item) => (
              <div 
                key={item.id}
                className={`relative p-3 rounded-lg border ${feedbackColors[item.feedback_type] || 'bg-muted/50'}`}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-60 hover:opacity-100"
                  onClick={() => handleDismiss(item.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
                
                <div className="flex items-start gap-2 pr-6">
                  <div className="mt-0.5">
                    {feedbackIcons[item.feedback_type] || <MessageSquare className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {feedbackLabels[item.feedback_type] || 'Message'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
