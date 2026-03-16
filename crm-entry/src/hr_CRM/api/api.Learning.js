import hrApi from "./hr.api";

// Fetch all assigned courses
export const getAllLearning = () => hrApi.get("/api/Learning/all");

// Fetch courses by Employee ID
export const getLearningByEmployee = (employeeId) => hrApi.get(`/api/Learning/employee/${employeeId}`);

// Assign new course (POST) - requires all Swagger fields
export const assignCourse = (data) => hrApi.post("/api/Learning/assign-course", data);

// Update progress (PUT)
export const updateLearningProgress = (id, data) => hrApi.put(`/api/Learning/update-progress/${id}`, data);

// Mark as complete (PUT)
export const completeLearning = (id) => hrApi.put(`/api/Learning/complete/${id}`);

// Delete record (DELETE)
export const deleteLearning = (id) => hrApi.delete(`/api/Learning/delete/${id}`);