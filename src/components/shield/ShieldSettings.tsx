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
  Globe,
  KeyRound,
  Timer,
  Moon,
  Lock,
  Vibrate,
  Volume2,
  Eye,
  Download,
  Upload,
  Trash2,
  Info,
  HelpCircle,
  MessageSquare,
  Database,
  RefreshCw,
  Zap,
  BellRing,
  MonitorSmartphone,
  ShieldCheck
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
  iconColor?: string;
  iconBg?: string;
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
      iconColor: 'text-rose-500',
      iconBg: 'bg-rose-500/10',
    },
    {
      icon: Columns,
      title: 'Block Split Screen',
      description: 'Prevent multitasking to stay focused',
      hasToggle: true,
      toggleValue: settings.blockSplitScreen,
      onToggle: (value) => onSettingChange('blockSplitScreen', value),
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
    },
    {
      icon: Power,
      title: 'Block Power Off',
      description: 'Prevent shutdown during focus sessions',
      hasToggle: true,
      toggleValue: settings.blockPowerOff,
      onToggle: (value) => onSettingChange('blockPowerOff', value),
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-500/10',
    },
    {
      icon: AppWindow,
      title: 'Block Recent Apps',
      description: 'Disable recent apps screen access',
      hasToggle: true,
      toggleValue: settings.blockRecentApps,
      onToggle: (value) => onSettingChange('blockRecentApps', value),
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-500/10',
    },
    {
      icon: Lock,
      title: 'Prevent Uninstall',
      description: 'Block app uninstallation during sessions',
      hasToggle: true,
      toggleValue: false,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-500/10',
    },
  ];

  const timerSettings: SettingItem[] = [
    {
      icon: Clock,
      title: 'Start of Day',
      description: 'Set when your day resets (default: midnight)',
      hasArrow: true,
      iconColor: 'text-sky-500',
      iconBg: 'bg-sky-500/10',
    },
    {
      icon: Timer,
      title: 'Pause Duration',
      description: 'Skip duration selection when pausing',
      hasToggle: true,
      toggleValue: settings.pauseDurationEnabled,
      onToggle: (value) => onSettingChange('pauseDurationEnabled', value),
      iconColor: 'text-teal-500',
      iconBg: 'bg-teal-500/10',
    },
    {
      icon: AlertTriangle,
      title: 'Low Time Alert',
      description: 'Get alerts when time limit is running out',
      hasToggle: true,
      toggleValue: settings.lowTimeAlert,
      onToggle: (value) => onSettingChange('lowTimeAlert', value),
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
    },
    {
      icon: BellRing,
      title: 'Pomodoro Breaks',
      description: 'Notify when it\'s time to take a break',
      hasToggle: true,
      toggleValue: settings.pomodoroBreak,
      onToggle: (value) => onSettingChange('pomodoroBreak', value),
      iconColor: 'text-green-500',
      iconBg: 'bg-green-500/10',
    },
    {
      icon: RefreshCw,
      title: 'Auto-Reset Daily',
      description: 'Automatically reset limits each day',
      hasToggle: true,
      toggleValue: true,
      iconColor: 'text-indigo-500',
      iconBg: 'bg-indigo-500/10',
    },
  ];

  const notificationSettings: SettingItem[] = [
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Receive focus reminders and alerts',
      hasToggle: true,
      toggleValue: true,
      iconColor: 'text-pink-500',
      iconBg: 'bg-pink-500/10',
    },
    {
      icon: Vibrate,
      title: 'Vibration Alerts',
      description: 'Vibrate when blocking apps',
      hasToggle: true,
      toggleValue: true,
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-500/10',
    },
    {
      icon: Volume2,
      title: 'Sound Effects',
      description: 'Play sound when sessions start/end',
      hasToggle: true,
      toggleValue: false,
      iconColor: 'text-cyan-500',
      iconBg: 'bg-cyan-500/10',
    },
  ];

  const appearanceSettings: SettingItem[] = [
    {
      icon: Moon,
      title: 'Dark Mode',
      description: 'Use dark theme',
      hasToggle: true,
      toggleValue: true,
      iconColor: 'text-slate-500',
      iconBg: 'bg-slate-500/10',
    },
    {
      icon: Palette,
      title: 'Theme Color',
      description: 'Customize app accent color',
      hasArrow: true,
      iconColor: 'text-fuchsia-500',
      iconBg: 'bg-fuchsia-500/10',
    },
    {
      icon: Globe,
      title: 'Language',
      description: 'English',
      hasArrow: true,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
    },
  ];

  const advancedSettings: SettingItem[] = [
    {
      icon: MonitorSmartphone,
      title: 'Set as Launcher',
      description: 'Use Focus Shield as your home screen',
      hasArrow: true,
      isPremium: true,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
    },
    {
      icon: ShieldCheck,
      title: 'Device Admin',
      description: 'Enable advanced protection features',
      hasArrow: true,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-600/10',
    },
    {
      icon: KeyRound,
      title: 'Emergency Bypass',
      description: 'Configure emergency access options',
      hasArrow: true,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-500/10',
    },
    {
      icon: Eye,
      title: 'Accessibility Service',
      description: 'Required for website blocking',
      hasArrow: true,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
    },
    {
      icon: Zap,
      title: 'Battery Optimization',
      description: 'Disable for reliable background blocking',
      hasArrow: true,
      iconColor: 'text-yellow-500',
      iconBg: 'bg-yellow-500/10',
    },
  ];

  const dataSettings: SettingItem[] = [
    {
      icon: Download,
      title: 'Backup Data',
      description: 'Export your settings and history',
      hasArrow: true,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-500/10',
    },
    {
      icon: Upload,
      title: 'Restore Data',
      description: 'Import from a backup file',
      hasArrow: true,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
    },
    {
      icon: Database,
      title: 'Usage Statistics',
      description: 'View detailed app usage data',
      hasArrow: true,
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-500/10',
    },
    {
      icon: Trash2,
      title: 'Clear History',
      description: 'Delete all usage data',
      hasArrow: true,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-500/10',
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      icon: HelpCircle,
      title: 'Help & FAQ',
      description: 'Get answers to common questions',
      hasArrow: true,
      iconColor: 'text-sky-500',
      iconBg: 'bg-sky-500/10',
    },
    {
      icon: MessageSquare,
      title: 'Send Feedback',
      description: 'Help us improve the app',
      hasArrow: true,
      iconColor: 'text-teal-500',
      iconBg: 'bg-teal-500/10',
    },
    {
      icon: Info,
      title: 'About',
      description: 'Version 1.0.0',
      hasArrow: true,
      iconColor: 'text-gray-500',
      iconBg: 'bg-gray-500/10',
    },
  ];

  const renderSettingItem = (item: SettingItem, index: number, isLast: boolean) => (
    <div
      key={index}
      className={cn(
        'flex items-center gap-4 p-4 cursor-pointer active:bg-muted/50 transition-colors',
        !isLast && 'border-b border-border/50'
      )}
      onClick={item.onClick}
    >
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
        item.iconBg || 'bg-muted'
      )}>
        <item.icon className={cn("h-5 w-5", item.iconColor || 'text-muted-foreground')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{item.title}</h3>
          {item.isPremium && (
            <Badge variant="secondary" className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
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

  const renderSection = (title: string, items: SettingItem[]) => (
    <div>
      <h2 className="font-semibold text-xs text-muted-foreground mb-2 px-1 uppercase tracking-wider">{title}</h2>
      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-0">
          {items.map((item, index) => 
            renderSettingItem(item, index, index === items.length - 1)
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 pb-4">
      {renderSection('Blocking', blockingSettings)}
      {renderSection('Timer & Alerts', timerSettings)}
      {renderSection('Notifications', notificationSettings)}
      {renderSection('Appearance', appearanceSettings)}
      {renderSection('Advanced', advancedSettings)}
      {renderSection('Data & Privacy', dataSettings)}
      {renderSection('Support', supportSettings)}
    </div>
  );
}
