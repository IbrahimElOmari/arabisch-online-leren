/**
 * Service Worker Manager
 * Handles SW registration, updates, and cache management
 */

export async function initServiceWorkerManager(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW Manager] Service workers not supported');
    return;
  }

  try {
    // Get all registrations and check for updates
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      // Force check for updates
      registration.update().catch(console.error);
      
      // Listen for new service worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW Manager] New version available, activating...');
              // New SW is ready, tell it to take over immediately
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });
    }

    // Listen for controller change (new SW took over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW Manager] New service worker activated');
      // Optionally reload to ensure fresh content
      // window.location.reload();
    });

  } catch (error) {
    console.error('[SW Manager] Error:', error);
  }
}

/**
 * Force clear all caches and unregister service workers
 * Use this for troubleshooting
 */
export async function forceServiceWorkerReset(): Promise<void> {
  try {
    // Clear all caches
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW Manager] All caches cleared');

    // Unregister all service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.unregister()));
    console.log('[SW Manager] All service workers unregistered');

    // Reload to get fresh content
    window.location.reload();
  } catch (error) {
    console.error('[SW Manager] Reset error:', error);
  }
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).forceServiceWorkerReset = forceServiceWorkerReset;
}
