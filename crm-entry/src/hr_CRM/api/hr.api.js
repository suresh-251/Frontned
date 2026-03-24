import axios from "axios";
import { getAccessToken, clearAccessToken } from "../../utils/authStorage";

// HR CRM Axios Instance
const hrApi = axios.create({
  baseURL: "https://crmhr.metagensoft.com/", // HR Backend
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Attach JWT token automatically
hrApi.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
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
      clearAccessToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default hrApi;