import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PWALoadingScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

export default function PWALoadingScreen({ 
  onComplete, 
  minDuration = 800 
}: PWALoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    
    // Smooth progress animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    // Ensure minimum duration before completing
    const minTimer = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);
      
      setTimeout(() => {
        setProgress(100);
        setFadeOut(true);
        setTimeout(() => {
          onComplete?.();
        }, 300);
      }, remaining);
    }, minDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(minTimer);
    };
  }, [minDuration, onComplete]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-300',
        fadeOut && 'opacity-0 pointer-events-none'
      )}
    >
      {/* App Icon */}
      <div className="relative mb-6 animate-pulse">
        <img
          src="/icons/icon-192x192.png"
          alt="Yearly Track"
          className="h-20 w-20 rounded-2xl shadow-lg"
        />
      </div>

      {/* App Name */}
      <h1 className="mb-8 text-2xl font-bold text-foreground">
        Yearly Track
      </h1>

      {/* Progress Bar */}
      <div className="relative h-1 w-48 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-200 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Loading Text */}
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}
