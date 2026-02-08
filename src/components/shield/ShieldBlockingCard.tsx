import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Ban, 
  Globe, 
  Search, 
  Film,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockingCardProps {
  blockedApps: string[];
  blockedWebsites: string[];
  blockedKeywords: string[];
  adultBlockEnabled: boolean;
  reelsBlockEnabled: boolean;
  onAdultBlockToggle: (value: boolean) => void;
  onReelsBlockToggle: (value: boolean) => void;
  onManageApps?: () => void;
  onManageSites?: () => void;
  onManageKeywords?: () => void;
}

export function ShieldBlockingCard({
  blockedApps,
  blockedWebsites,
  blockedKeywords,
  adultBlockEnabled,
  reelsBlockEnabled,
  onAdultBlockToggle,
  onReelsBlockToggle,
  onManageApps,
  onManageSites,
  onManageKeywords,
}: BlockingCardProps) {
  return (
    <div className="space-y-3">
      {/* Quick Toggles */}
      <div className="grid grid-cols-2 gap-3">
        <Card 
          className={cn(
            'cursor-pointer transition-all',
            adultBlockEnabled && 'ring-2 ring-destructive/50 bg-destructive/5'
          )}
          onClick={() => onAdultBlockToggle(!adultBlockEnabled)}
        >
          <CardContent className="p-3 flex items-center gap-3">
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center',
              adultBlockEnabled ? 'bg-destructive/20' : 'bg-muted'
            )}>
              <ShieldAlert className={cn(
                'h-5 w-5',
                adultBlockEnabled ? 'text-destructive' : 'text-muted-foreground'
              )} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Adult Content</p>
              <p className="text-[10px] text-muted-foreground">Block 18+ sites</p>
            </div>
            <Switch 
              checked={adultBlockEnabled}
              className="data-[state=checked]:bg-destructive"
            />
          </CardContent>
        </Card>

        <Card 
          className={cn(
            'cursor-pointer transition-all',
            reelsBlockEnabled && 'ring-2 ring-primary/50 bg-primary/5'
          )}
          onClick={() => onReelsBlockToggle(!reelsBlockEnabled)}
        >
          <CardContent className="p-3 flex items-center gap-3">
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center',
              reelsBlockEnabled ? 'bg-primary/20' : 'bg-muted'
            )}>
              <Film className={cn(
                'h-5 w-5',
                reelsBlockEnabled ? 'text-primary' : 'text-muted-foreground'
              )} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Reels & Shorts</p>
              <p className="text-[10px] text-muted-foreground">Block feeds</p>
            </div>
            <Switch 
              checked={reelsBlockEnabled}
              className="data-[state=checked]:bg-primary"
            />
          </CardContent>
        </Card>
      </div>

      {/* Blocking Lists */}
      <Card>
        <CardContent className="p-0 divide-y divide-border">
          <button 
            className="w-full flex items-center gap-3 p-4 active:bg-muted/50 transition-colors"
            onClick={onManageApps}
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Ban className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Blocked Apps</p>
              <div className="flex items-center gap-2 mt-1">
                {blockedApps.slice(0, 3).map((app, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] h-5">
                    {app}
                  </Badge>
                ))}
                {blockedApps.length > 3 && (
                  <Badge variant="outline" className="text-[10px] h-5">
                    +{blockedApps.length - 3}
                  </Badge>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          <button 
            className="w-full flex items-center gap-3 p-4 active:bg-muted/50 transition-colors"
            onClick={onManageSites}
          >
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
              <Globe className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Blocked Websites</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {blockedWebsites.length} sites blocked
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          <button 
            className="w-full flex items-center gap-3 p-4 active:bg-muted/50 transition-colors"
            onClick={onManageKeywords}
          >
            <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
              <Search className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Blocked Keywords</p>
              <div className="flex items-center gap-2 mt-1">
                {blockedKeywords.slice(0, 2).map((kw, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] h-5">
                    {kw}
                  </Badge>
                ))}
                {blockedKeywords.length > 2 && (
                  <Badge variant="outline" className="text-[10px] h-5">
                    +{blockedKeywords.length - 2}
                  </Badge>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
