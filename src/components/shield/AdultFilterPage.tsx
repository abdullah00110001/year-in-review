import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, ShieldCheck, Check, ShieldX,
  Flame, Lock, Brain, Heart, Sparkles, AlertTriangle, Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import ShieldPlugin from '@/lib/capacitor/shieldPlugin';

const BLOCK_SCREENS = [
  {
    id: 'focus',
    label: 'Stay Focused',
    icon: Brain,
    preview: {
      bg: 'from-slate-900 to-slate-800',
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/20',
      title: 'Stay Focused',
      subtitle: 'This content is blocked.\nYou are better than this.',
      accent: 'bg-blue-500',
    },
  },
  {
    id: 'reminder',
    label: 'Reminder',
    icon: Heart,
    preview: {
      bg: 'from-rose-950 to-slate-900',
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/20',
      title: 'Not Today',
      subtitle: 'Remember your goals.\nYou can do this.',
      accent: 'bg-rose-500',
    },
  },
  {
    id: 'strict',
    label: 'Strict',
    icon: Lock,
    preview: {
      bg: 'from-zinc-950 to-zinc-900',
      iconColor: 'text-red-500',
      iconBg: 'bg-red-500/20',
      title: 'Blocked',
      subtitle: 'Access Denied.\nFocus Shield is protecting you.',
      accent: 'bg-red-600',
    },
  },
  {
    id: 'motivate',
    label: 'Motivational',
    icon: Sparkles,
    preview: {
      bg: 'from-violet-950 to-indigo-950',
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/20',
      title: 'You Got This! 💪',
      subtitle: 'Every time you resist,\nyou grow stronger.',
      accent: 'bg-violet-500',
    },
  },
  {
    id: 'streak',
    label: 'Streak Alert',
    icon: Flame,
    preview: {
      bg: 'from-orange-950 to-amber-950',
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/20',
      title: "Don't Break Your Streak!",
      subtitle: "Stay strong.\nDon't ruin it now.",
      accent: 'bg-orange-500',
    },
  },
  {
    id: 'islamic',
    label: 'Islamic Mode',
    icon: Moon,
    preview: {
      bg: 'from-emerald-950 to-teal-950',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
      title: 'اتق الله',
      subtitle: 'Fear Allah.\nGuard your eyes and heart.',
      accent: 'bg-emerald-500',
    },
  },
  {
    id: 'custom',
    label: 'Custom Message',
    icon: AlertTriangle,
    preview: null,
  },
];

interface AdultFilterPageProps {
  onBack: () => void;
  isActive: boolean;
}

