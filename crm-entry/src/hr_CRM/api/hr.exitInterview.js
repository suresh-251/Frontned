import hrApi from "./hr.api";

// 1. GET ALL
export const getAllExitInterviews = () => hrApi.get("/api/ExitInterview/all");

// 2. GET BY USER ID
export const getExitInterviewByUser = (userId) => hrApi.get(`/api/ExitInterview/user/${userId}`);

// 3. POST SCHEDULE
export const scheduleExitInterview = (data) => hrApi.post("/api/ExitInterview/schedule", data);

// 4. POST FEEDBACK
export const submitExitFeedback = (data) => hrApi.post("/api/ExitInterview/submit-feedback", data);

// 5. PUT UPDATE
export const updateExitInterview = (id, data) => hrApi.put(`/api/ExitInterview/update/${id}`, data);

// 6. DELETE
export const deleteExitInterview = (id) => hrApi.delete(`/api/ExitInterview/delete/${id}`);