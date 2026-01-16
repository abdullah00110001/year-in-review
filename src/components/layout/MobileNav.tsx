import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Target, 
  LayoutDashboard, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  LogOut,
  Calendar,
  Flame,
  BookOpen,
  Map,
  Clock,
  Trophy,
  PieChart,
  GraduationCap,
  Image,
  Mail,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function MobileNav() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    setIsAdmin(data === true);
  };

  // Swipe gesture handling
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeDistance = touchEndX.current - touchStartX.current;
      const minSwipeDistance = 50;

      // Swipe right from left edge opens menu
      if (swipeDistance > minSwipeDistance && touchStartX.current < 50) {
        setOpen(true);
      }
      // Swipe left closes menu
      if (swipeDistance < -minSwipeDistance && open) {
        setOpen(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [open]);

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.journey'), href: '/journey', icon: Map },
    { name: t('nav.goals'), href: '/goals', icon: Target },
    { name: t('nav.quarterlyGoals'), href: '/quarterly-goals', icon: Target },
    { name: t('nav.habits'), href: '/habits', icon: CheckSquare },
    { name: t('nav.timeTracking'), href: '/time-tracking', icon: Clock },
    { name: t('nav.lifeDistribution'), href: '/life-distribution', icon: PieChart },
    { name: t('nav.knowledgeShelf'), href: '/knowledge-shelf', icon: GraduationCap },
    { name: t('nav.monthlyHighlights'), href: '/monthly-highlights', icon: Image },
    { name: t('nav.futureLetter'), href: '/future-letter', icon: Mail },
    { name: t('nav.leaderboard'), href: '/leaderboard', icon: Trophy },
    { name: t('nav.calendar'), href: '/calendar', icon: Calendar },
    { name: t('nav.heatmap'), href: '/heatmap', icon: Flame },
    { name: t('nav.journal'), href: '/journal', icon: BookOpen },
    { name: t('nav.analytics'), href: '/analytics', icon: BarChart3 },
    ...(isAdmin ? [{ name: t('nav.admin'), href: '/admin', icon: Shield }] : []),
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden fixed top-3 left-3 z-50 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg border"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold">{t('app.name')}</span>
              <span className="text-[10px] text-muted-foreground -mt-1">{t('app.tagline')}</span>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-3">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                               (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all active:scale-[0.98]',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted active:bg-muted'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-foreground hover:bg-muted active:scale-[0.98]"
              onClick={() => {
                signOut();
                setOpen(false);
              }}
            >
              <LogOut className="h-5 w-5" />
              {t('nav.signOut')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
