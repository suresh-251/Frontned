import apiClient from './apiClient';

const accountsAPI = {
  getAll: async () => {
    const res = await apiClient.get('/Accounts');
    return res.data;
  },

  getById: async (id) => {
    const res = await apiClient.get(`/Accounts/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await apiClient.post('/Accounts', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await apiClient.patch(`/Accounts/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await apiClient.delete(`/Accounts/${id}`);
    return res.data;
  },

  getDeals: async (id) => {
    const res = await apiClient.get(`/Accounts/${id}/deals`);
    return res.data;
  }
};

export default accountsAPI;
