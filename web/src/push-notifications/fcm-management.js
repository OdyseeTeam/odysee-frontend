// @flow
/*
 * This module is responsible for persisting information about push notification
 * registrations to local storage.
 */
import { LocalStorage } from 'util/storage';

const registrations = (): Array<string> => {
  return JSON.parse(LocalStorage.getItem('fcm') || '[]');
};

const updateRegistrations = (data) => {
  LocalStorage.setItem('fcm', JSON.stringify(data));
};

export const addRegistration = (userId: number) => {
  const data = Array.from(new Set(registrations().concat(userId)));
  updateRegistrations(data);
};

export const removeRegistration = (userId: number) => {
  const data = registrations().filter((id) => id !== userId);
  updateRegistrations(data);
};

export const hasRegistration = (userId: number): boolean => {
  return registrations().includes(userId);
};
