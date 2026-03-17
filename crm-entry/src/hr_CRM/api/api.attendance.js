// import hrApi from "./hr.api";

// export const checkIn = async (userId) => {
//   return hrApi.post(`/api/Attendence/checkin`, { userId: Number(userId) });
// };

// export const checkOut = async (userId) => {
//   return hrApi.post(`/api/Attendence/check-out?userId=${userId}`);
// };

// export const getTotalHours = async (userId) => {
//   return hrApi.get(`/api/Attendence/total-hours?userId=${userId}`);
// };

// export const getAttendanceHistory = async (userId) => {
//   if (!userId) return { data: [] };
//   return hrApi.get(`/api/Attendence/history/${userId}`)
//     .catch(() => ({ data: [] }));
// };


import hrApi from "./hr.api";

export const checkIn = async (userId, lat, lng) => 
  hrApi.post(`/api/Attendence/checkin`, { userId: Number(userId), latitude: lat, longitude: lng });

export const checkOut = async (userId) => 
  hrApi.post(`/api/Attendence/check-out?userId=${userId}`);

export const getTotalHours = async (userId) => 
  hrApi.get(`/api/Attendence/total-hours?userId=${userId}`).catch(() => ({ data: 0 }));

export const getAttendanceHistory = async (userId) => 
  hrApi.get(`/api/Attendence/history/${userId}`).catch(() => ({ data: [] }));

export const updateLiveLocation = async (userId, lat, lng) => 
  hrApi.put(`/api/Attendence/location`, { userId: Number(userId), latitude: lat, longitude: lng });

export const getAllLiveLocations = async () => 
  hrApi.get(`/api/Attendence/live-locations`).catch(() => ({ data: [] }));

export const getLocationTrail = async (userId, date) => 
  hrApi.get(`/api/Attendence/location-trail/${userId}?date=${date}`).catch(() => ({ data: [] }));

export const getUserLiveLocation = async (userId) => 
  hrApi.get(`/api/Attendence/live-location/${userId}`).catch(() => ({ data: null }));

export const getAllLeaves = () => hrApi.get("/api/Leave").catch(() => ({ data: [] }));