// 1. Import your custom instance instead of the default axios
import hrApi from "./hr.api";// Adjust the path based on where your instance file is

const API_URL = "/api/OffBoarding";

export const getOffBoardingList = async () => {
  // Use hrApi instead of axios. Interceptors handle headers & baseURL automatically.
  const res = await hrApi.get(API_URL);
  return res.data;
};

export const getOffBoardingById = async (id) => {
  const res = await hrApi.get(`${API_URL}/${id}`);
  return res.data;
};

export const createOffBoarding = async (data) => {
  const res = await hrApi.post(`${API_URL}/create`, data);
  return res.data;
};

export const updateOffBoardingStatus = async (id, statusData) => {
  const res = await hrApi.put(`${API_URL}/update-status/${id}`, statusData);
  return res.data;
};

export const deleteOffBoarding = async (id) => {
  const res = await hrApi.delete(`${API_URL}/delete/${id}`);
  return res.data;
};