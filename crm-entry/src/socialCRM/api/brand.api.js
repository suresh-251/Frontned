// // import api from "../api/apiClient"; // your main axios file

// // // 🔹 Get all brands
// // export const getBrands = async () => {
// //   const response = await api.get("/apps");
// //   return response.data;
// // };

// // // 🔹 Create brand
// // export const createBrand = async (name) => {
// //   const response = await api.post(`/apps?name=${encodeURIComponent(name)}`);
// //   return response.data; // returns brandId (integer)
// // };

// // // 🔹 Switch brand
// // export const switchBrand = async (brandId) => {
// //   const response = await api.post(`/apps/switch/${brandId}`);
// //   return response.data;
// // };






// import api from "./apiClient";

// // Get brands
// export const getBrands = async () => {
//   const response = await api.get("/apps");
//   return response.data;
// };

// // Create brand
// export const createBrand = async (name) => {
//   const response = await api.post(
//     `/apps?name=${encodeURIComponent(name)}`
//   );
//   return response.data;
// };

// // Switch brand (VERY IMPORTANT)
// export const switchBrand = async (brandId) => {
//   const response = await api.post(`/apps/switch/${brandId}`);
//   return response.data;
// };