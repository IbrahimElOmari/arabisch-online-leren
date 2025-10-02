import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeRTLOptimizations } from "./utils/rtlBundleOptimization";
import { initializeCriticalCSS } from "./utils/criticalCSS";
import { initializeCrossBrowserRTL } from "./utils/crossBrowserRTL";
import { GlobalErrorBoundary } from "./components/system/GlobalErrorBoundary";

// Initialize optimizations
if (import.meta.env.PROD) {
  initializeRTLOptimizations();
}
initializeCriticalCSS();

// Initialize cross-browser RTL fixes
initializeCrossBrowserRTL();

// Service worker is handled by VitePWA plugin

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
);
