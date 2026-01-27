import axios from "axios";

export const BASE_URL = "/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
});

// 🌍 GLOBAL ERROR HANDLING (FROM YOUR CODE)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(new Error("Network error"));
    }

    const { status, data } = error.response;

    if (status === 401) {
      window.location.href = "/";
      return;
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
