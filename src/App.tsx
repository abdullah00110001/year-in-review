import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { CapacitorProvider } from "@/contexts/CapacitorContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import SmartNotificationProvider from "@/components/notifications/SmartNotifications";
import { useState, useEffect } from "react";
import { isNative } from "@/lib/capacitor/platform";
import NativeSplash from "@/components/NativeSplash";
import UpdatePrompt from "@/components/UpdatePrompt";
import ForceUpdateScreen from "@/components/ForceUpdateScreen";
import { useAppUpdate } from "@/hooks/useAppUpdate";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { LocalNotifications } from '@capacitor/local-notifications';
import { useToast } from "@/hooks/use-toast";

// All pages imported directly - no lazy loading
import Auth from "./pages/Auth";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import Goals from "./pages/Goals";
import Habits from "./pages/Habits";
import Calendar from "./pages/Calendar";
import Journal from "./pages/Journal";
import Journey from "./pages/Journey";
import Leaderboard from "./pages/Leaderboard";
import LifeDistribution from "./pages/LifeDistribution";
import KnowledgeShelf from "./pages/KnowledgeShelf";
import QuarterlyGoals from "./pages/QuarterlyGoals";
import MonthlyHighlights from "./pages/MonthlyHighlights";
import FutureLetter from "./pages/FutureLetter";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import YearEndWrapped from "./pages/YearEndWrapped";
import DataExport from "./pages/DataExport";
import DailyInput from "./pages/DailyInput";
import NightMuhasaba from "./pages/NightMuhasaba";
import WeeklyReview from "./pages/WeeklyReview";
import AdminCommand from "./pages/AdminCommand";
import Gamification from "./pages/Gamification";
import MonthlyReview from "./pages/MonthlyReview";
import IntelligenceEngine from "./pages/IntelligenceEngine";
import Insights from "./pages/Insights";
import IslamicDashboard from "./pages/IslamicDashboard";
import UnifiedDashboard from "./pages/UnifiedDashboard";
import Challenges from "./pages/Challenges";
import Reflections from "./pages/Reflections";
import ComparativeAnalytics from "./pages/ComparativeAnalytics";
import ShieldPage from "./pages/Shield";
import RisePage from "./pages/Rise";
import TimeTracking from "./pages/TimeTracking";
import LifeCalendar from "./pages/LifeCalendar";
import Premium from "./pages/Premium";
import AdminOverview from "./pages/admin/AdminOverview";
import UserInspector from "./pages/admin/UserInspector";
import AtRiskUsers from "./pages/admin/AtRiskUsers";
import FeedbackCenter from "./pages/admin/FeedbackCenter";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminCommandCenter from "./pages/admin/AdminCommandCenter";
import AdminPanel from "./pages/admin/AdminPanel";
import DownloadApp from "./pages/DownloadApp";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
      retry: (failureCount, error) => {
        if (!navigator.onLine) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount) => {
        if (!navigator.onLine) return false;
        return failureCount < 2;
      },
    },
  },
});

