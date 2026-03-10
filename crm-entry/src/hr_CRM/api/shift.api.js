import hrApi from "./hr.api";

// Fetch all shifts
export const getShifts = async () => {
  const response = await hrApi.get("/api/Shift");
  return response.data;
};

// Create a new shift
export const createShift = async (payload) => {
  const response = await hrApi.post("/api/Shift", payload);
  return response.data;
};

// Get all users who have assigned shifts
export const getAssignedUsers = async () => {
  const response = await hrApi.get("/api/Shift/assigned-users");
  return response.data;
};

// Get shift details for a specific user
export const getUserShift = async (userId) => {
  const response = await hrApi.get(`/api/Shift/user/${userId}`);
  return response.data;
};

// Assign a shift to a user (Query Parameters)
export const assignShiftToUser = async (userId, shiftId) => {
  const response = await hrApi.post(`/api/Shift/assign?userId=${userId}&shiftId=${shiftId}`);
  return response.data;
};