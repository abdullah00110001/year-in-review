import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, Sunrise, TrendingUp, Shield, Trophy, Clock } from 'lucide-react';
import { useGroupSettings } from '@/hooks/useGroupSettings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface AreaStat {
  area: string;
  awakeCount: number;
  totalUsers: number;
  percentage: number;
}

interface WakeEvent {
  id: string;
  time: string;
  area: string;
  displayName: string;
  avatarUrl: string | null;
  type: 'fajr' | 'tahajjud' | 'early';
}

export function CommunityWakeFeed() {
  const { user } = useAuth();
  const { settings, updateSettings } = useGroupSettings();
  const [areaStats, setAreaStats] = useState<AreaStat[]>([]);
  const [recentWakes, setRecentWakes] = useState<WakeEvent[]>([]);
  const [stats, setStats] = useState({ awakeToday: 0, totalUsers: 0 });

  useEffect(() => {
    void loadFeed();
    const ch = supabase
      .channel('community_wake_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_wake_events' }, () => {
        void loadFeed();
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, []);

  async function loadFeed() {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: events } = await supabase
        .from('community_wake_events' as any)
        .select('id, user_id, wake_time, city, event_type')
        .gte('wake_time', since)
        .order('wake_time', { ascending: false })
        .limit(30);

      const rows = ((events as any[]) || []);
      // Fetch real profiles for the users
      const uniqueIds = Array.from(new Set(rows.map((r: any) => r.user_id)));
      const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      if (uniqueIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', uniqueIds as any);
        (profiles ?? []).forEach((p: any) => profileMap.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }));
      }
      setRecentWakes(rows.slice(0, 10).map((e) => {
        const p = profileMap.get(e.user_id);
        return {
          id: e.id,
          time: formatDistanceToNow(new Date(e.wake_time), { addSuffix: true }),
          area: e.city || 'Unknown',
          displayName: p?.full_name || 'Member',
          avatarUrl: p?.avatar_url || null,
          type: e.event_type,
        } as WakeEvent;
      }));

      const byCity: Record<string, number> = {};
      rows.forEach((r) => { byCity[r.city || 'Unknown'] = (byCity[r.city || 'Unknown'] || 0) + 1; });

      const { count: totalLoc } = await supabase
        .from('user_locations' as any)
        .select('user_id', { count: 'exact', head: true })
        .eq('opted_in', true);

      const total = totalLoc || rows.length;
      setStats({ awakeToday: rows.length, totalUsers: total });

      setAreaStats(
        Object.entries(byCity)
          .map(([area, awake]) => ({
            area,
            awakeCount: awake,
            totalUsers: total,
            percentage: total > 0 ? Math.round((awake / total) * 100) : 0,
          }))
          .sort((a, b) => b.awakeCount - a.awakeCount)
          .slice(0, 5)
      );
    } catch (err) {
      console.error('Community feed load failed (likely needs migration):', err);
    }
  }

  async function logMyWake(type: 'fajr' | 'tahajjud' | 'early') {
    if (!user) return;
    try {
      await supabase.from('community_wake_events' as any).insert({
        user_id: user.id,
        city: settings.city || null,
        event_type: type,
        anonymous: false,
      });
      await loadFeed();
    } catch (err) {
      console.error('Log wake failed', err);
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fajr': return 'bg-primary/10 text-primary border-primary/20';
      case 'tahajjud': return 'bg-secondary text-secondary-foreground border-border';
      case 'early': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const successRate = stats.totalUsers > 0 ? Math.round((stats.awakeToday / stats.totalUsers) * 100) : 0;

  return (
    <div className="space-y-4">
      {!settings.locationOptIn && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Enable city-based community insights</h3>
                <p className="text-xs text-muted-foreground mb-3">You will only share your city, never your exact location.</p>
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <Shield className="h-3 w-3" />Privacy-safe city level data only
                </div>
              </div>
            </div>
            <Button className="w-full mt-3" size="sm" onClick={() => void updateSettings({ locationOptIn: true, city: settings.city || 'Dhaka' })}>
              <Globe className="h-4 w-4 mr-2" />Enable location sharing
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm flex items-center gap-2"><Sunrise className="h-4 w-4 text-primary" />Log my wake</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void logMyWake('fajr')}>Fajr</Button>
          <Button size="sm" variant="outline" onClick={() => void logMyWake('tahajjud')}>Tahajjud</Button>
          <Button size="sm" variant="outline" onClick={() => void logMyWake('early')}>Early</Button>
        </CardContent>
      </Card>

      {areaStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" />Area leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {areaStats.map((stat, index) => (
              <div key={stat.area} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold w-6 text-center text-primary">{index + 1}</span>
                  <div>
                    <p className="font-medium text-sm flex items-center gap-1"><MapPin className="h-3 w-3" />{stat.area}</p>
                    <p className="text-xs text-muted-foreground">{stat.awakeCount} awake in last 24h</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-600">{stat.percentage}%</span>
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Sunrise className="h-4 w-4 text-primary" />Recent wake activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentWakes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No recent wakes. Be the first — log your wake above.
            </p>
          ) : recentWakes.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                {event.avatarUrl ? (
                  <img src={event.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                    {event.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{event.displayName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /><span>{event.area}</span><span>•</span><Clock className="h-3 w-3" /><span>{event.time}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={cn('text-xs', getTypeColor(event.type))}>{event.type}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-around py-2">
            <div className="text-center"><p className="text-2xl font-bold text-emerald-600">{stats.awakeToday}</p><p className="text-xs text-muted-foreground">Awake today</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-primary">{stats.totalUsers}</p><p className="text-xs text-muted-foreground">Tracked users</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-blue-600">{successRate}%</p><p className="text-xs text-muted-foreground">Success rate</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
