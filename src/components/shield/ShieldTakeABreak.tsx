import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coffee } from 'lucide-react';
import { toast } from 'sonner';

interface ShieldTakeABreakProps {
  onBreakStart: (minutes: number) => void;
  disabled?: boolean;
}

export function ShieldTakeABreak({ onBreakStart, disabled }: ShieldTakeABreakProps) {
  const breakDurations = [
    { label: '30 min', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '4 hours', minutes: 240 },
    { label: '1 day', minutes: 1440 }
  ];

  const handleBreakClick = (minutes: number) => {
    if (disabled) {
      toast.error('Cannot start break during active session');
      return;
    }
    onBreakStart(minutes);
    toast.success(`Break started for ${breakDurations.find(d => d.minutes === minutes)?.label}`);
  };

  return (
    <Card className="bg-gradient-to-br from-violet-600/30 to-purple-700/20 border-violet-500/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Coffee className="h-5 w-5 text-violet-400" />
          <h3 className="font-semibold">Take a Break</h3>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {breakDurations.map((duration) => (
            <Button
              key={duration.minutes}
              variant="secondary"
              size="sm"
              className="flex-shrink-0 rounded-full bg-violet-800/40 hover:bg-violet-700/50 border-violet-500/30 text-violet-100"
              onClick={() => handleBreakClick(duration.minutes)}
              disabled={disabled}
            >
              {duration.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
