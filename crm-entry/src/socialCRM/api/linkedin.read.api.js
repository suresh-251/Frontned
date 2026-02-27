import api from "./apiClient";

/**
 * LinkedIn Read APIs
 */

GET /api/linkedin/read/profile
export const getLinkedInProfile = async () => {
  const response = await api.get("/linkedin/read/profile");
  return response.data;
};

// GET /api/linkedin/read/posts
export const getLinkedInPosts = async () => {
  const response = await api.get("/linkedin/read/posts");
  return response.data;
};

// GET /api/linkedin/read/post-stats
export const getLinkedInPostStats = async () => {
  const response = await api.get("/linkedin/read/post-stats");
  return response.data;
};
