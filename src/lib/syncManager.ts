import { supabase } from '@/integrations/supabase/client';
import {
  getPendingSync,
  removePendingSync,
  incrementPendingSyncRetry,
  markDailyEntrySynced,
  getUnsyncedDailyEntries,
  getPendingSyncCount,
} from './offlineStorage';

const MAX_RETRIES = 5;
const RETRY_DELAY_BASE = 1000; // 1 second

type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';
type SyncListener = (status: SyncStatus, pendingCount: number) => void;

class SyncManager {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private listeners: Set<SyncListener> = new Set();
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Start periodic sync check
    this.startPeriodicSync();
  }

  private handleOnline = () => {
    this.isOnline = true;
    console.log('[SyncManager] Back online, triggering sync...');
    this.sync();
  };

  private handleOffline = () => {
    this.isOnline = false;
    console.log('[SyncManager] Gone offline');
    this.notifyListeners('idle', 0);
  };

  private startPeriodicSync() {
    // Check for pending syncs every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync();
      }
    }, 30000);
  }

  subscribe(listener: SyncListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async notifyListeners(status: SyncStatus, pendingCount?: number) {
    const count = pendingCount ?? (await getPendingSyncCount());
    this.listeners.forEach((listener) => listener(status, count));
  }

  getOnlineStatus() {
    return this.isOnline;
  }

  async sync(): Promise<boolean> {
    if (!this.isOnline || this.isSyncing) {
      return false;
    }

    this.isSyncing = true;
    this.notifyListeners('syncing');

    try {
      // Get all pending sync items
      const pendingItems = await getPendingSync();
      
      if (pendingItems.length === 0) {
        this.notifyListeners('success', 0);
        this.isSyncing = false;
        return true;
      }

      console.log(`[SyncManager] Syncing ${pendingItems.length} items...`);

      let successCount = 0;
      let failCount = 0;

      for (const item of pendingItems) {
        if (item.retries >= MAX_RETRIES) {
          console.warn(`[SyncManager] Max retries reached for item ${item.id}, skipping`);
          failCount++;
          continue;
        }

        try {
          await this.syncItem(item);
          await removePendingSync(item.id);
          successCount++;
        } catch (error) {
          console.error(`[SyncManager] Failed to sync item ${item.id}:`, error);
          await incrementPendingSyncRetry(item.id);
          failCount++;
          
          // Exponential backoff for retries
          const delay = RETRY_DELAY_BASE * Math.pow(2, item.retries);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // Also sync any unsynced daily entries
      await this.syncDailyEntries();

      console.log(`[SyncManager] Sync complete: ${successCount} success, ${failCount} failed`);
      
      const remainingCount = await getPendingSyncCount();
      this.notifyListeners(failCount > 0 ? 'error' : 'success', remainingCount);
      
      this.isSyncing = false;
      return failCount === 0;
    } catch (error) {
      console.error('[SyncManager] Sync error:', error);
      this.notifyListeners('error');
      this.isSyncing = false;
      return false;
    }
  }

  private async syncItem(item: {
    table: string;
    operation: 'insert' | 'update' | 'delete';
    data: Record<string, unknown>;
  }) {
    const { table, operation, data } = item;

    switch (operation) {
      case 'insert':
        const { error: insertError } = await supabase
          .from(table as 'daily_entries')
          .insert(data as never);
        if (insertError) throw insertError;
        break;

      case 'update':
        const { error: updateError } = await supabase
          .from(table as 'daily_entries')
          .update(data as never)
          .eq('id', data.id as string);
        if (updateError) throw updateError;
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from(table as 'daily_entries')
          .delete()
          .eq('id', data.id as string);
        if (deleteError) throw deleteError;
        break;
    }
  }

  private async syncDailyEntries() {
    const unsyncedEntries = await getUnsyncedDailyEntries();
    
    for (const entry of unsyncedEntries) {
      try {
        const { error } = await supabase
          .from('daily_entries')
          .upsert(entry.data as never);
        
        if (!error) {
          await markDailyEntrySynced(entry.id);
        }
      } catch (error) {
        console.error('[SyncManager] Failed to sync daily entry:', error);
      }
    }
  }

  async forceSyncNow() {
    return this.sync();
  }

  destroy() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const syncManager = new SyncManager();

// Export a function to process the sync queue
export async function processSyncQueue() {
  return syncManager.sync();
}
