// src/salesCRM/api/leads.api.js
import apiClient from "./apiClient";
import { getUsers } from "../../api/admin/users.api";
const formatUserName = (user) => {
  const raw = String(
    user?.name || user?.username || user?.email || `User ${user?.userId || user?.id || ""}`
  )
    .trim()
    .replace(/\s+/g, " ");

  return raw.replace(/\b\w/g, (char) => char.toUpperCase());
};


const leadsAPI = {
  getAll: async () => {
    const response = await apiClient.get("/Leads");
    return response.data;
  },

  getDeleted: async () => {
    const response = await apiClient.get("/Leads/deleted");
    return response.data;
  },

  getDashboard: async () => {
    const response = await apiClient.get("/Leads/dashboard");
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/Leads/${id}`);
    return response.data;
  },

  getTimeline: async (id) => {
    const response = await apiClient.get(`/Leads/${id}/timeline`);
    return response.data;
  },

  getCommunications: async (leadId, type) => {
    let url = `/Leads/${leadId}/communications`;
    if (type) url += `?type=${type}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  addCommunication: async (data) => {
    const response = await apiClient.post(`/Leads/communication`, data);
    return response.data;
  },

  create: async (leadData) => {
    const response = await apiClient.post("/Leads", leadData);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.patch(`/Leads/${id}`, data);
    return response.data;
  },

  updateScore: async (id, score) => {
    const response = await apiClient.patch(`/Leads/${id}/score`, score, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  },

  assignLead: async (leadId, userId) => {
    const response = await apiClient.put(`/Leads/assign/${leadId}`, null, {
      params: { userId },
    });
    return response.data;
  },

  bulkUpdateStatus: async (ids, status) => {
    const response = await apiClient.put("/Leads/bulk/status", {
      ids,
      status,
    });
    return response.data;
  },

  bulkDelete: async (ids) => {
    const response = await apiClient.delete("/Leads/bulk", {
      data: { ids },
    });
    return response.data;
  },

  getSalesUsers: async () => {
    const data = await getUsers({ page: 1, pageSize: 200 });
    const users = Array.isArray(data)
      ? data
      : Array.isArray(data?.users)
        ? data.users
        : [];
    return users
      .filter((user) => {
        const roles = Array.isArray(user.roles) ? user.roles : user.role ? [user.role] : [];
        return roles.some((role) => String(role).trim().toLowerCase() === "sales user");
      })
      .map((user) => ({
        ...user,
        name: formatUserName(user),
      }));
  },

  convertToDeal: async (id) => {
    const response = await apiClient.post(
      `/Leads/${id}/convert-to-deal`,
      undefined,
      { headers: { "Content-Type": undefined } }
    );
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/Leads/${id}`);
    return response.data;
  },

  import: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/Leads/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  },

  getContactHistory: async (id) => {
    const response = await apiClient.get(`/Leads/${id}/contact-history`);
    return response.data;
  },

  getAttachments: async (leadId) => {
    const response = await apiClient.get(`/Leads/${leadId}/attachments`);
    return response.data;
  },

  uploadAttachment: async (leadId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post(`/Leads/${leadId}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteAttachment: async (attachmentId) => {
    const response = await apiClient.delete(`/Leads/attachments/${attachmentId}`);
    return response.data;
  },
};

export default leadsAPI;

