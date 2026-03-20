import apiClient from './apiClient';

const dealsAPI = {
  // GET /api/Deals
  getAll: async () => {
    const response = await apiClient.get('/Deals');
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
