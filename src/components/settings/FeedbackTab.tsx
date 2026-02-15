import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { MessageSquare, Send, Bug, Lightbulb, ThumbsUp, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';

interface Feedback {
  id: string;
  feedback_type: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
}

const typeIcons: Record<string, any> = {
  bug: Bug,
  suggestion: Lightbulb,
  complaint: AlertCircle,
  praise: ThumbsUp,
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  dismissed: 'bg-muted text-muted-foreground',
};

export default function FeedbackTab() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) fetchFeedbacks();
  }, [user]);

  const fetchFeedbacks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setFeedbacks((data as any[]) || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !subject.trim() || !message.trim()) {
      toast.error(language === 'bn' ? 'সব ফিল্ড পূরণ করুন' : 'Please fill all fields');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('user_feedback').insert({
      user_id: user.id,
      feedback_type: feedbackType,
      subject: subject.trim(),
      message: message.trim(),
    });
    if (error) {
      toast.error(language === 'bn' ? 'ফিডব্যাক পাঠাতে ব্যর্থ' : 'Failed to send feedback');
    } else {
      toast.success(language === 'bn' ? 'ফিডব্যাক পাঠানো হয়েছে!' : 'Feedback sent successfully!');
      setSubject('');
      setMessage('');
      fetchFeedbacks();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Submit Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {language === 'bn' ? 'ফিডব্যাক পাঠান' : 'Send Feedback'}
          </CardTitle>
          <CardDescription>
            {language === 'bn' ? 'আপনার সমস্যা, পরামর্শ বা উপদেশ জানান' : 'Share your issues, suggestions, or praise'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{language === 'bn' ? 'ধরন' : 'Type'}</Label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">{language === 'bn' ? '🐛 বাগ রিপোর্ট' : '🐛 Bug Report'}</SelectItem>
                <SelectItem value="suggestion">{language === 'bn' ? '💡 পরামর্শ' : '💡 Suggestion'}</SelectItem>
                <SelectItem value="complaint">{language === 'bn' ? '⚠️ অভিযোগ' : '⚠️ Complaint'}</SelectItem>
                <SelectItem value="praise">{language === 'bn' ? '👍 প্রশংসা' : '👍 Praise'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{language === 'bn' ? 'বিষয়' : 'Subject'}</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={language === 'bn' ? 'সংক্ষেপে বিষয় লিখুন' : 'Brief subject'} />
          </div>
          <div className="space-y-2">
            <Label>{language === 'bn' ? 'বিস্তারিত' : 'Details'}</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={language === 'bn' ? 'বিস্তারিত লিখুন...' : 'Write details...'} rows={4} />
          </div>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {language === 'bn' ? 'পাঠান' : 'Submit'}
          </Button>
        </CardContent>
      </Card>

      {/* Previous Feedbacks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{language === 'bn' ? 'আপনার ফিডব্যাক' : 'Your Feedbacks'}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : feedbacks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{language === 'bn' ? 'এখনও কোন ফিডব্যাক নেই' : 'No feedback yet'}</p>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((fb) => {
                const Icon = typeIcons[fb.feedback_type] || MessageSquare;
                return (
                  <div key={fb.id} className="p-3 rounded-xl bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{fb.subject}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[fb.status]}`}>
                        {fb.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{fb.message}</p>
                    {fb.admin_reply && (
                      <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                        <p className="text-xs font-medium text-primary">{language === 'bn' ? 'এডমিন উত্তর:' : 'Admin Reply:'}</p>
                        <p className="text-xs mt-1">{fb.admin_reply}</p>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground">{new Date(fb.created_at).toLocaleDateString()}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
