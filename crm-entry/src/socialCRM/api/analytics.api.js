import api from "./apiClient";

/**
 * Analytics Pipeline API
 * All endpoints are brand-scoped via X-Brand-Id header (set by apiClient interceptor).
 */

/**
 * Full brand analytics summary — totals + daily breakdown + platform breakdown + top posts.
 * GET /api/analytics/brand/summary?days=7
 */
export const getBrandSummary = async (days = 7) => {
  const res = await api.get("/analytics/brand/summary", { params: { days } });
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
 * Manual analytics sync — pulls fresh metrics from platform APIs,
 * promotes to PostMetrics, and re-aggregates BrandDailyMetrics for today.
 * POST /api/analytics/sync
 */
export const syncAnalytics = async () => {
  const res = await api.post("/analytics/sync");
  return res.data;
};
