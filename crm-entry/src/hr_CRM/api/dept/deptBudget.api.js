import hrApi from "../hr.api";

// Fetch all budgets
export const getDepartmentBudgets = () => hrApi.get("/api/DepartmentBudget");

// Create budget allocation - Ensuring data is passed as a flat object
export const createDepartmentBudget = (payload) => hrApi.post("/api/DepartmentBudget", payload);