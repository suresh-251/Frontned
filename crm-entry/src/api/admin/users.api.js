


import api from "../axios";

// ADMIN LIST
export const getAdminUsers = async (params) => {
  const res = await api.get("/api/users", { params });
  return res.data || [];
};

// export const getAllEmployees = async (params) => {
//   const res = await api.get("/api/users", { params });
//   return res.data || [];
// };


// If you expect paginated structure
export const getUsers = async (params) => {
  const res = await api.get("/api/users", { params });
  return res.data.users || [];
};

// USER DETAILS
export const getAdminUserById = async (userId) => {
  const res = await api.get(`/api/users/${userId}`);
  return res.data;
};

// USER SECURITY
export const getUserSecurity = async (userId) => {
  const res = await api.get(`/api/users/${userId}/security`);
  return res.data;
};

// USER AUDIT LOGS
export const getUserAuditLogs = async (userId, params) => {
  const res = await api.get(
    `/api/users/${userId}/audit-logs`,
    { params }
  );
  return res.data;
};
