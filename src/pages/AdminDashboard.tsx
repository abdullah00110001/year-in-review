import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Shield, 
  Users, 
  BarChart3, 
  Settings2, 
  Loader2, 
  UserCog,
  Target,
  CheckSquare,
  Clock,
  BookOpen,
  Image,
  Flame,
  Globe,
  Lock,
  TrendingUp,
  Brain,
  AlertTriangle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: string;
}

interface GlobalStats {
  totalUsers: number;
  totalGoals: number;
  totalHabits: number;
  totalHabitEntries: number;
  totalTimeHours: number;
  totalKnowledgeItems: number;
  totalHighlights: number;
  totalSmallWins: number;
}

interface AppSetting {
  key: string;
  value: { public?: boolean; [key: string]: unknown };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<GlobalStats>({
    totalUsers: 0,
    totalGoals: 0,
    totalHabits: 0,
    totalHabitEntries: 0,
    totalTimeHours: 0,
    totalKnowledgeItems: 0,
    totalHighlights: 0,
    totalSmallWins: 0,
  });
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [savingRole, setSavingRole] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndFetch();
  }, [user]);

  const checkAdminAndFetch = async () => {
    if (!user) return;

    const { data: isAdminData } = await supabase.rpc("has_role", { 
      _user_id: user.id, 
      _role: "admin" 
    });

    if (!isAdminData) {
      toast.error(language === "bn" ? "অনুমতি নেই" : "Access denied");
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    await Promise.all([fetchUsers(), fetchStats(), fetchSettings()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, created_at")
      .order("created_at", { ascending: false });

    if (!profiles) return;

    // Fetch roles for each user
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

    const usersWithRoles = profiles.map(p => ({
      ...p,
      role: roleMap.get(p.user_id) || "user",
    }));

    setUsers(usersWithRoles);
  };

  const fetchStats = async () => {
    const [
      { count: usersCount },
      { count: goalsCount },
      { count: habitsCount },
      { count: habitEntriesCount },
      { data: timeData },
      { count: knowledgeCount },
      { count: highlightsCount },
      { count: winsCount },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("goals").select("*", { count: "exact", head: true }),
      supabase.from("habits").select("*", { count: "exact", head: true }),
      supabase.from("habit_entries").select("*", { count: "exact", head: true }).eq("completed", true),
      supabase.from("time_entries").select("hours"),
      supabase.from("knowledge_items").select("*", { count: "exact", head: true }),
      supabase.from("monthly_highlights").select("*", { count: "exact", head: true }),
      supabase.from("small_wins").select("*", { count: "exact", head: true }),
    ]);

    const totalHours = timeData?.reduce((sum, entry) => sum + Number(entry.hours), 0) || 0;

    setStats({
      totalUsers: usersCount || 0,
      totalGoals: goalsCount || 0,
      totalHabits: habitsCount || 0,
      totalHabitEntries: habitEntriesCount || 0,
      totalTimeHours: totalHours,
      totalKnowledgeItems: knowledgeCount || 0,
      totalHighlights: highlightsCount || 0,
      totalSmallWins: winsCount || 0,
    });
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from("app_settings").select("key, value");
    if (data) {
      setSettings(data as AppSetting[]);
    }
  };

  const updateUserRole = async (userId: string, newRole: "admin" | "moderator" | "user") => {
    setSavingRole(userId);

    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) {
      toast.error(language === "bn" ? "রোল আপডেট করতে সমস্যা হয়েছে" : "Failed to update role");
    } else {
      toast.success(language === "bn" ? "রোল আপডেট হয়েছে" : "Role updated");
      setUsers(users.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
    }

    setSavingRole(null);
  };

  const toggleSetting = async (key: string, currentValue: boolean) => {
    const { error } = await supabase
      .from("app_settings")
      .update({ value: { public: !currentValue } })
      .eq("key", key);

    if (error) {
      toast.error(language === "bn" ? "সেটিং আপডেট করতে সমস্যা হয়েছে" : "Failed to update setting");
    } else {
      toast.success(language === "bn" ? "সেটিং আপডেট হয়েছে" : "Setting updated");
      setSettings(settings.map(s => 
        s.key === key ? { ...s, value: { ...s.value, public: !currentValue } } : s
      ));
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "moderator": return "secondary";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const statCards = [
    { label: language === "bn" ? "মোট ব্যবহারকারী" : "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { label: language === "bn" ? "মোট গোল" : "Total Goals", value: stats.totalGoals, icon: Target, color: "text-green-500" },
    { label: language === "bn" ? "মোট হ্যাবিট" : "Total Habits", value: stats.totalHabits, icon: CheckSquare, color: "text-purple-500" },
    { label: language === "bn" ? "হ্যাবিট এন্ট্রি" : "Habit Entries", value: stats.totalHabitEntries, icon: Flame, color: "text-orange-500" },
    { label: language === "bn" ? "মোট সময়" : "Total Hours", value: stats.totalTimeHours.toFixed(0), icon: Clock, color: "text-cyan-500" },
    { label: language === "bn" ? "জ্ঞান আইটেম" : "Knowledge Items", value: stats.totalKnowledgeItems, icon: BookOpen, color: "text-pink-500" },
    { label: language === "bn" ? "হাইলাইট" : "Highlights", value: stats.totalHighlights, icon: Image, color: "text-yellow-500" },
    { label: language === "bn" ? "স্মল উইন্স" : "Small Wins", value: stats.totalSmallWins, icon: TrendingUp, color: "text-emerald-500" },
  ];

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              {language === "bn" ? "অ্যাডমিন ড্যাশবোর্ড" : "Admin Dashboard"}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {language === "bn" ? "ব্যবহারকারী এবং অ্যাপ সেটিংস পরিচালনা করুন" : "Manage users and app settings"}
            </p>
          </div>
        </div>

        <Tabs defaultValue="stats" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="stats" className="text-xs sm:text-sm py-2.5 px-2 sm:px-4">
              <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{language === "bn" ? "পরিসংখ্যান" : "Statistics"}</span>
              <span className="sm:hidden">{language === "bn" ? "স্ট্যাটস" : "Stats"}</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs sm:text-sm py-2.5 px-2 sm:px-4">
              <Brain className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{language === "bn" ? "ইনসাইটস" : "Insights"}</span>
              <span className="sm:hidden">{language === "bn" ? "ইনসাইটস" : "Insights"}</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm py-2.5 px-2 sm:px-4">
              <Users className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{language === "bn" ? "ব্যবহারকারী" : "Users"}</span>
              <span className="sm:hidden">{language === "bn" ? "ইউজার" : "Users"}</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm py-2.5 px-2 sm:px-4">
              <Settings2 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{language === "bn" ? "সেটিংস" : "Settings"}</span>
              <span className="sm:hidden">{language === "bn" ? "সেটিং" : "Settings"}</span>
            </TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              {statCards.map((stat, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                      {stat.label}
                    </CardTitle>
                    <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color} shrink-0`} />
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                    <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Insights Tab - Admin view of user patterns */}
          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Brain className="h-5 w-5" />
                  {language === "bn" ? "ইউজার ইনসাইটস" : "User Insights Overview"}
                </CardTitle>
                <CardDescription className="text-sm">
                  {language === "bn" ? "বার্নআউট এলার্ট এবং ইউজার প্যাটার্ন মনিটর করুন" : "Monitor burnout alerts and user patterns"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <span className="font-medium text-amber-800 dark:text-amber-200">
                        {language === "bn" ? "বার্নআউট মনিটরিং" : "Burnout Monitoring"}
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {language === "bn" 
                        ? "সক্রিয় ইউজারদের লো এনার্জি, লো স্লিপ ট্র্যাক করা হচ্ছে।"
                        : "Actively tracking users with low energy and sleep patterns."
                      }
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span className="font-medium">
                        {language === "bn" ? "মুড-প্রোডাক্টিভিটি করেলেশন" : "Mood-Productivity Correlation"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === "bn" 
                        ? "সকল ইউজারের মুড এবং প্রোডাক্টিভিটি প্যাটার্ন বিশ্লেষণ করা হচ্ছে।"
                        : "Analyzing mood and productivity patterns across all users."
                      }
                    </p>
                  </div>
                </div>
                <div className="text-center py-6 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {language === "bn" 
                      ? "বিস্তারিত ইনসাইটস আসছে..."
                      : "Detailed insights dashboard coming soon..."
                    }
                  </p>
                  <p className="text-xs mt-1">
                    {language === "bn" 
                      ? "ইউজারদের দৈনিক এন্ট্রি থেকে প্যাটার্ন বিশ্লেষণ করা হবে।"
                      : "User patterns will be analyzed from daily entries."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <UserCog className="h-5 w-5" />
                  {language === "bn" ? "ব্যবহারকারী তালিকা" : "User Management"}
                </CardTitle>
                <CardDescription className="text-sm">
                  {language === "bn" ? "ব্যবহারকারীদের রোল পরিবর্তন করুন" : "Change user roles and permissions"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                {/* Mobile User Cards */}
                <div className="sm:hidden space-y-3 p-4 pt-0">
                  {users.map((userProfile) => (
                    <Card key={userProfile.user_id} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={userProfile.avatar_url || undefined} />
                          <AvatarFallback>
                            {(userProfile.full_name || "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {userProfile.full_name || (language === "bn" ? "অজানা" : "Unknown")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(userProfile.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={getRoleBadgeVariant(userProfile.role)}>
                          {userProfile.role}
                        </Badge>
                      </div>
                      <Select
                        value={userProfile.role}
                        onValueChange={(value) => updateUserRole(userProfile.user_id, value as "admin" | "moderator" | "user")}
                        disabled={savingRole === userProfile.user_id || userProfile.user_id === user?.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">{language === "bn" ? "ব্যবহারকারী" : "User"}</SelectItem>
                          <SelectItem value="moderator">{language === "bn" ? "মডারেটর" : "Moderator"}</SelectItem>
                          <SelectItem value="admin">{language === "bn" ? "অ্যাডমিন" : "Admin"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === "bn" ? "ব্যবহারকারী" : "User"}</TableHead>
                        <TableHead>{language === "bn" ? "যোগদান" : "Joined"}</TableHead>
                        <TableHead>{language === "bn" ? "বর্তমান রোল" : "Current Role"}</TableHead>
                        <TableHead className="text-right">{language === "bn" ? "রোল পরিবর্তন" : "Change Role"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userProfile) => (
                        <TableRow key={userProfile.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={userProfile.avatar_url || undefined} />
                                <AvatarFallback>
                                  {(userProfile.full_name || "U")[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {userProfile.full_name || (language === "bn" ? "অজানা" : "Unknown")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(userProfile.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(userProfile.role)}>
                              {userProfile.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Select
                              value={userProfile.role}
                              onValueChange={(value) => updateUserRole(userProfile.user_id, value as "admin" | "moderator" | "user")}
                              disabled={savingRole === userProfile.user_id || userProfile.user_id === user?.id}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">{language === "bn" ? "ব্যবহারকারী" : "User"}</SelectItem>
                                <SelectItem value="moderator">{language === "bn" ? "মডারেটর" : "Moderator"}</SelectItem>
                                <SelectItem value="admin">{language === "bn" ? "অ্যাডমিন" : "Admin"}</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Settings2 className="h-5 w-5" />
                  {language === "bn" ? "অ্যাপ সেটিংস" : "App Settings"}
                </CardTitle>
                <CardDescription className="text-sm">
                  {language === "bn" ? "গ্লোবাল অ্যাপ সেটিংস কনফিগার করুন" : "Configure global app settings"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                {settings.map((setting) => (
                  <div 
                    key={setting.key} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {setting.value?.public ? (
                        <Globe className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm sm:text-base">
                          {setting.key === "leaderboard_visibility" 
                            ? (language === "bn" ? "লিডারবোর্ড ভিজিবিলিটি" : "Leaderboard Visibility")
                            : setting.key
                          }
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {setting.value?.public 
                            ? (language === "bn" ? "সবার কাছে দৃশ্যমান" : "Visible to everyone")
                            : (language === "bn" ? "শুধু এডমিন দেখতে পারে" : "Only admins can see")
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-8 sm:ml-0">
                      <Label htmlFor={setting.key} className="text-sm">
                        {language === "bn" ? "পাবলিক" : "Public"}
                      </Label>
                      <Switch
                        id={setting.key}
                        checked={setting.value?.public ?? false}
                        onCheckedChange={() => toggleSetting(setting.key, setting.value?.public ?? false)}
                      />
                    </div>
                  </div>
                ))}

                {settings.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === "bn" ? "কোন সেটিং পাওয়া যায়নি" : "No settings found"}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
