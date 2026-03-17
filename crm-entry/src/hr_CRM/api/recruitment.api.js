import hrApi from "./hr.api";

export const getRecruitments = async () => {
  const response = await hrApi.get("/api/Recruitment");
  return response.data;
};

export const getRecruitmentsByStatus = async (status) => {
  const response = await hrApi.get(`/api/Recruitment/status/${status}`);
  return response.data;
};

export const getRecruitmentById = async (id) => {
  const response = await hrApi.get(`/api/Recruitment/${id}`);
  return response.data;
};

export const createRecruitment = async (data) => {
  const formData = new FormData();
  formData.append("FirstName", data.firstName || "");
  formData.append("LastName", data.lastName || "");
  formData.append("Email", data.email || "");
  formData.append("Phone", data.phone || "");
  formData.append("AppliedPosition", data.appliedPosition || "");
  formData.append("DepartmentId", String(Number(data.departmentId) || 0));
  formData.append("ApplicationDate", data.applicationDate || new Date().toISOString());
  formData.append("Source", data.source || "");
  formData.append("ExpectedSalary", String(Number(data.expectedSalary) || 0));
  if (data.resume) formData.append("Resume", data.resume);
  const response = await hrApi.post("/api/Recruitment", formData);
  return response.data;
};

export const updateRecruitment = async (id, data) => {
  const response = await hrApi.put(`/api/Recruitment/${id}`, {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    appliedPosition: data.appliedPosition,
    departmentId: Number(data.departmentId) || 0,
    applicationDate: data.applicationDate || new Date().toISOString(),
    source: data.source,
    expectedSalary: Number(data.expectedSalary) || 0,
    resume: data.resume || "",
  });
  return response.data;
};

export const deleteRecruitment = async (id) => {
  const response = await hrApi.delete(`/api/Recruitment/${id}`);
  return response.data;
};

export const getResume = async (id) => {
  const response = await hrApi.get(`/api/Recruitment/${id}/resume`, { responseType: "blob" });
  return response;
};

export const scheduleInterview = async (id, data) => {
  const response = await hrApi.put(`/api/Recruitment/${id}/schedule-interview`, {
    interviewDate: data.interviewDate,
    interviewerName: data.interviewerName,
    interviewType: data.interviewType,
    notes: data.notes,
  });
  return response.data;
};

export const convertToOnboarding = async (id) => {
  const response = await hrApi.post(`/api/Recruitment/${id}/convert-to-onboarding`);
  return response.data;
};
