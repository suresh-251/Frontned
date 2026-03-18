// src/salesCRM/api/leads.api.js
import apiClient from "./apiClient";
import { getAdminUsers } from "../../api/admin/users.api";

const unwrapArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.leads)) return payload.leads;
  return [];
};

const unwrapObjectPayload = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) return payload.data;
  if (payload.item && typeof payload.item === "object" && !Array.isArray(payload.item)) return payload.item;
  if (payload.result && typeof payload.result === "object" && !Array.isArray(payload.result)) return payload.result;
  return payload;
};

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
    return unwrapArrayPayload(response.data);
  },

  getDeleted: async () => {
    const response = await apiClient.get("/Leads/deleted");
    return unwrapArrayPayload(response.data);
  },

  getDashboard: async () => {
    const response = await apiClient.get("/Leads/dashboard");
    return unwrapObjectPayload(response.data);
  },

  getById: async (id) => {
    const response = await apiClient.get(`/Leads/${id}`);
    return unwrapObjectPayload(response.data);
  },

  getTimeline: async (id) => {
    const response = await apiClient.get(`/Leads/${id}/timeline`);
    return unwrapArrayPayload(response.data);
  },

  getCommunications: async (leadId, type) => {
    let url = `/Leads/${leadId}/communications`;
    if (type) url += `?type=${type}`;
    const response = await apiClient.get(url);
    return unwrapArrayPayload(response.data);
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

  assignLead: async (leadId, userId, userName = "", remark = "") => {
    try {
      const response = await apiClient.put(`/leads/${leadId}/assign`, {
        userId,
        userName,
        remark,
      });
      return response.data;
    } catch (error) {
      if (error?.response?.status !== 404) throw error;

      const fallbackResponse = await apiClient.put(`/Leads/assign/${leadId}`, null, {
        params: { userId },
      });
      return fallbackResponse.data;
    }
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
    const data = await getAdminUsers({ page: 1, pageSize: 200 });
    const users = Array.isArray(data)
      ? data
      : Array.isArray(data?.users)
        ? data.users
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
            ? data.data
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

  convertToDeal: async (id, data) => {
    const response = await apiClient.post(
      `/Leads/${id}/convert-to-deal`,
      data
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
    return unwrapArrayPayload(response.data);
  },

  getAttachments: async (leadId) => {
    const response = await apiClient.get(`/Leads/${leadId}/attachments`);
    return unwrapArrayPayload(response.data);
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

