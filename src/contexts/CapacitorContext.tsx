import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useCapacitor } from '@/hooks/useCapacitor';
import { isNative, isAndroid } from '@/lib/capacitor/platform';

interface CapacitorContextType {
  isNative: boolean;
  isAndroid: boolean;
  isInitialized: boolean;
  deviceInfo: any;
  pushToken: string | null;
}

const CapacitorContext = createContext<CapacitorContextType>({
  isNative: false,
  isAndroid: false,
  isInitialized: false,
  deviceInfo: null,
  pushToken: null
});

export const useCapacitorContext = () => useContext(CapacitorContext);

interface CapacitorProviderProps {
  children: ReactNode;
}

export function CapacitorProvider({ children }: CapacitorProviderProps) {
  const capacitorState = useCapacitor();
  
  // Show loading screen while Capacitor initializes on native
  if (isNative && !capacitorState.isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto animate-pulse">
            <svg viewBox="0 0 100 100" className="text-primary">
              <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.2" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="280" strokeDashoffset="70" className="animate-spin origin-center" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">Loading Life OS...</p>
        </div>
      </div>
    );
  }
  
  return (
    <CapacitorContext.Provider value={capacitorState}>
      {children}
    </CapacitorContext.Provider>
  );
}

// Hook to check if running as installed app (PWA or native)
export function useInstalledApp() {
  const { isNative } = useCapacitorContext();
  const [isInstalled, setIsInstalled] = useState(false);
  
  useEffect(() => {
    // Check if PWA is installed
    const isPwaInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as any).standalone === true;
    
    setIsInstalled(isNative || isPwaInstalled);
  }, [isNative]);
  
  return { isInstalled, isNative };
}

// Hook for safe area insets (for notch devices)
export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });
  
  useEffect(() => {
    // Get CSS safe area insets
    const computeInsets = () => {
      const style = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(style.getPropertyValue('--sat') || '0') || 
             parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
        bottom: parseInt(style.getPropertyValue('--sab') || '0') ||
                parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(style.getPropertyValue('--sal') || '0') ||
              parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
        right: parseInt(style.getPropertyValue('--sar') || '0') ||
               parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
      });
    };
    
    computeInsets();
    window.addEventListener('resize', computeInsets);
    return () => window.removeEventListener('resize', computeInsets);
  }, []);
  
  return insets;
}
