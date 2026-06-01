import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { LifeOSLogo } from '@/components/LifeOSLogo';

interface NativeSplashProps {
  onComplete?: () => void;
  /**
   * When provided, the splash stays mounted (no auto-fade) until this becomes false.
   * Used by the app shell to gate splash dismissal on auth resolution.
   */
  waitFor?: boolean;
}

export default function NativeSplash({ onComplete, waitFor }: NativeSplashProps) {
  const [entered, setEntered] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Fade-in + scale-up over 400ms on first paint
  useEffect(() => {
    const r = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(r);
  }, []);

  // Dismiss when waitFor flips false (or after a short min-show window when uncontrolled)
  useEffect(() => {
    if (waitFor === undefined) {
      const t = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => onComplete?.(), 300);
      }, 900);
      return () => clearTimeout(t);
    }
    if (waitFor === false) {
      setFadeOut(true);
      const t = setTimeout(() => onComplete?.(), 300);
      return () => clearTimeout(t);
    }
  }, [waitFor, onComplete]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-300',
        'bg-white dark:bg-[#0d1520]',
        fadeOut && 'opacity-0 pointer-events-none',
      )}
    >
      <div
        className={cn(
          'transition-all duration-[400ms] ease-out',
          entered ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.85]',
        )}
      >
        <LifeOSLogo size={160} />
      </div>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#0a1f2e] dark:text-white">
        Life OS
      </h1>

      <p className="mt-2 text-[11px] font-semibold tracking-[0.32em] uppercase text-[#1a80d4]">
        Rise · Shield · Growth
      </p>
    </div>
  );
}
