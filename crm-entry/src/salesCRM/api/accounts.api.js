import apiClient from './apiClient';

/**
 * Accounts API Service
 * Handles all account-related API calls
 */

const accountsAPI = {
  // Get all accounts
  getAll: async () => {
    const response = await apiClient.get('/Accounts');
    return response.data;
  },

  // Get account by ID
  getById: async (id) => {
    const response = await apiClient.get(`/Accounts/${id}`);
    return response.data;
  },

  // Create new account
  create: async (accountData) => {
    const response = await apiClient.post('/Accounts', accountData);
    return response.data;
  },

  // Update account
  update: async (id, accountData) => {
    const response = await apiClient.put(`/Accounts/${id}`, {
      id,
      ...accountData
    });
    return response.data;
  },

  // Delete account
  delete: async (id) => {
    const response = await apiClient.delete(`/Accounts/${id}`);
    return response.data;
  },

  // Get deals for an account
  getDeals: async (id) => {
    const response = await apiClient.get(`/Accounts/${id}/deals`);
    return response.data;
  },
};

export default accountsAPI;
