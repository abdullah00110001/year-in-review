import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'stats' | 'text';
  count?: number;
  className?: string;
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-muted/80',
        className
      )}
    />
  );
}

export default function SkeletonLoader({
  variant = 'card',
  count = 1,
  className,
}: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'stats') {
    return (
      <div className={cn('grid grid-cols-2 gap-4', className)}>
        {items.map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <SkeletonPulse className="mb-2 h-4 w-16" />
            <SkeletonPulse className="mb-1 h-8 w-20" />
            <SkeletonPulse className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {items.map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
          >
            <SkeletonPulse className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-4 w-3/4" />
              <SkeletonPulse className="h-3 w-1/2" />
            </div>
            <SkeletonPulse className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={cn('space-y-2', className)}>
        {items.map((i) => (
          <SkeletonPulse
            key={i}
            className={cn('h-4', i === items.length - 1 ? 'w-2/3' : 'w-full')}
          />
        ))}
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className={cn('space-y-4', className)}>
      {items.map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2">
              <SkeletonPulse className="h-5 w-32" />
              <SkeletonPulse className="h-3 w-20" />
            </div>
            <SkeletonPulse className="h-10 w-10 rounded-lg" />
          </div>
          <SkeletonPulse className="h-2 w-full rounded-full mb-3" />
          <div className="flex gap-3">
            <SkeletonPulse className="h-8 w-24 rounded-lg" />
            <SkeletonPulse className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
