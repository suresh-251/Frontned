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

/**
 * GET: /api/Attendance/history/1
 * FINAL ATTEMPT AT SILENCING CONSOLE:
 * We return a default empty object in the catch block 
 * and ensure validateStatus is applied correctly.
 */
export const getAttendanceHistory = async (userId) => {
  if (!userId) return { data: [] };

  return hrApi.get(`/api/Attendance/history/${userId}`, {
    // Tells Axios: 404 is NOT an error. Do not log it as a failure.
    validateStatus: (status) => (status >= 200 && status < 300) || status === 404
  })
  .then(response => {
    if (response.status === 404) return { data: [] };
    return response;
  })
  .catch(() => {
    // Catch-all to prevent the red "Uncaught" error
    return { data: [] };
  });
};