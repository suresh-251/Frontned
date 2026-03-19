import apiClient from "./apiClient";

const unwrapArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const unwrapObjectPayload = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) return payload.data;
  if (payload.item && typeof payload.item === "object" && !Array.isArray(payload.item)) return payload.item;
  if (payload.result && typeof payload.result === "object" && !Array.isArray(payload.result)) return payload.result;
  return payload;
};

const meetingsAPI = {
  create: async (meetingData) => {
    const response = await apiClient.post("/Meetings", meetingData);
    return response.data;
  },

  getAll: async () => {
    const response = await apiClient.get("/Meetings");
    return unwrapArrayPayload(response.data);
  },

  getById: async (id) => {
    const response = await apiClient.get(`/Meetings/${id}`);
    return unwrapObjectPayload(response.data);
  },

  getForLead: async (leadId) => {
    if (!leadId) return [];
    const response = await apiClient.get(`/Meetings/lead/${leadId}`);
    return unwrapArrayPayload(response.data);
  },
};

export default meetingsAPI;
