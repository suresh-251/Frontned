import hrApi from "./hr.api";

// POST: /api/Attendance/check-in?userId=1
export const checkIn = async (userId) => {
  return hrApi.post(`/api/Attendance/check-in?userId=${userId}`);
};

// POST: /api/Attendance/check-out?userId=1
export const checkOut = async (userId) => {
  return hrApi.post(`/api/Attendance/check-out?userId=${userId}`);
};

// GET: /api/Attendance/total-hours?userId=1
export const getTotalHours = async (userId) => {
  return hrApi.get(`/api/Attendance/total-hours?userId=${userId}`);
};

// GET: /api/Attendance/history/1
export const getAttendanceHistory = async (userId) => {
  return hrApi.get(`/api/Attendance/history/${userId}`);
};
