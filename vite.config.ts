import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split RTL-specific code into separate chunks
          'rtl-core': ['./src/contexts/RTLContext', './src/hooks/useRTLLayout', './src/utils/arabicUtils'],
          'rtl-components': ['./src/components/rtl/RTLDashboard', './src/components/rtl/RTLTestRunner'],
          'rtl-performance': ['./src/utils/rtlBundleOptimization', './src/utils/performanceRTL'],
          // Regular chunks
          'vendor': ['react', 'react-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'supabase': ['@supabase/supabase-js'],
        }
      }
    }
  },
}));
