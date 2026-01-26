// PWA Detection and Utility Functions

export function isPWAInstalled(): boolean {
  // Check if running in standalone mode (installed PWA)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // iOS Safari detection
  if ((navigator as { standalone?: boolean }).standalone === true) {
    return true;
  }
  
  // Check localStorage flag
  if (localStorage.getItem('pwa_installed') === 'true') {
    return true;
  }
  
  return false;
}

export function markAsInstalled(): void {
  localStorage.setItem('pwa_installed', 'true');
}

export function isIOSSafari(): boolean {
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isWebkit = /WebKit/.test(ua);
  const isNotChrome = !/CriOS/.test(ua);
  return isIOS && isWebkit && isNotChrome;
}

export function isAndroidChrome(): boolean {
  const ua = window.navigator.userAgent;
  return /Android/.test(ua) && /Chrome/.test(ua);
}

export function canInstallPWA(): boolean {
  // Check if the browser supports PWA installation
  return 'BeforeInstallPromptEvent' in window || isIOSSafari();
}

// Store the deferred prompt for later use
let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function setupInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Store the event for later use
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] Install prompt ready');
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    markAsInstalled();
    deferredPrompt = null;
  });
}

export async function triggerInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] No install prompt available');
    return false;
  }

  // Show the install prompt
  await deferredPrompt.prompt();
  
  // Wait for the user's choice
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`[PWA] User choice: ${outcome}`);
  
  if (outcome === 'accepted') {
    markAsInstalled();
  }
  
  deferredPrompt = null;
  return outcome === 'accepted';
}

export function hasInstallPrompt(): boolean {
  return deferredPrompt !== null;
}

// Service Worker Registration
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('[PWA] Service Worker registered:', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              console.log('[PWA] New content available');
              dispatchUpdateEvent();
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

function dispatchUpdateEvent() {
  window.dispatchEvent(new CustomEvent('pwa-update-available'));
}

// Check for updates
export async function checkForUpdates(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
    }
  }
}

// Skip waiting and activate new service worker
export async function skipWaiting(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
}
