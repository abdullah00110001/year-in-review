import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Ban, 
  Globe, 
  Type, 
  Film, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  icon: typeof Ban;
  iconBg: string;
  value: number | string;
  label: string;
  hasArrow?: boolean;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onClick?: () => void;
  isPremium?: boolean;
}

interface ShieldQuickActionsCardProps {
  appsBlocked: number;
  sitesBlocked: number;
  keywordsBlocked: number;
  keywordsEnabled: boolean;
  adultBlockEnabled: boolean;
  reelsBlockEnabled: boolean;
  onKeywordsToggle: (value: boolean) => void;
  onAdultBlockToggle: (value: boolean) => void;
  onReelsBlockToggle: (value: boolean) => void;
  onAppsClick: () => void;
  onSitesClick: () => void;
  onKeywordsClick: () => void;
  onAdultClick: () => void;
  onReelsClick: () => void;
}

export function ShieldQuickActionsCard({
  appsBlocked,
  sitesBlocked,
  keywordsBlocked,
  keywordsEnabled,
  adultBlockEnabled,
  reelsBlockEnabled,
  onKeywordsToggle,
  onAdultBlockToggle,
  onReelsBlockToggle,
  onAppsClick,
  onSitesClick,
  onKeywordsClick,
  onAdultClick,
  onReelsClick
}: ShieldQuickActionsCardProps) {
  const actions: QuickAction[] = [
    {
      icon: Ban,
      iconBg: 'bg-slate-600/30',
      value: appsBlocked,
      label: 'Apps Blocked',
      hasArrow: true,
      onClick: onAppsClick
    },
    {
      icon: Globe,
      iconBg: 'bg-slate-600/30',
      value: sitesBlocked,
      label: 'Sites Blocked',
      hasArrow: true,
      onClick: onSitesClick
    },
    {
      icon: Type,
      iconBg: 'bg-slate-600/30',
      value: keywordsBlocked,
      label: 'Keywords Blocked',
      hasToggle: true,
      toggleValue: keywordsEnabled,
      onToggle: onKeywordsToggle,
      onClick: onKeywordsClick
    },
    {
      icon: ShieldCheck,
      iconBg: 'bg-amber-900/30',
      value: adultBlockEnabled ? 'On' : 'Off',
      label: 'Block Adult Content',
      hasToggle: true,
      toggleValue: adultBlockEnabled,
      onToggle: onAdultBlockToggle,
      onClick: onAdultClick,
      isPremium: !adultBlockEnabled
    },
    {
      icon: Film,
      iconBg: 'bg-slate-600/30',
      value: reelsBlockEnabled ? 'On' : 'Off',
      label: 'Block Reels/Shorts',
      hasToggle: true,
      toggleValue: reelsBlockEnabled,
      onToggle: onReelsBlockToggle,
      onClick: onReelsClick
    }
  ];

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-lg">Quick Actions</h2>
      
      <Card className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-slate-600/30 overflow-hidden">
        <CardContent className="p-0">
          {actions.map((action, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center justify-between p-4 transition-colors cursor-pointer hover:bg-white/5',
                index !== actions.length - 1 && 'border-b border-slate-600/20'
              )}
              onClick={action.onClick}
            >
              <div className="flex items-center gap-4">
                <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', action.iconBg)}>
                  <action.icon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{action.value}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{action.label}</p>
                    {action.onClick && action.hasToggle && (
                      <span className="text-xs text-primary underline">Configure</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {action.isPremium && (
                  <Badge className="bg-amber-500 text-black text-xs font-semibold">
                    👑 Upgrade
                  </Badge>
                )}
                {action.hasArrow && (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                {action.hasToggle && (
                  <Switch
                    checked={action.toggleValue}
                    onCheckedChange={(checked) => {
                      action.onToggle?.(checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
