import axios from "axios";

// HR CRM Axios Instance
const hrApi = axios.create({
  baseURL: "https://crmhr.metagensoft.com/", // HR Backend
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Attach Admin JWT token automatically
hrApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // Same token from admin login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🚫 Handle Unauthorized (Token expired / invalid)
hrApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Token expired or unauthorized. Redirecting...");
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default hrApi;