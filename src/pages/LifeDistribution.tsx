import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Plus, Smile, Meh, Frown } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks } from 'date-fns';

interface ActivityTag {
  id: string;
  name: string;
  name_bn: string;
  color: string;
  icon: string | null;
}

interface DailyLog {
  id: string;
  date: string;
  mood: string | null;
  tag_id: string | null;
  hours: number;
  notes: string | null;
  activity_tags?: ActivityTag;
}

export default function LifeDistribution() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [tags, setTags] = useState<ActivityTag[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [hours, setHours] = useState<string>('1');
  const [mood, setMood] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [pieData, setPieData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    // Fetch tags
    const { data: tagsData } = await supabase
      .from('activity_tags')
      .select('*');
    
    if (tagsData) setTags(tagsData);

    // Fetch logs for current year
    const currentYear = new Date().getFullYear();
    const { data: logsData } = await supabase
      .from('daily_logs')
      .select('*, activity_tags(*)')
      .eq('user_id', user!.id)
      .gte('date', `${currentYear}-01-01`)
      .order('date', { ascending: false });

    if (logsData) {
      setLogs(logsData);
      processAnalytics(logsData);
    }
    setLoading(false);
  };

  const processAnalytics = (logsData: any[]) => {
    // Pie chart data
    const tagHours: Record<string, { hours: number; color: string; name: string }> = {};
    
    logsData.forEach((log) => {
      if (log.activity_tags) {
        const tagName = language === 'bn' ? log.activity_tags.name_bn : log.activity_tags.name;
        if (!tagHours[tagName]) {
          tagHours[tagName] = { hours: 0, color: log.activity_tags.color, name: tagName };
        }
        tagHours[tagName].hours += Number(log.hours) || 0;
      }
    });

    const pieChartData = Object.values(tagHours)
      .filter(t => t.hours > 0)
      .map(t => ({
        name: t.name,
        value: Math.round(t.hours * 10) / 10,
        color: t.color,
      }));
    setPieData(pieChartData);

    // Weekly bar chart data
    const weeks: any[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i));
      const weekEnd = endOfWeek(subWeeks(new Date(), i));
      const weekLogs = logsData.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= weekStart && logDate <= weekEnd;
      });
      
      const totalHours = weekLogs.reduce((sum, log) => sum + (Number(log.hours) || 0), 0);
      weeks.push({
        week: format(weekStart, 'MMM d'),
        hours: Math.round(totalHours * 10) / 10,
      });
    }
    setWeeklyData(weeks);
  };

  const handleSubmit = async () => {
    if (!selectedTag) {
      toast.error(language === 'bn' ? 'ক্যাটাগরি নির্বাচন করুন' : 'Please select a category');
      return;
    }

    const { error } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: user!.id,
        date: selectedDate,
        tag_id: selectedTag,
        hours: parseFloat(hours) || 0,
        mood: mood || null,
        notes: notes || null,
      }, { onConflict: 'user_id,date,tag_id' });

    if (error) {
      toast.error(language === 'bn' ? 'সংরক্ষণ করা যায়নি' : 'Could not save');
      return;
    }

    toast.success(language === 'bn' ? 'সংরক্ষিত!' : 'Saved!');
    setSelectedTag('');
    setHours('1');
    setMood('');
    setNotes('');
    fetchData();
  };

  const moodOptions = [
    { value: 'good', icon: Smile, label: language === 'bn' ? 'ভালো' : 'Good', color: 'text-green-500' },
    { value: 'average', icon: Meh, label: language === 'bn' ? 'মাঝামাঝি' : 'Average', color: 'text-yellow-500' },
    { value: 'bad', icon: Frown, label: language === 'bn' ? 'খারাপ' : 'Bad', color: 'text-red-400' },
  ];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {language === 'bn' ? 'জীবন বিতরণ' : 'Life Distribution'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {language === 'bn' ? 'আপনার সময় কোথায় যাচ্ছে তা ট্র্যাক করুন' : 'Track where your time goes'}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Log Entry Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {language === 'bn' ? 'নতুন এন্ট্রি' : 'New Entry'}
              </CardTitle>
              <CardDescription>
                {language === 'bn' ? 'আজকের কার্যকলাপ লগ করুন' : 'Log your activities'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{language === 'bn' ? 'তারিখ' : 'Date'}</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div>
                <Label>{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</Label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'bn' ? 'নির্বাচন করুন' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-3 w-3 rounded-full" 
                            style={{ backgroundColor: tag.color }} 
                          />
                          {language === 'bn' ? tag.name_bn : tag.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{language === 'bn' ? 'ঘন্টা' : 'Hours'}</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>

              <div>
                <Label>{language === 'bn' ? 'মেজাজ' : 'Mood'}</Label>
                <div className="flex gap-2 mt-2">
                  {moodOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={mood === option.value ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => setMood(mood === option.value ? '' : option.value)}
                    >
                      <option.icon className={`h-4 w-4 ${mood === option.value ? '' : option.color}`} />
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>{language === 'bn' ? 'নোট' : 'Notes'}</Label>
                <Textarea
                  placeholder={language === 'bn' ? 'ঐচ্ছিক নোট...' : 'Optional notes...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Entry'}
              </Button>
            </CardContent>
          </Card>

          {/* Analytics */}
          <div className="space-y-6 lg:col-span-2">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === 'bn' ? 'বছরের বিতরণ' : 'Year Distribution'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`${value} hours`, '']}
                          contentStyle={{ 
                            borderRadius: '8px',
                            border: '1px solid hsl(var(--border))',
                            backgroundColor: 'hsl(var(--background))'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-72 items-center justify-center text-muted-foreground">
                    {language === 'bn' ? 'ডেটা যোগ করুন' : 'Add some data to see your distribution'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === 'bn' ? 'সাপ্তাহিক প্রবণতা' : 'Weekly Trend'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="week" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => [`${value}h`, language === 'bn' ? 'ঘন্টা' : 'Hours']}
                        contentStyle={{ 
                          borderRadius: '8px',
                          border: '1px solid hsl(var(--border))',
                          backgroundColor: 'hsl(var(--background))'
                        }}
                      />
                      <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Logs */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{language === 'bn' ? 'সাম্প্রতিক এন্ট্রি' : 'Recent Entries'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {log.activity_tags && (
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: log.activity_tags.color }}
                      />
                    )}
                    <div>
                      <span className="font-medium">
                        {log.activity_tags 
                          ? (language === 'bn' ? log.activity_tags.name_bn : log.activity_tags.name)
                          : 'Unknown'
                        }
                      </span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {format(new Date(log.date), 'MMM d')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {log.mood && (
                      <span>
                        {log.mood === 'good' && <Smile className="h-4 w-4 text-green-500" />}
                        {log.mood === 'average' && <Meh className="h-4 w-4 text-yellow-500" />}
                        {log.mood === 'bad' && <Frown className="h-4 w-4 text-red-400" />}
                      </span>
                    )}
                    <span className="text-sm font-medium">{log.hours}h</span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="py-4 text-center text-muted-foreground">
                  {language === 'bn' ? 'কোন এন্ট্রি নেই' : 'No entries yet'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
