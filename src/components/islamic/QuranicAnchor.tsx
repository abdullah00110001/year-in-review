import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { BookOpen, Heart, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const moods = [
  { value: 'anxious', label: 'Anxious 😰', color: 'bg-amber-100 text-amber-800' },
  { value: 'angry', label: 'Angry 😠', color: 'bg-rose-100 text-rose-800' },
  { value: 'lazy', label: 'Lazy 😴', color: 'bg-blue-100 text-blue-800' },
  { value: 'sad', label: 'Sad 😢', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'hopeless', label: 'Hopeless 💔', color: 'bg-purple-100 text-purple-800' },
  { value: 'grateful', label: 'Grateful 🤲', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'fearful', label: 'Fearful 😨', color: 'bg-slate-100 text-slate-800' },
  { value: 'distracted', label: 'Distracted 🌀', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'proud', label: 'Proud 👑', color: 'bg-orange-100 text-orange-800' },
  { value: 'overwhelmed', label: 'Overwhelmed 😵', color: 'bg-pink-100 text-pink-800' },
];

interface QuranicAnchor {
  id: string;
  mood: string;
  surah_name: string;
  surah_number: number;
  ayah_start: number;
  ayah_end: number;
  english_translation: string;
  benefit: string;
}

interface QuranicAnchorProps {
  onFeedback?: (moodShifted: boolean) => void;
}

export default function QuranicAnchorSystem({ onFeedback }: QuranicAnchorProps) {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [anchor, setAnchor] = useState<QuranicAnchor | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const fetchAnchor = async (mood: string) => {
    setLoading(true);
    setFeedbackGiven(false);
    
    try {
      const { data, error } = await supabase
        .from('quranic_anchors')
        .select('*')
        .eq('mood', mood)
        .limit(1)
        .single();

      if (error) throw error;
      setAnchor(data);
    } catch (error) {
      console.error('Error fetching Quranic anchor:', error);
      setAnchor(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    fetchAnchor(mood);
  };

  const handleFeedback = (shifted: boolean) => {
    setFeedbackGiven(true);
    onFeedback?.(shifted);
  };

  const handleReset = () => {
    setSelectedMood('');
    setAnchor(null);
    setFeedbackGiven(false);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-500" />
            Quranic Anchor System
          </CardTitle>
          {selectedMood && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>Map your emotions to healing verses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedMood ? (
          <>
            <p className="text-sm text-center text-muted-foreground">
              How are you feeling right now?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {moods.map(mood => (
                <Button
                  key={mood.value}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-xs h-9",
                    selectedMood === mood.value && mood.color
                  )}
                  onClick={() => handleMoodSelect(mood.value)}
                >
                  {mood.label}
                </Button>
              ))}
            </div>
          </>
        ) : loading ? (
          <div className="py-8 text-center">
            <RefreshCw className="h-6 w-6 mx-auto animate-spin text-emerald-500" />
            <p className="text-sm text-muted-foreground mt-2">Finding healing words...</p>
          </div>
        ) : anchor ? (
          <div className="space-y-4">
            {/* Selected Mood Badge */}
            <div className="flex justify-center">
              <Badge className={cn("text-xs", moods.find(m => m.value === selectedMood)?.color)}>
                {moods.find(m => m.value === selectedMood)?.label}
              </Badge>
            </div>

            {/* Surah Reference */}
            <div className="text-center">
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {anchor.surah_name} ({anchor.surah_number}:{anchor.ayah_start}
                {anchor.ayah_end !== anchor.ayah_start && `-${anchor.ayah_end}`})
              </p>
            </div>

            {/* Ayah Content */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm italic leading-relaxed text-emerald-900 dark:text-emerald-100">
                "{anchor.english_translation}"
              </p>
            </div>

            {/* Benefit */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                <Heart className="h-3 w-3 inline mr-1 text-rose-500" />
                {anchor.benefit}
              </p>
            </div>

            {/* Feedback */}
            {!feedbackGiven ? (
              <div className="space-y-2">
                <p className="text-sm text-center font-medium">
                  Did this shift your state?
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => handleFeedback(true)}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Yes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-300 text-rose-600 hover:bg-rose-50"
                    onClick={() => handleFeedback(false)}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    No
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Thank you for your feedback! May Allah grant you peace. 🤲
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">No anchor found for this mood.</p>
            <Button variant="link" onClick={handleReset}>Try another mood</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
