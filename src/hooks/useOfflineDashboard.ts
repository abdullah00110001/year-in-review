import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { supabase } from '@/integrations/supabase/client';
import {
  getAppState,
  setAppState,
  cacheChallenges,
  getCachedChallenges,
} from '@/lib/offlineStorage';
import { format } from 'date-fns';

interface DashboardStats {
  totalGoals: number;
  totalHabits: number;
  todayCompleted: number;
  todayTotal: number;
}

interface CachedDashboardData {
  stats: DashboardStats;
  recentHabits: any[];
  cachedAt: string;
}

const CACHE_KEY = 'dashboard_data';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useOfflineDashboard() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [stats, setStats] = useState<DashboardStats>({
    totalGoals: 0,
    totalHabits: 0,
    todayCompleted: 0,
    todayTotal: 0,
  });
  const [recentHabits, setRecentHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    
    try {
      // Check cache first
      const cached = await getAppState<CachedDashboardData>(CACHE_KEY);
      const isCacheValid = cached && 
        new Date().getTime() - new Date(cached.cachedAt).getTime() < CACHE_DURATION;

      if (!isOnline) {
        // Use cache when offline
        if (cached) {
          setStats(cached.stats);
          setRecentHabits(cached.recentHabits);
          setIsFromCache(true);
          setLastSynced(cached.cachedAt);
        }
        setLoading(false);
        return;
      }

      // Fetch fresh data when online
      const today = format(new Date(), 'yyyy-MM-dd');

      const [goalsResult, habitsResult, entriesResult] = await Promise.all([
        supabase
          .from('goals')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('habits')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(5),
        supabase
          .from('habit_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today),
      ]);

      const completedToday = entriesResult.data?.filter(e => e.completed).length || 0;
      const habitsCount = habitsResult.count || 0;

      const newStats: DashboardStats = {
        totalGoals: goalsResult.count || 0,
        totalHabits: habitsCount,
        todayCompleted: completedToday,
        todayTotal: habitsCount,
      };

      const habits = habitsResult.data || [];

      setStats(newStats);
      setRecentHabits(habits);
      setIsFromCache(false);
      setLastSynced(new Date().toISOString());

      // Update cache
      await setAppState(CACHE_KEY, {
        stats: newStats,
        recentHabits: habits,
        cachedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Fallback to cache on error
      const cached = await getAppState<CachedDashboardData>(CACHE_KEY);
      if (cached) {
        setStats(cached.stats);
        setRecentHabits(cached.recentHabits);
        setIsFromCache(true);
        setLastSynced(cached.cachedAt);
      }
    } finally {
      setLoading(false);
    }
  }, [user, isOnline]);

  // Fetch challenges and cache them
  const fetchChallenges = useCallback(async () => {
    if (!user) return [];

    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .eq('is_active', true);

        if (!error && data) {
          await cacheChallenges(data as Record<string, unknown>[]);
          return data;
        }
      }

      // Return cached challenges
      return await getCachedChallenges();
    } catch (error) {
      console.error('Error fetching challenges:', error);
      return await getCachedChallenges();
    }
  }, [user, isOnline]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Refetch when coming online
  useEffect(() => {
    if (isOnline && user) {
      fetchDashboardData();
    }
  }, [isOnline, user]);

  return {
    stats,
    recentHabits,
    loading,
    isFromCache,
    lastSynced,
    refetch: fetchDashboardData,
    fetchChallenges,
  };
}
