import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Check,
  X,
  Crown,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockScreenOption {
  id: string;
  background: string;
  isPremium?: boolean;
  isCustom?: boolean;
}

interface ShieldBlockScreenProps {
  onBack: () => void;
  selectedScreen: string;
  onSelectScreen: (id: string) => void;
}

export function ShieldBlockScreen({ onBack, selectedScreen, onSelectScreen }: ShieldBlockScreenProps) {
  const blockScreens: BlockScreenOption[] = [
    {
      id: 'default',
      background: 'bg-gradient-to-br from-violet-300 to-violet-400',
    },
    {
      id: 'ocean',
      background: 'bg-gradient-to-br from-cyan-400 to-blue-500',
      isPremium: true,
    },
    {
      id: 'custom',
      background: 'bg-gradient-to-br from-gray-400 to-gray-500',
      isCustom: true,
      isPremium: true,
    },
    {
      id: 'sunset',
      background: 'bg-gradient-to-br from-cyan-300 to-pink-400',
      isPremium: true,
    },
    {
      id: 'nature',
      background: 'bg-gradient-to-br from-violet-200 to-violet-300',
      isPremium: true,
    },
    {
      id: 'minimal',
      background: 'bg-gradient-to-br from-pink-300 to-rose-400',
      isPremium: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 text-white px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-muted/20 text-white hover:bg-muted/30"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Block Screen</h1>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {blockScreens.map((screen) => (
            <Card 
              key={screen.id}
              className={cn(
                'relative overflow-hidden cursor-pointer transition-all aspect-[3/4]',
                selectedScreen === screen.id && 'ring-2 ring-primary'
              )}
              onClick={() => !screen.isPremium && onSelectScreen(screen.id)}
            >
              <CardContent className={cn('p-0 h-full', screen.background)}>
                <div className="absolute inset-0 p-3 flex flex-col">
                  {/* App Icon */}
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                      <span className="text-white text-xs font-bold">SF</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-white/20 text-white hover:bg-white/30"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Quote */}
                  <div className="mt-3">
                    <p className="text-white/80 text-xs font-medium leading-tight">
                      Stay Focused on your GOALS, your PEACE & your HAPPINESS...
                    </p>
                  </div>

                  {/* Center Icon */}
                  <div className="flex-1 flex items-center justify-center">
                    {selectedScreen === screen.id ? (
                      <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center">
                        <Check className="h-8 w-8 text-slate-800" />
                      </div>
                    ) : screen.isPremium ? (
                      <div className="h-14 w-14 rounded-full bg-amber-500 flex items-center justify-center">
                        <Crown className="h-7 w-7 text-white" />
                      </div>
                    ) : null}
                  </div>

                  {/* Custom Upload Button */}
                  {screen.isCustom && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full mt-auto bg-white/20 backdrop-blur text-white hover:bg-white/30"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
