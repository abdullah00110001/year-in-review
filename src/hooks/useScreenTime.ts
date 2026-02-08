import { useState, useEffect } from 'react';
import { isNative } from '@/lib/capacitor/platform';

interface AppUsage {
  packageName: string;
  appName: string;
  usageMinutes: number;
  launchCount: number;
  lastUsed: string;
  icon?: string;
}

interface ScreenTimeData {
  totalScreenTimeMinutes: number;
  totalAppLaunches: number;
  appUsage: AppUsage[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

// Mock data for web preview - in native app, this comes from UsageStatsManager
const generateMockData = (): { screenTime: number; appLaunches: number; apps: AppUsage[] } => {
  const apps: AppUsage[] = [
    { packageName: 'com.instagram.android', appName: 'Instagram', usageMinutes: 127, launchCount: 45, lastUsed: new Date().toISOString() },
    { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok', usageMinutes: 98, launchCount: 32, lastUsed: new Date().toISOString() },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', usageMinutes: 76, launchCount: 89, lastUsed: new Date().toISOString() },
    { packageName: 'com.google.android.youtube', appName: 'YouTube', usageMinutes: 65, launchCount: 12, lastUsed: new Date().toISOString() },
    { packageName: 'com.twitter.android', appName: 'X (Twitter)', usageMinutes: 43, launchCount: 28, lastUsed: new Date().toISOString() },
    { packageName: 'com.facebook.katana', appName: 'Facebook', usageMinutes: 38, launchCount: 15, lastUsed: new Date().toISOString() },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', usageMinutes: 29, launchCount: 21, lastUsed: new Date().toISOString() },
    { packageName: 'com.spotify.music', appName: 'Spotify', usageMinutes: 52, launchCount: 8, lastUsed: new Date().toISOString() },
  ];

  const totalScreenTime = apps.reduce((sum, app) => sum + app.usageMinutes, 0);
  const totalLaunches = apps.reduce((sum, app) => sum + app.launchCount, 0);

  return {
    screenTime: totalScreenTime,
    appLaunches: totalLaunches,
    apps: apps.sort((a, b) => b.usageMinutes - a.usageMinutes),
  };
};

export function useScreenTime(): ScreenTimeData {
  const [totalScreenTimeMinutes, setTotalScreenTimeMinutes] = useState(0);
  const [totalAppLaunches, setTotalAppLaunches] = useState(0);
  const [appUsage, setAppUsage] = useState<AppUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNativeScreenTime = async () => {
    // This would be called from Capacitor native bridge
    // For now, we simulate it with mock data
    // In real Android app, this uses UsageStatsManager
    
    if (isNative) {
      try {
        // Native bridge call would go here
        // const result = await NativeShield.getScreenTimeStats();
        // For now, use mock data
        const mockData = generateMockData();
        return mockData;
      } catch (err) {
        console.error('Failed to get native screen time:', err);
        return generateMockData();
      }
    }
    
    return generateMockData();
  };

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchNativeScreenTime();
      setTotalScreenTimeMinutes(data.screenTime);
      setTotalAppLaunches(data.appLaunches);
      setAppUsage(data.apps);
    } catch (err) {
      setError('Failed to load screen time data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    
    // Refresh every 5 minutes
    const interval = setInterval(refreshData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    totalScreenTimeMinutes,
    totalAppLaunches,
    appUsage,
    isLoading,
    error,
    refreshData,
  };
}
