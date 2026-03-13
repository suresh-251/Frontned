import hrApi from "./hr.api";

// Fetch all payroll records
export const getAllPayroll = () => hrApi.get("/api/Payroll/all");

// Fetch payroll by Employee ID
export const getPayrollByEmployee = (employeeId) => hrApi.get(`/api/Payroll/${employeeId}`);

// Generate new payroll (POST)
export const generatePayroll = (data) => hrApi.post("/api/Payroll/generate", data);

// Update payroll record (PUT)
export const updatePayroll = (id, data) => hrApi.put(`/api/Payroll/${id}`, data);

// Delete payroll record (DELETE)
export const deletePayroll = (id) => hrApi.delete(`/api/Payroll/${id}`);