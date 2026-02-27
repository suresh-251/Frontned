// import apiClient from './apiClient';

// /**
//  * Accounts API Service
//  * Handles all account-related API calls
//  */

// const accountsAPI = {
//   // Get all accounts
//   getAll: async () => {
//     const response = await apiClient.get('/Accounts');
//     return response.data;
//   },

//   // Get account by ID
//   getById: async (id) => {
//     const response = await apiClient.get(`/Accounts/${id}`);
//     return response.data;
//   },

//   // Create new account
//   create: async (accountData) => {
//     const response = await apiClient.post('/Accounts', accountData);
//     return response.data;
//   },

//   // Update account
//   update: async (id, accountData) => {
//     const response = await apiClient.put(`/Accounts/${id}`, {
//       id,
//       ...accountData
//     });
//     return response.data;
//   },

//   // Delete account
//   delete: async (id) => {
//     const response = await apiClient.delete(`/Accounts/${id}`);
//     return response.data;
//   },

//   // Get deals for an account
//   getDeals: async (id) => {
//     const response = await apiClient.get(`/Accounts/${id}/deals`);
//     return response.data;
//   },
// };

// export default accountsAPI;

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
    const res = await apiClient.post('/Accounts', {
      ...data,
      createdAt: new Date().toISOString()
    });
    return res.data;
  },

  update: async (id, data) => {
    const res = await apiClient.put(`/Accounts/${id}`, {
      id,
      ...data
    });
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