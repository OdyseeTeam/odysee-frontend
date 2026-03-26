/*
 * This module is responsible for persisting information about push notification
 * registrations to local storage.
 */
import { LocalStorage } from 'util/storage';

const registrations = (): Array<string> => {
  try {
    const parsed = JSON.parse(LocalStorage.getItem('fcm') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const updateRegistrations = (data) => {
  LocalStorage.setItem('fcm', JSON.stringify(Array.isArray(data) ? data : []));
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
