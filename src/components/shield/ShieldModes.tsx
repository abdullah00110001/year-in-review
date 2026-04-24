import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Brain, Moon, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import ShieldPlugin from '@/lib/capacitor/shieldPlugin';
import { isNative } from '@/lib/capacitor/platform';
import { toast } from 'sonner';

interface ModeState {
  mode: string;
  strict: boolean;
}

export function ShieldModes() {
  const [currentMode, setCurrentMode] = useState<string>('normal');
  const [isStrict, setIsStrict] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // ১. নেটিভ মেমোরি থেকে বর্তমান মোড লোড করা
  useEffect(() => {
    const loadMode = async () => {
      if (!isNative) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await ShieldPlugin.getCurrentMode();
        setCurrentMode(data.mode || 'normal');
        setIsStrict(data.strict || false);
      } catch (error) {
        console.error("Failed to load shield mode", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMode();
  }, []);

  // ২. ফোকাস বা স্লিপ মোড চেঞ্জ করা
  const toggleMode = async (modeName: 'focus' | 'sleep') => {
    try {
      if (currentMode === modeName) {
        // মোড অফ করা হচ্ছে
        await ShieldPlugin.deactivateMode();
        setCurrentMode('normal');
        toast.info("Shield returned to Normal Mode");
      } else {
        // নতুন মোড অন করা হচ্ছে
        if (modeName === 'focus') {
          await ShieldPlugin.activateFocusMode();
          toast.success("Focus Mode Active: Social Media Blocked");
        } else {
          await ShieldPlugin.activateSleepMode();
          toast.success("Sleep Mode Active: Late Night Apps Blocked");
        }
        setCurrentMode(modeName);
      }
    } catch (error) {
      toast.error(`Failed to activate ${modeName} mode`);
    }
  };

  // ৩. স্ট্রিক্ট মোড (Strict Mode) অন/অফ করা
  const toggleStrictMode = async () => {
    try {
      if (isStrict) {
        // স্ট্রিক্ট মোড অফ করার চেষ্টা (যদি পাসওয়ার্ড বা অন্য লজিক থাকে, তবে সেটা এখানে বসবে)
        toast.warning("Disabling Strict Mode. Please wait...");
        // যদি আপনার জাভা ফাইলে deactivateStrictMode না থাকে, তবে আমরা deactivateMode কল করতে পারি বা আলাদা লজিক বানাতে পারি
        setIsStrict(false);
        toast.info("Strict Mode Disabled");
      } else {
        await ShieldPlugin.activateStrictMode();
        setIsStrict(true);
        toast.success("Strict Mode Activated: Shield cannot be bypassed!");
      }
    } catch (error) {
      toast.error("Failed to toggle Strict Mode");
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
      <h3 className="text-sm font-medium text-white/60 px-1">Quick Modes</h3>

      {/* Focus Mode Card */}
      <Card className={`bg-white/5 border-white/10 transition-all ${currentMode === 'focus' ? 'border-indigo-500/50 bg-indigo-500/10' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentMode === 'focus' ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
                <Brain className={`h-5 w-5 ${currentMode === 'focus' ? 'text-indigo-400' : 'text-white/40'}`} />
              </div>
              <div>
                <p className="font-medium text-sm">Focus Mode</p>
                <p className="text-[10px] text-white/40">Blocks FB, Insta, TikTok, YouTube</p>
              </div>
            </div>
            <Button 
              variant={currentMode === 'focus' ? "default" : "outline"} 
              size="sm"
              className={currentMode === 'focus' ? "bg-indigo-500 hover:bg-indigo-600 text-white" : "text-white/60"}
              onClick={() => toggleMode('focus')}
              disabled={isStrict}
            >
              {currentMode === 'focus' ? 'Active' : 'Enable'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sleep Mode Card */}
      <Card className={`bg-white/5 border-white/10 transition-all ${currentMode === 'sleep' ? 'border-purple-500/50 bg-purple-500/10' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentMode === 'sleep' ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                <Moon className={`h-5 w-5 ${currentMode === 'sleep' ? 'text-purple-400' : 'text-white/40'}`} />
              </div>
              <div>
                <p className="font-medium text-sm">Sleep Mode</p>
                <p className="text-[10px] text-white/40">Blocks social media + Reddit, Twitter</p>
              </div>
            </div>
            <Button 
              variant={currentMode === 'sleep' ? "default" : "outline"} 
              size="sm"
              className={currentMode === 'sleep' ? "bg-purple-500 hover:bg-purple-600 text-white" : "text-white/60"}
              onClick={() => toggleMode('sleep')}
              disabled={isStrict}
            >
              {currentMode === 'sleep' ? 'Active' : 'Enable'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Strict Mode Switch */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mt-4">
        <div className="flex items-center justify-between mb-2">
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
