// import apiClient from './apiClient';

// /**
//  * Leads API Service
//  * Handles all lead-related API calls
//  */

// const leadsAPI = {
//   // Get all leads
//   getAll: async () => {
//     const response = await apiClient.get('/Leads');
//     return response.data;
//   },

//   // Create new lead
//   create: async (leadData) => {
//     const response = await apiClient.post('/Leads', leadData);
//     return response.data;
//   },
// };

// export default leadsAPI;


// src/api/leadsAPI.js
import apiClient from "./apiClient";

/**
 * Leads API Service
 */

const leadsAPI = {
  // ✅ Get all leads
  getAll: async () => {
    const response = await apiClient.get("/Leads");
    return response.data;
  },

  // ✅ Create new lead (WRAPPED INSIDE "lead")
  create: async (leadData) => {
    const response = await apiClient.post("/Leads", {
      lead: leadData, // IMPORTANT FIX
    });

    return response.data;
  },
};

export default leadsAPI;