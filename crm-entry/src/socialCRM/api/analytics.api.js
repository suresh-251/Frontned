import api from "./apiClient";

/**
 * Analytics Pipeline API
 * All endpoints are brand-scoped via X-Brand-Id header (set by apiClient interceptor).
 */

/**
 * Full brand analytics summary — totals + daily breakdown + platform breakdown + top posts.
 * GET /api/analytics/brand/summary?days=7
 */
export const getBrandSummary = async (days = 7, platform = null, sortBy = "engagement") => {
  const params = { days };
  if (platform && platform !== "all") params.platform = platform;
  if (sortBy && sortBy !== "engagement") params.sortBy = sortBy;
  const res = await api.get("/analytics/brand/summary", { params });
  return res.data;
};

/**
 * Per-day metrics for the active brand.
 * GET /api/analytics/brand/daily?days=7
 */
export const getDailyMetrics = async (days = 7) => {
  const res = await api.get("/analytics/brand/daily", { params: { days } });
  return res.data;
};

/**
 * Per-platform engagement breakdown.
 * GET /api/analytics/brand/platforms?days=7
 */
export const getPlatformBreakdown = async (days = 7) => {
  const res = await api.get("/analytics/brand/platforms", { params: { days } });
  return res.data;
};

/**
 * Top posts ranked by engagement.
 * GET /api/analytics/brand/top-posts?days=7&limit=10
 */
export const getTopPosts = async (days = 7, limit = 10) => {
  const res = await api.get("/analytics/brand/top-posts", { params: { days, limit } });
  return res.data;
};

/**
 * Per-channel (connected account) metrics: followers, reach, engagement, leads.
 * GET /api/analytics/brand/channels?days=30
 */
export const getChannelMetrics = async (days = 30) => {
  const res = await api.get("/analytics/brand/channels", { params: { days } });
  return res.data;
};

/**
 * Manual analytics sync — pulls fresh metrics from platform APIs,
 * promotes to PostMetrics, and re-aggregates BrandDailyMetrics for today.
 * POST /api/analytics/sync
 */
export const syncAnalytics = async () => {
  try {
    const res = await api.post("/analytics/sync");
    return res.data;
  } catch (err) {
    // Re-throw with the actual backend error message preserved
    const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || "Sync failed";
    const enriched = new Error(msg);
    enriched.response = err.response;
    throw enriched;
  }
};

/**
 * Best posting times — ranked time slots based on historical engagement + reach.
 * GET /api/analytics/brand/best-times?days=30
 */
export const getBestPostingTimes = async (days = 30) => {
  const res = await api.get("/analytics/brand/best-times", { params: { days } });
  return res.data;
};
