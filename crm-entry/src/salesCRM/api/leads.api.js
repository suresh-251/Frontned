// src/salesCRM/api/leads.api.js
import apiClient from "./apiClient";

const leadsAPI = {
  // Get all leads
  getAll: async () => {
    const response = await apiClient.get("/Leads");
    return response.data;
  },

  // Get summary statistics for dashboard
  getDashboard: async () => {
    const response = await apiClient.get("/Leads/dashboard");
    return response.data;
  },

  // Get single lead by ID
  getById: async (id) => {
    const response = await apiClient.get(`/Leads/${id}`);
    return response.data;
  },

  // Get timeline for a lead
  getTimeline: async (id) => {
    const response = await apiClient.get(`/Leads/${id}/timeline`);
    return response.data;
  },

  // Create new lead
  create: async (leadData) => {
    const response = await apiClient.post("/Leads", leadData);
    return response.data;
  },

  // Update lead — used for general field edits
  update: async (id, data) => {
    const response = await apiClient.patch(`/Leads/${id}`, data);
    return response.data;
  },

  // Patch status via dedicated endpoint
  updateStatus: async (leadId, status) => {
    const response = await apiClient.patch(`/Leads/status`, { leadId, status });
    return response.data;
  },

  // Convert lead to a deal/customer
  // No body needed — endpoint only uses the {id} path param
  convertToDeal: async (id) => {
    const response = await apiClient.post(
      `/Leads/${id}/convert-to-deal`,
      undefined,    // ← no body
      { headers: { "Content-Type": undefined } }  // ← strip Content-Type so .NET doesn't reject
    );
    return response.data;
  },

  // Delete lead
  delete: async (id) => {
    const response = await apiClient.delete(`/Leads/${id}`);
    return response.data;
  },

  // Import leads from a CSV/XLSX file
  import: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/Leads/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Get contact history for a lead
  getContactHistory: async (id) => {
    const response = await apiClient.get(`/Leads/${id}/contact-history`);
    return response.data;
  },
};


export default leadsAPI;