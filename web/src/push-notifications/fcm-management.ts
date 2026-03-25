/*
 * This module is responsible for persisting information about push notification
 * registrations to local storage.
 */
import { LocalStorage } from 'util/storage';

const registrations = (): Array<string | number> => {
  return JSON.parse(LocalStorage.getItem('fcm') || '[]');
};

const updateRegistrations = (data) => {
  LocalStorage.setItem('fcm', JSON.stringify(data));
};

export const addRegistration = (userId: number) => {
  const data = Array.from(new Set(registrations().concat(String(userId))));
  updateRegistrations(data);
};
export const removeRegistration = (userId: number) => {
  const data = registrations().filter((id) => String(id) !== String(userId));
  updateRegistrations(data);
};
export const hasRegistration = (userId: number): boolean => {
  return registrations().includes(String(userId));
};
