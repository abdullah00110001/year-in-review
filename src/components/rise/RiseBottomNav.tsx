import { cn } from '@/lib/utils';
import { 
  Bell, 
  Users, 
  Moon,
  BarChart3, 
  Settings
} from 'lucide-react';

interface RiseBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function RiseBottomNav({ activeTab, onTabChange }: RiseBottomNavProps) {
  const tabs = [
    { id: 'alarms', icon: Bell, label: 'Alarms' },
    { id: 'missions', icon: Settings, label: 'Missions' },
    { id: 'sleep', icon: Moon, label: 'Sleep' },
    { id: 'group', icon: Users, label: 'Group' },
    { id: 'analytics', icon: BarChart3, label: 'Stats' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all min-w-[60px]',
              activeTab === tab.id 
                ? 'bg-primary/10 text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className={cn(
              'h-5 w-5 mb-1',
              activeTab === tab.id && 'text-primary'
            )} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
