import apiClient from './apiClient';

/**
 * Forecast API Service
 * Handles all forecast-related API calls
 */

const forecastAPI = {
  // Get monthly forecast
  getMonthly: async () => {
    const response = await apiClient.get('/Forecast/monthly');
    return response.data;
  },
};

export default forecastAPI;
