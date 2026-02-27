import axios from "axios";

const api = axios.create({
    baseURL:  "https://crmauth.metagensoft.com",

    // baseURL: "https://crm.metagensoft.com/api/",
    // baseURL: "https://albertine-nonempathic-heaven.ngrok-free.dev",
    // baseURL: "https://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, 
});

const refreshApi = axios.create({
  baseURL: api.defaults.baseURL,
  withCredentials: true, 
});

let isRefreshing = false;
let refreshPromise = null;

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshApi.post("/api/token/refresh");
      }

      const { data } = await refreshPromise;
      refreshPromise = null;

      if (!data?.accessToken) {
        throw new Error("No access token returned from refresh");
      }

      localStorage.setItem("accessToken", data.accessToken);

      api.defaults.headers.common["Authorization"] =
        `Bearer ${data.accessToken}`;

      originalRequest.headers.Authorization =
        `Bearer ${data.accessToken}`;

      isRefreshing = false;

      return api(originalRequest);

    } catch (refreshError) {
      isRefreshing = false;
      refreshPromise = null;
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  }
);

export default api;