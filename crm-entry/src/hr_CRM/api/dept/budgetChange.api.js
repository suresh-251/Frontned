import hrApi from "../hr.api";

// POST: Request a budget change
export const requestBudgetChange = (data) => 
  hrApi.post("/api/BudgetChange/request", data);

// GET: Get all budget change history
// Note: Following your backend pattern, this is likely /api/BudgetChange or /api/BudgetChange/history
export const getBudgetChangeHistory = () => 
  hrApi.get("/api/BudgetChange"); 

// PUT: Approve/Reject (If applicable in your Swagger)
export const updateRequestStatus = (id, status) => 
  hrApi.put(`/api/BudgetChange/${id}/status`, { status });