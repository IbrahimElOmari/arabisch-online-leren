import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeRTLOptimizations } from "./utils/rtlBundleOptimization";

// Initialize RTL optimizations for production
if (typeof window !== 'undefined') {
  initializeRTLOptimizations();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
