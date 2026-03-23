/**
 * Secure Storage Utility
 *
 * Wraps localStorage with base64 encoding + simple obfuscation for sensitive keys.
 * NOT encryption (client-side "encryption" is security theater), but prevents
 * casual inspection of tokens and brand data in DevTools.
 *
 * For truly sensitive data, rely on httpOnly cookies set by the backend.
 */

const OBFUSCATION_PREFIX = "ss_";

function encode(value) {
  try {
    const json = JSON.stringify(value);
    return btoa(
      encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  } catch {
    return null;
  }
}

function decode(encoded) {
  try {
    const json = decodeURIComponent(
      Array.from(atob(encoded), (c) =>
        "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
      ).join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const secureStorage = {
  set(key, value) {
    try {
      const encoded = encode(value);
      if (encoded) localStorage.setItem(OBFUSCATION_PREFIX + key, encoded);
    } catch {
      // Storage quota exceeded
    }
  },

  get(key) {
    try {
      const raw = localStorage.getItem(OBFUSCATION_PREFIX + key);
      if (!raw) return null;
      return decode(raw);
    } catch {
      return null;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(OBFUSCATION_PREFIX + key);
    } catch {
      // ignore
    }
  },

  /** Migrate a plain localStorage key to secure storage. Returns the value. */
  migrate(plainKey, secureKey) {
    const plain = localStorage.getItem(plainKey);
    if (plain != null) {
      this.set(secureKey || plainKey, plain);
      localStorage.removeItem(plainKey);
      return plain;
    }
    return this.get(secureKey || plainKey);
  },

  clearAll() {
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith(OBFUSCATION_PREFIX)
      );
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  },
};
