import hrApi from "../hr.api";

// GET: Fetch all budget change requests
export const getBudgetChangeHistory = () => hrApi.get("/api/BudgetChange");

// POST: Submit a new budget change request
export const requestBudgetChange = (data) => hrApi.post("/api/BudgetChange", data);

// GET: Fetch departments for the dropdown (from your HR API)
export const getDepartments = () => hrApi.get("/api/Department");