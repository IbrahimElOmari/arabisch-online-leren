import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeRTLOptimizations } from "./utils/rtlBundleOptimization";
import { initializeCriticalCSS } from "./utils/criticalCSS";

// Initialize optimizations
if (import.meta.env.PROD) {
  initializeRTLOptimizations();
}
initializeCriticalCSS();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
