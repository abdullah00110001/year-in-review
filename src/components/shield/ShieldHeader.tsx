import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ShieldHeader() {
  const navigate = useNavigate();
  return (
    <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="h-9 w-9 rounded-xl"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Focus Shield</h1>
            <p className="text-xs text-muted-foreground">Digital Wellbeing</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
            Active
          </Badge>
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-destructive rounded-full" />
          </Button>
        </div>
      </div>
    </div>
  );
}
