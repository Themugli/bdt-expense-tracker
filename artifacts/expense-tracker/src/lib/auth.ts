import type { User } from '../types';

export const USERS_STORAGE_KEY = 'little-ledger-users-v2';
export const SESSION_STORAGE_KEY = 'little-ledger-session-v2';
export const DEFAULT_USERS: User[] = [];

export function getStoredUsers(): User[] {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveStoredUsers(users: User[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function getActiveSession(): { user: User; isGuest: boolean } | null {
  try {
    const data = localStorage.getItem(SESSION_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveActiveSession(session: { user: User; isGuest: boolean } | null) {
  if (session) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}
