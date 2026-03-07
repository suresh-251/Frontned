import api from "./apiClient";

// X-Brand-Id is automatically attached by the apiClient interceptor
export const getFacebookPageAnalytics = async () => {
  const response = await api.get("/analytics/facebook/page");
  return response.data;
};
