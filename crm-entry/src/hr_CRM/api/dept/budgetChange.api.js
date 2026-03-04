import hrApi from "../hr.api";

// 1. Fetch all budget change requests
export const getBudgetChangeHistory = () => hrApi.get("/api/BudgetChange");

// 2. Get a single request by ID
export const getBudgetChangeById = (id) => hrApi.get(`/api/BudgetChange/${id}`);

// 3. Submit a new budget change request
export const requestBudgetChange = (data) => hrApi.post("/api/BudgetChange", data);

// 4. Approve a request
export const approveBudgetChange = (id) => hrApi.put(`/api/BudgetChange/approve/${id}`);

// 5. Reject a request
export const rejectBudgetChange = (id) => hrApi.put(`/api/BudgetChange/reject/${id}`);

// 6. Fetch departments (usually from your main hr.dept file, but included here for consistency)
export const getDepartments = () => hrApi.get("/api/Department");