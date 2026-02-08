import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Camera, 
  Calculator, 
  Footprints, 
  QrCode, 
  Brain, 
  Keyboard,
  Dumbbell,
  Smartphone,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface RiseAlarm {
  id: string;
  alarm_time: string;
  days_of_week: number[];
  alarm_type: string;
  is_enabled: boolean;
  intention: string | null;
  label: string | null;
  verification_type: string;
  snooze_limit: number;
  sound_type?: string;
}

interface RiseAlarmCardProps {
  alarm: RiseAlarm;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (alarm: RiseAlarm) => void;
  onDelete: (id: string) => void;
  onDuplicate: (alarm: RiseAlarm) => void;
}

export function RiseAlarmCard({ 
  alarm, 
  onToggle, 
  onEdit, 
  onDelete,
  onDuplicate 
}: RiseAlarmCardProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return { time: `${displayHour}:${minutes}`, ampm };
  };

  const getDayLabels = (days: number[]) => {
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return labels.map((l, i) => ({
      label: l,
      active: days.includes(i)
    }));
  };

  const getMissionIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Camera className="h-4 w-4" />;
      case 'math': return <Calculator className="h-4 w-4" />;
      case 'shake': return <Smartphone className="h-4 w-4" />;
      case 'qr': return <QrCode className="h-4 w-4" />;
      case 'memory': return <Brain className="h-4 w-4" />;
      case 'typing': return <Keyboard className="h-4 w-4" />;
      case 'walking': return <Footprints className="h-4 w-4" />;
      case 'squat': return <Dumbbell className="h-4 w-4" />;
      default: return null;
    }
  };

  const { time, ampm } = formatTime(alarm.alarm_time);
  const days = getDayLabels(alarm.days_of_week);
  const missionIcon = getMissionIcon(alarm.verification_type);

  return (
    <Card 
      className={cn(
        'transition-all cursor-pointer hover:border-primary/30',
        !alarm.is_enabled && 'opacity-50'
      )}
      onClick={() => onEdit(alarm)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Days Row */}
            <div className="flex gap-1.5 mb-2">
              {days.map((d, i) => (
                <span 
                  key={i}
                  className={cn(
                    'text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full',
                    d.active 
                      ? 'bg-primary/20 text-primary' 
                      : 'text-muted-foreground/50'
                  )}
                >
                  {d.label}
                </span>
              ))}
            </div>

            {/* Time Row */}
            <div className="flex items-center gap-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight">{time}</span>
                <span className="text-lg text-muted-foreground">{ampm}</span>
              </div>
              {missionIcon && (
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                  {missionIcon}
                </div>
              )}
            </div>

            {/* Label */}
            {(alarm.label || alarm.intention) && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-primary">🌟</span>
                <span className="text-sm text-muted-foreground truncate">
                  {alarm.label || alarm.intention}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={alarm.is_enabled}
              onCheckedChange={(checked) => onToggle(alarm.id, checked)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(alarm)}>
                  Edit Alarm
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(alarm)}>
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(alarm.id)}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
