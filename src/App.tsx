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
import UpdatePrompt from "@/components/pwa/UpdatePrompt";
import ScrollToTop from "@/components/ScrollToTop";
import { lazy, Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import PWALoadingScreen from "@/components/pwa/PWALoadingScreen";

// Critical pages loaded eagerly
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// All other pages lazy-loaded to reduce initial bundle
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Goals = lazy(() => import("./pages/Goals"));
const Habits = lazy(() => import("./pages/Habits"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Journal = lazy(() => import("./pages/Journal"));
const Journey = lazy(() => import("./pages/Journey"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const LifeDistribution = lazy(() => import("./pages/LifeDistribution"));
const KnowledgeShelf = lazy(() => import("./pages/KnowledgeShelf"));
const QuarterlyGoals = lazy(() => import("./pages/QuarterlyGoals"));
const MonthlyHighlights = lazy(() => import("./pages/MonthlyHighlights"));
const FutureLetter = lazy(() => import("./pages/FutureLetter"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const YearEndWrapped = lazy(() => import("./pages/YearEndWrapped"));
const DataExport = lazy(() => import("./pages/DataExport"));
const DailyInput = lazy(() => import("./pages/DailyInput"));
const NightMuhasaba = lazy(() => import("./pages/NightMuhasaba"));
const WeeklyReview = lazy(() => import("./pages/WeeklyReview"));
const AdminCommand = lazy(() => import("./pages/AdminCommand"));
const Gamification = lazy(() => import("./pages/Gamification"));
const MonthlyReview = lazy(() => import("./pages/MonthlyReview"));
const IntelligenceEngine = lazy(() => import("./pages/IntelligenceEngine"));
const Insights = lazy(() => import("./pages/Insights"));
const IslamicDashboard = lazy(() => import("./pages/IslamicDashboard"));
const UnifiedDashboard = lazy(() => import("./pages/UnifiedDashboard"));
const Challenges = lazy(() => import("./pages/Challenges"));
const Reflections = lazy(() => import("./pages/Reflections"));
const ComparativeAnalytics = lazy(() => import("./pages/ComparativeAnalytics"));
const Install = lazy(() => import("./pages/Install"));
const ShieldPage = lazy(() => import("./pages/Shield"));
const RisePage = lazy(() => import("./pages/Rise"));
const PDFTools = lazy(() => import("./pages/PDFTools"));

// Admin pages
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const UserInspector = lazy(() => import("./pages/admin/UserInspector"));
const AtRiskUsers = lazy(() => import("./pages/admin/AtRiskUsers"));
const FeedbackCenter = lazy(() => import("./pages/admin/FeedbackCenter"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminCommandCenter = lazy(() => import("./pages/admin/AdminCommandCenter"));
const AdminPDFTools = lazy(() => import("./pages/admin/AdminPDFTools"));
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel"));
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import OfflineIndicator from "./components/OfflineIndicator";

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

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

const App = () => {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return (
      <ThemeProvider>
        <PWALoadingScreen onComplete={() => setSplashDone(true)} minDuration={1200} />
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
                    <Toaster />
                    <Sonner />
                    <OfflineIndicator />
                    <UpdatePrompt />
                    <BrowserRouter>
                      <ScrollToTop />
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/install" element={<Install />} />
                          <Route path="/auth" element={<Auth />} />
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
                          <Route path="/pdf-tools" element={<PDFTools />} />
                          
                          {/* Admin routes */}
                          <Route path="/admin" element={<AdminProtectedRoute><AdminOverview /></AdminProtectedRoute>} />
                          <Route path="/admin/users" element={<AdminProtectedRoute><UserInspector /></AdminProtectedRoute>} />
                          <Route path="/admin/at-risk" element={<AdminProtectedRoute><AtRiskUsers /></AdminProtectedRoute>} />
                          <Route path="/admin/feedback" element={<AdminProtectedRoute><FeedbackCenter /></AdminProtectedRoute>} />
                          <Route path="/admin/analytics" element={<AdminProtectedRoute><AdminAnalytics /></AdminProtectedRoute>} />
                          <Route path="/admin/notifications" element={<AdminProtectedRoute><AdminNotifications /></AdminProtectedRoute>} />
                          <Route path="/admin/panel" element={<AdminProtectedRoute><AdminPanel /></AdminProtectedRoute>} />
                          <Route path="/admin/command" element={<AdminProtectedRoute><AdminCommandCenter /></AdminProtectedRoute>} />
                          <Route path="/admin/pdf-tools" element={<AdminProtectedRoute><AdminPDFTools /></AdminProtectedRoute>} />
                          
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </BrowserRouter>
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
