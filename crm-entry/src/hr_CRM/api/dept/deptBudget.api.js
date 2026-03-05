import hrApi from "../hr.api";

// Fetch all budgets
export const getDepartmentBudgets = () => hrApi.get("/api/DepartmentBudget");

// Create budget allocation
export const createDepartmentBudget = (payload) => hrApi.post("/api/DepartmentBudget", payload);

// Get a specific budget by ID
export const getDepartmentBudgetById = (id) => hrApi.get(`/api/DepartmentBudget/${id}`);

// Get budget by department ID
export const getDepartmentBudgetByDeptId = (deptId) => hrApi.get(`/api/DepartmentBudget/department/${deptId}`);

// Delete budget allocation
export const deleteDepartmentBudget = (id) => hrApi.delete(`/api/DepartmentBudget/${id}`);