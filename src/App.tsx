import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppModeProvider } from "@/contexts/AppModeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
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
import AdminDashboard from "./pages/AdminDashboard";
import AdminOverview from "./pages/admin/AdminOverview";
import UserInspector from "./pages/admin/UserInspector";
import AtRiskUsers from "./pages/admin/AtRiskUsers";
import FeedbackCenter from "./pages/admin/FeedbackCenter";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminCommandCenter from "./pages/admin/AdminCommandCenter";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <AppModeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/goals"
                  element={
                    <ProtectedRoute>
                      <Goals />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/goals/new"
                  element={
                    <ProtectedRoute>
                      <Goals />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/habits"
                  element={
                    <ProtectedRoute>
                      <Habits />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/habits/new"
                  element={
                    <ProtectedRoute>
                      <Habits />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <ProtectedRoute>
                      <Calendar />
                    </ProtectedRoute>
                  }
                />
                {/* Heatmap merged into Calendar */}
                <Route
                  path="/journal"
                  element={
                    <ProtectedRoute>
                      <Journal />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/journey"
                  element={
                    <ProtectedRoute>
                      <Journey />
                    </ProtectedRoute>
                  }
                />
                {/* Time Tracking merged into Life Distribution */}
                <Route
                  path="/leaderboard"
                  element={
                    <ProtectedRoute>
                      <Leaderboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/life-distribution"
                  element={
                    <ProtectedRoute>
                      <LifeDistribution />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/knowledge-shelf"
                  element={
                    <ProtectedRoute>
                      <KnowledgeShelf />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/quarterly-goals"
                  element={
                    <ProtectedRoute>
                      <QuarterlyGoals />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/monthly-highlights"
                  element={
                    <ProtectedRoute>
                      <MonthlyHighlights />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/future-letter"
                  element={
                    <ProtectedRoute>
                      <FutureLetter />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminProtectedRoute>
                      <AdminOverview />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminProtectedRoute>
                      <UserInspector />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/at-risk"
                  element={
                    <AdminProtectedRoute>
                      <AtRiskUsers />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/feedback"
                  element={
                    <AdminProtectedRoute>
                      <FeedbackCenter />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <AdminProtectedRoute>
                      <AdminAnalytics />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/notifications"
                  element={
                    <AdminProtectedRoute>
                      <AdminNotifications />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/wrapped"
                  element={
                    <ProtectedRoute>
                      <YearEndWrapped />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/export"
                  element={
                    <ProtectedRoute>
                      <DataExport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/daily-input"
                  element={
                    <ProtectedRoute>
                      <DailyInput />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/night-muhasaba"
                  element={
                    <ProtectedRoute>
                      <NightMuhasaba />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/monthly-review"
                  element={
                    <ProtectedRoute>
                      <MonthlyReview />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/intelligence"
                  element={
                    <ProtectedRoute>
                      <IntelligenceEngine />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/weekly-review"
                  element={
                    <ProtectedRoute>
                      <WeeklyReview />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin-command"
                  element={
                    <ProtectedRoute>
                      <AdminCommand />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/gamification"
                  element={
                    <ProtectedRoute>
                      <Gamification />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/insights"
                  element={
                    <ProtectedRoute>
                      <Insights />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/islamic-dashboard"
                  element={
                    <ProtectedRoute>
                      <IslamicDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/unified-dashboard"
                  element={
                    <ProtectedRoute>
                      <UnifiedDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/command"
                  element={
                    <AdminProtectedRoute>
                      <AdminCommandCenter />
                    </AdminProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AppModeProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
