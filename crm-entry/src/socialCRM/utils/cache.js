/**
 * Lightweight cache with TTL.
 * Uses base64-obfuscated storage so brand/lead data isn't visible
 * in plain text in browser DevTools.
 *
 * TTL tiers:
 *   FRESH  (0 – 3 min)  → serve from cache, no background refresh
 *   STALE  (3 – 20 min) → serve from cache, trigger background refresh
 *   EXPIRED (> 20 min)  → ignore cache, show loading skeleton
 */

const FRESH_MS = 3 * 60 * 1000;
const STALE_MS = 20 * 60 * 1000;
const PREFIX = "c_"; // cache prefix for all keys

function encode(value) {
  try {
    return btoa(
      encodeURIComponent(JSON.stringify(value)).replace(
        /%([0-9A-F]{2})/g,
        (_, p1) => String.fromCharCode(parseInt(p1, 16))
      )
    );
  } catch {
    return null;
  }
}

function decode(encoded) {
  try {
    return JSON.parse(
      decodeURIComponent(
        Array.from(atob(encoded), (c) =>
          "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
        ).join("")
      )
    );
  } catch {
    return null;
  }
}

function read(key) {
  try {
    // Try new encoded format first
    const encoded = localStorage.getItem(PREFIX + key);
    if (encoded) {
      const obj = decode(encoded);
      if (obj && obj.ts) return { data: obj.data, age: Date.now() - obj.ts };
    }
    // Fall back to old plain format (migration)
    const plain = localStorage.getItem(key);
    if (plain) {
      const { data, ts } = JSON.parse(plain);
      // Migrate to encoded
      localStorage.removeItem(key);
      try {
        const enc = encode({ data, ts });
        if (enc) localStorage.setItem(PREFIX + key, enc);
      } catch { /* quota */ }
      return { data, age: Date.now() - ts };
    }
    return null;
  } catch {
    return null;
  }
}

export const appCache = {
  /** Return cached entry or null if key missing / expired */
  get(key) {
    const entry = read(key);
    if (!entry || entry.age >= STALE_MS) return null;
    return entry;
  },

  /** Return cached entry even if stale, null only if totally expired */
  getStale(key) {
    return read(key);
  },

  /** true when age < FRESH_MS */
  isFresh(key) {
    const e = read(key);
    return e != null && e.age < FRESH_MS;
  },

  /** true when FRESH_MS <= age < STALE_MS */
  isStale(key) {
    const e = read(key);
    return e != null && e.age >= FRESH_MS && e.age < STALE_MS;
  },

  set(key, data) {
    try {
      const enc = encode({ data, ts: Date.now() });
      if (enc) localStorage.setItem(PREFIX + key, enc);
    } catch {
      // Storage quota exceeded
    }
  },

  invalidate(key) {
    try {
      localStorage.removeItem(PREFIX + key);
      localStorage.removeItem(key); // also clean legacy plain key
    } catch { /* ignore */ }
  },

  /** Invalidate all keys that start with prefix */
  invalidatePrefix(prefix) {
    try {
      // Remove both encoded (c_prefix...) and legacy plain (prefix...)
      const keys = Object.keys(localStorage).filter(
        (k) => k.startsWith(PREFIX + prefix) || k.startsWith(prefix)
      );
      keys.forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
  },

  /** Clear all user-specific caches. Call on logout and before new login. */
  clearAllUserCaches() {
    const prefixes = [
      "sc_dash_", "ph_inbox_", "ph_leads_", "ph_pages_",
      "ph_scheduled_", "ph_history_", "ph_drafts_",
      "ph_subs_", "ph_fbpages_", "ph_brands_", "sc_brands",
    ];
    prefixes.forEach((p) => this.invalidatePrefix(p));

    // Clear standalone user-scoped keys (plain + secure)
    try {
      localStorage.removeItem("brandSlug");
      localStorage.removeItem("salesCrmToken");
      localStorage.removeItem("activeBrandId");
      // Clear all secure storage keys
      const ssKeys = Object.keys(localStorage).filter(
        (k) => k.startsWith("ss_") || k.startsWith("c_")
      );
      ssKeys.forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
  },
};
