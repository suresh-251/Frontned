import api from "../axios";

export const updateUser = async (userId, payload) => {
  const res = await api.put(`/api/users/${userId}`, payload);
  return res.data;
};

// GET: Retrieves detailed information about a specific user
export const getUserById = async (userId) => {
  const res = await api.get(`/api/users/${userId}`);
  return res.data;
};

// PATCH: Updates ONLY the profile object details (Permission: USER_UPDATE_PROFILE)
export const updateUserProfile = async (userId, profileData) => {
  const res = await api.patch(`/api/users/${userId}/profile`, profileData);
  return res.data;
};

export const updateUserStatus = async (userId, status) => {
  const res = await api.patch(`/api/users/${userId}/status`, {
    status, // Must be: Active / Inactive / Locked / Exited
  });
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