import { Sunrise, Flame, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RiseHeaderProps {
  streak: number;
  nextAlarm?: { time: string; countdown: string } | null;
}

export function RiseHeader({ streak }: RiseHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="bg-gradient-to-br from-amber-900/60 via-orange-800/40 to-rose-700/30 text-white p-4 pb-6 rounded-b-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 text-white"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <Sunrise className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Rise</h1>
            <p className="text-sm text-white/70">Wake with Purpose</p>
          </div>
        </div>
        <Badge variant="outline" className="border-white/20 text-white bg-white/10">
          <Flame className="h-3 w-3 mr-1 text-orange-400" />
          {streak} days
        </Badge>
      </div>
    </div>
  );
}
