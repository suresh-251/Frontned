import apiClient from './apiClient';

/**
 * Activities API Service
 */

const unwrapArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const normalizeActivityPreview = (item) => {
  const normalizedType = item?.type || item?.activityType || item?.activityTypeName || "Follow-up";
  const normalizedSubject = item?.subject || item?.title || item?.name || normalizedType;

  return {
    ...item,
    type: normalizedType,
    subject: normalizedSubject,
  };
};

const activitiesAPI = {
  // Get all activities
  getAll: async () => {
    const response = await apiClient.get('/Activities');
    return unwrapArrayPayload(response.data);
  },

  getCalendar: async ({ startDate, endDate, userId } = {}) => {
    const response = await apiClient.get('/Activities/calendar', {
      params: {
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(userId ? { userId } : {}),
      },
    });
    return unwrapArrayPayload(response.data);
  },

  getOpen: async ({ leadId, dealId } = {}) => {
    const response = await apiClient.get('/Activities/open', {
      params: {
        ...(leadId ? { leadId } : {}),
        ...(dealId ? { dealId } : {}),
      },
    });
    return unwrapArrayPayload(response.data);
  },

  getClosed: async ({ leadId, dealId } = {}) => {
    const response = await apiClient.get('/Activities/closed', {
      params: {
        ...(leadId ? { leadId } : {}),
        ...(dealId ? { dealId } : {}),
      },
    });
    return unwrapArrayPayload(response.data);
  },

  getFollowUps: async ({ leadId, assignedToUserId, fromDate, toDate, status } = {}) => {
    const response = await apiClient.get('/Activities/followups', {
      params: {
        ...(leadId ? { leadId } : {}),
        ...(assignedToUserId ? { assignedToUserId } : {}),
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {}),
        ...(status ? { status } : {}),
      },
    });
    return unwrapArrayPayload(response.data);
  },

  getFollowUpsToday: async ({ leadId, assignedToUserId } = {}) => {
    const response = await apiClient.get('/Activities/followups/today', {
      params: {
        ...(leadId ? { leadId } : {}),
        ...(assignedToUserId ? { assignedToUserId } : {}),
      },
    });
    return unwrapArrayPayload(response.data);
  },

  getFollowUpsOverdue: async ({ leadId, type } = {}) => {
    const response = await apiClient.get('/Activities/followups/overdue', {
      params: {
        ...(leadId ? { leadId } : {}),
        ...(type ? { type } : {}),
      },
    });
    return unwrapArrayPayload(response.data).map(normalizeActivityPreview);
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
    return unwrapArrayPayload(response.data);
  },
};

export default activitiesAPI;
