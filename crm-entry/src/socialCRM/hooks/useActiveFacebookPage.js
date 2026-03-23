import { useEffect, useState, useRef } from "react";
import {
  getAvailablePages,
  getActivePage,
  selectPage
} from "../api/facebook.pages.api";
import { useBrand } from "../context/BrandContext";
import { appCache } from "../utils/cache";

const fbPagesCacheKey = (slug) => `ph_fbpages_${slug ?? "none"}`;

export default function useActiveFacebookPage() {
  const { activeBrand } = useBrand();
  const slug = activeBrand?.slug ?? null;

  // Initialize synchronously from cache for instant first render
  const [pages, setPages] = useState(() => {
    const cached = slug ? appCache.getStale(fbPagesCacheKey(slug)) : null;
    return cached?.data?.pages ?? [];
  });
  const [activePage, setActivePageState] = useState(() => {
    const cached = slug ? appCache.getStale(fbPagesCacheKey(slug)) : null;
    return cached?.data?.activePage ?? null;
  });
  const [loading, setLoading] = useState(!slug || !appCache.getStale(fbPagesCacheKey(slug)));
  const [error, setError] = useState("");

  // Tracks current slug so in-flight requests from old brands are discarded
  const activeSlugRef = useRef(slug);

  const loadPages = async (requestSlug) => {
    activeSlugRef.current = requestSlug;
    try {
      setLoading(true);
      setError("");
      const data = await getAvailablePages();
      if (activeSlugRef.current !== requestSlug) return; // brand changed mid-flight
      const active = data.find(p => p.isActive) || null;
      setPages(data);
      setActivePageState(active);
      if (requestSlug) appCache.set(fbPagesCacheKey(requestSlug), { pages: data, activePage: active });
    } catch {
      if (activeSlugRef.current === requestSlug) setError("Failed to load Facebook pages");
    } finally {
      if (activeSlugRef.current === requestSlug) setLoading(false);
    }
  };

  // Brand-switch effect: instant cache restore + always fetch fresh
  useEffect(() => {
    const cached = slug ? appCache.getStale(fbPagesCacheKey(slug)) : null;

    if (cached) {
      setPages(cached.data?.pages ?? []);
      setActivePageState(cached.data?.activePage ?? null);
      setLoading(false);
    } else {
      setPages([]);
      setActivePageState(null);
    }

    // Always fetch fresh data
    loadPages(slug);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const changeActivePage = async (pageId) => {
    await selectPage(pageId);
    await loadPages(slug);
  };

  return {
    pages,
    activePage,
    loading,
    error,
    reloadPages: () => loadPages(slug),
    setActivePage: changeActivePage
  };
}
