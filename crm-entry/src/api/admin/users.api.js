


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


// Returns users normalized to { userId, name } for consistent usage across components
export const getUsers = async (params) => {
  const res = await api.get("/api/users", { params });
  const rawPayload = res.data;
  const raw = Array.isArray(rawPayload?.users)
    ? rawPayload.users
    : Array.isArray(rawPayload?.items)
      ? rawPayload.items
      : Array.isArray(rawPayload?.data)
        ? rawPayload.data
        : Array.isArray(rawPayload)
          ? rawPayload
          : [];
  return raw.map(u => ({
    userId: u.userId ?? u.id,
    name: u.name || u.userName || u.username || String(u.userId ?? u.id),
  }));
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
