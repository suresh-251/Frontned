import axios from "axios";
import toast from "react-hot-toast";
import { getAccessToken, clearAccessToken } from "../../utils/authStorage";
import { secureStorage } from "../../utils/secureStorage";
import { appCache } from "../utils/cache";
// export const BASE_URL = "https://crmsocial.metagensoft.com/api";
// Local dev override (requires `dotnet run` in Backend folder):
export const BASE_URL = "https://localhost:7015/api";
// export const BASE_URL = "http://89.116.20.215:9090/api";


const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
});

// Attach JWT + active brand automatically
api.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Read brandSlug from secure storage, fall back to plain localStorage for migration
  const brandSlug =
    secureStorage.get("brandSlug") || localStorage.getItem("brandSlug");
  if (brandSlug) {
    config.headers["X-Brand-Id"] = brandSlug;
    // Migrate plain to secure if found in plain
    if (localStorage.getItem("brandSlug")) {
      secureStorage.set("brandSlug", brandSlug);
      localStorage.removeItem("brandSlug");
    }
  }
  return config;
});

/** Create an error with the backend response data preserved for callers. */
function apiError(msg, responseData, status) {
  const err = new Error(msg);
  err.response = { data: responseData, status };
  return err;
}

// GLOBAL ERROR HANDLING — show user-friendly toast, return clean error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error("Network error. Please check your connection.");
      return Promise.reject(new Error("Network error"));
    }

    const { status, data } = error.response;

    // Extract user-friendly message from backend structured response
    const message = data?.message || data?.error || "";
    const action = data?.action;

    if (status === 401) {
      // Social media token expired — prompt reconnect, not logout
      const requestUrl = error.config?.url || "";
      const isSocialEndpoint = requestUrl.startsWith("/facebook/") || requestUrl.startsWith("/instagram/");

      const isSocialTokenIssue = action === "ReconnectAccount" || action === "ReLogin"
        || action === "ReAuthorize" || data?.error === "token_expired";

      if (isSocialTokenIssue || isSocialEndpoint) {
        toast.error(
          message || "Your social media session has expired. Please reconnect your account.",
          { duration: 6000 }
        );
        const err = apiError(message || "Social token expired", data, status);
        err.code = "social_token_expired";
        err.action = "ReconnectAccount";
        return Promise.reject(err);
      }

      // App session expired
      clearAccessToken();
      appCache.clearAllUserCaches();
      toast.error("Session expired. Please log in again.");
      window.location.href = "/login";
      return Promise.reject(apiError("Session expired", data, status));
    }

    if (status === 403) {
      toast.error(message || "You don't have permission to perform this action.");
      return Promise.reject(apiError(message || "Permission denied", data, status));
    }

    if (status === 404) {
      return Promise.reject(apiError(message || "Resource not found", data, status));
    }

    if (status === 400 || status === 409) {
      toast.error(message || "Invalid request. Please check your input.");
      return Promise.reject(apiError(message || "Invalid request", data, status));
    }

    if (status === 429) {
      toast.error("Too many requests. Please wait a moment and try again.");
      return Promise.reject(apiError("Rate limited", data, status));
    }

    if (status >= 500) {
      toast.error("Something went wrong on our end. Please try again later.");
      return Promise.reject(apiError("Server error", data, status));
    }

    return Promise.reject(error);
  }
);

export default api;
