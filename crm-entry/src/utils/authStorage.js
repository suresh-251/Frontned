import { secureStorage } from "./secureStorage";

const ACCESS_TOKEN_KEY = "accessToken";
const LEGACY_KEY = "accessToken"; // plain localStorage key for migration

export const getAccessToken = () => {
  // Check secure storage first, then fall back to legacy plain storage + migrate
  const secure = secureStorage.get(ACCESS_TOKEN_KEY);
  if (secure) return secure;

  // Migrate from plain localStorage/sessionStorage
  const plain =
    localStorage.getItem(LEGACY_KEY) ||
    sessionStorage.getItem(LEGACY_KEY) ||
    null;
  if (plain) {
    secureStorage.set(ACCESS_TOKEN_KEY, plain);
    localStorage.removeItem(LEGACY_KEY);
    sessionStorage.removeItem(LEGACY_KEY);
    return plain;
  }

  return null;
};

export const hasPersistentAccessToken = () =>
  Boolean(secureStorage.get(ACCESS_TOKEN_KEY) || localStorage.getItem(LEGACY_KEY));

export const setAccessToken = (token, persist = true) => {
  if (!token) return;

  // Always store in secure storage (obfuscated)
  if (persist) {
    secureStorage.set(ACCESS_TOKEN_KEY, token);
    sessionStorage.removeItem(LEGACY_KEY);
    localStorage.removeItem(LEGACY_KEY);
    return;
  }

  // Session-only: use sessionStorage (short-lived, cleared on tab close)
  sessionStorage.setItem(LEGACY_KEY, token);
  secureStorage.remove(ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_KEY);
};

export const clearAccessToken = () => {
  secureStorage.remove(ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_KEY);
  sessionStorage.removeItem(LEGACY_KEY);
};
