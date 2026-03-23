import { useState, useEffect, useCallback } from "react";
import { getBrandSummary, syncAnalytics } from "../api/analytics.api";
import { useBrand } from "../context/BrandContext";

export default function useAnalytics(days = 7, platform = null, sortBy = "engagement") {
  const { activeBrand } = useBrand();

  const [summary, setSummary]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [syncing, setSyncing]       = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const load = useCallback(async () => {
    if (!activeBrand?.slug) return;
    setLoading(true);
    setError(null);

    try {
      const summaryData = await getBrandSummary(days, platform, sortBy);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [activeBrand?.slug, days, platform, sortBy]);

  const sync = useCallback(async () => {
    if (syncing) return;

    setSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncAnalytics();

      setSyncResult({
        message: result.message,
        errors: result.errors ?? [],
        postsSynced: result.postsSynced ?? 0
      });

      await load(); // refresh after sync
    } catch (err) {
      setSyncResult({
        message: null,
        errors: [
          err?.response?.data?.message ??
          "Sync failed. Check connected platform accounts."
        ],
      });
    } finally {
      setSyncing(false);
    }
  }, [syncing, load]);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, loading, error, refresh: load, sync, syncing, syncResult };
}