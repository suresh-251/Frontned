import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  activateBrand,
  clearActiveBrand,
  createBrand as apiCreateBrand,
  deleteBrand as apiDeleteBrand,
  getBrands,
  updateBrand as apiUpdateBrand,
} from "../api/brand.api";
import { appCache } from "../utils/cache";

const BRANDS_CACHE_KEY = "sc_brands";

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

export function BrandProvider({ children }) {
  const cachedBrands = readCachedBrands();

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
        localStorage.setItem("brandSlug", active.slug);
      } else {
        localStorage.removeItem("brandSlug");
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

  /** Flush every brand-scoped cache so the next page renders fresh data. */
  const invalidateAllBrandCaches = useCallback(() => {
    const prefixes = [
      "sc_dash_", "ph_inbox_", "ph_leads_", "ph_pages_",
      "ph_scheduled_", "ph_history_", "ph_drafts_",
      "ph_subs_", "ph_fbpages_",
    ];
    prefixes.forEach((p) => appCache.invalidatePrefix(p));
    appCache.invalidate(BRANDS_CACHE_KEY);
  }, []);

  const switchBrand = useCallback(
    async (slug) => {
      invalidateAllBrandCaches();
      localStorage.setItem("brandSlug", slug);
      await activateBrand(slug);

      const target = brands.find(b => b.slug === slug);
      if (target) {
        const updated = brands.map(b => ({ ...b, isActive: b.slug === slug }));
        setBrands(updated);
        setActiveBrand({ ...target, isActive: true });
        appCache.set(BRANDS_CACHE_KEY, updated);
      }
    },
    [brands, invalidateAllBrandCaches]
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
        localStorage.removeItem("brandSlug");
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
