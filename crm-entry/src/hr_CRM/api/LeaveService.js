import hrApi from "./hr.api";

// Fetch all leave records
export const getAllLeaves = () => hrApi.get("/api/Leave");

// Fetch leaves for a specific employee
export const getLeavesByEmployee = (empId) => hrApi.get(`/api/Leave/${empId}`);

// Submit a new leave request (THIS IS THE MISSING EXPORT)
export const applyLeave = (leaveData) => hrApi.post("/api/Leave/apply", leaveData);

// Approve or Reject a leave
export const updateLeaveStatus = (leaveId, statusUpdate) => 
    hrApi.put(`/api/Leave/${leaveId}/status`, statusUpdate);

// Remove a leave record
export const deleteLeave = (leaveId) => hrApi.delete(`/api/Leave/${leaveId}`);