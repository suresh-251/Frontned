import hrApi from "./hr.api";

export const getAllExitInterviews = () => hrApi.get("/api/ExitInterview/all");

// GET specifically for the logged-in User
export const getExitInterviewByEmployee = (employeeId) => hrApi.get(`/api/ExitInterview/employee/${employeeId}`);

export const scheduleExitInterview = (data) => hrApi.post("/api/ExitInterview/schedule", data);

export const submitExitFeedback = (data) => hrApi.post("/api/ExitInterview/submit-feedback", data);

export const updateExitInterview = (id, data) => hrApi.put(`/api/ExitInterview/update/${id}`, data);

export const deleteExitInterview = (id) => hrApi.delete(`/api/ExitInterview/delete/${id}`);