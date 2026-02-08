import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Lock, 
  LockOpen, 
  Smartphone,
  Zap,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type StrictnessMode = 'normal' | 'lock' | 'strict';

interface ShieldModesProps {
  activeMode: StrictnessMode;
  onModeChange: (mode: StrictnessMode) => void;
  disciplineScore?: number;
}

export function ShieldModes({ activeMode, onModeChange, disciplineScore = 50 }: ShieldModesProps) {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showStrictDialog, setShowStrictDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingMode, setPendingMode] = useState<StrictnessMode | null>(null);

  const modes = [
    {
      id: 'normal' as StrictnessMode,
      icon: LockOpen,
      label: 'Normal Mode',
      description: 'Make any changes and uninstall the app freely.',
      color: 'from-muted/50 to-muted/30',
      borderColor: 'border-muted-foreground/20',
      iconBg: 'bg-muted-foreground/20',
      lockLevel: 0,
    },
    {
      id: 'lock' as StrictnessMode,
      icon: Lock,
      label: 'Lock Mode',
      description: 'Set a password to block phone settings, and control Stay Focused access or profile changes.',
      color: 'from-muted/50 to-muted/30',
      borderColor: 'border-muted-foreground/20',
      iconBg: 'bg-muted-foreground/20',
      lockLevel: 1,
      hasQuickAction: true,
    },
    {
      id: 'strict' as StrictnessMode,
      icon: Smartphone,
      label: 'Strict Mode',
      description: 'Set deactivation method to block phone settings, app uninstallations including Stay Focused, and profile changes.',
      color: 'from-muted/50 to-muted/30',
      borderColor: 'border-muted-foreground/20',
      iconBg: 'bg-muted-foreground/20',
      lockLevel: 2,
      requiresScore: 60,
    },
  ];

  const handleModeSelect = (mode: StrictnessMode) => {
    if (mode === 'strict' && disciplineScore < 60) {
      toast.error('You need a discipline score of 60+ to use Strict Mode');
      return;
    }

    if (mode === 'lock') {
      setPendingMode(mode);
      setShowPasswordDialog(true);
    } else if (mode === 'strict') {
      setPendingMode(mode);
      setShowStrictDialog(true);
    } else {
      onModeChange(mode);
      toast.success('Normal Mode activated');
    }
  };

  const handlePasswordSubmit = () => {
    if (password.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (pendingMode) {
      onModeChange(pendingMode);
      toast.success('Lock Mode activated');
    }
    setShowPasswordDialog(false);
    setPassword('');
    setConfirmPassword('');
    setPendingMode(null);
  };

  const handleStrictConfirm = () => {
    if (pendingMode) {
      onModeChange(pendingMode);
      toast.success('Strict Mode activated - Stay focused!');
    }
    setShowStrictDialog(false);
    setPendingMode(null);
  };

  const getLockIcons = (level: number) => {
    return (
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <Lock
            key={i}
            className={cn(
              'h-4 w-4',
              i <= level ? 'text-destructive' : 'text-muted-foreground/30'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-lg">Select Mode</h2>
      </div>

      {modes.map((mode) => {
        const isActive = activeMode === mode.id;
        const isLocked = mode.requiresScore && disciplineScore < mode.requiresScore;

        return (
          <Card
            key={mode.id}
            className={cn(
              'transition-all overflow-hidden',
              isActive && 'ring-2 ring-primary',
              isLocked && 'opacity-60'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', mode.iconBg)}>
                    <mode.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {isActive ? (
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      Active
                    </Badge>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full px-4"
                      onClick={() => handleModeSelect(mode.id)}
                      disabled={isLocked}
                    >
                      Activate
                    </Button>
                  )}
                </div>
                {getLockIcons(mode.lockLevel)}
              </div>

              <h3 className="font-semibold text-lg mb-1">{mode.label}</h3>
              <p className="text-sm text-muted-foreground">{mode.description}</p>

              {mode.hasQuickAction && (
                <Button
                  variant="default"
                  className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  ENABLE WITH LAST SETTINGS
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              )}

              {isLocked && (
                <p className="text-xs text-muted-foreground mt-2">
                  Requires {mode.requiresScore}+ discipline score (current: {disciplineScore})
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Lock Mode Password</DialogTitle>
            <DialogDescription>
              This password will be required to disable Lock Mode or change settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handlePasswordSubmit}>
              Enable Lock Mode
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Strict Mode Confirmation */}
      <Dialog open={showStrictDialog} onOpenChange={setShowStrictDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Strict Mode?</DialogTitle>
            <DialogDescription>
              In Strict Mode, you won't be able to:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Change phone settings</li>
                <li>Uninstall Shield</li>
                <li>Modify profiles during active sessions</li>
                <li>Disable blocking without waiting period</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowStrictDialog(false)}>
              Cancel
            </Button>
            <Button className="flex-1 bg-destructive hover:bg-destructive/90" onClick={handleStrictConfirm}>
              Enable Strict Mode
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
