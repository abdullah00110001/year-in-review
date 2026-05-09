import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

// Global error handlers to prevent app crashes
window.addEventListener("unhandledrejection", (event) => {
  console.error("[App] Unhandled promise rejection:", event.reason);
  event.preventDefault();
});

window.addEventListener("error", (event) => {
  console.error("[App] Uncaught error:", event.error || event.message);
  event.preventDefault();
});

window.addEventListener('DOMContentLoaded', () => {
  if (!Capacitor.isNativePlatform()) return;

  const webView = navigator.userAgent.includes('wv');
  if (webView && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch((err) => {
        console.warn('[SW] Native cleanup failed:', err);
      });
  }
});
// Register service worker for push notifications (web only, not in Capacitor)
if ('serviceWorker' in navigator && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('[SW] Registration failed:', err);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);

// Hide native splash once React has mounted (small delay so first paint is ready)
if (Capacitor.isNativePlatform()) {
  setTimeout(() => {
    SplashScreen.hide().catch((err) => console.warn('[Splash] hide failed:', err));
  }, 100);
}
