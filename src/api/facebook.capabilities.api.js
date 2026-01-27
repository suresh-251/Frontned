import api from "../api/apiClient";
export const getFacebookCapabilities = async () => {
  const res = await api.get("/facebook/capabilities");
  return res.data;
};
