import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7015/api", // 🔥 IMPORTANT
  withCredentials: true
});

// 🔐 Attach JWT automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
