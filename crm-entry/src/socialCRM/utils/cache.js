/**
 * Lightweight localStorage cache with TTL.
 *
 * TTL tiers:
 *   FRESH  (0 – 3 min)  → serve from cache, no background refresh
 *   STALE  (3 – 20 min) → serve from cache, trigger background refresh
 *   EXPIRED (> 20 min)  → ignore cache, show loading skeleton
 */

const FRESH_MS  = 3  * 60 * 1000;
const STALE_MS  = 20 * 60 * 1000;

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return { data, age: Date.now() - ts };
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

  /** true when FRESH_MS ≤ age < STALE_MS */
  isStale(key) {
    const e = read(key);
    return e != null && e.age >= FRESH_MS && e.age < STALE_MS;
  },

  set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    } catch {
      // Storage quota exceeded – silently skip
    }
  },

  invalidate(key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },

  /** Invalidate all keys that start with prefix */
  invalidatePrefix(prefix) {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
      keys.forEach(k => localStorage.removeItem(k));
    } catch { /* ignore */ }
  },

  /** Clear all user-specific caches. Call on logout and before new login. */
  clearAllUserCaches() {
    const prefixes = [
      "sc_dash_", "ph_inbox_", "ph_leads_", "ph_pages_",
      "ph_scheduled_", "ph_history_", "ph_drafts_",
      "ph_subs_", "ph_fbpages_", "ph_brands_",
    ];
    prefixes.forEach((p) => this.invalidatePrefix(p));

    // Also clear standalone user-scoped keys
    try {
      localStorage.removeItem("brandSlug");
      localStorage.removeItem("salesCrmToken");
      localStorage.removeItem("activeBrandId");
    } catch { /* ignore */ }
  },
};
