import { ReactNode, useState, useRef, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  threshold?: number;
}

export default function PullToRefresh({
  children,
  onRefresh,
  className,
  threshold = 80,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    // Check if we're at the top of the page
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    if (distance > 0 && window.scrollY <= 0) {
      // Apply resistance
      const resistance = 0.4;
      const adjustedDistance = Math.min(distance * resistance, threshold * 1.5);
      setPullDistance(adjustedDistance);
    } else {
      setPullDistance(0);
    }
  }, [isPulling, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }

    setIsPulling(false);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;

  return (
    <div
      className={cn('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 transition-opacity duration-200"
          style={{
            top: Math.max(70, pullDistance + 20),
          }}
        >
          <div className={cn(
            'flex items-center justify-center h-10 w-10 rounded-full bg-card shadow-lg border border-border',
            isRefreshing && 'animate-pulse'
          )}>
            <RefreshCw
              className={cn(
                'h-5 w-5 text-primary transition-transform duration-200',
                isRefreshing && 'animate-spin'
              )}
              style={{
                transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Content with pull offset */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
