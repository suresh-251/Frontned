// import hrApi from "../hr.api";

// // 1. Fetch all budget change requests
// export const getBudgetChangeHistory = () => hrApi.get("/api/BudgetChange");

// // 2. Get a single request by ID
// export const getBudgetChangeById = (id) => hrApi.get(`/api/BudgetChange/${id}`);

// // 3. Submit a new budget change request
// export const requestBudgetChange = (data) => hrApi.post("/api/BudgetChange", data);

// // 4. Approve a request
// export const approveBudgetChange = (id) => hrApi.put(`/api/BudgetChange/approve/${id}`);

// // 5. Reject a request
// export const rejectBudgetChange = (id) => hrApi.put(`/api/BudgetChange/reject/${id}`);

// // 6. Delete a request (included for completeness based on your Swagger)
// export const deleteBudgetChange = (id) => hrApi.delete(`/api/BudgetChange/${id}`);

// // 7. Fetch departments
// export const getDepartments = () => hrApi.get("/api/Department");

// // 8. Fetch existing department budgets (Needed to load the old budget data)
// export const getDepartmentBudgets = () => hrApi.get("/api/DepartmentBudget");

import hrApi from "../hr.api";

// Fetch all budget change requests
export const getBudgetChangeHistory = () => hrApi.get("/api/BudgetChange");

// Submit a new budget change request
export const requestBudgetChange = (data) => hrApi.post("/api/BudgetChange", data);

// Approve a request
export const approveBudgetChange = (id) => hrApi.put(`/api/BudgetChange/approve/${id}`);

// Reject a request
export const rejectBudgetChange = (id) => hrApi.put(`/api/BudgetChange/reject/${id}`);

// Delete a request
export const deleteBudgetChange = (id) => hrApi.delete(`/api/BudgetChange/${id}`);

// Fetch departments
export const getDepartments = () => hrApi.get("/api/Department");

// Fetch existing department budgets (to pre-fill or validate)
export const getDepartmentBudgets = () => hrApi.get("/api/DepartmentBudget");