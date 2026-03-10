import hrApi from "../hr.api";

export const getDepartmentRoles = () => hrApi.get("/api/DepartmentRole");
export const createDepartmentRole = (data) => hrApi.post("/api/DepartmentRole", data);

// ✅ Update Endpoint: Uses the ID in the URL and sends the body
export const updateDepartmentRole = (id, data) => hrApi.put(`/api/DepartmentRole/${id}`, data);

export const deleteDepartmentRole = (id) => hrApi.delete(`/api/DepartmentRole/${id}`);
export const assignUserRole = (data) => hrApi.post("/api/DepartmentRole/assign", data);
export const getUserRoles = (userId) => hrApi.get(`/api/DepartmentRole/user/${userId}`);