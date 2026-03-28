/*
 * This module is responsible for managing browser push notification
 * subscriptions via the firebase SDK.
 */
import { Lbryio } from 'lbryinc';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import { firebaseConfig, vapidKey } from '$web/src/firebase-config';
import { addRegistration, removeRegistration, hasRegistration } from '$web/src/push-notifications/fcm-management';
import { browserData } from '$web/src/ua';
import { isPushSupported } from '$web/src/push-notifications/push-supported';
let messaging: any = null;
let pushSystem: Record<string, any> | null = null;

const getTokenList = (value: unknown): Array<any> => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    if (Array.isArray((value as any).items)) return (value as any).items;
    if (Array.isArray((value as any).data)) return (value as any).data;
    if (Array.isArray((value as any).result)) return (value as any).result;
  }
  return [];
};

const subscriptionMetaData = () => {
  const isMobile = (window.navigator as any).userAgentData?.mobile || false;
  const browserName = browserData.browser?.name || 'unknown';
  const osName = browserData.os?.name || 'unknown';
  return {
    type: `web-${isMobile ? 'mobile' : 'desktop'}`,
    name: `${browserName}-${osName}`,
  };
};

const getFcmToken = async (): Promise<string | void> => {
  const swRegistration = await navigator.serviceWorker?.ready;
  if (!swRegistration) return;
  return getToken(messaging, {
    serviceWorkerRegistration: swRegistration,
    vapidKey,
  });
};

const subscribe = async (userId: number, permanent: boolean = true): Promise<boolean> => {
  try {
    const fcmToken = await getFcmToken();
    if (!fcmToken) return false;
    await Lbryio.call('cfm', 'add', {
      token: fcmToken,
      ...subscriptionMetaData(),
    });
    if (permanent) addRegistration(userId);
    return true;
  } catch {
    return false;
  }
};

const unsubscribe = async (userId: number, permanent: boolean = true): Promise<boolean> => {
  try {
    const fcmToken = await getFcmToken();
    if (!fcmToken) return false;
    await deleteToken(messaging);
    await Lbryio.call('cfm', 'remove', {
      token: fcmToken,
    });
    if (permanent) removeRegistration(userId);
    return true;
  } catch {
    return false;
  }
};

const subscribed = async (userId: number): Promise<boolean> => {
  const swRegistration = await navigator.serviceWorker?.ready;
  if (!swRegistration || !swRegistration.pushManager) return false;
  const browserSubscriptionExists = (await swRegistration.pushManager.getSubscription()) !== null;
  const userRecordExists = hasRegistration(userId);
  return browserSubscriptionExists && userRecordExists;
};

const reconnect = async (userId: number): Promise<boolean> => {
  if (hasRegistration(userId)) return subscribe(userId, false);
  return false;
};

const disconnect = async (userId: number): Promise<boolean> => {
  if (hasRegistration(userId)) return unsubscribe(userId, false);
  return false;
};

const validate = async (userId: number) => {
  if (!hasRegistration(userId)) return;

  const runValidation = async () => {
    try {
      const serverTokensRaw = await Lbryio.call('cfm', 'list');
      const serverTokens = getTokenList(serverTokensRaw);
      const fcmToken = await getFcmToken();
      if (!fcmToken) return;

      const exists = serverTokens.find((item) => item?.value === fcmToken || item?.token === fcmToken);
      if (!exists) {
        await subscribe(userId, false);
      }
    } catch {
      // Ignore validation failures; we'll retry on the next refresh path.
    }
  };

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => {
      void runValidation();
    });
  } else {
    window.setTimeout(() => {
      void runValidation();
    }, 0);
  }
};

const initPromise = (async () => {
  const supported = await isPushSupported();

  if (supported) {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    pushSystem = {
      supported: true,
      subscribe,
      unsubscribe,
      subscribed,
      reconnect,
      disconnect,
      validate,
    };
  }
})();

export type PushNotificationsApi = {
  supported: boolean;
  ready: Promise<void>;
  subscribe: (userId: number, permanent?: boolean) => Promise<boolean>;
  unsubscribe: (userId: number, permanent?: boolean) => Promise<boolean>;
  subscribed: (userId: number) => Promise<boolean>;
  reconnect: (userId: number) => Promise<boolean>;
  disconnect: (userId: number) => Promise<boolean>;
  validate: (userId: number) => Promise<void>;
};

export default new Proxy({} as PushNotificationsApi, {
  get(target, prop) {
    if (prop === 'ready') return initPromise;
    if (pushSystem) {
      return pushSystem[prop as string];
    } else {
      if (prop === 'supported') return false;
      return () => Promise.reject(new Error('Push notifications are not supported in this browser environment.'));
    }
  },
});
