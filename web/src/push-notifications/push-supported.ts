// @if process.env.FLOSS_BUILD!='true'
import { isSupported } from 'firebase/messaging';
// @endif

export const isPushSupported = async (): Promise<boolean> => {
  // @if process.env.FLOSS_BUILD='true'
  return false;
  // @endif

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
