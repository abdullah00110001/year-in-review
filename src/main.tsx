import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initBackgroundSync } from "./lib/backgroundSync";

// Initialize background sync for offline-first PWA
if ('serviceWorker' in navigator) {
  initBackgroundSync().catch(console.error);
}

// Capacitor initialization is handled by useCapacitor hook in App.tsx
// This ensures proper React lifecycle integration

createRoot(document.getElementById("root")!).render(<App />);
