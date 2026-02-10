import { useState, useEffect, useCallback } from 'react';
import {
  getSyncStatus,
  syncPendingOperations,
  subscribeSyncStatus,
  initializeOfflineSync,
  queueOfflineOperation,
  SyncStatus
} from '@/lib/capacitor/offlineSync';
import { isConnected } from '@/lib/capacitor/nativeNetwork';
import { toast } from 'sonner';

export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    errors: [],
  });
  const [isOnline, setIsOnline] = useState(true);

  // Initialize sync on mount
  useEffect(() => {
    initializeOfflineSync();
    
    // Subscribe to status changes
    const unsubscribe = subscribeSyncStatus(status => {
      setSyncStatus(status);
    });

    // Get initial status
    getSyncStatus().then(setSyncStatus);
    isConnected().then(setIsOnline);

    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (syncStatus.isSyncing) return false;
    
    if (!isOnline) {
      toast.error('You are offline', {
        description: 'Sync will happen automatically when you reconnect',
      });
      return false;
    }

    const success = await syncPendingOperations();
    
    if (success) {
      toast.success('Sync complete', {
        description: `${syncStatus.pendingCount} items synced`,
      });
    } else {
      toast.error('Sync failed', {
        description: 'Some items could not be synced',
      });
    }

    return success;
  }, [syncStatus, isOnline]);

  // Queue an operation for offline sync
  const queueOperation = useCallback(async (
    type: 'insert' | 'update' | 'delete',
    table: string,
    data: any
  ) => {
    await queueOfflineOperation({ type, table, data });
    
    if (!isOnline) {
      toast.info('Saved offline', {
        description: 'Will sync when connected',
      });
    }
  }, [isOnline]);

  // Format last sync time
  const lastSyncFormatted = syncStatus.lastSyncTime
    ? new Date(syncStatus.lastSyncTime).toLocaleTimeString()
    : 'Never';

  return {
    ...syncStatus,
    isOnline,
    lastSyncFormatted,
    triggerSync,
    queueOperation,
  };
}
