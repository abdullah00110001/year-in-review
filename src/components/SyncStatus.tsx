import { useState, useEffect } from 'react';
import { syncManager } from '@/lib/syncManager';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export default function SyncStatus() {
  const { isOnline } = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((status, count) => {
      setSyncStatus(status);
      setPendingCount(count);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualSync = async () => {
    if (isOnline) {
      await syncManager.forceSyncNow();
    }
  };

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: CloudOff,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        label: 'Offline',
        description: pendingCount > 0 
          ? `${pendingCount} changes waiting to sync`
          : 'Working offline',
      };
    }

    switch (syncStatus) {
      case 'syncing':
        return {
          icon: RefreshCw,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          label: 'Syncing...',
          description: 'Uploading your changes',
          animate: true,
        };
      case 'success':
        return {
          icon: Check,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          label: 'Synced',
          description: 'All changes saved',
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          label: 'Sync Error',
          description: `${pendingCount} changes failed to sync`,
        };
      default:
        return {
          icon: Cloud,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          label: 'Online',
          description: pendingCount > 0 
            ? `${pendingCount} pending changes`
            : 'All synced',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-2 h-8 px-2',
              config.bgColor,
              !isOnline && 'opacity-70'
            )}
            onClick={handleManualSync}
            disabled={!isOnline || syncStatus === 'syncing'}
          >
            <Icon 
              className={cn(
                'h-4 w-4',
                config.color,
                config.animate && 'animate-spin'
              )} 
            />
            {pendingCount > 0 && (
              <span className={cn('text-xs font-medium', config.color)}>
                {pendingCount}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-center">
          <p className="font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
          {isOnline && pendingCount > 0 && (
            <p className="text-xs text-primary mt-1">Tap to sync now</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
