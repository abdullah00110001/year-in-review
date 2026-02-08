import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Ban,
  Palette,
  Clock,
  Columns,
  Power,
  AppWindow,
  AlertTriangle,
  Bell,
  ChevronRight,
  Smartphone,
  Globe,
  KeyRound,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingItem {
  icon: typeof Ban;
  title: string;
  description: string;
  hasArrow?: boolean;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  onClick?: () => void;
  isPremium?: boolean;
}

interface ShieldSettingsProps {
  settings: {
    pauseDurationEnabled: boolean;
    blockSplitScreen: boolean;
    blockPowerOff: boolean;
    blockRecentApps: boolean;
    lowTimeAlert: boolean;
    pomodoroBreak: boolean;
  };
  onSettingChange: (key: string, value: boolean) => void;
  onNavigate: (page: string) => void;
}

export function ShieldSettings({ settings, onSettingChange, onNavigate }: ShieldSettingsProps) {
  const blockingSettings: SettingItem[] = [
    {
      icon: Ban,
      title: 'Block Screen Style',
      description: 'Choose what appears when apps are blocked',
      hasArrow: true,
      onClick: () => onNavigate('block-screen'),
    },
    {
      icon: Columns,
      title: 'Block Split Screen',
      description: 'Prevent multitasking to stay focused',
      hasToggle: true,
      toggleValue: settings.blockSplitScreen,
      onToggle: (value) => onSettingChange('blockSplitScreen', value),
    },
    {
      icon: Power,
      title: 'Block Power Off',
      description: 'Prevent shutdown during focus sessions',
      hasToggle: true,
      toggleValue: settings.blockPowerOff,
      onToggle: (value) => onSettingChange('blockPowerOff', value),
    },
    {
      icon: AppWindow,
      title: 'Block Recent Apps',
      description: 'Disable recent apps screen access',
      hasToggle: true,
      toggleValue: settings.blockRecentApps,
      onToggle: (value) => onSettingChange('blockRecentApps', value),
    },
  ];

  const timerSettings: SettingItem[] = [
    {
      icon: Clock,
      title: 'Start of Day',
      description: 'Set when your day resets (default: midnight)',
      hasArrow: true,
    },
    {
      icon: Timer,
      title: 'Pause Duration',
      description: 'Skip duration selection when pausing',
      hasToggle: true,
      toggleValue: settings.pauseDurationEnabled,
      onToggle: (value) => onSettingChange('pauseDurationEnabled', value),
    },
    {
      icon: AlertTriangle,
      title: 'Low Time Alert',
      description: 'Get alerts when time limit is running out',
      hasToggle: true,
      toggleValue: settings.lowTimeAlert,
      onToggle: (value) => onSettingChange('lowTimeAlert', value),
    },
    {
      icon: Bell,
      title: 'Pomodoro Breaks',
      description: 'Notify when it\'s time to take a break',
      hasToggle: true,
      toggleValue: settings.pomodoroBreak,
      onToggle: (value) => onSettingChange('pomodoroBreak', value),
    },
  ];

  const advancedSettings: SettingItem[] = [
    {
      icon: Smartphone,
      title: 'Set as Launcher',
      description: 'Use Focus Shield as your home screen',
      hasArrow: true,
      isPremium: true,
    },
    {
      icon: Globe,
      title: 'Language',
      description: 'English',
      hasArrow: true,
    },
    {
      icon: Palette,
      title: 'Theme',
      description: 'System default',
      hasArrow: true,
    },
    {
      icon: KeyRound,
      title: 'Emergency Bypass',
      description: 'Configure emergency access options',
      hasArrow: true,
    },
  ];

  const renderSettingItem = (item: SettingItem, index: number, isLast: boolean) => (
    <div
      key={index}
      className={cn(
        'flex items-center gap-4 p-4 cursor-pointer active:bg-muted/50 transition-colors',
        !isLast && 'border-b border-border'
      )}
      onClick={item.onClick}
    >
      <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 bg-muted">
        <item.icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{item.title}</h3>
          {item.isPremium && (
            <Badge variant="secondary" className="text-[10px] bg-accent text-accent-foreground">
              PRO
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {item.description}
        </p>
      </div>
      {item.hasArrow && (
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      )}
      {item.hasToggle && (
        <Switch
          checked={item.toggleValue}
          onCheckedChange={item.onToggle}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 data-[state=checked]:bg-primary"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4 pb-4">
      {/* Blocking Options */}
      <div>
        <h2 className="font-semibold text-sm text-muted-foreground mb-2 px-1">BLOCKING</h2>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {blockingSettings.map((item, index) => 
              renderSettingItem(item, index, index === blockingSettings.length - 1)
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timer & Alerts */}
      <div>
        <h2 className="font-semibold text-sm text-muted-foreground mb-2 px-1">TIMER & ALERTS</h2>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {timerSettings.map((item, index) => 
              renderSettingItem(item, index, index === timerSettings.length - 1)
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced */}
      <div>
        <h2 className="font-semibold text-sm text-muted-foreground mb-2 px-1">ADVANCED</h2>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {advancedSettings.map((item, index) => 
              renderSettingItem(item, index, index === advancedSettings.length - 1)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
