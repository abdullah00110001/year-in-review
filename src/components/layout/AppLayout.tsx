import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import QuickActionFAB from './QuickActionFAB';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:z-50 lg:w-64">
        <Sidebar />
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Main content with proper spacing */}
      <main className="flex-1 w-full overflow-x-hidden pt-16 lg:pt-0 lg:pl-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>

      {/* Quick Action FAB */}
      <QuickActionFAB />
    </div>
  );
}