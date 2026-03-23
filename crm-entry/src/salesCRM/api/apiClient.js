import axios from "axios";
import { clearAccessToken, getAccessToken } from "../../utils/authStorage";
import { appCache } from "../../socialCRM/utils/cache";

const BASE_URL = "https://crmsales.metagensoft.com/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// 🔐 Attach JWT automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🌍 GLOBAL ERROR HANDLING (IMPROVED)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // ✅ Network error (no response from server)
    if (!error.response) {
      return Promise.reject(new Error("Network error. Please check your connection."));
    }

    const { status, data } = error.response;

    // 🔐 Unauthorized
    if (status === 401) {
      clearAccessToken();
      appCache.clearAllUserCaches();
      window.location.href = "/login";
      return Promise.reject(new Error("Session expired. Redirecting to login..."));
    }

    // 🚫 Forbidden
    if (status === 403) {
      return Promise.reject(new Error("Permission denied"));
    }

    // ⚠️ Bad request / Conflict
    if (status === 400 || status === 409) {
      return Promise.reject(
        new Error(data?.message || "Invalid request")
      );
    }

    // 🔍 Not found
    if (status === 404) {
      return Promise.reject(new Error("Requested resource not found"));
    }

    // 💥 Server error
    if (status >= 500) {
      return Promise.reject(
        new Error("Server error. Please try again later.")
      );
    }

    // ⚡ Fallback
    return Promise.reject(error);
  }
);

export default apiClient;
export { BASE_URL };