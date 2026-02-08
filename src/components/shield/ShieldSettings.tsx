import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2,
  Play,
  RefreshCw,
  Rocket,
  RotateCcw,
  Globe,
  Quote,
  ExternalLink,
  Clock,
  Pause,
  UserPlus,
  Columns,
  Power,
  AppWindow,
  Timer,
  AlertTriangle,
  Bell,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingItem {
  icon: typeof Trash2;
  iconColor: string;
  iconBg: string;
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
  onBack: () => void;
  settings: {
    pauseDurationEnabled: boolean;
    blockUnsupportedBrowsers: boolean;
    blockSplitScreen: boolean;
    blockPowerOff: boolean;
    blockRecentApps: boolean;
    lowTimeAlert: boolean;
    pomodoroBreak: boolean;
  };
  onSettingChange: (key: string, value: boolean) => void;
}

export function ShieldSettings({ onBack, settings, onSettingChange }: ShieldSettingsProps) {
  const generalSettings: SettingItem[] = [
    {
      icon: Trash2,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/20',
      title: 'Uninstall Stay Focused',
      description: 'Completely remove Stay Focused from your device.',
      hasArrow: true,
    },
    {
      icon: Play,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
      title: 'Pause Stay Focused',
      description: 'Temporarily pause or reactivate app blocking and monitoring.',
      hasArrow: true,
    },
    {
      icon: RefreshCw,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
      title: 'Sync Hidden Apps',
      description: "Add apps that aren't visible in the app list for tracking or blocking.",
      hasArrow: true,
    },
  ];

  const customizationSettings: SettingItem[] = [
    {
      icon: Rocket,
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/20',
      title: 'Set as Default Launcher',
      description: 'Set Stay Focused as home app\n\nClick Home > Select Stay Focused > Press back',
      hasArrow: true,
    },
    {
      icon: RotateCcw,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/20',
      title: 'Allow Home Screen Rotation',
      description: 'Enable or disable home screen rotation to match your screen orientation.',
      isPremium: true,
    },
    {
      icon: Globe,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/20',
      title: 'Change Language',
      description: 'Select your preferred app language.',
      hasArrow: true,
    },
    {
      icon: Quote,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      title: 'Motivational Quote',
      description: 'Show an inspiring quote on the block screen.',
      hasArrow: true,
    },
    {
      icon: ExternalLink,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
      title: 'Set Redirect URL',
      description: 'Show an inspiring quote on the block screen.',
      isPremium: true,
    },
    {
      icon: Clock,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
      title: 'Set Start of Day',
      description: 'Select when your day starts (e.g., midnight or your wake-up time).',
      hasArrow: true,
    },
    {
      icon: Pause,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/20',
      title: 'Enable Pause Duration',
      description: 'Skip selecting a pause duration before pausing the profile. The profile will remain paused indefinitely until manually resumed.',
      hasToggle: true,
      toggleValue: settings.pauseDurationEnabled,
      onToggle: (value) => onSettingChange('pauseDurationEnabled', value),
    },
  ];

  const blockingSettings: SettingItem[] = [
    {
      icon: UserPlus,
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/20',
      title: 'Block Unsupported Browsers',
      description: 'Prevent the use of browsers not supported by Stay Focused to block unwanted content.',
      isPremium: true,
    },
    {
      icon: Columns,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      title: 'Block Split Screen',
      description: 'Stop split screen usage to avoid multitasking distractions. (Requires Accessibility permission)',
      hasToggle: true,
      toggleValue: settings.blockSplitScreen,
      onToggle: (value) => onSettingChange('blockSplitScreen', value),
    },
    {
      icon: Power,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
      title: 'Block Power Off',
      description: 'Prevent device shutdown to ensure uninterrupted focus. This may not work on all devices. (Requires Accessibility permission)',
      hasToggle: true,
      toggleValue: settings.blockPowerOff,
      onToggle: (value) => onSettingChange('blockPowerOff', value),
    },
    {
      icon: AppWindow,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      title: 'Block Recent Apps',
      description: 'Prevent access to the recent apps screen to reduce distractions and improve focus. (Requires Accessibility permission)',
      hasToggle: true,
      toggleValue: settings.blockRecentApps,
      onToggle: (value) => onSettingChange('blockRecentApps', value),
    },
  ];

  const timeSettings: SettingItem[] = [
    {
      icon: Timer,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
      title: 'Remaining Timer Type',
      description: 'Choose how remaining time is displayed: on-screen timer, notification, or hide it.',
      hasArrow: true,
    },
    {
      icon: AlertTriangle,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/20',
      title: 'Low Time Alert',
      description: 'Receive alerts when time is running low (e.g., at 10, 5, or 1 minute left).',
      hasToggle: true,
      toggleValue: settings.lowTimeAlert,
      onToggle: (value) => onSettingChange('lowTimeAlert', value),
    },
  ];

  const notificationSettings: SettingItem[] = [
    {
      icon: Bell,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-500/20',
      title: 'Pomodoro Break',
      description: "Get notified when it's time to take a break.",
      hasToggle: true,
      toggleValue: settings.pomodoroBreak,
      onToggle: (value) => onSettingChange('pomodoroBreak', value),
    },
  ];

  const renderSettingItem = (item: SettingItem, index: number, isLast: boolean) => (
    <div
      key={index}
      className={cn(
        'flex items-start gap-4 p-4',
        !isLast && 'border-b border-border'
      )}
    >
      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', item.iconBg)}>
        <item.icon className={cn('h-5 w-5', item.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{item.title}</h3>
          {item.isPremium && (
            <Badge className="bg-amber-500 text-black text-xs">
              👑 Upgrade
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">
          {item.description}
        </p>
      </div>
      {item.hasArrow && (
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-2" />
      )}
      {item.hasToggle && (
        <Switch
          checked={item.toggleValue}
          onCheckedChange={item.onToggle}
          className="shrink-0 mt-2 data-[state=checked]:bg-emerald-500"
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 text-white px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-muted/20 text-white hover:bg-muted/30"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* General Settings */}
        <Card>
          <CardContent className="p-0">
            {generalSettings.map((item, index) => 
              renderSettingItem(item, index, index === generalSettings.length - 1)
            )}
          </CardContent>
        </Card>

        {/* Customization */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Customization</h2>
          <Card>
            <CardContent className="p-0">
              {customizationSettings.map((item, index) => 
                renderSettingItem(item, index, index === customizationSettings.length - 1)
              )}
            </CardContent>
          </Card>
        </div>

        {/* Blocking Options */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Blocking Options</h2>
          <Card>
            <CardContent className="p-0">
              {blockingSettings.map((item, index) => 
                renderSettingItem(item, index, index === blockingSettings.length - 1)
              )}
            </CardContent>
          </Card>
        </div>

        {/* Time & Alerts */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Time & Alerts</h2>
          <Card>
            <CardContent className="p-0">
              {timeSettings.map((item, index) => 
                renderSettingItem(item, index, index === timeSettings.length - 1)
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="font-semibold text-lg mb-3">Notifications</h2>
          <Card>
            <CardContent className="p-0">
              {notificationSettings.map((item, index) => 
                renderSettingItem(item, index, index === notificationSettings.length - 1)
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
