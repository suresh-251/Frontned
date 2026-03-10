import axios from "axios";

const API_URL = "/api/OffBoarding";
const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
});

export const getOffBoardingList = async () => {
  const res = await axios.get(API_URL, getHeaders());
  return res.data;
};

export const getOffBoardingById = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`, getHeaders());
  return res.data;
};

export const createOffBoarding = async (data) => {
  const res = await axios.post(`${API_URL}/create`, data, getHeaders());
  return res.data;
};

export const updateOffBoardingStatus = async (id, statusData) => {
  const res = await axios.put(`${API_URL}/update-status/${id}`, statusData, getHeaders());
  return res.data;
};

export const deleteOffBoarding = async (id) => {
  const res = await axios.delete(`${API_URL}/delete/${id}`, getHeaders());
  return res.data;
};