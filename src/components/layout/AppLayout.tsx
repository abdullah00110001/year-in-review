import { ReactNode, useCallback } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import QuickActionFAB from './QuickActionFAB';
import OfflineIndicator from '@/components/OfflineIndicator';
import SyncStatus from '@/components/SyncStatus';
import PullToRefresh from '@/components/pwa/PullToRefresh';
import { useQueryClient } from '@tanstack/react-query';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const queryClient = useQueryClient();

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    // Invalidate all queries to refetch data
    await queryClient.invalidateQueries();
    // Small delay to show the refresh animation
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
      
      {/* Main content with proper spacing */}
      <main className="flex-1 w-full overflow-x-hidden overflow-y-auto pt-16 lg:pt-0 lg:pl-64" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Desktop Sync Status */}
        <div className="hidden lg:flex lg:justify-end lg:p-2 lg:border-b lg:border-border">
          <SyncStatus />
        </div>
        
        {/* Pull to Refresh wrapper for mobile */}
        <PullToRefresh 
          onRefresh={handleRefresh}
          className="min-h-[calc(100vh-4rem)] lg:min-h-screen pb-20 lg:pb-0"
        >
          <div className="animate-fade-in">
            {children}
          </div>
        </PullToRefresh>
      </main>

      {/* Quick Action FAB */}
      <QuickActionFAB />
    </div>
  );
}
