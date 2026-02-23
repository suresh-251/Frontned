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

  // Delete note
  delete: async (id) => {
    const response = await apiClient.delete(`/Notes/${id}`);
    return response.data;
  },

  // Get notes by related entity ID
  getByRelatedId: async (relatedId) => {
    const response = await apiClient.get(`/Notes/related/${relatedId}`);
    return response.data;
  },

  // Get notes by type
  getByType: async (type) => {
    const response = await apiClient.get(`/Notes/type/${type}`);
    return response.data;
  },
};

export default notesAPI;
