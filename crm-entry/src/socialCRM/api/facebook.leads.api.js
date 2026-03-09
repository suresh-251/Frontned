import api from "./apiClient";

// ─── Lead Forms ──────────────────────────────────────────────────────────────

export const getLeadForms = async (pageId) => {
  const res = await api.get("/facebook/leads/forms", { params: { pageId } });
  return res.data || [];
};

export const syncLeadsByForm = async (formId) => {
  const res = await api.post(`/facebook/leads/forms/${formId}/sync`);
  return res.data;
};

// ─── Leads ───────────────────────────────────────────────────────────────────

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

// ─── Form → Department Batch Assignment ──────────────────────────────────────

/** Assign all leads of a form to a single department (legacy / backward-compat) */
export const assignLeadsByFormToDepartment = async (formId, departmentId, departmentName) => {
  await api.post(`/facebook/leads/forms/${formId}/assign-department`, {
    departmentId: String(departmentId),
    departmentName: String(departmentName),
  });
};

/**
 * Assign all leads of a form to one or more departments with an optional time range.
 * @param {string} formId
 * @param {Array<{departmentId: string, departmentName: string}>} departments
 * @param {string|null} startDate  ISO date string, e.g. "2024-01-01"
 * @param {string|null} endDate    ISO date string, e.g. "2024-12-31"
 */
export const assignLeadsByFormToDepartments = async (formId, departments, startDate = null, endDate = null) => {
  await api.post(`/facebook/leads/forms/${formId}/assign-departments`, {
    departments,
    startDate: startDate || null,
    endDate: endDate || null,
  });
};

/** Remove a department assignment from every lead in a form */
export const removeDepartmentFromForm = async (formId, departmentId) => {
  await api.delete(`/facebook/leads/forms/${formId}/departments/${departmentId}`);
};

// ─── Per-Lead Department Assignment ──────────────────────────────────────────

/** Returns all departments assigned to a specific lead */
export const getLeadDepartments = async (leadId) => {
  const res = await api.get(`/facebook/leads/${leadId}/departments`);
  return res.data || [];
};

/**
 * Assigns one or more departments to a single lead.
 * @param {string|number} leadId
 * @param {Array<{departmentId: string, departmentName: string}>} departments
 */
export const assignLeadDepartments = async (leadId, departments) => {
  await api.post(`/facebook/leads/${leadId}/departments`, { departments });
};

/** Removes a department assignment from a specific lead */
export const removeLeadDepartment = async (leadId, departmentId) => {
  await api.delete(`/facebook/leads/${leadId}/departments/${departmentId}`);
};

// ─── Per-Lead User Assignment ─────────────────────────────────────────────────

/** Returns all users assigned to a specific lead */
export const getLeadUsers = async (leadId) => {
  const res = await api.get(`/facebook/leads/${leadId}/users`);
  return res.data || [];
};

/**
 * Assigns one or more users to a lead.
 * @param {string|number} leadId
 * @param {number[]} userIds
 */
export const assignLeadUsers = async (leadId, userIds) => {
  await api.post(`/facebook/leads/${leadId}/users`, { userIds });
};

/** Removes a user assignment from a specific lead */
export const removeLeadUser = async (leadId, userId) => {
  await api.delete(`/facebook/leads/${leadId}/users/${userId}`);
};
