import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import HabitFrictionSystem from '@/components/insights/HabitFrictionSystem';
import { 
  BookOpen, Clock, Dumbbell, Moon, Brain, Target, Smartphone,
  CheckCircle2, AlertTriangle, Save, Lock
} from 'lucide-react';

interface DailyEntry {
  id?: string;
  date: string;
  focused_study_minutes: number;
  revision_minutes: number;
  skill_learning_minutes: number;
  fajr_completed: boolean;
  fajr_on_time: boolean;
  dhuhr_completed: boolean;
  dhuhr_on_time: boolean;
  asr_completed: boolean;
  asr_on_time: boolean;
  maghrib_completed: boolean;
  maghrib_on_time: boolean;
  isha_completed: boolean;
  isha_on_time: boolean;
  khushu_level: number;
  quran_read: boolean;
  quran_surah: string;
  quran_ayah_from: number;
  quran_ayah_to: number;
  quran_type: string;
  quran_minutes: number;
  device_time_minutes: number;
  social_media_minutes: number;
  shorts_reels_minutes: number;
  exercise_done: boolean;
  exercise_type: string;
  exercise_intensity: string;
  exercise_duration_minutes: number;
  sleep_duration_minutes: number;
  sleep_quality: number;
  energy_level: number;
  focus_level: number;
  discipline_level: number;
  overall_day_rating: number;
  task_status: string;
  mental_state: string;
  most_important_task: string;
  biggest_time_leak: string;
  regret_of_day: string;
  free_reflection: string;
  is_locked: boolean;
}

const defaultEntry: Omit<DailyEntry, 'date'> = {
  focused_study_minutes: 0,
  revision_minutes: 0,
  skill_learning_minutes: 0,
  fajr_completed: false,
  fajr_on_time: false,
  dhuhr_completed: false,
  dhuhr_on_time: false,
  asr_completed: false,
  asr_on_time: false,
  maghrib_completed: false,
  maghrib_on_time: false,
  isha_completed: false,
  isha_on_time: false,
  khushu_level: 3,
  quran_read: false,
  quran_surah: '',
  quran_ayah_from: 0,
  quran_ayah_to: 0,
  quran_type: 'reading',
  quran_minutes: 0,
  device_time_minutes: 0,
  social_media_minutes: 0,
  shorts_reels_minutes: 0,
  exercise_done: false,
  exercise_type: '',
  exercise_intensity: 'medium',
  exercise_duration_minutes: 0,
  sleep_duration_minutes: 420,
  sleep_quality: 3,
  energy_level: 3,
  focus_level: 3,
  discipline_level: 3,
  overall_day_rating: 5,
  task_status: 'not_submitted',
  mental_state: 'calm',
  most_important_task: '',
  biggest_time_leak: '',
  regret_of_day: '',
  free_reflection: '',
  is_locked: false,
};

const SALAH_PRAYERS = [
  { key: 'fajr', name: 'Fajr', namebn: 'ফজর' },
  { key: 'dhuhr', name: 'Dhuhr', namebn: 'যোহর' },
  { key: 'asr', name: 'Asr', namebn: 'আসর' },
  { key: 'maghrib', name: 'Maghrib', namebn: 'মাগরিব' },
  { key: 'isha', name: 'Isha', namebn: 'ইশা' },
];

