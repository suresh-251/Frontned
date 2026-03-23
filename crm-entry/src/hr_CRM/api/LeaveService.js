import hrApi from "./hr.api";

// 1. All records
export const getAllLeaves = () => hrApi.get("/api/Leave");
// 2. Specific User records
export const getLeavesByEmployee = (userId) => hrApi.get(`/api/Leave/${userId}`);
// 3. Submit request
export const applyLeave = (data) => hrApi.post("/api/Leave/apply", data);
// 4. Update status (Using leaveId in path)
export const updateLeaveStatus = (leaveId, statusUpdate) => hrApi.put(`/api/Leave/${leaveId}/status`, statusUpdate);
// 5. Delete record
export const deleteLeave = (leaveId) => hrApi.delete(`/api/Leave/${leaveId}`);
// 6. Balance
export const getLeaveBalance = (userId) => hrApi.get(`/api/Leave/balance/${userId}`);
// 7. Add Holiday
export const addHoliday = (data) => hrApi.post("/api/Leave/holiday", data);
// 8. List Holidays
export const getHolidays = (year) => hrApi.get(`/api/Leave/holidays?year=${year}`);
// 9. Delete Holiday
export const deleteHoliday = (id) => hrApi.delete(`/api/Leave/holiday/${id}`);
// 10. Calendar View
export const getLeaveCalendar = (m, y) => hrApi.get(`/api/Leave/calendar?month=${m}&year=${y}`);
// 11. Request Encashment
export const requestEncashment = (userId, name, year) => hrApi.post(`/api/Leave/encashment/${userId}?userName=${name}&year=${year}`);
// 12. History Encashment
export const getEncashmentHistory = (userId) => hrApi.get(`/api/Leave/encashment/${userId}`);