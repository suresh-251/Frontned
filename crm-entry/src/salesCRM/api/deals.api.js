import apiClient from './apiClient';

const unwrapArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const buildDealsListParams = ({ source, filter, owner, dateRangeFrom, dateRangeTo, closingDate } = {}) => ({
  ...(source ? { source } : {}),
  ...(filter ? { Filter: filter } : {}),
  ...(owner ? { Owner: owner } : {}),
  ...(dateRangeFrom ? { DateRangeFrom: dateRangeFrom } : {}),
  ...(dateRangeTo ? { DateRangeTo: dateRangeTo } : {}),
  ...(closingDate ? { closingDate } : {}),
});

const dealsAPI = {
  // GET /api/Deals
  getAll: async ({ source, filter, owner, dateRangeFrom, dateRangeTo, closingDate } = {}) => {
    const response = await apiClient.get('/Deals', {
      params: buildDealsListParams({ source, filter, owner, dateRangeFrom, dateRangeTo, closingDate }),
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
    const response = await apiClient.get("/Leads/communications", {
      params: {
        ...(dealId ? { dealId } : {}),
        ...(type ? { type } : {}),
      },
    });
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

  // PUT /api/Deals/bulk/stage for a single deal
  updateStage: async (id, stage) => {
    const response = await apiClient.put('/Deals/bulk/stage', {
      dealIds: [id],
      stage,
    });
    return response.data;
  },

  // PUT /api/Deals/bulk/stage
  bulkUpdateStage: async (dealIds, stage) => {
    const response = await apiClient.put('/Deals/bulk/stage', {
      dealIds,
      stage,
    });
    return response.data;
  },

  // DELETE /api/Deals/{id}
  delete: async (id) => {
    const response = await apiClient.delete(`/Deals/${id}`);
    return response.data;
  },

  // DELETE /api/Deals/bulk
  bulkDelete: async (dealIds) => {
    const response = await apiClient.delete('/Deals/bulk', {
      data: dealIds,
    });
    return response.data;
  },

  // GET /api/Deals/pipeline/{stage}
  getByStage: async (stage) => {
    const response = await apiClient.get(`/Deals/pipeline/${stage}`);
    return response.data;
  },
};

export default dealsAPI;
