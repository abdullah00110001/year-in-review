import { getPendingSync, removePendingSync, incrementPendingSyncRetry } from './offlineStorage';
import { supabase } from '@/integrations/supabase/client';

const SYNC_TAG = 'yearly-track-sync';

// Register background sync
export async function registerBackgroundSync(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('sync' in ServiceWorkerRegistration.prototype)) {
    console.log('[BackgroundSync] Not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // @ts-ignore - sync is not in types but exists
    await registration.sync.register(SYNC_TAG);
    console.log('[BackgroundSync] Registered successfully');
    return true;
  } catch (error) {
    console.error('[BackgroundSync] Registration failed:', error);
    return false;
  }
}

// Process sync when back online
export async function processBackgroundSync(): Promise<void> {
  console.log('[BackgroundSync] Processing...');
  
  try {
    const pendingItems = await getPendingSync();
    
    if (pendingItems.length === 0) {
      console.log('[BackgroundSync] No pending items');
      return;
    }

    console.log(`[BackgroundSync] Processing ${pendingItems.length} items`);

    for (const item of pendingItems) {
      if (item.retries >= 5) {
        console.warn(`[BackgroundSync] Max retries for item ${item.id}`);
        continue;
      }

      try {
        const { table, operation, data } = item;

        switch (operation) {
          case 'insert':
            await supabase.from(table as 'daily_entries').insert(data as never);
            break;
          case 'update':
            await supabase.from(table as 'daily_entries').update(data as never).eq('id', data.id as string);
            break;
          case 'delete':
            await supabase.from(table as 'daily_entries').delete().eq('id', data.id as string);
            break;
        }

        await removePendingSync(item.id);
        console.log(`[BackgroundSync] Synced item ${item.id}`);
      } catch (error) {
        console.error(`[BackgroundSync] Failed item ${item.id}:`, error);
        await incrementPendingSyncRetry(item.id);
      }
    }

    console.log('[BackgroundSync] Complete');
  } catch (error) {
    console.error('[BackgroundSync] Error:', error);
  }
}

// Request persistent storage for better offline support
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persist) {
    console.log('[Storage] Persistent storage not supported');
    return false;
  }

  try {
    const isPersisted = await navigator.storage.persisted();
    if (isPersisted) {
      console.log('[Storage] Already persistent');
      return true;
    }

    const result = await navigator.storage.persist();
    console.log(`[Storage] Persistence ${result ? 'granted' : 'denied'}`);
    return result;
  } catch (error) {
    console.error('[Storage] Error requesting persistence:', error);
    return false;
  }
}

// Get storage estimate
export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage || !navigator.storage.estimate) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  } catch {
    return null;
  }
}

// Initialize background sync
export async function initBackgroundSync(): Promise<void> {
  // Request persistent storage
  await requestPersistentStorage();

  // Register background sync
  await registerBackgroundSync();

  // Listen for online events
  window.addEventListener('online', () => {
    console.log('[BackgroundSync] Back online, triggering sync...');
    processBackgroundSync();
    registerBackgroundSync();
  });

  // Process any pending syncs on load
  if (navigator.onLine) {
    processBackgroundSync();
  }
}
