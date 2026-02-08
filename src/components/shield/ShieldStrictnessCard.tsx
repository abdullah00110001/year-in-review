import { Card, CardContent } from '@/components/ui/card';
import { Lock, LockOpen, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type StrictnessMode = 'normal' | 'lock' | 'strict';

interface ShieldStrictnessCardProps {
  activeMode: StrictnessMode;
  onClick: () => void;
}

export function ShieldStrictnessCard({ activeMode, onClick }: ShieldStrictnessCardProps) {
  const getModeDetails = (mode: StrictnessMode) => {
    switch (mode) {
      case 'normal':
        return {
          icon: LockOpen,
          label: 'Normal Mode',
          description: 'Make any changes and uninstall the app freely.',
          lockLevel: 0,
        };
      case 'lock':
        return {
          icon: Lock,
          label: 'Lock Mode',
          description: 'Password required to change settings.',
          lockLevel: 1,
        };
      case 'strict':
        return {
          icon: Lock,
          label: 'Strict Mode',
          description: 'Maximum protection enabled.',
          lockLevel: 2,
        };
    }
  };

  const modeDetails = getModeDetails(activeMode);

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
    <Card 
      className="bg-gradient-to-br from-amber-700/30 to-amber-800/20 border-amber-600/30 cursor-pointer hover:bg-amber-700/40 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-amber-600/30 flex items-center justify-center">
              <modeDetails.icon className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Strictness Level</span>
              {getLockIcons(modeDetails.lockLevel)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">{modeDetails.label}</h3>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground mt-1">{modeDetails.description}</p>
      </CardContent>
    </Card>
  );
}
