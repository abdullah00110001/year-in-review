import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Ban, 
  Globe, 
  Type, 
  Film, 
  ChevronRight,
  Shield,
  Coffee
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DisciplineProfile {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  strictness_level: string;
  is_active: boolean;
  blocked_apps: string[];
  blocked_websites: string[];
  blocked_keywords: string[];
  block_infinite_content: boolean;
  block_adult_content: boolean;
  default_duration_minutes: number;
}

interface ShieldSession {
  id: string;
  profile_name: string;
}

interface ShieldQuickActionsProps {
  profiles: DisciplineProfile[];
  onStartSession: (profile: DisciplineProfile) => void;
  activeSession: ShieldSession | null;
}

export function ShieldQuickActions({ profiles, onStartSession, activeSession }: ShieldQuickActionsProps) {
  const quickActions = [
    { icon: Ban, label: 'Apps Blocked', value: profiles.reduce((acc, p) => acc + (p.blocked_apps?.length || 0), 0), hasArrow: true },
    { icon: Globe, label: 'Sites Blocked', value: profiles.reduce((acc, p) => acc + (p.blocked_websites?.length || 0), 0), hasArrow: true },
    { icon: Type, label: 'Keywords Blocked', value: profiles.reduce((acc, p) => acc + (p.blocked_keywords?.length || 0), 0), hasToggle: true, toggleValue: true },
    { icon: Film, label: 'Block Reels/Shorts', value: 'On', hasToggle: true, toggleValue: true }
  ];

  const breakDurations = [
    { label: '30 min', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '4 hours', minutes: 240 },
    { label: '1 day', minutes: 1440 }
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-muted/50 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickActions.map((action, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center">
                  <action.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{action.value}</p>
                  <p className="text-xs text-muted-foreground">{action.label}</p>
                </div>
              </div>
              {action.hasArrow && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
              {action.hasToggle && <Switch checked={action.toggleValue} />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-primary/10 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Take a Break</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {breakDurations.map((duration) => (
              <Button key={duration.minutes} variant="outline" className="flex-shrink-0">
                {duration.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {profiles.slice(0, 3).map((profile) => (
            <Button
              key={profile.id}
              variant="outline"
              className="w-full justify-between h-auto py-3"
              onClick={() => onStartSession(profile)}
              disabled={!!activeSession}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{profile.icon}</span>
                <div className="text-left">
                  <p className="font-medium">{profile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.default_duration_minutes} min • {profile.strictness_level}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}