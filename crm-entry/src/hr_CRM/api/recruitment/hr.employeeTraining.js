import hrApi from "../hr.api";

// Fetch all training records
export const getAllTrainings = () => hrApi.get("/api/EmployeeTraining/all");

// Fetch training by Employee ID
export const getTrainingByEmployee = (employeeId) => hrApi.get(`/api/EmployeeTraining/employee/${employeeId}`);

// Assign new training (POST)
export const assignTraining = (data) => hrApi.post("/api/EmployeeTraining/assign", data);

// Update training status (PUT)
export const updateTrainingStatus = (id, status) => hrApi.put(`/api/EmployeeTraining/update-status/${id}`, { status });

// Delete training record (DELETE)
export const deleteTraining = (id) => hrApi.delete(`/api/EmployeeTraining/delete/${id}`);