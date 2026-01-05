import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

// CSS imports in GUARANTEED load order (no @import fragility)
import "./index.css";
import "./styles/cross-browser.css";
import "./styles/rtl.css";
import "./styles/accessibility.css";
import "./mobile-optimizations.css";

import { initializeRTLOptimizations } from "./utils/rtlBundleOptimization";
import { initializeCriticalCSS } from "./utils/criticalCSS";
import { initializeCrossBrowserRTL } from "./utils/crossBrowserRTL";
import { GlobalErrorBoundary } from "./components/system/GlobalErrorBoundary";
import { initMonitoring } from "./lib/monitoring";
import { initWebVitals } from "./utils/webVitals";
import { initContainerQueryFallback } from "./utils/containerQueryFallback";
import { initServiceWorkerManager } from "./utils/serviceWorkerManager";

// Initialize optimizations
if (import.meta.env.PROD) {
  initializeRTLOptimizations();
  // Initialize monitoring (Sentry) in production
  initMonitoring().catch(console.error);
}
initializeCriticalCSS();

// Initialize cross-browser RTL fixes
initializeCrossBrowserRTL();

// Initialize container query fallback detection
initContainerQueryFallback();

// Initialize Web Vitals tracking
initWebVitals();

// Initialize service worker manager for cache updates (PROD only to prevent stale DEV builds)
if (import.meta.env.PROD) {
  initServiceWorkerManager();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
);
