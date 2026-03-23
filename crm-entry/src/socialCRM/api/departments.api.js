import axios from "axios";
import { getAccessToken } from "../../utils/authStorage";

// Direct call to HR API with safe error handling (won't trigger logout)
const hrApiSafe = axios.create({
  baseURL: "https://crmhr.metagensoft.com/",
  headers: { "Content-Type": "application/json" },
});

hrApiSafe.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Get all departments from HR API.
 * Wrapped with safe error handling - returns empty array on failure instead of triggering logout.
 */
export const getDepartments = async () => {
  try {
    const response = await hrApiSafe.get("/api/Department");
    return response.data || [];
  } catch (error) {
    console.warn("Failed to fetch departments from HR:", error?.message);
    return [];
  }
};
