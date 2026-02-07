import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Shield, 
  Ban, 
  Clock, 
  BarChart3, 
  Settings,
  Users
} from 'lucide-react';

interface ShieldBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ShieldBottomNav({ activeTab, onTabChange }: ShieldBottomNavProps) {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'blocking', icon: Ban, label: 'Block' },
    { id: 'usage', icon: Clock, label: 'Usage' },
    { id: 'profiles', icon: Shield, label: 'Profiles' },
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
