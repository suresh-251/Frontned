// import api from "../api/apiClient";
// export const getFacebookCapabilities = async () => {
//   const res = await api.get("/facebook/capabilities");
//   return res.data;
// };



import api from "./apiClient";

export const getFacebookCapabilities = async () => {
  const brandId = localStorage.getItem("brandId");

  if (!brandId) {
    throw new Error("Brand ID not found in localStorage");
  }

  const response = await api.get("/facebook/capabilities", {
    headers: {
      "X-Brand-Id": brandId,
    },
  });

  return response.data;
};