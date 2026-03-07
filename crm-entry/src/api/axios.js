
import axios from "axios";

const api = axios.create({
  // baseURL: "http://89.116.20.215:9090/",
  baseURL: "https://crmauth.metagensoft.com/",
  // baseURL: "https://albertine-nonempathic-heaven.ngrok-free.dev",
  // baseURL: "https://localhost:8080",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Attach token on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
