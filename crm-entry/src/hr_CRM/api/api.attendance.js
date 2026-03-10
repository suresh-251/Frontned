import hrApi from "./hr.api";

export const checkIn = async (userId) => {
  return hrApi.post(`/api/Attendence/checkin`, { userId: Number(userId) });
};

export const checkOut = async (userId) => {
  return hrApi.post(`/api/Attendence/check-out?userId=${userId}`);
};

export const getTotalHours = async (userId) => {
  return hrApi.get(`/api/Attendence/total-hours?userId=${userId}`);
};

export const getAttendanceHistory = async (userId) => {
  if (!userId) return { data: [] };
  return hrApi.get(`/api/Attendence/history/${userId}`)
    .catch(() => ({ data: [] }));
};