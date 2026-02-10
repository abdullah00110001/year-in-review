import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Settings, 
  ChevronLeft,
  Shield,
  AlertTriangle,
  BarChart3,
  Search,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNavItems = [
  {
    title: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Control Center',
    href: '/admin/panel',
    icon: Shield,
  },
  {
    title: 'User Inspector',
    href: '/admin/users',
    icon: Search,
  },
  {
    title: 'At-Risk Users',
    href: '/admin/at-risk',
    icon: AlertTriangle,
  },
  {
    title: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
  },
  {
    title: 'Feedback Center',
    href: '/admin/feedback',
    icon: MessageSquare,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Admin Sidebar - Desktop */}
      <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:z-50 lg:w-72">
        <div className="flex h-full flex-col border-r bg-card">
          {/* Header */}
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">God Mode</p>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>

            <Separator className="my-4" />

            {/* Back to App */}
            <Link
              to="/dashboard"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              Back to App
            </Link>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                Admin actions are logged for security purposes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-card flex items-center px-4 gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <h2 className="font-bold text-foreground">Admin Panel</h2>
        <div className="flex-1" />
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Exit
          </Link>
        </Button>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-card">
        <nav className="flex h-full items-center justify-around px-2">
          {adminNavItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.title.split(' ')[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-x-hidden overflow-y-auto pt-16 pb-20 lg:pt-0 lg:pb-0 lg:pl-72">
        <div className="min-h-screen p-3 sm:p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
