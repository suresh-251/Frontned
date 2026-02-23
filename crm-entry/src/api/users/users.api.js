import api from "../axios";

export const updateUser = async (userId, payload) => {
  const res = await api.put(`/api/users/${userId}`, payload);
  return res.data;
};

export const lockUser = async (userId, reason = "Locked by admin") => {
  const res = await api.put(`/api/users/${userId}/lock`, { reason });
  return res.data;
};

export const unlockUser = async (userId) => {
  const res = await api.put(`/api/users/${userId}/unlock`);
  return res.data;
};

export const assignManager = async (userId, managerId) => {
  const res = await api.put(`/api/users/${userId}/manager`, {
    managerId,
  });
  return res.data;
};

export const getManagers = async () => {
  const res = await api.get("/api/users/managers");
  return res.data; // ARRAY
};

export const createUser = async (payload) => {
  const res = await api.post("/api/users", payload);
  return res.data;
};