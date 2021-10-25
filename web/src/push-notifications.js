// @flow
/*
 * This module is responsible for managing browser push notification
 * subscriptions via the firebase SDK.
 */

import { Lbryio } from 'lbryinc';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import { firebaseConfig, vapidKey } from '$web/src/firebase-config';
import {
  addRegistration,
  removeRegistration,
  toggleRegistration,
  hasRegistration,
  allRegistrations,
} from '$web/src/fcm-management';
import { browserData } from '$web/src/ua';

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const subscriptionMetaData = () => {
  const isMobile = window.navigator.userAgentData?.mobile || false;
  const browserName = browserData.browser?.name || 'unknown';
  const osName = browserData.os?.name || 'unknown';
  return { type: `web-${isMobile ? 'mobile' : 'desktop'}`, name: `${browserName}-${osName}` };
};

const apiAdd = (token: string) => Lbryio.call('cfm', 'add', { token, ...subscriptionMetaData() });

const apiRemove = (token: string) => Lbryio.call('cfm', 'remove', { token });

const getFcmToken = async (promptUser: boolean = false): Promise<string | void> => {
  if (!promptUser && window.Notification?.permission !== 'granted') return;
  if (!navigator.serviceWorker) return;
  const swRegistration = await navigator.serviceWorker.ready;
  return getToken(messaging, { serviceWorkerRegistration: swRegistration, vapidKey });
};

export const pushSubscribe = async (userId: number): Promise<boolean> => {
  try {
    const fcmToken = await getFcmToken(true);
    if (!fcmToken) return false;
    await apiAdd(fcmToken);
    addRegistration(userId, fcmToken);
    return true;
  } catch {
    return false;
  }
};

export const pushUnsubscribe = async (userId: number): Promise<boolean> => {
  try {
    const fcmToken = await getFcmToken();
    if (!fcmToken) return false;
    await deleteToken(messaging);
    await apiRemove(fcmToken);
    removeRegistration(userId);
    return true;
  } catch {
    return false;
  }
};

export const pushIsSubscribed = async (userId: number): Promise<boolean> => {
  const swRegistration = await navigator.serviceWorker?.ready;
  if (!swRegistration || !swRegistration.pushManager) return false;
  const browserSubscriptionExists = (await swRegistration.pushManager.getSubscription()) !== null;
  const userRecordExists = hasRegistration(userId);
  return browserSubscriptionExists && userRecordExists;
};

export const pushPause = async (userId: number) => {
  const fcmToken = toggleRegistration(userId, true);
  if (!fcmToken) return;
  await apiRemove(fcmToken);
};

export const pushPauseAll = async () => {
  const promises = [];
  for (const userId in allRegistrations()) {
    promises.push(pushPause(Number(userId)));
  }
  return Promise.all(promises);
};

export const pushUnPause = async (userId: number) => {
  const fcmToken = toggleRegistration(userId, false);
  if (!fcmToken) return;
  const tokenValid = await isTokenValid(fcmToken);
  if (!tokenValid) {
    removeRegistration(userId);
    return;
  }
  apiAdd(fcmToken);
};

const isTokenValid = async (token: string): Promise<boolean> => {
  try {
    return (await getFcmToken()) === token;
  } catch {
    return false;
  }
};
