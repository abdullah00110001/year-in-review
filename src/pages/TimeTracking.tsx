import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { Clock, Plus, TrendingUp, Calendar, Play, Pause, Square } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import NiyyahValidator from "@/components/islamic/NiyyahValidator";

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  activity: string;
  notes: string | null;
}

const ACTIVITIES = [
  { value: "study", labelEn: "Study", labelBn: "পড়াশোনা" },
  { value: "exercise", labelEn: "Exercise", labelBn: "ব্যায়াম" },
  { value: "reading", labelEn: "Reading", labelBn: "বই পড়া" },
  { value: "meditation", labelEn: "Meditation", labelBn: "মেডিটেশন" },
  { value: "skill_dev", labelEn: "Skill Development", labelBn: "স্কিল ডেভেলপমেন্ট" },
  { value: "deep_work", labelEn: "Deep Work", labelBn: "ডিপ ওয়ার্ক" },
  { value: "other", labelEn: "Other", labelBn: "অন্যান্য" },
];

export default function TimeTracking() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [hours, setHours] = useState("");
  const [activity, setActivity] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Niyyah & Timer state
  const [showNiyyah, setShowNiyyah] = useState(false);
  const [currentNiyyah, setCurrentNiyyah] = useState<{ type: string; multiplier: number } | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (user) fetchEntries();
  }, [user]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const fetchEntries = async () => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
    
    const { data, error } = await supabase
      .from("time_entries")
      .select("*")
      .gte("date", thirtyDaysAgo)
      .order("date", { ascending: false });

    if (!error && data) {
      setEntries(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hours || !activity) return;

    setSaving(true);
    const { error } = await supabase.from("time_entries").upsert({
      user_id: user.id,
      date: selectedDate,
      hours: parseFloat(hours),
      activity,
      notes: notes || null,
    }, { onConflict: "user_id,date,activity" });

    if (error) {
      toast.error(language === "bn" ? "সেভ করতে সমস্যা হয়েছে" : "Failed to save");
    } else {
      toast.success(language === "bn" ? "সেভ হয়েছে!" : "Saved!");
      fetchEntries();
      setHours("");
      setNotes("");
    }
    setSaving(false);
  };

  // Niyyah handlers
  const handleStartSession = () => {
    setShowNiyyah(true);
  };

  const handleNiyyahConfirm = async (niyyah: string, multiplier: number) => {
    setCurrentNiyyah({ type: niyyah, multiplier });
    setShowNiyyah(false);
    setIsTimerRunning(true);
    setTimerStartTime(new Date());
    setTimerSeconds(0);
    
    // Save session start to database
    if (user) {
      await supabase.from("study_sessions").insert({
        user_id: user.id,
        date: format(new Date(), "yyyy-MM-dd"),
        niyyah: niyyah,
        niyyah_multiplier: multiplier,
        started_at: new Date().toISOString(),
        duration_minutes: 0,
      });
    }
    
    toast.success(language === "bn" ? "বিসমিল্লাহ! সেশন শুরু হয়েছে" : "Bismillah! Session started");
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResumeTimer = () => {
    setIsTimerRunning(true);
  };

  const handleStopTimer = async () => {
    setIsTimerRunning(false);
    const durationMinutes = Math.round(timerSeconds / 60);
    
    if (user && timerStartTime) {
      // Update the session
      await supabase
        .from("study_sessions")
        .update({
          ended_at: new Date().toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq("user_id", user.id)
        .eq("started_at", timerStartTime.toISOString());

      // Calculate barakah score
      const barakahScore = durationMinutes * (currentNiyyah?.multiplier || 1);
      
      toast.success(
        language === "bn" 
          ? `সেশন শেষ! ${durationMinutes} মিনিট × ${currentNiyyah?.multiplier || 1}x = ${barakahScore} বারাকাহ পয়েন্ট` 
          : `Session complete! ${durationMinutes} min × ${currentNiyyah?.multiplier || 1}x = ${barakahScore} Barakah points`
      );
    }
    
    setTimerSeconds(0);
    setTimerStartTime(null);
    setCurrentNiyyah(null);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Prepare chart data - last 7 days
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyData = weekDays.map(day => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayEntries = entries.filter(e => e.date === dateStr);
    const totalHours = dayEntries.reduce((sum, e) => sum + Number(e.hours), 0);
    return {
      day: format(day, "EEE"),
      hours: totalHours,
    };
  });

  // Activity breakdown
  const activityData = ACTIVITIES.map(act => {
    const totalHours = entries
      .filter(e => e.activity === act.value)
      .reduce((sum, e) => sum + Number(e.hours), 0);
    return {
      name: language === "bn" ? act.labelBn : act.labelEn,
      hours: totalHours,
    };
  }).filter(a => a.hours > 0);

  const totalWeekHours = weeklyData.reduce((sum, d) => sum + d.hours, 0);
  const totalMonthHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);

  const todayEntries = entries.filter(e => e.date === format(new Date(), "yyyy-MM-dd"));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Niyyah Modal */}
        <NiyyahValidator
          isOpen={showNiyyah}
          onClose={() => setShowNiyyah(false)}
          onConfirm={handleNiyyahConfirm}
          sessionType="deep work"
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {language === "bn" ? "টাইম ট্র্যাকিং" : "Time Tracking"}
            </h1>
            <p className="text-muted-foreground">
              {language === "bn" ? "দৈনিক সময় রেকর্ড করুন" : "Log your daily time"}
            </p>
          </div>
        </div>

        {/* Deep Work Timer with Niyyah */}
        <Card className={currentNiyyah ? "border-primary/50 bg-primary/5" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {language === "bn" ? "ডিপ ওয়ার্ক টাইমার" : "Deep Work Timer"}
              {currentNiyyah && (
                <span className={`text-sm font-normal px-2 py-0.5 rounded ${
                  currentNiyyah.multiplier === 2 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" :
                  currentNiyyah.multiplier === 1 ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                  "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300"
                }`}>
                  {currentNiyyah.multiplier}x Barakah
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="text-5xl font-mono font-bold tabular-nums">
                {formatTime(timerSeconds)}
              </div>
              
              <div className="flex gap-3">
                {!isTimerRunning && !currentNiyyah && (
                  <Button onClick={handleStartSession} size="lg" className="gap-2">
                    <Play className="h-5 w-5" />
                    {language === "bn" ? "সেশন শুরু করুন" : "Start Session"}
                  </Button>
                )}
                
                {isTimerRunning && (
                  <>
                    <Button onClick={handlePauseTimer} variant="outline" size="lg" className="gap-2">
                      <Pause className="h-5 w-5" />
                      {language === "bn" ? "বিরতি" : "Pause"}
                    </Button>
                    <Button onClick={handleStopTimer} variant="destructive" size="lg" className="gap-2">
                      <Square className="h-5 w-5" />
                      {language === "bn" ? "শেষ করুন" : "Stop"}
                    </Button>
                  </>
                )}
                
                {!isTimerRunning && currentNiyyah && (
                  <>
                    <Button onClick={handleResumeTimer} size="lg" className="gap-2">
                      <Play className="h-5 w-5" />
                      {language === "bn" ? "চালিয়ে যান" : "Resume"}
                    </Button>
                    <Button onClick={handleStopTimer} variant="destructive" size="lg" className="gap-2">
                      <Square className="h-5 w-5" />
                      {language === "bn" ? "শেষ করুন" : "Stop"}
                    </Button>
                  </>
                )}
              </div>

              {currentNiyyah && (
                <p className="text-sm text-muted-foreground text-center">
                  {language === "bn" 
                    ? `নিয়ত: ${currentNiyyah.type === 'allah' ? 'আল্লাহর জন্য' : currentNiyyah.type === 'career' ? 'ক্যারিয়ারের জন্য' : 'অহংকার'}` 
                    : `Niyyah: ${currentNiyyah.type === 'allah' ? 'For Allah' : currentNiyyah.type === 'career' ? 'For Career' : 'Ego/Fame'}`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayEntries.reduce((s, e) => s + Number(e.hours), 0).toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">{language === "bn" ? "আজ" : "Today"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalWeekHours.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">{language === "bn" ? "এই সপ্তাহ" : "This Week"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalMonthHours.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">{language === "bn" ? "৩০ দিন" : "30 Days"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/10">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{(totalWeekHours / 7).toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">{language === "bn" ? "দৈনিক গড়" : "Daily Avg"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Entry Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {language === "bn" ? "সময় যোগ করুন" : "Add Time Entry"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "bn" ? "তারিখ" : "Date"}</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      max={format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "bn" ? "ঘন্টা" : "Hours"}</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      placeholder="2.5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{language === "bn" ? "কাজ" : "Activity"}</Label>
                  <Select value={activity} onValueChange={setActivity}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === "bn" ? "সিলেক্ট করুন" : "Select activity"} />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITIES.map((act) => (
                        <SelectItem key={act.value} value={act.value}>
                          {language === "bn" ? act.labelBn : act.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{language === "bn" ? "নোট (ঐচ্ছিক)" : "Notes (optional)"}</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={language === "bn" ? "কী করলেন..." : "What did you do..."}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={saving || !hours || !activity}>
                  {saving ? (language === "bn" ? "সেভ হচ্ছে..." : "Saving...") : (language === "bn" ? "সেভ করুন" : "Save")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Weekly Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "bn" ? "সাপ্তাহিক গ্রাফ" : "Weekly Graph"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Activity Breakdown */}
        {activityData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{language === "bn" ? "কাজের ধরন অনুযায়ী" : "By Activity Type"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={activityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="hours" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <CardTitle>{language === "bn" ? "সাম্প্রতিক এন্ট্রি" : "Recent Entries"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">{language === "bn" ? "লোড হচ্ছে..." : "Loading..."}</p>
            ) : entries.length === 0 ? (
              <p className="text-muted-foreground">{language === "bn" ? "কোনো এন্ট্রি নেই" : "No entries yet"}</p>
            ) : (
              <div className="space-y-2">
                {entries.slice(0, 10).map((entry) => {
                  const actLabel = ACTIVITIES.find(a => a.value === entry.activity);
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">
                          {actLabel ? (language === "bn" ? actLabel.labelBn : actLabel.labelEn) : entry.activity}
                        </p>
                        <p className="text-sm text-muted-foreground">{entry.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{Number(entry.hours).toFixed(1)}h</p>
                        {entry.notes && <p className="text-xs text-muted-foreground truncate max-w-[150px]">{entry.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
