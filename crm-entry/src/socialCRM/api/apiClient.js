import axios from "axios";

export const BASE_URL = "https://crmsocial.metagensoft.com/api";
// Old URLs for reference:
// export const BASE_URL = "http://89.116.20.215:9090/api";
// export const BASE_URL = "https://unvolatilised-essie-straight.ngrok-free.dev/api";
// export const BASE_URL = "https://localhost:7015/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
});

// 🔐 Attach JWT automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