export function AdultFilterPage({ onBack, isActive }: AdultFilterPageProps) {
  const [selectedScreen, setSelectedScreen] = useState('focus');
  const [customMessage, setCustomMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // Load saved settings
  useEffect(() => {
    const saved = localStorage.getItem('adult_filter_screen');
    if (saved) setSelectedScreen(saved);
    const savedMsg = localStorage.getItem('adult_filter_custom_message');
    if (savedMsg) setCustomMessage(savedMsg);
  }, []);

  const selected = BLOCK_SCREENS.find((s) => s.id === selectedScreen)!;

  const handleSave = async () => {
    if (selectedScreen === 'custom' && !customMessage.trim()) {
      toast.error('Please enter a custom message');
      return;
    }
    setSaving(true);
    try {
      localStorage.setItem('adult_filter_screen', selectedScreen);
      localStorage.setItem('adult_filter_custom_message', customMessage);

      if (Capacitor.getPlatform() === 'android') {
        await ShieldPlugin.updateAdultFilterScreen({
          style: selectedScreen,
          customMessage: selectedScreen === 'custom' ? customMessage : getDefaultMessage(selectedScreen),
        });
      }
      toast.success('Saved 🛡️');
      onBack();
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const getDefaultMessage = (id: string) => {
    const s = BLOCK_SCREENS.find(b => b.id === id);
    return s?.preview?.subtitle?.replace('\n', ' ') || '';
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10">
        <button
          onClick={onBack}
          className="h-9 w-9 rounded-xl flex items-center justify-center bg-muted active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-base">Adult Filter</h1>
          <p className="text-xs text-muted-foreground">18+ content blocked automatically</p>
        </div>
        <div className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
          isActive ? 'bg-green-500/15 text-green-500' : 'bg-muted text-muted-foreground'
        )}>
          <span className={cn(
            'h-2 w-2 rounded-full',
            isActive ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
          )} />
          {isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">

        {/* Status Card */}
        <Card className={cn(
          'border-2',
          isActive ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'
        )}>
          <CardContent className="p-4 flex items-center gap-3">
            {isActive
              ? <ShieldCheck className="h-8 w-8 text-green-500 shrink-0" />
              : <ShieldX className="h-8 w-8 text-amber-500 shrink-0" />
            }
            <div>
              <p className={cn('font-semibold text-sm',
                isActive ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
              )}>
                {isActive ? 'Filter is running' : 'Filter is not active'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isActive
                  ? 'All 18+ websites are blocked. DNS + keyword + site list active.'
                  : 'Enable Accessibility Service to activate the filter.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Block Screen Style */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1">
            Block Screen Style
          </h2>
          <p className="text-xs text-muted-foreground mb-3 px-1">
            Shown when an 18+ site is detected
          </p>
          <div className="space-y-2.5">
            {BLOCK_SCREENS.map((screen) => {
              const isSelected = selectedScreen === screen.id;
              return (
                <button
                  key={screen.id}
                  onClick={() => setSelectedScreen(screen.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all active:scale-[0.98] text-left',
                    isSelected ? 'border-primary bg-primary/5' : 'border-border/50 bg-muted/30'
                  )}
                >
                  <div className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                    isSelected ? 'bg-primary/10' : 'bg-muted'
                  )}>
                    <screen.icon className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-medium text-sm', isSelected && 'text-primary')}>{screen.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {screen.id === 'custom'
                        ? (customMessage.trim() || 'Write your own message')
                        : screen.preview?.subtitle.replace('\n', ' ')}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom message */}
        {selectedScreen === 'custom' && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Your Message
            </h2>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g. Remember why you started. Stay strong."
              className="rounded-2xl resize-none text-sm min-h-[100px] bg-muted border-0 focus-visible:ring-1"
              maxLength={200}
            />
            <p className="text-[11px] text-muted-foreground mt-1.5 text-right px-1">
              {customMessage.length}/200
            </p>
          </div>
        )}

        {/* Preview */}
        {selected.preview && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Preview
            </h2>
            <div className={cn(
              'rounded-3xl overflow-hidden bg-gradient-to-b p-8 flex flex-col items-center justify-center gap-4 min-h-[260px]',
              selected.preview.bg
            )}>
              <div className={cn('h-16 w-16 rounded-2xl flex items-center justify-center', selected.preview.iconBg)}>
                <ShieldX className={cn('h-8 w-8', selected.preview.iconColor)} />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-white font-bold text-xl">{selected.preview.title}</p>
                {selected.preview.subtitle.split('\n').map((line, i) => (
                  <p key={i} className="text-white/60 text-sm">{line}</p>
                ))}
              </div>
              <div className={cn('h-1 w-16 rounded-full mt-2', selected.preview.accent)} />
            </div>
          </div>
        )}

        {selectedScreen === 'custom' && customMessage.trim() && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Preview
            </h2>
            <div className="rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 p-8 flex flex-col items-center justify-center gap-4 min-h-[260px]">
              <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
                <ShieldX className="h-8 w-8 text-white/80" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-white font-bold text-xl">Blocked</p>
                {customMessage.trim().split('\n').map((line, i) => (
                  <p key={i} className="text-white/60 text-sm">{line}</p>
                ))}
              </div>
              <div className="h-1 w-16 rounded-full mt-2 bg-white/30" />
            </div>
          </div>
        )}

      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border/50">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-2xl font-semibold text-base"
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
