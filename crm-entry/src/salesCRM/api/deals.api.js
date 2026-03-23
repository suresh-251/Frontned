import apiClient from './apiClient';

const unwrapArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const dealsAPI = {
  // GET /api/Deals
  getAll: async ({ source, filter, owner, dateRangeFrom, dateRangeTo } = {}) => {
    const response = await apiClient.get('/Deals', {
      params: {
        ...(source ? { source } : {}),
        ...(filter ? { Filter: filter } : {}),
        ...(owner ? { Owner: owner } : {}),
        ...(dateRangeFrom ? { DateRangeFrom: dateRangeFrom } : {}),
        ...(dateRangeTo ? { DateRangeTo: dateRangeTo } : {}),
      },
    });
    return response.data;
  },

  // GET /api/Deals/{id}
  getById: async (id) => {
    const response = await apiClient.get(`/Deals/${id}`);
    return response.data;
  },

  // POST /api/Deals
  create: async (dealData) => {
    const response = await apiClient.post('/Deals', dealData);
    return response.data;
  },

  getTimeline: async (id) => {
    const response = await apiClient.get(`/Deals/${id}/timeline`);
    return unwrapArrayPayload(response.data);
  },

  getCommunications: async (dealId, type) => {
    let url = `/Deals/${dealId}/communications`;
    if (type) url += `?type=${encodeURIComponent(type)}`;
    const response = await apiClient.get(url);
    return unwrapArrayPayload(response.data);
  },

  addCommunication: async (data) => {
    const response = await apiClient.post('/Leads/communication', data);
    return response.data;
  },

  // PATCH /api/Deals/{id}
  update: async (id, data) => {
    const response = await apiClient.patch(`/Deals/${id}`, data);
    return response.data;
  },

  // PUT /api/Deals/stage/{id}
  updateStage: async (id, stage) => {
  return apiClient.put(
    `/Deals/stage/${id}`,
    JSON.stringify(stage),
    { headers: { "Content-Type": "application/json" } }
  );
},

  // DELETE /api/Deals/{id}
  delete: async (id) => {
    const response = await apiClient.delete(`/Deals/${id}`);
    return response.data;
  },

  // GET /api/Deals/pipeline/{stage}
  getByStage: async (stage) => {
    const response = await apiClient.get(`/Deals/pipeline/${stage}`);
    return response.data;
  },
};

export default dealsAPI;
