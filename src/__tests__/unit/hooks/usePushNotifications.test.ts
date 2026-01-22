import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';

// Mock service worker and push manager
const mockPushSubscription = {
  endpoint: 'https://push.example.com/subscription/123',
  unsubscribe: vi.fn().mockResolvedValue(true),
};

const mockPushManager = {
  subscribe: vi.fn().mockResolvedValue(mockPushSubscription),
  getSubscription: vi.fn().mockResolvedValue(null),
};

const mockServiceWorkerRegistration = {
  pushManager: mockPushManager,
};

const mockServiceWorker = {
  ready: Promise.resolve(mockServiceWorkerRegistration),
};

describe('usePushNotifications', () => {
  let originalNotification: typeof Notification;
  let originalServiceWorker: typeof navigator.serviceWorker;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Store originals
    originalNotification = window.Notification;
    originalServiceWorker = navigator.serviceWorker;

    // Mock Notification API
    Object.defineProperty(window, 'Notification', {
      value: {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      },
      writable: true,
      configurable: true,
    });

    // Mock service worker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockServiceWorker,
      writable: true,
      configurable: true,
    });

    // Reset mock return values
    mockPushManager.getSubscription.mockResolvedValue(null);
  });

  afterEach(() => {
    // Restore
    Object.defineProperty(window, 'Notification', {
      value: originalNotification,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      writable: true,
      configurable: true,
    });
  });

  describe('isSupported', () => {
    it('should return true when Notification and serviceWorker are available', async () => {
      const { usePushNotifications } = await import('@/hooks/usePushNotifications');
      const { result } = renderHook(() => usePushNotifications());
      
      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
      });
    });

    it('should return false when Notification is not available', async () => {
      Object.defineProperty(window, 'Notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      
      // Need to re-import to get fresh module
      vi.resetModules();
      const { usePushNotifications } = await import('@/hooks/usePushNotifications');
      const { result } = renderHook(() => usePushNotifications());
      
      expect(result.current.isSupported).toBe(false);
    });
  });

  describe('isSubscribed', () => {
    it('should be false initially when no subscription exists', async () => {
      mockPushManager.getSubscription.mockResolvedValue(null);
      
      vi.resetModules();
      const { usePushNotifications } = await import('@/hooks/usePushNotifications');
      const { result } = renderHook(() => usePushNotifications());
      
      await waitFor(() => {
        expect(result.current.isSubscribed).toBe(false);
      });
    });

    it('should be true when subscription exists', async () => {
      mockPushManager.getSubscription.mockResolvedValue(mockPushSubscription);
      
      vi.resetModules();
      const { usePushNotifications } = await import('@/hooks/usePushNotifications');
      const { result } = renderHook(() => usePushNotifications());
      
      await waitFor(() => {
        expect(result.current.isSubscribed).toBe(true);
      });
    });
  });

  describe('loading', () => {
    it('should be false initially', async () => {
      const { usePushNotifications } = await import('@/hooks/usePushNotifications');
      const { result } = renderHook(() => usePushNotifications());
      
      expect(result.current.loading).toBe(false);
    });
  });

  describe('requestPermission', () => {
    it('should request notification permission', async () => {
      const { usePushNotifications } = await import('@/hooks/usePushNotifications');
      const { result } = renderHook(() => usePushNotifications());
      
      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
      });
      
      let permission: NotificationPermission | undefined;
      await act(async () => {
        permission = await result.current.requestPermission();
      });
      
      expect(permission).toBe('granted');
      expect(Notification.requestPermission).toHaveBeenCalled();
    });

    it('should throw when not supported', async () => {
      Object.defineProperty(window, 'Notification', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      
      vi.resetModules();
      const { usePushNotifications } = await import('@/hooks/usePushNotifications');
      const { result } = renderHook(() => usePushNotifications());
      
      await expect(result.current.requestPermission()).rejects.toThrow('Push notifications not supported');
    });
  });

  describe('subscribe', () => {
    it('should set loading to true during subscribe', async () => {
      const { usePushNotifications } = await import('@/hooks/usePushNotifications');
      const { result } = renderHook(() => usePushNotifications());
      
      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
      });
      
      let subscribePromise: Promise<void>;
      act(() => {
        subscribePromise = result.current.subscribe();
      });
      
      // Loading should be true during subscription
      expect(result.current.loading).toBe(true);
      
      await act(async () => {
        await subscribePromise;
      });
      
      // Loading should be false after subscription
      expect(result.current.loading).toBe(false);
    });

    it('should set isSubscribed to true after successful subscribe', async () => {
      const { usePushNotifications } = await import('@/hooks/usePushNotifications');
      const { result } = renderHook(() => usePushNotifications());
      
      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
      });
      
      await act(async () => {
        await result.current.subscribe();
      });
      
      expect(result.current.isSubscribed).toBe(true);
    });

    it('should throw when permission is denied', async () => {
      (Notification.requestPermission as ReturnType<typeof vi.fn>).mockResolvedValue('denied');
      
      const { usePushNotifications } = await import('@/hooks/usePushNotifications');
      const { result } = renderHook(() => usePushNotifications());
      
      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
      });
      
      await expect(act(async () => {
        await result.current.subscribe();
      })).rejects.toThrow('Notification permission denied');
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe successfully', async () => {
      mockPushManager.getSubscription.mockResolvedValue(mockPushSubscription);
      
      vi.resetModules();
      const { usePushNotifications } = await import('@/hooks/usePushNotifications');
      const { result } = renderHook(() => usePushNotifications());
      
      await waitFor(() => {
        expect(result.current.isSubscribed).toBe(true);
      });
      
      await act(async () => {
        await result.current.unsubscribe();
      });
      
      expect(result.current.isSubscribed).toBe(false);
      expect(mockPushSubscription.unsubscribe).toHaveBeenCalled();
    });

    it('should set loading during unsubscribe', async () => {
      mockPushManager.getSubscription.mockResolvedValue(mockPushSubscription);
      
      vi.resetModules();
      const { usePushNotifications } = await import('@/hooks/usePushNotifications');
      const { result } = renderHook(() => usePushNotifications());
      
      await waitFor(() => {
        expect(result.current.isSubscribed).toBe(true);
      });
      
      let unsubscribePromise: Promise<void>;
      act(() => {
        unsubscribePromise = result.current.unsubscribe();
      });
      
      expect(result.current.loading).toBe(true);
      
      await act(async () => {
        await unsubscribePromise;
      });
      
      expect(result.current.loading).toBe(false);
    });
  });
});
