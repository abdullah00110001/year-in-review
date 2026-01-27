import { useState, useEffect, useCallback } from 'react';
import { Workbox } from 'workbox-window';

interface ServiceWorkerState {
  needRefresh: boolean;
  offlineReady: boolean;
  updateServiceWorker: () => Promise<void>;
  isUpdating: boolean;
}

export function useServiceWorker(): ServiceWorkerState {
  const [isUpdating, setIsUpdating] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [wb, setWb] = useState<Workbox | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      const workbox = new Workbox('/sw.js');

      workbox.addEventListener('installed', (event) => {
        if (event.isUpdate) {
          setNeedRefresh(true);
        } else {
          setOfflineReady(true);
        }
      });

      workbox.addEventListener('waiting', () => {
        setNeedRefresh(true);
      });

      workbox.addEventListener('controlling', () => {
        window.location.reload();
      });

      workbox.register().then(() => {
        console.log('[SW] Registered successfully');
      }).catch((error) => {
        console.error('[SW] Registration error:', error);
      });

      setWb(workbox);

      // Check for updates periodically
      const interval = setInterval(() => {
        workbox.update();
      }, 60 * 60 * 1000); // Every hour

      return () => clearInterval(interval);
    }
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!wb) return;
    
    setIsUpdating(true);
    try {
      // Tell the waiting service worker to become active
      wb.messageSkipWaiting();
    } finally {
      setIsUpdating(false);
    }
  }, [wb]);

  // Auto-dismiss offline ready notification
  useEffect(() => {
    if (offlineReady) {
      const timer = setTimeout(() => {
        setOfflineReady(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady]);

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker: handleUpdate,
    isUpdating,
  };
}
