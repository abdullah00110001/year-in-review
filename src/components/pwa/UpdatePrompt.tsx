import { useServiceWorker } from '@/hooks/useServiceWorker';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function UpdatePrompt() {
  const { needRefresh, offlineReady, updateServiceWorker, isUpdating } = useServiceWorker();

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      className={cn(
        'fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300',
        'lg:left-auto lg:right-6 lg:max-w-sm'
      )}
    >
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xl">
        {offlineReady ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Ready for Offline</p>
              <p className="text-sm text-muted-foreground">
                App can now work without internet
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <RefreshCw className={cn(
                'h-5 w-5 text-primary',
                isUpdating && 'animate-spin'
              )} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Update Available</p>
              <p className="text-sm text-muted-foreground">
                A new version is ready to install
              </p>
            </div>
            <Button
              size="sm"
              onClick={updateServiceWorker}
              disabled={isUpdating}
              className="shrink-0"
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
