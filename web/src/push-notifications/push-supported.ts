import { isSupported } from 'firebase/messaging';

export const isPushSupported = async (): Promise<boolean> => {
  if (window.cordova) {
    return 'initNotifications' in window;
  }

  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasNotifications = 'Notification' in window;
  const hasPushManager = 'PushManager' in window;

  if (!hasServiceWorker || !hasNotifications || !hasPushManager) return false;

  try {
    return await isSupported();
  } catch {}

  return false;
};
