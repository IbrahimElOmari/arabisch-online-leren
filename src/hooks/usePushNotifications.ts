/**
 * Push Notifications Hook for PWA
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if Push API is supported
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      throw new Error('Push notifications not supported');
    }

    return await Notification.requestPermission();
  };

  const subscribe = async (): Promise<void> => {
    setLoading(true);
    try {
      const permission = await requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      );
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey as Uint8Array
      });

      // TODO: Save subscription to backend when push_subscriptions table exists
      // await supabase.from('push_subscriptions').upsert({...})
      
      console.log('Push subscription created:', subscription.endpoint);

      setIsSubscribed(true);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async (): Promise<void> => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        // TODO: Remove from backend when push_subscriptions table exists
        console.log('Push subscription removed');
      }

      setIsSubscribed(false);
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async (): Promise<void> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      setIsSubscribed(false);
    }
  };

  useEffect(() => {
    if (isSupported) {
      void checkSubscription();
    }
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    requestPermission
  };
}

/**
 * Helper: Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Helper: Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
