import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { supabase } from '@/integrations/supabase/client';
import {
  saveDailyEntry,
  getDailyEntriesByDate,
  addToPendingSync,
} from '@/lib/offlineStorage';
import { processSyncQueue } from '@/lib/syncManager';

interface DailyEntryData {
  id?: string;
  date: string;
  [key: string]: unknown;
}

export function useOfflineEntry(selectedDate: string) {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [entry, setEntry] = useState<DailyEntryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Fetch entry - tries online first, falls back to cache
  const fetchEntry = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (isOnline) {
        // Try to fetch from Supabase
        const { data, error } = await supabase
          .from('daily_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', selectedDate)
          .maybeSingle();

        if (!error && data) {
          setEntry(data as DailyEntryData);
          setIsFromCache(false);
          setLastSynced(new Date().toISOString());

          // Cache the entry locally
          await saveDailyEntry({
            id: `${user.id}-${selectedDate}`,
            user_id: user.id,
            date: selectedDate,
            data: data as Record<string, unknown>,
            synced: true,
            updated_at: new Date().toISOString(),
          });
          return;
        }
      }

      // Fallback to cached data
      const cached = await getDailyEntriesByDate(selectedDate);
      const userEntry = cached.find((e) => e.user_id === user.id);
      
      if (userEntry) {
        setEntry({ ...(userEntry.data as DailyEntryData), date: selectedDate });
        setIsFromCache(true);
        setLastSynced(userEntry.updated_at);
      } else {
        setEntry(null);
      }
    } catch (error) {
      console.error('Error fetching entry:', error);
      
      // Try cache on error
      const cached = await getDailyEntriesByDate(selectedDate);
      const userEntry = cached.find((e) => e.user_id === user.id);
      
      if (userEntry) {
        setEntry({ ...(userEntry.data as DailyEntryData), date: selectedDate });
        setIsFromCache(true);
      }
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate, isOnline]);

  // Save entry - saves to cache first, then syncs if online
  const saveEntry = useCallback(async (data: Partial<DailyEntryData>) => {
    if (!user) return false;
    setSaving(true);

    const entryData = {
      ...entry,
      ...data,
      date: selectedDate,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    try {
      // Always save to cache first
      const cacheId = `${user.id}-${selectedDate}`;
      await saveDailyEntry({
        id: cacheId,
        user_id: user.id,
        date: selectedDate,
        data: entryData as Record<string, unknown>,
        synced: false,
        updated_at: new Date().toISOString(),
      });

      setEntry(entryData as DailyEntryData);

      if (isOnline) {
        // Try to sync immediately
        const { data: existing } = await supabase
          .from('daily_entries')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', selectedDate)
          .maybeSingle();

        let error;
        if (existing?.id) {
          const { error: updateError } = await supabase
            .from('daily_entries')
            .update(entryData)
            .eq('id', existing.id);
          error = updateError;
        } else {
          const { error: insertError } = await supabase
            .from('daily_entries')
            .insert(entryData);
          error = insertError;
        }

        if (!error) {
          // Mark as synced in cache
          await saveDailyEntry({
            id: cacheId,
            user_id: user.id,
            date: selectedDate,
            data: entryData as Record<string, unknown>,
            synced: true,
            updated_at: new Date().toISOString(),
          });
          setIsFromCache(false);
          setLastSynced(new Date().toISOString());
          return true;
        }
      }

      // If offline or sync failed, add to pending queue
      await addToPendingSync(
        'daily_entries',
        entry?.id ? 'update' : 'insert',
        entryData as Record<string, unknown>
      );
      
      setIsFromCache(true);
      return true;
    } catch (error) {
      console.error('Error saving entry:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, selectedDate, entry, isOnline]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && user) {
      processSyncQueue();
    }
  }, [isOnline, user]);

  // Fetch entry when date or user changes
  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  return {
    entry,
    setEntry,
    loading,
    saving,
    saveEntry,
    isFromCache,
    lastSynced,
    refetch: fetchEntry,
  };
}
