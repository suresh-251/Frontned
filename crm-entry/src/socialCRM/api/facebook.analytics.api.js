import api from "./apiClient";

/**
 * Facebook Analytics API
 * GET /api/analytics/facebook/page
 *
 * Brand scoping is handled automatically by apiClient's X-Brand-Id header.
 * No need to manually read brandId from localStorage.
 */
export const getFacebookPageAnalytics = async () => {
  const response = await api.get("/analytics/facebook/page");
  return response.data;
};
