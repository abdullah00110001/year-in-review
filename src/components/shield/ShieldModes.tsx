import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Brain, Moon, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import ShieldPlugin from '@/lib/capacitor/shieldPlugin';
import { isNative } from '@/lib/capacitor/platform';
import { toast } from 'sonner';

type StrictnessMode = 'normal' | 'lock' | 'strict';

interface ShieldModesProps {
  activeMode?: StrictnessMode;
  onModeChange?: (mode: StrictnessMode) => void;
  disciplineScore?: number | null;
}

export function ShieldModes({ activeMode, onModeChange, disciplineScore }: ShieldModesProps = {}) {
  const [currentMode, setCurrentMode] = useState<StrictnessMode>('normal');
  const [isStrict, setIsStrict] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const isControlled = activeMode !== undefined;
  const resolvedMode = isControlled ? activeMode : currentMode;

  useEffect(() => {
    const loadMode = async () => {
      if (!isNative) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await ShieldPlugin.getCurrentMode();
        const nativeMode = (data.mode || 'normal') as StrictnessMode;
        setCurrentMode(nativeMode);
        setIsStrict(Boolean(data.strict));
      } catch (error) {
        console.error('Failed to load shield mode', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMode();
  }, []);

  useEffect(() => {
    if (activeMode) {
      setCurrentMode(activeMode);
      setIsStrict(activeMode === 'strict');
    }
  }, [activeMode]);

  const modeDescription = useMemo(() => {
    if (disciplineScore == null) return null;
    return `Discipline score: ${disciplineScore}`;
  }, [disciplineScore]);

  const applyMode = (mode: StrictnessMode) => {
    setCurrentMode(mode);
    setIsStrict(mode === 'strict');
    onModeChange?.(mode);
  };

  const toggleMode = async (modeName: 'focus' | 'sleep') => {
    const targetMode: StrictnessMode = modeName === 'focus' ? 'lock' : 'strict';
    try {
      if (resolvedMode === targetMode) {
        await ShieldPlugin.deactivateMode();
        applyMode('normal');
        toast.info('Shield returned to Normal Mode');
        return;
      }

      if (modeName === 'focus') {
        await ShieldPlugin.activateFocusMode();
        toast.success('Focus Mode Active');
      } else {
        await ShieldPlugin.activateSleepMode();
        toast.success('Sleep Mode Active');
      }

      applyMode(targetMode);
    } catch (error) {
      toast.error(`Failed to activate ${modeName} mode`);
    }
  };

  const toggleStrictMode = async (checked: boolean) => {
    try {
      if (!checked) {
        applyMode('normal');
        toast.info('Strict Mode Disabled');
        return;
      }

      await ShieldPlugin.activateStrictMode();
      applyMode('strict');
      toast.success('Strict Mode Activated: Shield cannot be bypassed!');
    } catch (error) {
      toast.error('Failed to toggle Strict Mode');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-6">
      <div className="px-1">
        <h3 className="text-sm font-medium text-white/60">Quick Modes</h3>
        {modeDescription && <p className="text-xs text-white/40 mt-1">{modeDescription}</p>}
      </div>

      <Card className={`bg-white/5 border-white/10 transition-all ${resolvedMode === 'lock' ? 'border-indigo-500/50 bg-indigo-500/10' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-lg ${resolvedMode === 'lock' ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
                <Brain className={`h-5 w-5 ${resolvedMode === 'lock' ? 'text-indigo-400' : 'text-white/40'}`} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">Focus Mode</p>
                <p className="text-[10px] text-white/40">Customized blocking enabled</p>
              </div>
            </div>
            <Button
              variant={resolvedMode === 'lock' ? 'default' : 'outline'}
              size="sm"
              className={resolvedMode === 'lock' ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'text-white/60'}
              onClick={() => toggleMode('focus')}
              disabled={isStrict}
            >
              {resolvedMode === 'lock' ? 'Active' : 'Enable'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={`bg-white/5 border-white/10 transition-all ${resolvedMode === 'normal' ? 'border-purple-500/50 bg-purple-500/10' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-lg ${resolvedMode === 'normal' ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                <Moon className={`h-5 w-5 ${resolvedMode === 'normal' ? 'text-purple-400' : 'text-white/40'}`} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">Sleep Mode</p>
                <p className="text-[10px] text-white/40">Custom block list active</p>
              </div>
            </div>
            <Button
              variant={resolvedMode === 'normal' ? 'default' : 'outline'}
              size="sm"
              className={resolvedMode === 'normal' ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'text-white/60'}
              onClick={() => toggleMode('sleep')}
              disabled={isStrict}
            >
              {resolvedMode === 'normal' ? 'Active' : 'Enable'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mt-4">
        <div className="flex items-center justify-between mb-2 gap-3">
          <div className="flex items-center gap-2 text-amber-500 font-medium text-sm">
            <Lock className="h-4 w-4" /> Strict Mode
          </div>
          <Switch
            checked={isStrict}
            onCheckedChange={toggleStrictMode}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>
        <p className="text-xs text-amber-200/60 leading-relaxed">
          <AlertTriangle className="inline h-3 w-3 mr-1" />
          When enabled, you cannot disable Shield or change modes until tomorrow.
        </p>
      </div>
    </div>
  );
}
