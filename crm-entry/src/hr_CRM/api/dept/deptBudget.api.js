import hrApi from "../hr.api";

// UPDATE: Added /get-all to the path
export const getDepartmentBudgets = () => hrApi.get("/api/DepartmentBudget/get-all");

// For creating/updating
export const createDepartmentBudget = (data) => hrApi.post("/api/DepartmentBudget", data);

// If you need to fetch by a specific ID
export const getBudgetByDept = (deptId) => hrApi.get(`/api/DepartmentBudget/${deptId}`);