import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import QuickActionFAB from './QuickActionFAB';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:z-50 lg:w-64">
        <Sidebar />
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Main content area */}
      <main className="flex-1 w-full pt-16 lg:pt-0 lg:pl-64">
        <div className={isMobile ? "min-h-[calc(100vh-4rem)] pb-[90px] animate-fade-in" : "min-h-screen pb-8 animate-fade-in"}>
          {children}
        </div>
      </main>

      {/* Quick Action FAB */}
      <QuickActionFAB />
    </div>
  );
}
