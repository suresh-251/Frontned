// src/salesCRM/api/leads.api.js
import apiClient from "./apiClient";

const leadsAPI = {
  // Get all leads
  getAll: async () => {
    const response = await apiClient.get("/Leads");
    return response.data;
  },

  // Create new lead
  create: async (leadData) => {
    const response = await apiClient.post("/Leads", leadData);
    return response.data;
  },

  // Update lead (used for status change and other edits)
  update: async (id, data) => {
    const response = await apiClient.patch(`/Leads/${id}`, data);
    return response.data;
  },

  // Delete lead
  delete: async (id) => {
    const response = await apiClient.delete(`/Leads/${id}`);
    return response.data;
  },
};

export default leadsAPI;