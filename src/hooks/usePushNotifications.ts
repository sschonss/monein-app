import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

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

export function usePushNotifications() {
  const [permission, setPermission] = useState<PermissionState>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  useEffect(() => {
    if (!supported) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PermissionState);

    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        setSubscribed(!!sub);
      });
    });
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) return false;
    setLoading(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);
      if (perm !== 'granted') {
        setLoading(false);
        return false;
      }

      const { data } = await api.get('/push/vapid-key');
      const vapidKey = urlBase64ToUint8Array(data.vapid_key);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey as BufferSource,
      });

      const json = subscription.toJSON();
      await api.post('/push/subscribe', {
        endpoint: json.endpoint,
        keys: {
          auth: json.keys?.auth,
          p256dh: json.keys?.p256dh,
        },
      });

      setSubscribed(true);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Push subscription failed:', err);
      setLoading(false);
      return false;
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await api.delete('/push/unsubscribe', {
          data: { endpoint: subscription.endpoint },
        });
        await subscription.unsubscribe();
      }

      setSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe failed:', err);
    }
    setLoading(false);
  }, [supported]);

  return { permission, subscribed, supported, loading, subscribe, unsubscribe };
}
