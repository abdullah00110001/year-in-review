import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handlers to prevent app crashes
window.addEventListener("unhandledrejection", (event) => {
  console.error("[App] Unhandled promise rejection:", event.reason);
  event.preventDefault();
});

window.addEventListener("error", (event) => {
  console.error("[App] Uncaught error:", event.error);
});
// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.warn('[SW] Registration failed:', err);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
