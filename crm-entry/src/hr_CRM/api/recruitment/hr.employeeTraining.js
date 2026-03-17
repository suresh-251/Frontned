import hrApi from "../hr.api";

export const getAllTrainings = () => hrApi.get("/api/EmployeeTraining/all");
export const getTrainingByUser = (userId) => hrApi.get(`/api/EmployeeTraining/user/${userId}`);
export const assignTraining = (data) => hrApi.post("/api/EmployeeTraining/assign", data);
export const updateTrainingStatus = (id, data) => hrApi.put(`/api/EmployeeTraining/update-status/${id}`, data);
export const deleteTraining = (id) => hrApi.delete(`/api/EmployeeTraining/delete/${id}`);