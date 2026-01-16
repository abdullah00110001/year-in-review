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
import { Clock, Plus, TrendingUp, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

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

  useEffect(() => {
    if (user) fetchEntries();
  }, [user]);

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
