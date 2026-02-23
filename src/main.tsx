import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handlers to prevent app crashes — catch EVERYTHING
window.addEventListener("unhandledrejection", (event) => {
  const msg = String(event.reason?.message || event.reason || '');
  console.error("[App] Unhandled promise rejection:", msg);
  // Prevent all unhandled rejections from crashing the app
  event.preventDefault();
});

window.addEventListener("error", (event) => {
  const msg = event.error?.message || event.message || '';
  console.error("[App] Uncaught error:", msg);
  
  // Check if it's a Capacitor/native bridge error - these should NOT kill the app
  if (msg.includes('Capacitor') || msg.includes('cap_') || msg.includes('plugin') || 
      msg.includes('PushNotifications') || msg.includes('LocalNotifications') ||
      msg.includes('StatusBar') || msg.includes('SplashScreen') ||
      msg.includes('not implemented') || msg.includes('not available')) {
    console.warn("[App] Native plugin error suppressed:", msg);
    event.preventDefault();
    return;
  }
  
  // Prevent error from propagating and killing the app
  event.preventDefault();
});

// Register service worker for push notifications (web only, not in Capacitor)
if ('serviceWorker' in navigator && !window.location.protocol.includes('capacitor')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('[SW] Registration failed:', err);
    });
  });
}

// Safe render with crash recovery
const rootEl = document.getElementById("root");
if (rootEl) {
  try {
    const root = createRoot(rootEl);
    root.render(<App />);
  } catch (err) {
    console.error("[App] Fatal render error:", err);
    rootEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff;font-family:sans-serif;text-align:center;padding:20px"><div><h2>App failed to start</h2><p style="opacity:0.7;margin:10px 0">Please restart the app</p><button onclick="location.reload()" style="padding:10px 24px;background:#0ea5e9;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer">Reload</button></div></div>';
  }
} else {
  console.error("[App] Root element not found!");
}
