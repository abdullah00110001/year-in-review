import { ReactNode } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface OfflineDataProps {
  children: ReactNode;
  isFromCache?: boolean;
  lastSynced?: string | null;
  className?: string;
  showIndicator?: boolean;
}

export default function OfflineData({
  children,
  isFromCache = false,
  lastSynced,
  className,
  showIndicator = true,
}: OfflineDataProps) {
  const { isOnline } = useNetworkStatus();

  const showBadge = showIndicator && (isFromCache || !isOnline);

  return (
    <div className={cn('relative', className)}>
      {showBadge && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
            !isOnline 
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
              : 'bg-muted text-muted-foreground'
          )}>
            {!isOnline ? (
              <>
                <WifiOff className="h-3 w-3" />
                <span>Offline</span>
              </>
            ) : isFromCache && lastSynced ? (
              <>
                <Clock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(lastSynced), { addSuffix: true })}
                </span>
              </>
            ) : null}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