export default function DailyInput() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entry, setEntry] = useState<DailyEntry>({ ...defaultEntry, date: selectedDate });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchEntry();
  }, [user, selectedDate]);

  const fetchEntry = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', selectedDate)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setEntry(data as DailyEntry);
      } else {
        setEntry({ ...defaultEntry, date: selectedDate });
      }
    } catch (error) {
      console.error('Error fetching entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || entry.is_locked) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('daily_entries')
        .upsert({
          ...entry,
          user_id: user.id,
          date: selectedDate,
        }, { onConflict: 'user_id,date' });

      if (error) throw error;
      toast.success('Entry saved successfully!');
      await updateScores();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const updateScores = async () => {
    if (!user) return;
    
    const salahCount = [
      entry.fajr_completed, entry.dhuhr_completed, entry.asr_completed,
      entry.maghrib_completed, entry.isha_completed
    ].filter(Boolean).length;

    const deenScore = Math.round((salahCount / 5 * 50) + (entry.quran_read ? 30 : 0) + (entry.khushu_level || 0) * 4);
    const disciplineScore = Math.round(((entry.discipline_level || 0) * 20) + ((entry.focus_level || 0) * 10) - (entry.device_time_minutes / 10));
    const focusScore = Math.round((entry.focused_study_minutes / 3) + ((entry.focus_level || 0) * 15));
    const productivityScore = Math.round((entry.overall_day_rating || 0) * 10);

    await supabase
      .from('user_scores')
      .upsert({
        user_id: user.id,
        date: selectedDate,
        deen_score: Math.max(0, Math.min(100, deenScore)),
        discipline_score: Math.max(0, Math.min(100, disciplineScore)),
        focus_score: Math.max(0, Math.min(100, focusScore)),
        productivity_score: Math.max(0, Math.min(100, productivityScore)),
      }, { onConflict: 'user_id,date' });
  };

  const formatMinutesToTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Daily Life Input</h1>
            <p className="text-sm text-muted-foreground">Track your day mindfully</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 sm:flex-none sm:w-40"
              max={format(new Date(), 'yyyy-MM-dd')}
            />
            {entry.is_locked && (
              <div className="flex items-center gap-1 text-amber-600 shrink-0">
                <Lock className="h-4 w-4" />
                <span className="text-sm hidden sm:inline">Locked</span>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="study" className="w-full">
          <TabsList className="w-full h-auto flex-wrap grid grid-cols-4 sm:grid-cols-7 gap-1">
            <TabsTrigger value="study" className="text-[10px] sm:text-xs px-2 py-1.5">📚 Study</TabsTrigger>
            <TabsTrigger value="salah" className="text-[10px] sm:text-xs px-2 py-1.5">🕌 Salah</TabsTrigger>
            <TabsTrigger value="quran" className="text-[10px] sm:text-xs px-2 py-1.5">📖 Qur'an</TabsTrigger>
            <TabsTrigger value="digital" className="text-[10px] sm:text-xs px-2 py-1.5">📱 Digital</TabsTrigger>
            <TabsTrigger value="health" className="text-[10px] sm:text-xs px-2 py-1.5">🏃 Health</TabsTrigger>
            <TabsTrigger value="energy" className="text-[10px] sm:text-xs px-2 py-1.5">😴 Energy</TabsTrigger>
            <TabsTrigger value="reflect" className="text-[10px] sm:text-xs px-2 py-1.5">🧠 Reflect</TabsTrigger>
          </TabsList>

          {/* Study Time Tab */}
          <TabsContent value="study">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Study Time Tracker
                </CardTitle>
                <CardDescription>Log your focused learning hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Focused Study (minutes)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={entry.focused_study_minutes}
                      onChange={(e) => setEntry({ ...entry, focused_study_minutes: parseInt(e.target.value) || 0 })}
                      disabled={entry.is_locked}
                    />
                    <p className="text-xs text-muted-foreground">{formatMinutesToTime(entry.focused_study_minutes)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Revision (minutes)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={entry.revision_minutes}
                      onChange={(e) => setEntry({ ...entry, revision_minutes: parseInt(e.target.value) || 0 })}
                      disabled={entry.is_locked}
                    />
                    <p className="text-xs text-muted-foreground">{formatMinutesToTime(entry.revision_minutes)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Skill Learning (minutes)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={entry.skill_learning_minutes}
                      onChange={(e) => setEntry({ ...entry, skill_learning_minutes: parseInt(e.target.value) || 0 })}
                      disabled={entry.is_locked}
                    />
                    <p className="text-xs text-muted-foreground">{formatMinutesToTime(entry.skill_learning_minutes)}</p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium">Total Study Time Today</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatMinutesToTime(entry.focused_study_minutes + entry.revision_minutes + entry.skill_learning_minutes)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Salah Tab */}
          <TabsContent value="salah">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🕌 Salah Tracker
                </CardTitle>
                <CardDescription>Track your daily prayers with quality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  {SALAH_PRAYERS.map((prayer) => (
                    <div key={prayer.key} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{prayer.name}</span>
                        <span className="text-muted-foreground text-sm">({prayer.namebn})</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={entry[`${prayer.key}_completed` as keyof DailyEntry] as boolean}
                            onCheckedChange={(checked) => 
                              setEntry({ ...entry, [`${prayer.key}_completed`]: checked })
                            }
                            disabled={entry.is_locked}
                          />
                          <span className="text-sm">Prayed</span>
                        </div>
                        {entry[`${prayer.key}_completed` as keyof DailyEntry] && (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={entry[`${prayer.key}_on_time` as keyof DailyEntry] as boolean}
                              onCheckedChange={(checked) => 
                                setEntry({ ...entry, [`${prayer.key}_on_time`]: checked })
                              }
                              disabled={entry.is_locked}
                            />
                            <span className="text-sm">On Time</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>Khushu Level (Concentration): {entry.khushu_level}</Label>
                  <Slider
                    value={[entry.khushu_level]}
                    onValueChange={([value]) => setEntry({ ...entry, khushu_level: value })}
                    min={1}
                    max={5}
                    step={1}
                    disabled={entry.is_locked}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Distracted</span>
                    <span>Very Focused</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quran Tab */}
          <TabsContent value="quran">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Qur'an Engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={entry.quran_read}
                    onCheckedChange={(checked) => setEntry({ ...entry, quran_read: checked })}
                    disabled={entry.is_locked}
                  />
                  <Label>Did you engage with Qur'an today?</Label>
                </div>
                {entry.quran_read && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Surah Name</Label>
                      <Input
                        value={entry.quran_surah}
                        onChange={(e) => setEntry({ ...entry, quran_surah: e.target.value })}
                        placeholder="e.g., Al-Baqarah"
                        disabled={entry.is_locked}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={entry.quran_type}
                        onValueChange={(value) => setEntry({ ...entry, quran_type: value })}
                        disabled={entry.is_locked}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reading">Reading</SelectItem>
                          <SelectItem value="memorization">Memorization</SelectItem>
                          <SelectItem value="tafsir">Tafsir Study</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>Ayah From</Label>
                        <Input
                          type="number"
                          min={1}
                          value={entry.quran_ayah_from || ''}
                          onChange={(e) => setEntry({ ...entry, quran_ayah_from: parseInt(e.target.value) || 0 })}
                          disabled={entry.is_locked}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ayah To</Label>
                        <Input
                          type="number"
                          min={1}
                          value={entry.quran_ayah_to || ''}
                          onChange={(e) => setEntry({ ...entry, quran_ayah_to: parseInt(e.target.value) || 0 })}
                          disabled={entry.is_locked}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Time Spent (minutes)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={entry.quran_minutes}
                        onChange={(e) => setEntry({ ...entry, quran_minutes: parseInt(e.target.value) || 0 })}
                        disabled={entry.is_locked}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Digital Usage Tab */}
          <TabsContent value="digital">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-destructive" />
                  Digital Usage
                </CardTitle>
                <CardDescription>Be honest with your screen time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Total Device Time (minutes)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={entry.device_time_minutes}
                      onChange={(e) => setEntry({ ...entry, device_time_minutes: parseInt(e.target.value) || 0 })}
                      disabled={entry.is_locked}
                    />
                    <p className="text-xs text-muted-foreground">{formatMinutesToTime(entry.device_time_minutes)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Social Media (minutes)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={entry.social_media_minutes}
                      onChange={(e) => setEntry({ ...entry, social_media_minutes: parseInt(e.target.value) || 0 })}
                      disabled={entry.is_locked}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shorts/Reels/YouTube (minutes)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={entry.shorts_reels_minutes}
                      onChange={(e) => setEntry({ ...entry, shorts_reels_minutes: parseInt(e.target.value) || 0 })}
                      disabled={entry.is_locked}
                    />
                  </div>
                </div>
                {entry.device_time_minutes > 180 && (
                  <HabitFrictionSystem 
                    type="warning"
                    trigger="high_device"
                    value={entry.device_time_minutes}
                    onDismiss={() => {}}
                  />
                )}
                {entry.device_time_minutes <= 120 && entry.device_time_minutes > 0 && (
                  <HabitFrictionSystem 
                    type="positive"
                    trigger="good_habit_complete"
                    onDismiss={() => {}}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  Physical Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={entry.exercise_done}
                    onCheckedChange={(checked) => setEntry({ ...entry, exercise_done: checked })}
                    disabled={entry.is_locked}
                  />
                  <Label>Did you exercise today?</Label>
                </div>
                {entry.exercise_done && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Exercise Type</Label>
                      <Input
                        value={entry.exercise_type}
                        onChange={(e) => setEntry({ ...entry, exercise_type: e.target.value })}
                        placeholder="e.g., Running, Gym, Yoga"
                        disabled={entry.is_locked}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Intensity</Label>
                      <Select
                        value={entry.exercise_intensity}
                        onValueChange={(value) => setEntry({ ...entry, exercise_intensity: value })}
                        disabled={entry.is_locked}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={entry.exercise_duration_minutes}
                        onChange={(e) => setEntry({ ...entry, exercise_duration_minutes: parseInt(e.target.value) || 0 })}
                        disabled={entry.is_locked}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Energy Tab */}
          <TabsContent value="energy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-primary" />
                  Sleep & Energy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Sleep Duration (hours)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      step={0.5}
                      value={(entry.sleep_duration_minutes / 60).toFixed(1)}
                      onChange={(e) => setEntry({ ...entry, sleep_duration_minutes: Math.round(parseFloat(e.target.value) * 60) || 0 })}
                      disabled={entry.is_locked}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sleep Quality: {entry.sleep_quality}/5</Label>
                    <Slider
                      value={[entry.sleep_quality]}
                      onValueChange={([value]) => setEntry({ ...entry, sleep_quality: value })}
                      min={1}
                      max={5}
                      step={1}
                      disabled={entry.is_locked}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Energy Level Today: {entry.energy_level}/5</Label>
                  <Slider
                    value={[entry.energy_level]}
                    onValueChange={([value]) => setEntry({ ...entry, energy_level: value })}
                    min={1}
                    max={5}
                    step={1}
                    disabled={entry.is_locked}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Very Tired</span>
                    <span>Full Energy</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reflection Tab */}
          <TabsContent value="reflect">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-accent" />
                  Self-Awareness & Reflection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Mental State</Label>
                    <Select
                      value={entry.mental_state}
                      onValueChange={(value) => setEntry({ ...entry, mental_state: value })}
                      disabled={entry.is_locked}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="calm">😌 Calm</SelectItem>
                        <SelectItem value="motivated">🔥 Motivated</SelectItem>
                        <SelectItem value="distracted">😵 Distracted</SelectItem>
                        <SelectItem value="stressed">😰 Stressed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Task Status</Label>
                    <Select
                      value={entry.task_status}
                      onValueChange={(value) => setEntry({ ...entry, task_status: value })}
                      disabled={entry.is_locked}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complete_on_time">✅ Complete (On Time)</SelectItem>
                        <SelectItem value="complete_late">⏰ Complete (Late)</SelectItem>
                        <SelectItem value="incomplete">❌ Incomplete</SelectItem>
                        <SelectItem value="not_submitted">📝 Not Submitted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Focus Level: {entry.focus_level}/5</Label>
                    <Slider
                      value={[entry.focus_level]}
                      onValueChange={([value]) => setEntry({ ...entry, focus_level: value })}
                      min={1}
                      max={5}
                      step={1}
                      disabled={entry.is_locked}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discipline Level: {entry.discipline_level}/5</Label>
                    <Slider
                      value={[entry.discipline_level]}
                      onValueChange={([value]) => setEntry({ ...entry, discipline_level: value })}
                      min={1}
                      max={5}
                      step={1}
                      disabled={entry.is_locked}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Overall Day Rating: {entry.overall_day_rating}/10</Label>
                  <Slider
                    value={[entry.overall_day_rating]}
                    onValueChange={([value]) => setEntry({ ...entry, overall_day_rating: value })}
                    min={1}
                    max={10}
                    step={1}
                    disabled={entry.is_locked}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Most Important Task (MIT)
                  </Label>
                  <Input
                    value={entry.most_important_task}
                    onChange={(e) => setEntry({ ...entry, most_important_task: e.target.value })}
                    placeholder="What was your ONE most important task today?"
                    disabled={entry.is_locked}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Biggest Time Leak
                  </Label>
                  <Input
                    value={entry.biggest_time_leak}
                    onChange={(e) => setEntry({ ...entry, biggest_time_leak: e.target.value })}
                    placeholder="What wasted your time the most?"
                    disabled={entry.is_locked}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Regret of the Day</Label>
                  <Input
                    value={entry.regret_of_day}
                    onChange={(e) => setEntry({ ...entry, regret_of_day: e.target.value })}
                    placeholder="What should you NOT have done?"
                    disabled={entry.is_locked}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Free Reflection Notes</Label>
                  <Textarea
                    value={entry.free_reflection}
                    onChange={(e) => setEntry({ ...entry, free_reflection: e.target.value })}
                    placeholder="Any other thoughts about your day..."
                    rows={4}
                    disabled={entry.is_locked}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-auto z-50">
          <Button 
            onClick={handleSave} 
            disabled={saving || entry.is_locked}
            className="w-full sm:w-auto shadow-lg"
            size="lg"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Entry
              </>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}