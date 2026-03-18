<<<<<<< HEAD
import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : "https://localhost:7015/api";
=======
import axios from "axios";
import { getAccessToken } from "../../utils/authStorage";
export const BASE_URL = "https://crmsocial.metagensoft.com/api";
// Local dev override (requires `dotnet run` in Backend folder):
//export const BASE_URL = "https://localhost:7015/api";
// export const BASE_URL = "http://89.116.20.215:9090/api";
>>>>>>> 643632a8ec9f6b8b9be2351b46874b5ecbf09455


const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
});

// 🔐 Attach JWT + active brand automatically
api.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const brandSlug = localStorage.getItem("brandSlug");
  if (brandSlug) {
    config.headers["X-Brand-Id"] = brandSlug;
  }
  return config;
});

// 🌍 GLOBAL ERROR HANDLING
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(new Error("Network error"));
    }

    const { status, data } = error.response;

    if (status === 401) {
      // Redirect to Social CRM login page instead of admin
     return Promise.reject(new Error("Not connected denied"));
    }

    if (status === 403) {
      return Promise.reject(new Error("Permission denied"));
    }

    if (status === 400 || status === 409) {
      return Promise.reject(
        new Error(data?.message || "Invalid request")
      );
    }

    if (status >= 500) {
      return Promise.reject(
        new Error("Server error. Please try again later.")
      );
    }

    return Promise.reject(error);
  }
);

export default api;
