import apiClient from './apiClient';

/**
 * Activities API Service
 */

const activitiesAPI = {
  // Get all activities
  getAll: async () => {
    const response = await apiClient.get('/Activities');
    return response.data;
  },

  getOpen: async () => {
    const response = await apiClient.get('/Activities/open');
    return response.data;
  },

  getClosed: async () => {
    const response = await apiClient.get('/Activities/closed');
    return response.data;
  },

  // Get activity by ID
  getById: async (id) => {
    const response = await apiClient.get(`/Activities/${id}`);
    return response.data;
  },

  // Create new activity
  create: async (activityData) => {
    const response = await apiClient.post('/Activities', activityData);
    return response.data;
  },

  // Update activity status
  updateStatus: async (id, status) => {
    const response = await apiClient.put(`/Activities/status/${id}`, {
      id,
      status
    });
    return response.data;
  },

  // Delete activity
  delete: async (id) => {
    const response = await apiClient.delete(`/Activities/${id}`);
    return response.data;
  },

  // Get activities by deal ID
  getByDealId: async (dealId) => {
    const response = await apiClient.get(`/Activities/deal/${dealId}`);
    return response.data;
  },
};

export default activitiesAPI;
