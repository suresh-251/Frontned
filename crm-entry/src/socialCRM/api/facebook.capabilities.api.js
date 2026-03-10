import api from "./apiClient";

// X-Brand-Id is automatically attached by the apiClient interceptor
export const getFacebookCapabilities = async () => {
  const response = await api.get("/facebook/capabilities");
  return response.data;
};