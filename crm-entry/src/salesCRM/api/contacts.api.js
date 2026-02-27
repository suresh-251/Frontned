import apiClient from "./apiClient";

const contactsAPI = {
  getAll: async () => {
    const res = await apiClient.get("/Contacts");
    return res.data;
  },

  getById: async (id) => {
    const res = await apiClient.get(`/Contacts/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await apiClient.post("/Contacts", data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await apiClient.put(`/Contacts/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await apiClient.delete(`/Contacts/${id}`);
    return res.data;
  },
};

export default contactsAPI;   // ✅ VERY IMPORTANT