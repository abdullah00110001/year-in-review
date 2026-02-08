import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Zap, 
  BarChart3, 
  User
} from 'lucide-react';

interface ShieldBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ShieldBottomNav({ activeTab, onTabChange }: ShieldBottomNavProps) {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'modes', icon: Zap, label: 'Modes' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'account', icon: User, label: 'Account' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all min-w-[70px]',
                isActive 
                  ? 'bg-primary/20' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'p-2 rounded-xl transition-all',
                isActive && 'bg-primary/30'
              )}>
                <tab.icon className={cn(
                  'h-5 w-5',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
              <span className={cn(
                'text-[10px] font-medium mt-1',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
