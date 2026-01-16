import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trophy, Clock, Flame, Target, Medal, Crown, Award, Lock, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeaderboardUser {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  total_hours?: number;
  streak?: number;
  goals_completed?: number;
  habits_completed?: number;
}

export default function Leaderboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [timeLeaders, setTimeLeaders] = useState<LeaderboardUser[]>([]);
  const [streakLeaders, setStreakLeaders] = useState<LeaderboardUser[]>([]);
  const [goalsLeaders, setGoalsLeaders] = useState<LeaderboardUser[]>([]);
  const [habitsLeaders, setHabitsLeaders] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    fetchData();
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    setIsAdmin(data === true);
  };

  const fetchData = async () => {
    setLoading(true);

    // Fetch visibility setting
    const { data: settings } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "leaderboard_visibility")
      .single();
    
    if (settings) {
      setIsPublic((settings.value as { public: boolean })?.public ?? true);
    }

    // Fetch all profiles
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url");
    
    if (!profiles) {
      setLoading(false);
      return;
    }

    // Fetch time entries for all users
    const { data: timeEntries } = await supabase.from("time_entries").select("user_id, hours");
    
    // Calculate total hours per user
    const hoursByUser = new Map<string, number>();
    timeEntries?.forEach(entry => {
      const current = hoursByUser.get(entry.user_id) || 0;
      hoursByUser.set(entry.user_id, current + Number(entry.hours));
    });

    const timeLeaderData = profiles
      .map(p => ({
        ...p,
        total_hours: hoursByUser.get(p.user_id) || 0,
      }))
      .filter(p => p.total_hours > 0)
      .sort((a, b) => b.total_hours - a.total_hours);

    setTimeLeaders(timeLeaderData);

    // Fetch habit entries for streak calculation
    const { data: habitEntries } = await supabase
      .from("habit_entries")
      .select("user_id, date, completed")
      .eq("completed", true)
      .order("date", { ascending: false });

    // Calculate streaks
    const streaksByUser = new Map<string, number>();
    const userDates = new Map<string, Set<string>>();
    
    habitEntries?.forEach(entry => {
      if (!userDates.has(entry.user_id)) {
        userDates.set(entry.user_id, new Set());
      }
      userDates.get(entry.user_id)?.add(entry.date);
    });

    userDates.forEach((dates, userId) => {
      const sortedDates = Array.from(dates).sort().reverse();
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < sortedDates.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        const expectedStr = expectedDate.toISOString().split("T")[0];
        
        if (sortedDates.includes(expectedStr)) {
          streak++;
        } else {
          break;
        }
      }
      streaksByUser.set(userId, streak);
    });

    const streakLeaderData = profiles
      .map(p => ({
        ...p,
        streak: streaksByUser.get(p.user_id) || 0,
      }))
      .filter(p => p.streak > 0)
      .sort((a, b) => (b.streak || 0) - (a.streak || 0));

    setStreakLeaders(streakLeaderData);

    // Fetch goals completion
    const { data: goals } = await supabase.from("goals").select("user_id");
    const goalsByUser = new Map<string, number>();
    goals?.forEach(g => {
      goalsByUser.set(g.user_id, (goalsByUser.get(g.user_id) || 0) + 1);
    });

    const goalsLeaderData = profiles
      .map(p => ({
        ...p,
        goals_completed: goalsByUser.get(p.user_id) || 0,
      }))
      .filter(p => p.goals_completed && p.goals_completed > 0)
      .sort((a, b) => (b.goals_completed || 0) - (a.goals_completed || 0));

    setGoalsLeaders(goalsLeaderData);

    // Habits completed count
    const habitsByUser = new Map<string, number>();
    habitEntries?.forEach(entry => {
      if (entry.completed) {
        habitsByUser.set(entry.user_id, (habitsByUser.get(entry.user_id) || 0) + 1);
      }
    });

    const habitsLeaderData = profiles
      .map(p => ({
        ...p,
        habits_completed: habitsByUser.get(p.user_id) || 0,
      }))
      .filter(p => p.habits_completed && p.habits_completed > 0)
      .sort((a, b) => (b.habits_completed || 0) - (a.habits_completed || 0));

    setHabitsLeaders(habitsLeaderData);

    setLoading(false);
  };

  const toggleVisibility = async () => {
    const newValue = !isPublic;
    const { error } = await supabase
      .from("app_settings")
      .update({ value: { public: newValue } })
      .eq("key", "leaderboard_visibility");

    if (error) {
      toast.error(language === "bn" ? "আপডেট করতে সমস্যা হয়েছে" : "Failed to update");
    } else {
      setIsPublic(newValue);
      toast.success(
        newValue 
          ? (language === "bn" ? "লিডারবোর্ড পাবলিক করা হয়েছে" : "Leaderboard is now public")
          : (language === "bn" ? "লিডারবোর্ড প্রাইভেট করা হয়েছে" : "Leaderboard is now private")
      );
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center font-medium text-muted-foreground">{index + 1}</span>;
  };

  const LeaderList = ({ 
    leaders, 
    valueKey, 
    suffix 
  }: { 
    leaders: LeaderboardUser[]; 
    valueKey: keyof LeaderboardUser; 
    suffix: string;
  }) => (
    <div className="space-y-2">
      {leaders.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {language === "bn" ? "কোনো ডাটা নেই" : "No data yet"}
        </p>
      ) : (
        leaders.slice(0, 10).map((leader, index) => (
          <div
            key={leader.user_id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              index === 0 ? "bg-yellow-500/10 border border-yellow-500/20" :
              index === 1 ? "bg-gray-500/10 border border-gray-500/20" :
              index === 2 ? "bg-amber-500/10 border border-amber-500/20" :
              "bg-muted/50"
            } ${leader.user_id === user?.id ? "ring-2 ring-primary" : ""}`}
          >
            <div className="flex items-center justify-center w-8">
              {getRankIcon(index)}
            </div>
            <Avatar className="h-10 w-10">
              <AvatarImage src={leader.avatar_url || undefined} />
              <AvatarFallback>
                {(leader.full_name || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {leader.full_name || (language === "bn" ? "অজানা ব্যবহারকারী" : "Unknown User")}
                {leader.user_id === user?.id && (
                  <span className="ml-2 text-xs text-primary">
                    ({language === "bn" ? "আপনি" : "You"})
                  </span>
                )}
              </p>
            </div>
            <div className="font-bold text-lg">
              {typeof leader[valueKey] === "number" ? 
                valueKey === "total_hours" ? Number(leader[valueKey]).toFixed(1) : leader[valueKey]
                : 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              {language === "bn" ? "লিডারবোর্ড" : "Leaderboard"}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              {isPublic ? (
                <>
                  <Globe className="h-4 w-4" />
                  {language === "bn" ? "পাবলিক" : "Public"}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  {language === "bn" ? "প্রাইভেট" : "Private"}
                </>
              )}
            </p>
          </div>

          {/* Admin Toggle */}
          {isAdmin && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Label htmlFor="visibility" className="text-sm">
                  {language === "bn" ? "পাবলিক লিডারবোর্ড" : "Public Leaderboard"}
                </Label>
                <Switch
                  id="visibility"
                  checked={isPublic}
                  onCheckedChange={toggleVisibility}
                />
              </div>
            </Card>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : (
          <Tabs defaultValue="time" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="time" className="text-xs sm:text-sm">
                <Clock className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{language === "bn" ? "সময়" : "Time"}</span>
              </TabsTrigger>
              <TabsTrigger value="streak" className="text-xs sm:text-sm">
                <Flame className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{language === "bn" ? "স্ট্রিক" : "Streak"}</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="text-xs sm:text-sm">
                <Target className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{language === "bn" ? "গোল" : "Goals"}</span>
              </TabsTrigger>
              <TabsTrigger value="habits" className="text-xs sm:text-sm">
                <Trophy className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{language === "bn" ? "হ্যাবিট" : "Habits"}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="time">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {language === "bn" ? "টোটাল টাইম" : "Total Time"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LeaderList 
                    leaders={timeLeaders} 
                    valueKey="total_hours" 
                    suffix={language === "bn" ? "ঘন্টা" : "hrs"} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="streak">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    {language === "bn" ? "স্ট্রিক কাউন্ট" : "Streak Count"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LeaderList 
                    leaders={streakLeaders} 
                    valueKey="streak" 
                    suffix={language === "bn" ? "দিন" : "days"} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    {language === "bn" ? "গোল সংখ্যা" : "Goals Created"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LeaderList 
                    leaders={goalsLeaders} 
                    valueKey="goals_completed" 
                    suffix="" 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="habits">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-green-500" />
                    {language === "bn" ? "হ্যাবিট কমপ্লিট" : "Habits Completed"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LeaderList 
                    leaders={habitsLeaders} 
                    valueKey="habits_completed" 
                    suffix="" 
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
