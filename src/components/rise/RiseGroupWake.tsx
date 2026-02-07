import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Bell,
  CheckCircle2,
  Clock,
  Zap,
  Moon,
  Sunrise,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RiseStreak {
  current_streak: number;
  is_recovery_mode: boolean;
}

interface RiseGroupWakeProps {
  streak: RiseStreak | null;
}

interface GroupMember {
  id: string;
  name: string;
  status: 'sleeping' | 'waking' | 'awake' | 'confirmed';
  scheduled_time: string;
  woke_at?: string;
}

export function RiseGroupWake({ streak }: RiseGroupWakeProps) {
  const { user } = useAuth();
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulated group members for demo
    setGroupMembers([
      { id: '1', name: 'Ahmed', status: 'confirmed', scheduled_time: '04:30', woke_at: '04:28' },
      { id: '2', name: 'Yusuf', status: 'awake', scheduled_time: '04:30', woke_at: '04:35' },
      { id: '3', name: 'Ibrahim', status: 'waking', scheduled_time: '04:30' },
      { id: '4', name: 'Omar', status: 'sleeping', scheduled_time: '04:30' }
    ]);
    setIsLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500 text-white';
      case 'awake': return 'bg-blue-500 text-white';
      case 'waking': return 'bg-amber-500 text-white';
      case 'sleeping': return 'bg-slate-500 text-white';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="h-4 w-4" />;
      case 'awake': return <Sunrise className="h-4 w-4" />;
      case 'waking': return <Clock className="h-4 w-4" />;
      case 'sleeping': return <Moon className="h-4 w-4" />;
      default: return null;
    }
  };

  const sendWakeSignal = async (memberId: string) => {
    toast.success('Wake signal sent! 🔔');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Group Status Overview */}
      <Card className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-blue-500/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Fajr Warriors
            </CardTitle>
            <Badge variant="outline" className="border-blue-500/30">
              4 members
            </Badge>
          </div>
          <CardDescription>
            Wake together at 4:30 AM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-around py-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-500">2</p>
              <p className="text-xs text-muted-foreground">Confirmed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">1</p>
              <p className="text-xs text-muted-foreground">Awake</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">1</p>
              <p className="text-xs text-muted-foreground">Waking</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Group Members */}
      <div className="space-y-3">
        {groupMembers.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{member.scheduled_time}</span>
                      {member.woke_at && (
                        <>
                          <span>→</span>
                          <span className="text-emerald-500">{member.woke_at}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(member.status)}>
                    {getStatusIcon(member.status)}
                    <span className="ml-1 capitalize">{member.status}</span>
                  </Badge>
                  
                  {(member.status === 'sleeping' || member.status === 'waking') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendWakeSignal(member.id)}
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Request */}
      <Card className="bg-amber-500/10 border-amber-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Bell className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Omar needs help waking up!</p>
              <p className="text-xs text-muted-foreground">
                He's been snoozing for 10 minutes
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => sendWakeSignal('4')}>
              <Zap className="h-4 w-4 mr-1" />
              Wake
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How Group Wake Works */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">How Group Wake Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold">1</span>
            </div>
            <p>Alarm rings for everyone at the same time</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold">2</span>
            </div>
            <p>Group sees your wake status in real-time</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold">3</span>
            </div>
            <p>If you snooze too much, friends can send wake signals</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold">4</span>
            </div>
            <p>Confirm "I'm awake" to complete your morning rise</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}