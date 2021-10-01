// @flow
/*
 * This module is responsible for persisting information about push notification
 * registrations to local storage.
 */

type fcmRegistration = {
  fcmToken: string,
  paused: boolean,
};

type fcmRegistrations = {
  [userId: number]: fcmRegistration,
};

const tokenStorage = {
  get(): fcmRegistrations {
    return JSON.parse(localStorage.getItem('fcm') || '{}');
  },
  set(data) {
    localStorage.setItem('fcm', JSON.stringify(data));
  },
};

export const addRegistration = (userId: number, fcmToken: string) => {
  const data = tokenStorage.get();
  data[userId] = { fcmToken, paused: false };
  tokenStorage.set(data);
};

export const removeRegistration = (userId: number) => {
  const data = tokenStorage.get();
  delete data[userId];
  tokenStorage.set(data);
};

export const toggleRegistration = (userId: number, paused: boolean): ?string => {
  const data = tokenStorage.get();
  if (!data[userId] || data[userId].paused === paused) return;
  data[userId].paused = paused;
  tokenStorage.set(data);
  return data[userId].fcmToken;
};

export const hasRegistration = (userId: number): boolean => {
  return Object.keys(tokenStorage.get()).includes(String(userId));
};

export const allRegistrations = () => {
  return tokenStorage.get();
};
