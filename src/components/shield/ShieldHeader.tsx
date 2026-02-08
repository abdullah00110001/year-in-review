import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  Bell,
  Ban,
  Settings,
  Star,
  Share2,
  LayoutGrid,
  CloudUpload,
  HelpCircle,
  MessageSquare,
  Info,
  Moon
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface ShieldHeaderProps {
  onNavigate: (page: string) => void;
  currentTheme?: 'light' | 'dark';
  onThemeToggle?: () => void;
}

export function ShieldHeader({ onNavigate, currentTheme = 'dark', onThemeToggle }: ShieldHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { icon: Ban, label: 'Block Screen', action: () => onNavigate('block-screen') },
    { icon: Settings, label: 'Settings', action: () => onNavigate('settings') },
    { icon: Star, label: 'Rate the App', action: () => {} },
    { icon: Share2, label: 'Share', action: () => {} },
    { icon: LayoutGrid, label: 'Organise Dashboard', action: () => onNavigate('organise') },
    { icon: CloudUpload, label: 'Backup & Restore', action: () => {} },
    { icon: HelpCircle, label: 'Help', action: () => {} },
    { icon: MessageSquare, label: 'Send feedback', action: () => {} },
    { icon: Info, label: 'About', action: () => {} },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 text-white px-4 py-3">
      <div className="flex items-center justify-between">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full bg-muted/20 text-white hover:bg-muted/30">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] bg-background border-r border-border p-0">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-lg">Shield</h2>
              </div>
              
              <div className="flex-1 py-2">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors"
                    onClick={() => {
                      item.action();
                      setIsMenuOpen(false);
                    }}
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Moon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="font-medium">Dark Mode</span>
                  </div>
                  <Switch 
                    checked={currentTheme === 'dark'} 
                    onCheckedChange={onThemeToggle}
                  />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Badge className="bg-emerald-500 text-white px-4 py-1.5 text-sm font-semibold rounded-full">
          💎 5 days free!
        </Badge>

        <Button variant="ghost" size="icon" className="rounded-full bg-muted/20 text-white hover:bg-muted/30 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full" />
        </Button>
      </div>
    </div>
  );
}
