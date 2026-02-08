import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Sun, 
  Coffee,
  BookOpen,
  Dumbbell,
  Droplets,
  Smile,
  Music,
  Newspaper,
  Plus,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MorningRoutine {
  id: string;
  name: string;
  icon: React.ReactNode;
  duration: string;
  enabled: boolean;
  completed: boolean;
}

export function RiseMorningRoutines() {
  const [routines, setRoutines] = useState<MorningRoutine[]>([
    { id: '1', name: 'Drink Water', icon: <Droplets className="h-5 w-5" />, duration: '1 min', enabled: true, completed: false },
    { id: '2', name: 'Stretch & Exercise', icon: <Dumbbell className="h-5 w-5" />, duration: '15 min', enabled: true, completed: false },
    { id: '3', name: 'Morning Reflection', icon: <BookOpen className="h-5 w-5" />, duration: '10 min', enabled: true, completed: false },
    { id: '4', name: 'Healthy Breakfast', icon: <Coffee className="h-5 w-5" />, duration: '20 min', enabled: true, completed: false },
    { id: '5', name: 'Gratitude Practice', icon: <Smile className="h-5 w-5" />, duration: '5 min', enabled: false, completed: false },
    { id: '6', name: 'Listen to Podcast', icon: <Music className="h-5 w-5" />, duration: '30 min', enabled: false, completed: false },
    { id: '7', name: 'Read News', icon: <Newspaper className="h-5 w-5" />, duration: '10 min', enabled: false, completed: false },
  ]);

  const [isRoutineActive, setIsRoutineActive] = useState(false);

  const enabledRoutines = routines.filter(r => r.enabled);
  const totalDuration = enabledRoutines.reduce((acc, r) => {
    const mins = parseInt(r.duration);
    return acc + (isNaN(mins) ? 0 : mins);
  }, 0);

  const toggleRoutineEnabled = (id: string) => {
    setRoutines(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const toggleRoutineCompleted = (id: string) => {
    setRoutines(prev => prev.map(r => 
      r.id === id ? { ...r, completed: !r.completed } : r
    ));
  };

  const startRoutine = () => {
    setIsRoutineActive(true);
    setRoutines(prev => prev.map(r => ({ ...r, completed: false })));
  };

  const completedCount = routines.filter(r => r.enabled && r.completed).length;

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <Card className="bg-gradient-to-br from-amber-900/40 to-orange-800/20 border-amber-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <Sun className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Morning Routine</h2>
                <p className="text-sm text-muted-foreground">
                  {enabledRoutines.length} activities • ~{totalDuration} min
                </p>
              </div>
            </div>
          </div>

          {isRoutineActive ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">{completedCount}/{enabledRoutines.length}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${(completedCount / enabledRoutines.length) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <Button 
              className="w-full bg-amber-500 hover:bg-amber-600"
              onClick={startRoutine}
            >
              <Clock className="h-4 w-4 mr-2" />
              Start Morning Routine
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Active Routine View */}
      {isRoutineActive && (
        <Card className="border-primary">
          <CardHeader className="pb-2">
          <CardTitle className="text-base">Today's Routine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {enabledRoutines.map((routine) => (
              <button
                key={routine.id}
                onClick={() => toggleRoutineCompleted(routine.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
                  routine.completed 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                <div className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center transition-colors',
                  routine.completed ? 'bg-primary/20' : 'bg-background'
                )}>
                  {routine.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <span className={routine.completed ? 'text-primary' : 'text-muted-foreground'}>
                      {routine.icon}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className={cn(
                    'font-medium text-sm',
                    routine.completed && 'line-through text-muted-foreground'
                  )}>
                    {routine.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{routine.duration}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Routine Settings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Configure Routine</span>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {routines.map((routine) => (
            <div 
              key={routine.id}
              className="flex items-center justify-between p-3 bg-muted rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center">
                  {routine.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{routine.name}</p>
                  <p className="text-xs text-muted-foreground">{routine.duration}</p>
                </div>
              </div>
              <Switch
                checked={routine.enabled}
                onCheckedChange={() => toggleRoutineEnabled(routine.id)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm">
            <span className="font-bold">💡 Tip:</span> Complete your morning routine 
            within the first hour of waking to build lasting habits and boost productivity.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
