// src/salesCRM/api/leads.api.js
import apiClient from "./apiClient";

const leadsAPI = {

  // Get all leads
  getAll: async () => {
    const response = await apiClient.get("/Leads");
    return response.data;
  },

  // Dashboard stats
  getDashboard: async () => {
    const response = await apiClient.get("/Leads/dashboard");
    return response.data;
  },

  // Single lead
  getById: async (id) => {
    const response = await apiClient.get(`/Leads/${id}`);
    return response.data;
  },

  // Timeline (status change, assign, convert etc.)
  getTimeline: async (id) => {
    const response = await apiClient.get(`/Leads/${id}/timeline`);
    return response.data;
  },

  // Communications (notes, calls, emails etc.)
  getCommunications: async (leadId, type) => {

    let url = `/Leads/${leadId}/communications`;

    if (type) {
      url += `?type=${type}`;
    }

    const response = await apiClient.get(url);
    return response.data;
  },

  // Add communication
  addCommunication: async (data) => {
    const response = await apiClient.post(`/Leads/communication`, data);
    return response.data;
  },

  // Create lead
  create: async (leadData) => {
    const response = await apiClient.post("/Leads", leadData);
    return response.data;
  },

  // Update lead
  update: async (id, data) => {
    const response = await apiClient.patch(`/Leads/${id}`, data);
    return response.data;
  },

  // Update status
  updateStatus: async (leadId, status) => {
    const response = await apiClient.patch(`/Leads/status`, { leadId, status });
    return response.data;
  },

  // Convert lead
  convertToDeal: async (id) => {
    const response = await apiClient.post(
      `/Leads/${id}/convert-to-deal`,
      undefined,
      { headers: { "Content-Type": undefined } }
    );
    return response.data;
  },

  // Delete
  delete: async (id) => {
    const response = await apiClient.delete(`/Leads/${id}`);
    return response.data;
  },

  // Import leads
  import: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/Leads/import", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    return response.data;
  },

  // Contact history
  getContactHistory: async (id) => {
    const response = await apiClient.get(`/Leads/${id}/contact-history`);
    return response.data;
  }

};

export default leadsAPI;