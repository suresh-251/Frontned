// src/salesCRM/api/leads.api.js
import apiClient from "./apiClient";

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

  updateStatus: async (leadId, status) => {
    const response = await apiClient.put(`/Leads/${leadId}/status`, { status });
    return response.data;
  },

  assignLead: async (leadId, userId) => {
    const response = await apiClient.put(`/Leads/assign/${leadId}`, null, {
      params: { userId },
    });
    return response.data;
  },

  getSalesUsers: async () => {
    const response = await apiClient.get("/users");
    const users = Array.isArray(response.data?.users) ? response.data.users : Array.isArray(response.data) ? response.data : [];
    return users.filter((user) => {
      const roles = Array.isArray(user.roles) ? user.roles : user.role ? [user.role] : [];
      return roles.some((role) => String(role).toLowerCase() === "sales user");
    });
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
