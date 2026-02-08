import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Globe, 
  Type, 
  Film, 
  ChevronRight,
  Shield,
  ShieldAlert,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShieldQuickActionsProps {
  blockedAppsCount: number;
  blockedSitesCount: number;
  blockedKeywordsCount: number;
  reelsBlockEnabled: boolean;
  adultBlockEnabled: boolean;
  onReelsToggle: (value: boolean) => void;
  onAdultToggle: (value: boolean) => void;
  onManageApps: () => void;
  onManageSites: () => void;
  onManageKeywords: () => void;
}

export function ShieldQuickActions({
  blockedAppsCount,
  blockedSitesCount,
  blockedKeywordsCount,
  reelsBlockEnabled,
  adultBlockEnabled,
  onReelsToggle,
  onAdultToggle,
  onManageApps,
  onManageSites,
  onManageKeywords
}: ShieldQuickActionsProps) {
  const quickActions = [
    { 
      icon: Smartphone, 
      label: 'Apps Blocked', 
      value: blockedAppsCount, 
      hasArrow: true,
      onClick: onManageApps,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10'
    },
    { 
      icon: Globe, 
      label: 'Sites Blocked', 
      value: blockedSitesCount, 
      hasArrow: true,
      onClick: onManageSites,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      icon: Type, 
      label: 'Keywords Blocked', 
      value: blockedKeywordsCount, 
      hasArrow: true,
      onClick: onManageKeywords,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    }
  ];

  const toggleActions = [
    { 
      icon: Film, 
      label: 'Block Reels & Shorts', 
      description: 'Stop infinite scrolling',
      enabled: reelsBlockEnabled,
      onToggle: onReelsToggle,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    { 
      icon: ShieldAlert, 
      label: 'Adult Content Filter', 
      description: 'Block inappropriate content',
      enabled: adultBlockEnabled,
      onToggle: onAdultToggle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    }
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-1">
        {/* Count Actions */}
        {quickActions.map((action, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 active:bg-muted cursor-pointer transition-colors"
            onClick={action.onClick}
          >
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", action.bgColor)}>
                <action.icon className={cn("h-5 w-5", action.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{action.value}</p>
                <p className="text-xs text-muted-foreground">{action.label}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        ))}

        {/* Divider */}
        <div className="h-px bg-border mx-2 my-2" />

        {/* Toggle Actions */}
        {toggleActions.map((action, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-3 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", action.bgColor)}>
                <action.icon className={cn("h-5 w-5", action.color)} />
              </div>
              <div>
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </div>
            <Switch 
              checked={action.enabled} 
              onCheckedChange={action.onToggle}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
