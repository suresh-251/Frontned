import api from "../../api/axios";

export const getSelfProfile = async () => {
  const res = await api.get("/api/self/profile");
  return res.data;
};

export const updateSelfProfile = async (profileData) => {
  const res = await api.patch("/api/self/profile", profileData);
  return res.data;
};
