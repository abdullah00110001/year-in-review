import { Sunrise, Flame, ArrowLeft, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RiseHeaderProps {
  streak: number;
}

/**
 * RiseHeader — visually mirrors ShieldHeader for cross-feature consistency.
 * Same layout, same paddings, same control sizes; only the accent color
 * (amber/orange) and labels differ to keep each feature recognisable.
 */
export function RiseHeader({ streak }: RiseHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-background border-b border-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-9 w-9 rounded-xl shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sunrise className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold truncate text-foreground">Rise</h1>
            <p className="text-xs text-muted-foreground">Wake with Purpose</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
            <Flame className="h-3 w-3 mr-1" />
            {streak}d
          </Badge>
          <Button variant="ghost" size="icon" className="rounded-full relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
          </Button>
        </div>
      </div>
    </div>
  );
}
