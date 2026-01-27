import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppMode } from '@/contexts/AppModeContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  Moon, Sun, Book, Dumbbell, Brain, Check, X,
  Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QuickEntryData {
  salahCompleted: boolean[];
  quranRead: boolean;
  exercised: boolean;
  overallMood: number;
}

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export default function QuickEntryWidget() {
  const { user } = useAuth();
  const { mode } = useAppMode();
  const [isExpanded, setIsExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<QuickEntryData>({
    salahCompleted: [false, false, false, false, false],
    quranRead: false,
    exercised: false,
    overallMood: 5,
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Check if entry exists
      const { data: existing } = await supabase
        .from('daily_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      const entryData = {
        fajr_completed: data.salahCompleted[0],
        fajr_on_time: data.salahCompleted[0],
        dhuhr_completed: data.salahCompleted[1],
        dhuhr_on_time: data.salahCompleted[1],
        asr_completed: data.salahCompleted[2],
        asr_on_time: data.salahCompleted[2],
        maghrib_completed: data.salahCompleted[3],
        maghrib_on_time: data.salahCompleted[3],
        isha_completed: data.salahCompleted[4],
        isha_on_time: data.salahCompleted[4],
        quran_read: data.quranRead,
        exercise_done: data.exercised,
        overall_day_rating: data.overallMood,
        task_status: 'complete_on_time',
      };

      if (existing?.id) {
        await supabase
          .from('daily_entries')
          .update({ ...entryData, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('daily_entries')
          .insert({
            ...entryData,
            user_id: user.id,
            date: today,
          });
      }

      toast.success('Quick entry saved!');
      setIsExpanded(false);
    } catch (error) {
      console.error('Error saving quick entry:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleSalah = (index: number) => {
    const newSalah = [...data.salahCompleted];
    newSalah[index] = !newSalah[index];
    setData({ ...data, salahCompleted: newSalah });
  };

  const completedCount = data.salahCompleted.filter(Boolean).length;
  const isIslamic = mode === 'islamic';

  if (!isExpanded) {
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          isIslamic ? "border-emerald-500/30" : "border-primary/30"
        )}
        onClick={() => setIsExpanded(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                isIslamic ? "bg-emerald-500/10" : "bg-primary/10"
              )}>
                {isIslamic ? (
                  <Moon className={cn("h-5 w-5", isIslamic ? "text-emerald-500" : "text-primary")} />
                ) : (
                  <Sun className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-medium">Quick Entry</p>
                <p className="text-xs text-muted-foreground">Tap to log today's data</p>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "animate-in slide-in-from-top-2",
      isIslamic ? "border-emerald-500/30" : "border-primary/30"
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isIslamic ? (
              <Moon className="h-5 w-5 text-emerald-500" />
            ) : (
              <Sun className="h-5 w-5 text-primary" />
            )}
            <span className="font-medium">Quick Entry</span>
            <Badge variant="outline" className="text-xs">
              {format(new Date(), 'MMM d')}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsExpanded(false)}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Salah Row */}
        {isIslamic && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Moon className="h-4 w-4 text-amber-500" />
                Salah ({completedCount}/5)
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {PRAYERS.map((prayer, idx) => (
                <button
                  key={prayer}
                  onClick={() => toggleSalah(idx)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                    data.salahCompleted[idx]
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600"
                      : "bg-muted/50 border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {data.salahCompleted[idx] ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4 opacity-40" />
                  )}
                  <span className="text-[10px] font-medium">{prayer.slice(0, 3)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick toggles */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setData({ ...data, quranRead: !data.quranRead })}
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg border transition-all",
              data.quranRead
                ? "bg-emerald-500/10 border-emerald-500/50"
                : "bg-muted/50 border-border hover:border-primary/50"
            )}
          >
            <Book className={cn(
              "h-4 w-4",
              data.quranRead ? "text-emerald-500" : "text-muted-foreground"
            )} />
            <span className="text-sm font-medium">
              {isIslamic ? "Qur'an" : "Reading"}
            </span>
            {data.quranRead && <Check className="h-4 w-4 text-emerald-500 ml-auto" />}
          </button>

          <button
            onClick={() => setData({ ...data, exercised: !data.exercised })}
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg border transition-all",
              data.exercised
                ? "bg-red-500/10 border-red-500/50"
                : "bg-muted/50 border-border hover:border-primary/50"
            )}
          >
            <Dumbbell className={cn(
              "h-4 w-4",
              data.exercised ? "text-red-500" : "text-muted-foreground"
            )} />
            <span className="text-sm font-medium">Exercise</span>
            {data.exercised && <Check className="h-4 w-4 text-red-500 ml-auto" />}
          </button>
        </div>

        {/* Mood slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-yellow-500" />
              Day Rating
            </span>
            <span className="text-sm font-bold text-primary">{data.overallMood}/10</span>
          </div>
          <Slider
            value={[data.overallMood]}
            onValueChange={([v]) => setData({ ...data, overallMood: v })}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
        </div>

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "w-full",
            isIslamic && "bg-emerald-600 hover:bg-emerald-700"
          )}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save Quick Entry
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
