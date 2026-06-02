import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { LifeOSLogo } from '@/components/LifeOSLogo';

interface NativeSplashProps {
  onComplete?: () => void;
  waitFor?: boolean;
}

export default function NativeSplash({ onComplete, waitFor }: NativeSplashProps) {
  const [entered, setEntered] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const r = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(r);
  }, []);

  useEffect(() => {
    if (waitFor === undefined) {
      const t = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => onComplete?.(), 350);
      }, 1200);
      return () => clearTimeout(t);
    }
    if (waitFor === false) {
      setFadeOut(true);
      const t = setTimeout(() => onComplete?.(), 350);
      return () => clearTimeout(t);
    }
  }, [waitFor, onComplete]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-300',
        'bg-gradient-to-br from-white via-[#eaf4ff] to-[#cfe6fb]',
        'dark:from-[#06101c] dark:via-[#0a1a2d] dark:to-[#0d2440]',
        fadeOut && 'opacity-0 pointer-events-none',
      )}
    >
      {/* ambient glow blobs */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-[#2EA3F2]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#1670C8]/25 blur-3xl" />

      <div className="relative flex flex-col items-center">
        {/* halo ring behind logo */}
        <div
          className={cn(
            'absolute inset-0 m-auto h-[260px] w-[260px] rounded-full',
            'bg-[radial-gradient(circle,rgba(46,163,242,0.35)_0%,transparent_70%)]',
            'transition-all duration-700 ease-out',
            entered ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
          )}
        />

        <div
          className={cn(
            'relative transition-all duration-[600ms] ease-out',
            entered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.8] translate-y-2',
          )}
        >
          <LifeOSLogo size={220} />
        </div>

        <h1
          className={cn(
            'mt-8 text-[34px] font-extrabold tracking-tight text-[#0a1f2e] dark:text-white transition-all duration-700 delay-150',
            entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
          )}
        >
          Life OS
        </h1>

        <p
          className={cn(
            'mt-3 text-[12px] font-semibold tracking-[0.4em] uppercase text-[#1670C8] dark:text-[#7BC4F5] transition-all duration-700 delay-300',
            entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
          )}
        >
          Rise · Shield · Growth
        </p>

        {/* shimmer bar */}
        <div className="mt-10 h-1 w-32 overflow-hidden rounded-full bg-[#1670C8]/15">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#7BC4F5] via-[#2EA3F2] to-[#1670C8] animate-shimmer bg-[length:200%_100%]" />
        </div>
      </div>
    </div>
  );
}
