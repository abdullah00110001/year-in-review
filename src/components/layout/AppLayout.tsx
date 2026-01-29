import { ReactNode, useCallback } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import QuickActionFAB from './QuickActionFAB';
import OfflineIndicator from '@/components/OfflineIndicator';
import SyncStatus from '@/components/SyncStatus';
import PullToRefresh from '@/components/pwa/PullToRefresh';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
    await new Promise(resolve => setTimeout(resolve, 500));
  }, [queryClient]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Offline Indicator Banner */}
      <OfflineIndicator />
      
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:z-50 lg:w-64">
        <Sidebar />
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Main content area */}
      <main className="flex-1 w-full pt-16 lg:pt-0 lg:pl-64">
        {/* Desktop Sync Status */}
        <div className="hidden lg:flex lg:justify-end lg:p-2 lg:border-b lg:border-border">
          <SyncStatus />
        </div>
        
        {/* Content - Use PullToRefresh only on mobile */}
        {isMobile ? (
          <PullToRefresh 
            onRefresh={handleRefresh}
            className="min-h-[calc(100vh-4rem)] pb-24"
          >
            <div className="animate-fade-in">
              {children}
            </div>
          </PullToRefresh>
        ) : (
          <div className="min-h-screen pb-8 animate-fade-in">
            {children}
          </div>
        )}
      </main>

      {/* Quick Action FAB */}
      <QuickActionFAB />
    </div>
  );
}
