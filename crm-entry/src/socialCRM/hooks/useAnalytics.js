import { useState, useEffect, useCallback } from "react";
import { getBrandSummary, syncAnalytics } from "../api/analytics.api";
import { useBrand } from "../context/BrandContext";

/**
 * Fetches the full analytics summary for the active brand.
 * Re-fetches automatically when the brand or day window changes.
 */
export default function useAnalytics(days = 7) {
  const { activeBrand } = useBrand();

  const [summary, setSummary]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [syncing, setSyncing]       = useState(false);
  const [syncResult, setSyncResult] = useState(null); // { message, errors }

  const load = useCallback(async () => {
    if (!activeBrand?.slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBrandSummary(days);
      setSummary(data);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [activeBrand?.slug, days]);

  const sync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncAnalytics();
      setSyncResult({ message: result.message, errors: result.errors ?? [] });
      // Reload dashboard data after sync
      await load();
    } catch (err) {
      setSyncResult({
        message: null,
        errors: [err?.response?.data?.message ?? "Sync failed. Check connected platform accounts."],
      });
    } finally {
      setSyncing(false);
    }
  }, [syncing, load]);

  useEffect(() => { load(); }, [load]);

  return { summary, loading, error, refresh: load, sync, syncing, syncResult };
}
