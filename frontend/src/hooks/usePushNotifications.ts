import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const ensurePushRegistration = async () => {
  const existingRegistration = await navigator.serviceWorker.getRegistration('/push-sw.js');
  if (existingRegistration) {
    return existingRegistration;
  }

  return navigator.serviceWorker.register('/push-sw.js');
};

const subscribeBrowserToPush = async () => {
  const registration = await ensurePushRegistration();

  const vapidRes = await api.get('/api/notifications/vapid');
  if (!vapidRes?.public_key) {
    throw new Error('VAPID public key is missing');
  }

  const applicationServerKey = urlBase64ToUint8Array(vapidRes.public_key);
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

  await api.post('/api/notifications/subscribe', {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.toJSON().keys?.p256dh || "",
      auth: subscription.toJSON().keys?.auth || ""
    }
  });

  return subscription;
};

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  useEffect(() => {
    const syncSubscriptionState = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration('/push-sw.js');
        const subscription = await registration?.pushManager.getSubscription();
        setIsSubscribed(Boolean(subscription));

        // In installed PWAs, permission can already be granted while the push
        // subscription is still missing for this context. Repair it automatically.
        if (!subscription && 'Notification' in window && Notification.permission === 'granted') {
          await subscribeBrowserToPush();
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error('Failed to read push subscription state', error);
      }
    };

    void syncSubscriptionState();
  }, []);

  const requestPermissionAndSubscribe = async () => {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      console.error('Push Notifications not supported in this browser');
      return false;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      
      if (perm !== 'granted') {
          return false;
      }

      await subscribeBrowserToPush();
      setIsSubscribed(true);
      return true;

    } catch (error) {
      console.error('Failed to subscribe to push notifications', error);
      return false;
    }
  };

  return { isSubscribed, permission, requestPermissionAndSubscribe };
};
