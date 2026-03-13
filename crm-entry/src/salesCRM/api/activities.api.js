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

  getOpen: async ({ leadId, dealId } = {}) => {
    const response = await apiClient.get('/Activities/open', {
      params: {
        ...(leadId ? { leadId } : {}),
        ...(dealId ? { dealId } : {}),
      },
    });
    return response.data;
  },

  getClosed: async ({ leadId, dealId } = {}) => {
    const response = await apiClient.get('/Activities/closed', {
      params: {
        ...(leadId ? { leadId } : {}),
        ...(dealId ? { dealId } : {}),
      },
    });
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

  createTask: async (taskData) => {
    const response = await apiClient.post('/Activities/task', taskData);
    return response.data;
  },

  createMeeting: async (meetingData) => {
    const response = await apiClient.post('/Activities/meeting', meetingData);
    return response.data;
  },

  logCall: async (callData) => {
    const response = await apiClient.post('/Activities/call/log', callData);
    return response.data;
  },

  scheduleCall: async (callData) => {
    const response = await apiClient.post('/Activities/call/schedule', callData);
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
