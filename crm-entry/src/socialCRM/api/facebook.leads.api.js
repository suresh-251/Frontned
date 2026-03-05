import api from "./apiClient";

export const getLeadForms = async (pageId) => {
  const res = await api.get("/facebook/leads/forms", { params: { pageId } });
  return res.data || [];
};

export const syncLeadsByForm = async (formId) => {
  const res = await api.post(`/facebook/leads/forms/${formId}/sync`);
  return res.data;
};

export const getLeads = async ({
  pageId,
  formId,
  status,
  assignedToUserId,
  departmentId,
} = {}) => {
  const res = await api.get("/facebook/leads", {
    params: {
      pageId: pageId || undefined,
      formId: formId || undefined,
      status: status || undefined,
      assignedToUserId: assignedToUserId || undefined,
      departmentId: departmentId || undefined,
    },
  });
  return res.data || [];
};

export const updateLeadStatus = async (leadId, status) => {
  await api.put(
    `/facebook/leads/${leadId}/status`,
    JSON.stringify(status),
    { headers: { "Content-Type": "application/json" } }
  );
};

export const assignLead = async (leadId, { userId, userName, remark }) => {
  await api.put(`/facebook/leads/${leadId}/assign`, { userId, userName, remark });
};

export const assignLeadsByFormToDepartment = async (formId, departmentId, departmentName) => {
  await api.post(`/facebook/leads/forms/${formId}/assign-department`, {
    departmentId: String(departmentId),
    departmentName: String(departmentName),
  });
};
