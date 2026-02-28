// import hrApi from "./hr.api"; 
// // adjust path if needed (example: ../hrApi)

// /**
//  * ✅ Check In
//  * POST /api/Attendance/check-in?userId=1
//  */
// export const checkIn = async (userId) => {
//   if (!userId) {
//     throw new Error("userId is required for check-in");
//   }

//   return hrApi.post("/api/Attendance/check-in", null, {
//     params: { userId },
//   });
// };


// /**
//  * ✅ Check Out
//  * POST /api/Attendance/check-out?userId=1
//  */
// export const checkOut = async (userId) => {
//   if (!userId) {
//     throw new Error("userId is required for check-out");
//   }

//   return hrApi.post("/api/Attendance/check-out", null, {
//     params: { userId },
//   });
// };


// /**
//  * ✅ Get Total Hours
//  * GET /api/Attendance/total-hours?userId=1
//  */
// export const getTotalHours = async (userId) => {
//   if (!userId) {
//     throw new Error("userId is required to fetch total hours");
//   }

//   return hrApi.get("/api/Attendance/total-hours", {
//     params: { userId },
//   });
// };


// /**
//  * ✅ Update Attendance Status
//  * PUT /api/Attendance/update-status?userId=1&status=Present
//  */
// export const updateAttendanceStatus = async (userId, status) => {
//   if (!userId || !status) {
//     throw new Error("userId and status are required");
//   }

//   return hrApi.put("/api/Attendance/update-status", null, {
//     params: { userId, status },
//   });
// };


// /**
//  * ✅ Get Attendance History
//  * GET /api/Attendance/history/1
//  */
// export const getAttendanceHistory = async (userId) => {
//   if (!userId) {
//     throw new Error("userId is required to fetch attendance history");
//   }

//   return hrApi.get(`/api/Attendance/history/${userId}`);
// };











import hrApi from "./hr.api";

// ✅ CHECK-IN (Fixed Query Params)
export const checkIn = async (userId) => {
  return hrApi.post(`/api/Attendance/check-in?userId=${userId}`);
};

// ✅ CHECK-OUT (Fixed Query Params)
export const checkOut = async (userId) => {
  return hrApi.post(`/api/Attendance/check-out?userId=${userId}`);
};

// ✅ GET HISTORY
export const getAttendanceHistory = async (userId) => {
  return hrApi.get(`/api/Attendance/history/${userId}`);
};