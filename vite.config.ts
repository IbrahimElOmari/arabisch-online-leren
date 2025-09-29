import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode (development, staging, production)
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Arabic Learning Platform',
          short_name: 'ArabicLearn',
          description: 'Interactive Arabic Learning Platform',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png', 
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                rangeRequests: true
              }
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5 // 5 minutes
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            }
          ]
        }
      })
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
            // Split RTL-specific code when needed
            'rtl-core': ['./src/contexts/RTLContext', './src/hooks/useRTLLayout', './src/utils/arabicUtils'],
            'rtl-components': ['./src/components/rtl/RTLDashboard', './src/components/rtl/RTLTestRunner'],
            'rtl-performance': ['./src/utils/rtlBundleOptimization', './src/utils/performanceRTL'],
            // Regular chunks
            'vendor': ['react', 'react-dom'],
            'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            'supabase': ['@supabase/supabase-js'],
          }
        }
      },
      // CSS Code splitting
      cssCodeSplit: true,
      // Optimize CSS
      cssMinify: true,
    },
    css: {
      // Enable CSS modules for better tree-shaking
      modules: {
        localsConvention: 'camelCase'
      },
      devSourcemap: mode === 'development'
    },
    // Define environment variables for client-side
    define: {
      __APP_ENV__: JSON.stringify(mode),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
  }
});
