import axios from "axios";

const API_URL = "https://crmhr.metagensoft.com/api/OffBoarding";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getOffBoardingList = async () => {
  const res = await api.get("/");
  return res.data;
};

export const getOffBoardingById = async (id) => {
  const res = await api.get(`/${id}`);
  return res.data;
};

export const createOffBoarding = async (data) => {
  const res = await api.post("/create", data);
  return res.data;
};

export const updateOffBoardingStatus = async (id, statusData) => {
  const res = await api.put(`/update-status/${id}`, statusData);
  return res.data;
};

export const deleteOffBoarding = async (id) => {
  const res = await api.delete(`/delete/${id}`);
  return res.data;
};