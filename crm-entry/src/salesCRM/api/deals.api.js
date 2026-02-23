import apiClient from './apiClient';

/**
 * Deals API Service
 * Handles all deal-related API calls
 */

const dealsAPI = {
  // Get all deals
  getAll: async () => {
    const response = await apiClient.get('/Deals');
    return response.data;
  },

  // Get deal by ID
  getById: async (id) => {
    const response = await apiClient.get(`/Deals/${id}`);
    return response.data;
  },

  // Create new deal
  create: async (dealData) => {
    const response = await apiClient.post('/Deals', dealData);
    return response.data;
  },

  // Update deal stage
  updateStage: async (id, stage) => {
    const response = await apiClient.put(`/Deals/stage/${id}`, {
      id,
      stage
    });
    return response.data;
  },

  // Delete deal
  delete: async (id) => {
    const response = await apiClient.delete(`/Deals/${id}`);
    return response.data;
  },

  // Get deals by pipeline stage
  getByStage: async (stage) => {
    const response = await apiClient.get(`/Deals/pipeline/${stage}`);
    return response.data;
  },
};

export default dealsAPI;
