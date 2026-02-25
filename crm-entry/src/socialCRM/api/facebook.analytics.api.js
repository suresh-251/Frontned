// import api from "./apiClient";

// /**
//  * Facebook Analytics API
//  * GET /api/analytics/facebook/page
//  */
// export const getFacebookPageAnalytics = async () => {
//   const response = await api.get("/analytics/facebook/page");
//   return response.data;
// };






import api from "./apiClient";

/**
 * Facebook Page Analytics
 * GET /api/analytics/facebook/page
 * Requires: X-Brand-Id header
 */
export const getFacebookPageAnalytics = async () => {
  const brandId = localStorage.getItem("brandId");

  if (!brandId) {
    throw new Error("Brand ID not found. Please select a brand.");
  }

  const response = await api.get("/analytics/facebook/page", {
    headers: {
      "X-Brand-Id": brandId, // explicit header (safe)
    },
  });

  return response.data;
};