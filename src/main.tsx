import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initBackgroundSync } from "./lib/backgroundSync";
import { isNative } from "./lib/capacitor/platform";

// Global error handlers to prevent app crashes
window.addEventListener("unhandledrejection", (event) => {
  console.error("[App] Unhandled promise rejection:", event.reason);
  event.preventDefault();
});

window.addEventListener("error", (event) => {
  console.error("[App] Uncaught error:", event.error);
});

// Initialize background sync for offline-first PWA (web only)
if (!isNative && 'serviceWorker' in navigator) {
  initBackgroundSync().catch(console.error);
}

// Initialize offline sync for native
if (isNative) {
  import('./lib/capacitor/offlineSync').then(({ initializeOfflineSync }) => {
    initializeOfflineSync();
    console.log('[App] Native offline sync initialized');
  }).catch(console.error);
}

createRoot(document.getElementById("root")!).render(<App />);
