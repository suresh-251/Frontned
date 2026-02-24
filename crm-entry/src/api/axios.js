
// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://89.116.20.215:9090/",
//   // baseURL: "https://crm.metagensoft.com/api/",
//   // baseURL: "https://albertine-nonempathic-heaven.ngrok-free.dev",
//   // baseURL: "https://localhost:8080",
//   headers: {
//     "Content-Type": "application/json",
//     "ngrok-skip-browser-warning": "true",
//   },
// });

// // Attach token on every request
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("accessToken");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Global 401 handling
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.clear();
//       window.location.href = "/login";
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;





// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://89.116.20.215:9090/",
//   // baseURL: "https://crm.metagensoft.com/api/",
//   // baseURL: "https://albertine-nonempathic-heaven.ngrok-free.dev",
//   // baseURL: "https://localhost:8080",
//   headers: {
//     "Content-Type": "application/json",
//     "ngrok-skip-browser-warning": "true",
//   },
// });

// // Attach token on every request
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("accessToken");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Global 401 handling
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.clear();
//       window.location.href = "/login";
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;




import axios from "axios";
const api = axios.create({
  baseURL:  "http://89.116.20.215:9090/",

  // baseURL: "https://crm.metagensoft.com/api/",
  // baseURL: "https://albertine-nonempathic-heaven.ngrok-free.dev",
  // baseURL: "https://localhost:8080",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// ------------------------------------
// Separate instance for refresh
// (No interceptors attached)
// ------------------------------------
const refreshApi = axios.create({
  baseURL: api.defaults.baseURL,
});

// ------------------------------------
// Refresh State (GLOBAL)
// ------------------------------------
let isRefreshing = false;
let refreshPromise = null;

// ------------------------------------
// Attach Access Token to Requests
// ------------------------------------
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

// ------------------------------------
// Handle 401 + Silent Refresh
// ------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If not 401 → reject normally
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // Prevent infinite retry loop
    if (originalRequest._retry) {
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    originalRequest._retry = true;

try {
  if (!isRefreshing) {
    isRefreshing = true;

    refreshPromise = refreshApi.post("/api/token/refresh", {
  refreshToken: localStorage.getItem("refreshToken"),
});
  }

  const { data } = await refreshPromise;

  refreshPromise = null; // reset

  if (!data?.accessToken) {
    throw new Error("No access token returned from refresh");
  }

  localStorage.setItem("accessToken", data.accessToken);

  api.defaults.headers.common["Authorization"] =
    `Bearer ${data.accessToken}`;

  isRefreshing = false;

  originalRequest.headers.Authorization =
    `Bearer ${data.accessToken}`;

  return api(originalRequest);

} catch (refreshError) {
  isRefreshing = false;
  refreshPromise = null; // reset
  localStorage.clear();
  window.location.href = "/login";
  return Promise.reject(refreshError);
}


  }
);

export default api;