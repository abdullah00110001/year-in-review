import { useState, useEffect, useCallback } from 'react';
import {
  isPWAInstalled,
  isIOSSafari,
  hasInstallPrompt,
  triggerInstallPrompt,
  setupInstallPrompt,
} from '@/lib/pwaUtils';

interface InstallPromptState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOSSafari: boolean;
  install: () => Promise<boolean>;
}

export function useInstallPrompt(): InstallPromptState {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(isPWAInstalled());

  useEffect(() => {
    // Setup install prompt listener
    setupInstallPrompt();

    // Check if install prompt is available
    const checkInstallable = () => {
      setIsInstallable(hasInstallPrompt());
    };

    // Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', () => {
      setIsInstallable(true);
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
    });

    // Check periodically
    const interval = setInterval(checkInstallable, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    const result = await triggerInstallPrompt();
    if (result) {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    return result;
  }, []);

  return {
    isInstallable,
    isInstalled,
    isIOSSafari: isIOSSafari(),
    install,
  };
}