const AppContent = () => {
  const appUpdate = useAppUpdate();
  usePushNotifications();
  const { toast } = useToast();

  // পারমিশন চেক + রিকোয়েস্ট - অ্যাপ স্টার্ট হলেই রান হবে
  useEffect(() => {
    const requestPermissions = async () => {
      if (!isNative) return;

      try {
        // 1. চেক করো অলরেডি পারমিশন আছে কিনা
        const permResult = await LocalNotifications.checkPermissions();

        if (permResult.display!== 'granted') {
          console.log('[Permissions] Requesting notification permission...');
          // 2. না থাকলে চাও - এই লাইনেই পপআপ আসবে
          const requestResult = await LocalNotifications.requestPermissions();

          if (requestResult.display === 'granted') {
            toast({
              title: "Notifications Enabled ✅",
              description: "Rise alarms will work properly now",
              duration: 3000,
            });
          } else {
            toast({
              title: "Permission Denied",
              description: "Go to Settings > Apps > Life OS > Notifications to enable",
              variant: "destructive",
              duration: 8000,
            });
          }
        } else {
          console.log('[Permissions] Notification permission already granted');
        }
      } catch (error) {
        console.error('[Permissions] Failed to request:', error);
      }
    };

    // Splash শেষ হওয়ার 1 সেকেন্ড পর পারমিশন চাও
    const timer = setTimeout(() => {
      requestPermissions();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (appUpdate.showForceScreen) {
    return (
      <ForceUpdateScreen downloadUrl={appUpdate.downloadUrl} releaseNotes={appUpdate.releaseNotes} latestVersion={appUpdate.latestVersion} />
    );
  }

  return (
    <>
      <Toaster />
      <Sonner />
      <SmartNotificationProvider />
      <UpdatePrompt open={appUpdate.showPrompt} onDismiss={appUpdate.dismiss} downloadUrl={appUpdate.downloadUrl} isForceUpdate={appUpdate.isForceUpdate} releaseNotes={appUpdate.releaseNotes} latestVersion={appUpdate.latestVersion} />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/download" element={<DownloadApp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path="/goals/new" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path="/habits" element={<ProtectedRoute><Habits /></ProtectedRoute>} />
          <Route path="/habits/new" element={<ProtectedRoute><Habits /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
          <Route path="/journey" element={<ProtectedRoute><Journey /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/life-distribution" element={<ProtectedRoute><LifeDistribution /></ProtectedRoute>} />
          <Route path="/knowledge-shelf" element={<ProtectedRoute><KnowledgeShelf /></ProtectedRoute>} />
          <Route path="/quarterly-goals" element={<ProtectedRoute><QuarterlyGoals /></ProtectedRoute>} />
          <Route path="/monthly-highlights" element={<ProtectedRoute><MonthlyHighlights /></ProtectedRoute>} />
          <Route path="/future-letter" element={<ProtectedRoute><FutureLetter /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/wrapped" element={<ProtectedRoute><YearEndWrapped /></ProtectedRoute>} />
          <Route path="/export" element={<ProtectedRoute><DataExport /></ProtectedRoute>} />
          <Route path="/daily-input" element={<ProtectedRoute><DailyInput /></ProtectedRoute>} />
          <Route path="/night-muhasaba" element={<ProtectedRoute><NightMuhasaba /></ProtectedRoute>} />
          <Route path="/monthly-review" element={<ProtectedRoute><MonthlyReview /></ProtectedRoute>} />
          <Route path="/intelligence" element={<ProtectedRoute><IntelligenceEngine /></ProtectedRoute>} />
          <Route path="/weekly-review" element={<ProtectedRoute><WeeklyReview /></ProtectedRoute>} />
          <Route path="/admin-command" element={<ProtectedRoute><AdminCommand /></ProtectedRoute>} />
          <Route path="/gamification" element={<ProtectedRoute><Gamification /></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
          <Route path="/islamic-dashboard" element={<ProtectedRoute><IslamicDashboard /></ProtectedRoute>} />
          <Route path="/unified-dashboard" element={<ProtectedRoute><UnifiedDashboard /></ProtectedRoute>} />
          <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
          <Route path="/reflections" element={<ProtectedRoute><Reflections /></ProtectedRoute>} />
          <Route path="/comparative-analytics" element={<ProtectedRoute><ComparativeAnalytics /></ProtectedRoute>} />
          <Route path="/shield" element={<ProtectedRoute><ShieldPage /></ProtectedRoute>} />
          <Route path="/rise" element={<ProtectedRoute><RisePage /></ProtectedRoute>} />
          <Route path="/time-tracking" element={<ProtectedRoute><TimeTracking /></ProtectedRoute>} />
          <Route path="/life-calendar" element={<ProtectedRoute><LifeCalendar /></ProtectedRoute>} />
         
          <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminProtectedRoute><AdminOverview /></AdminProtectedRoute>} />
          <Route path="/admin/users" element={<AdminProtectedRoute><UserInspector /></AdminProtectedRoute>} />
          <Route path="/admin/at-risk" element={<AdminProtectedRoute><AtRiskUsers /></AdminProtectedRoute>} />
          <Route path="/admin/feedback" element={<AdminProtectedRoute><FeedbackCenter /></AdminProtectedRoute>} />
          <Route path="/admin/analytics" element={<AdminProtectedRoute><AdminAnalytics /></AdminProtectedRoute>} />
          <Route path="/admin/notifications" element={<AdminProtectedRoute><AdminNotifications /></AdminProtectedRoute>} />
          <Route path="/admin/panel" element={<AdminProtectedRoute><AdminPanel /></AdminProtectedRoute>} />
          <Route path="/admin/command" element={<AdminProtectedRoute><AdminCommandCenter /></AdminProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => {
  const [splashDone, setSplashDone] = useState(!isNative);

  if (!splashDone) {
    return (
      <ThemeProvider>
        <NativeSplash onComplete={() => setSplashDone(true)} />
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <CapacitorProvider>
              <LanguageProvider>
                <AppModeProvider>
                  <TooltipProvider>
                    <AppContent />
                  </TooltipProvider>
                </AppModeProvider>
              </LanguageProvider>
            </CapacitorProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
