import { useState, useEffect, useCallback } from "react";
import {
  getBrandSummary,
  getChannelMetrics,
  getPlatformBreakdown,
  syncAnalytics,
} from "../api/analytics.api";
import { useBrand } from "../context/BrandContext";

/**
 * Fetches all analytics data for the active brand:
 *  - summary  : totals + daily breakdown + top posts
 *  - channels : per-connected-account metrics (followers, engagement, reach, leads)
 *  - platforms: per-platform breakdown (post counts, engagement per platform)
 *
 * All three are re-fetched automatically when the brand or day window changes.
 */
export default function useAnalytics(days = 7) {
  const { activeBrand } = useBrand();

  const [summary,   setSummary]   = useState(null);
  const [channels,  setChannels]  = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [syncing,   setSyncing]   = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const load = useCallback(async () => {
    if (!activeBrand?.slug) return;
    setLoading(true);
    setError(null);
    try {
      const [summaryData, channelData, platformData] = await Promise.all([
        getBrandSummary(days),
        getChannelMetrics(days),
        getPlatformBreakdown(days),
      ]);
      setSummary(summaryData);
      setChannels(channelData  ?? []);
      setPlatforms(platformData ?? []);
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

  return { summary, channels, platforms, loading, error, refresh: load, sync, syncing, syncResult };
}
