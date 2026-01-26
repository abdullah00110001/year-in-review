import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, RefreshCw, Check, AlertCircle, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
  variant?: 'banner' | 'badge' | 'minimal';
}

export default function OfflineIndicator({ className, variant = 'banner' }: OfflineIndicatorProps) {
  const { isOnline, syncStatus, pendingCount, forcSync } = useNetworkStatus();

  // Don't show anything if online and no pending items
  if (isOnline && pendingCount === 0 && syncStatus !== 'syncing') {
    return null;
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {!isOnline && (
          <div className="flex items-center gap-1 text-amber-500">
            <WifiOff className="h-4 w-4" />
          </div>
        )}
        {pendingCount > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Cloud className="h-4 w-4" />
            <span className="text-xs">{pendingCount}</span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'badge') {
    if (!isOnline) {
      return (
        <div className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-sm text-amber-500',
          className
        )}>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline</span>
        </div>
      );
    }

    if (syncStatus === 'syncing') {
      return (
        <div className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary',
          className
        )}>
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>Syncing...</span>
        </div>
      );
    }

    if (pendingCount > 0) {
      return (
        <div className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground',
          className
        )}>
          <Cloud className="h-3.5 w-3.5" />
          <span>{pendingCount} pending</span>
        </div>
      );
    }

    return null;
  }

  // Banner variant (default)
  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] transition-transform duration-300',
        (!isOnline || pendingCount > 0 || syncStatus === 'syncing') ? 'translate-y-0' : '-translate-y-full',
        className
      )}
    >
      {!isOnline ? (
        <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm text-white">
          <WifiOff className="h-4 w-4" />
          <span>You're offline. Changes will sync when connected.</span>
        </div>
      ) : syncStatus === 'syncing' ? (
        <div className="flex items-center justify-center gap-2 bg-primary px-4 py-2 text-sm text-primary-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Syncing your data...</span>
        </div>
      ) : syncStatus === 'success' && pendingCount === 0 ? (
        <div className="flex items-center justify-center gap-2 bg-green-500 px-4 py-2 text-sm text-white animate-fade-out">
          <Check className="h-4 w-4" />
          <span>All changes synced!</span>
        </div>
      ) : syncStatus === 'error' ? (
        <div className="flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm text-destructive-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Some changes couldn't sync. </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs hover:bg-destructive-foreground/10"
            onClick={forcSync}
          >
            Retry
          </Button>
        </div>
      ) : pendingCount > 0 ? (
        <div className="flex items-center justify-center gap-2 bg-muted px-4 py-2 text-sm text-muted-foreground">
          <Cloud className="h-4 w-4" />
          <span>{pendingCount} changes waiting to sync</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs hover:bg-muted-foreground/10"
            onClick={forcSync}
          >
            Sync Now
          </Button>
        </div>
      ) : null}
    </div>
  );
}
