// import axios from 'axios';

// const BASE_URL = 'http://89.116.20.215:9096/api';

// // Create axios instance with default config
// const apiClient = axios.create({
//   baseURL: BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   timeout: 30000, // 30 seconds
// });

// // Request interceptor - Add auth token
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('salesCrmToken');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor - Handle errors globally
// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response) {
//       // Server responded with error status
//       const { status, data } = error.response;
      
//       switch (status) {
//         case 401:
//           // Unauthorized - redirect to login
//           localStorage.removeItem('salesCrmToken');
//           window.location.href = '/login';
//           break;
//         case 403:
//           console.error('Forbidden - You do not have permission');
//           break;
//         case 404:
//           console.error('Resource not found');
//           break;
//         case 500:
//           console.error('Server error - Please try again later');
//           break;
//         default:
//           console.error(`Error ${status}: ${data?.message || 'Unknown error'}`);
//       }
//     } else if (error.request) {
//       // Request made but no response
//       console.error('Network error - Please check your connection');
//     } else {
//       // Something else happened
//       console.error('Error:', error.message);
//     }
    
//     return Promise.reject(error);
//   }
// );

// export default apiClient;
// export { BASE_URL };



// src/api/apiClient.js
import axios from "axios";

const BASE_URL = "http://89.116.20.215:9096/api"; // replace with your actual backend URL

// Create Axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30s
});

// Request interceptor: attach token automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // use the key where you store your token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        localStorage.clear(); // clear token
        window.location.href = "/login"; // redirect to login
      } else if (status === 403) {
        console.error("Forbidden - You do not have permission");
      } else if (status === 404) {
        console.error("Resource not found");
      } else if (status === 500) {
        console.error("Server error - Please try again later");
      } else {
        console.error(`Error ${status}: ${error.response.data?.message || "Unknown error"}`);
      }
    } else if (error.request) {
      console.error("Network error - Please check your connection");
    } else {
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
export { BASE_URL };