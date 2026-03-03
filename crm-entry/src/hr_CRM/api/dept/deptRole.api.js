import hrApi from "../hr.api";

export const getDepartmentRoles = () => hrApi.get("/api/DepartmentRole");
export const createDepartmentRole = (data) => hrApi.post("/api/DepartmentRole", data);
export const updateDepartmentRole = (id, data) => hrApi.put(`/api/DepartmentRole/${id}`, data);
export const deleteDepartmentRole = (id) => hrApi.delete(`/api/DepartmentRole/${id}`);