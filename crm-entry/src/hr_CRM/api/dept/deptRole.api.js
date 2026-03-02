import hrApi from "../hr.api";

// Get all roles
export const getDepartmentRoles = () => hrApi.get("/api/DepartmentRole");

// Create new role
export const createDepartmentRole = (data) => hrApi.post("/api/DepartmentRole", data);

// Update existing role
export const updateDepartmentRole = (id, data) => hrApi.put(`/api/DepartmentRole/${id}`, data);

// Delete role
export const deleteDepartmentRole = (id) => hrApi.delete(`/api/DepartmentRole/${id}`);

// Assign role to a specific User
export const assignRoleToUser = (data) => hrApi.post("/api/DepartmentRole/assign", data);

// Get roles assigned to a specific User
export const getUserRoles = (userId) => hrApi.get(`/api/DepartmentRole/user/${userId}`);