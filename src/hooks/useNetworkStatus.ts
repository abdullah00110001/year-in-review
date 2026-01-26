import { useState, useEffect, useCallback } from 'react';
import { syncManager } from '@/lib/syncManager';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

interface NetworkStatus {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingCount: number;
  lastSyncTime: Date | null;
  forcSync: () => Promise<void>;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to sync manager updates
    const unsubscribe = syncManager.subscribe((status, count) => {
      setSyncStatus(status);
      setPendingCount(count);
      if (status === 'success') {
        setLastSyncTime(new Date());
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const forcSync = useCallback(async () => {
    await syncManager.forceSyncNow();
  }, []);

  return {
    isOnline,
    syncStatus,
    pendingCount,
    lastSyncTime,
    forcSync,
  };
}
