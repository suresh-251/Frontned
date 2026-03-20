import apiClient from './apiClient';

/**
 * Notes API Service
 * Handles all note-related API calls
 */

const notesAPI = {
  // Get all notes
  getAll: async () => {
    const response = await apiClient.get('/Notes');
    return response.data;
  },

  // Get note by ID
  getById: async (id) => {
    const response = await apiClient.get(`/Notes/${id}`);
    return response.data;
  },

  // Create new note
  create: async (noteData) => {
    const response = await apiClient.post('/Notes', noteData);
    return response.data;
  },

  // Update note
  update: async (id, noteData) => {
    const response = await apiClient.put(`/Notes/${id}`, noteData);
    return response.data;
  },

  // Delete note
  delete: async (id) => {
    const response = await apiClient.delete(`/Notes/${id}`);
    return response.data;
  }
};

export default notesAPI;
