// import axios from "axios";

// export const BASE_URL = "https://crm.metagensoft.com/api";
// // Old URLs for reference:
// // export const BASE_URL = "http://89.116.20.215:9090/api";
// // export const BASE_URL = "https://unvolatilised-essie-straight.ngrok-free.dev/api";
// // export const BASE_URL = "https://localhost:7015/api";

// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true
// });

// // 🔐 Attach JWT automatically
// api.interceptors.request.use(config => {
//   const token = localStorage.getItem("accessToken");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // 🌍 GLOBAL ERROR HANDLING
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (!error.response) {
//       return Promise.reject(new Error("Network error"));
//     }

//     const { status, data } = error.response;

//     if (status === 401) {
//       // Redirect to Social CRM login page instead of admin
//       window.location.href = "/crm/socialmedia/post/create";
//       return;
//     }

//     if (status === 403) {
//       return Promise.reject(new Error("Permission denied"));
//     }

//     if (status === 400 || status === 409) {
//       return Promise.reject(
//         new Error(data?.message || "Invalid request")
//       );
//     }

//     if (status >= 500) {
//       return Promise.reject(
//         new Error("Server error. Please try again later.")
//       );
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;





// import axios from "axios";

// export const BASE_URL = "https://crm.metagensoft.com/api";

// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true
// });

// /* =======================================================
//    🔐 REQUEST INTERCEPTOR
//    - Attach JWT
//    - Attach X-Brand-Id (Multi-tenant support)
// ======================================================= */
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("accessToken");
//     const brandId = localStorage.getItem("brandId");

//     // Attach JWT
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     // Attach Brand ID (VERY IMPORTANT)
//     if (brandId) {
//       config.headers["X-Brand-Id"] = brandId;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// /* =======================================================
//    🌍 GLOBAL RESPONSE HANDLING
// ======================================================= */
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (!error.response) {
//       return Promise.reject(new Error("Network error. Please check connection."));
//     }

//     const { status, data } = error.response;

//     // 🔐 Unauthorized
//     if (status === 401) {
//       localStorage.removeItem("accessToken");
//       localStorage.removeItem("brandId");

//       window.location.href = "/crm/socialmedia/post/create";
//       return;
//     }

//     // 🚫 Forbidden
//     if (status === 403) {
//       return Promise.reject(new Error("Permission denied"));
//     }

//     // ❌ Bad Request / Conflict
//     if (status === 400 || status === 409) {
//       return Promise.reject(
//         new Error(data?.message || "Invalid request")
//       );
//     }

//     // 🔥 Server Error
//     if (status >= 500) {
//       return Promise.reject(
//         new Error("Server error. Please try again later.")
//       );
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;











import axios from "axios";

export const BASE_URL = "https://crm.metagensoft.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
});

/* =======================================================
   🔐 REQUEST INTERCEPTOR
======================================================= */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    const brandId = localStorage.getItem("brandId");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (brandId) {
      config.headers["X-Brand-Id"] = brandId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =======================================================
   🌍 RESPONSE INTERCEPTOR
======================================================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(
        new Error("Network error. Please check connection.")
      );
    }

    const { status, data } = error.response;

    // 🔥 ONLY logout if token truly invalid
    if (status === 401) {
      const message = data?.message || "";

      if (message.toLowerCase().includes("token")) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("brandId");
        window.location.href = "/login";
      }

      return Promise.reject(error);
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