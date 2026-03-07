import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  activateBrand,
  clearActiveBrand,
  createBrand as apiCreateBrand,
  deleteBrand as apiDeleteBrand,
  getBrands,
  updateBrand as apiUpdateBrand,
} from "../api/brand.api";

const BrandContext = createContext(null);

export function BrandProvider({ children }) {
  const [brands, setBrands] = useState([]);
  const [activeBrand, setActiveBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBrands();
      setBrands(data);
      const active = data.find((b) => b.isActive) ?? null;
      setActiveBrand(active);
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

  useEffect(() => {
    refresh();
  }, [refresh]);

  const switchBrand = useCallback(
    async (slug) => {
      await activateBrand(slug);
      await refresh();
    },
    [refresh]
  );

  const createBrand = useCallback(
    async (payload) => {
      const brand = await apiCreateBrand(payload);
      // Auto-activate the first brand created
      await activateBrand(brand.slug);
      await refresh();
      return brand;
    },
    [refresh]
  );

  const addBrand = useCallback(
    async (payload) => {
      const brand = await apiCreateBrand(payload);
      await refresh();
      return brand;
    },
    [refresh]
  );

  const updateBrand = useCallback(
    async (slug, payload) => {
      const updated = await apiUpdateBrand(slug, payload);
      await refresh();
      return updated;
    },
    [refresh]
  );

  const removeBrand = useCallback(
    async (slug) => {
      await apiDeleteBrand(slug);
      if (activeBrand?.slug === slug) {
        localStorage.removeItem("brandSlug");
      }
      await refresh();
    },
    [activeBrand, refresh]
  );

  const deactivate = useCallback(async () => {
    await clearActiveBrand();
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
