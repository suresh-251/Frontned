import { createContext, useCallback, useContext, useEffect, useState, useRef } from "react";
import {
  activateBrand,
  clearActiveBrand,
  createBrand as apiCreateBrand,
  deleteBrand as apiDeleteBrand,
  getBrands,
  updateBrand as apiUpdateBrand,
} from "../api/brand.api";
import { syncAnalytics } from "../api/analytics.api";
import { getAccountsSummary } from "../api/auth.api";
import { appCache } from "../utils/cache";
import { secureStorage } from "../../utils/secureStorage";

const BRANDS_CACHE_KEY = "sc_brands";
const SYNC_COOLDOWN_KEY = "sc_sync_cooldown";
const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/** Read brands synchronously from localStorage (used as useState initializer) */
function readCachedBrands() {
  try {
    const entry = appCache.getStale(BRANDS_CACHE_KEY);
    return entry?.data ?? null;
  } catch {
    return null;
  }
}

const BrandContext = createContext(null);

/** Check if enough time has passed since last sync */
function canSync() {
  try {
    const lastSync = secureStorage.get(SYNC_COOLDOWN_KEY);
    if (!lastSync) return true;
    return Date.now() - parseInt(lastSync, 10) > SYNC_COOLDOWN_MS;
  } catch {
    return true;
  }
}

/** Mark sync as just completed */
function markSynced() {
  try {
    secureStorage.set(SYNC_COOLDOWN_KEY, Date.now().toString());
  } catch { /* ignore */ }
}

export function BrandProvider({ children }) {
  const cachedBrands = readCachedBrands();
  const syncTriggeredRef = useRef(false);

  // Initialize synchronously from cache — no loading flash for returning users
  const [brands, setBrands]           = useState(cachedBrands ?? []);
  const [activeBrand, setActiveBrand] = useState(cachedBrands?.find(b => b.isActive) ?? null);
  // Only show loading spinner when there is genuinely nothing to show yet
  const [loading, setLoading]         = useState(!cachedBrands);
  const [error, setError]             = useState(null);

  const refresh = useCallback(async () => {
    try {
      // Don't show loading spinner if we already have cached brands
      const hasCached = readCachedBrands() != null;
      if (!hasCached) setLoading(true);
      setError(null);

      const data = await getBrands();
      setBrands(data);
      const active = data.find((b) => b.isActive) ?? null;
      setActiveBrand(active);

      // Persist to cache + localStorage slug
      appCache.set(BRANDS_CACHE_KEY, data);
      if (active) {
        secureStorage.set("brandSlug", active.slug);
      } else {
        secureStorage.remove("brandSlug");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: if cache is fresh skip the fetch; otherwise fetch in background
  useEffect(() => {
    if (appCache.isFresh(BRANDS_CACHE_KEY)) return; // nothing to do
    refresh();
  }, [refresh]);

  // Auto-sync analytics when active brand is available (with cooldown to avoid spam)
  useEffect(() => {
    if (!activeBrand || syncTriggeredRef.current) return;
    if (!canSync()) {
      console.log("Analytics sync skipped (cooldown active)");
      return;
    }

    // Only sync when active brand has at least one connected page/account.
    getAccountsSummary()
      .then((rows) => {
        const hasAnyConnectedResource = (Array.isArray(rows) ? rows : [])
          .some((r) => r?.connected && (r?.resourceCount ?? 0) > 0);
        if (!hasAnyConnectedResource) {
          console.log("Analytics sync skipped (no connected accounts in active brand)");
          return;
        }

        syncTriggeredRef.current = true;
        console.log("Auto-syncing analytics for brand:", activeBrand.slug);
        return syncAnalytics(30)
          .then(() => {
            console.log("Analytics auto-sync completed (30 days backfill)");
            markSynced();
          })
          .catch((err) => {
            console.warn("Analytics auto-sync failed:", err.message);
          });
      })
      .catch(() => {});
  }, [activeBrand]);

  /** Flush every brand-scoped cache so the next page renders fresh data. */
  const invalidateAllBrandCaches = useCallback(() => {
    const prefixes = [
      "sc_dash_", "ph_inbox_", "ph_leads_", "ph_pages_",
      "ph_forms_", "ph_scheduled_", "ph_history_", "ph_drafts_",
      "ph_subs_", "ph_fbpages_",
    ];
    prefixes.forEach((p) => appCache.invalidatePrefix(p));
    appCache.invalidate(BRANDS_CACHE_KEY);
  }, []);

  const switchBrand = useCallback(
    async (slug) => {
      invalidateAllBrandCaches();
      secureStorage.set("brandSlug", slug);
      await activateBrand(slug);

      // Full page reload to ensure all content (analytics, leads, inbox,
      // webhooks) refreshes for the newly selected brand's page.
      window.location.assign("/crm/socialmedia/dashboard");
    },
    [invalidateAllBrandCaches]
  );

  const createBrand = useCallback(
    async (payload) => {
      const brand = await apiCreateBrand(payload);
      await activateBrand(brand.slug);
      appCache.invalidate(BRANDS_CACHE_KEY);
      await refresh();
      return brand;
    },
    [refresh]
  );

  const addBrand = useCallback(
    async (payload) => {
      const brand = await apiCreateBrand(payload);
      appCache.invalidate(BRANDS_CACHE_KEY);
      await refresh();
      return brand;
    },
    [refresh]
  );

  const updateBrand = useCallback(
    async (slug, payload) => {
      const updated = await apiUpdateBrand(slug, payload);
      appCache.invalidate(BRANDS_CACHE_KEY);
      await refresh();
      return updated;
    },
    [refresh]
  );

  const removeBrand = useCallback(
    async (slug) => {
      await apiDeleteBrand(slug);
      appCache.invalidate(BRANDS_CACHE_KEY);
      appCache.invalidate(`sc_dash_${slug}`);
      if (activeBrand?.slug === slug) {
        secureStorage.remove("brandSlug");
      }
      await refresh();
    },
    [activeBrand, refresh]
  );

  const deactivate = useCallback(async () => {
    await clearActiveBrand();
    appCache.invalidate(BRANDS_CACHE_KEY);
    await refresh();
  }, [refresh]);

  return (
    <BrandContext.Provider
      value={{
        brands,
        activeBrand,
        loading,
        error,
        refresh,
        switchBrand,
        createBrand,
        addBrand,
        updateBrand,
        removeBrand,
        deactivate,
        invalidateAllBrandCaches,
        hasBrands: brands.length > 0,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export const useBrand = () => {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used inside <BrandProvider>");
  return ctx;
};
