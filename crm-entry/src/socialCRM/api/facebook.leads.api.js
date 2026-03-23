import api from "./apiClient";
import { BASE_URL } from "./apiClient";
import * as signalR from "@microsoft/signalr";

const LEADS_HUB_URL = BASE_URL.replace("/api", "") + "/hubs/leads";

export function createLeadsHubConnection() {
  const token = localStorage.getItem("accessToken");
  return new signalR.HubConnectionBuilder()
    .withUrl(LEADS_HUB_URL, token ? { accessTokenFactory: () => token } : {})
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

// ─── Lead Filter Options (pages + forms from DB, fast) ────────────────────────

export const getLeadFilterOptions = async () => {
  const res = await api.get("/facebook/leads/filters");
  return res.data || { pages: [], forms: [] };
};

// ─── Lead Forms ──────────────────────────────────────────────────────────────

export const getLeadForms = async () => {
  const res = await api.get("/facebook/leads/forms");
  return res.data || [];
};

export const syncLeadsByForm = async (formId, platform) => {
  const params = platform ? { platform } : {};
  const res = await api.post(`/facebook/leads/forms/${formId}/sync`, null, { params });
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
  // Auto-paginate — keep fetching until we have all leads
  const PAGE_SIZE = 200;
  let page = 1;
  let allItems = [];

  while (true) {
    const res = await api.get("/facebook/leads", {
      params: {
        pageId: pageId || undefined,
        formId: formId || undefined,
        status: status || undefined,
        assignedToUserId: assignedToUserId || undefined,
        departmentId: departmentId || undefined,
        page,
        pageSize: PAGE_SIZE,
      },
    });

    const data = res.data;
    let items = [];
    let total = 0;

    if (Array.isArray(data)) {
      items = data;
      total = data.length;
    } else if (data?.items && Array.isArray(data.items)) {
      items = data.items;
      total = data.total ?? items.length;
    }

    allItems = allItems.concat(items);

    // Stop when we have everything or the page came back short
    if (allItems.length >= total || items.length < PAGE_SIZE) break;
    page++;
  }

  return allItems;
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
  const res = await api.post(`/facebook/leads/forms/${formId}/assign-departments`, {
    departments,
    startDate: startDate || null,
    endDate: endDate || null,
  });
  return res.data; // { message, added }
};

/** Preview: count how many leads in a form match the date range (MetaCreatedAt only). */
export const countFormLeads = async (formId, startDate = null, endDate = null) => {
  const res = await api.get(`/facebook/leads/forms/${formId}/count`, {
    params: {
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    },
  });
  return res.data?.count ?? 0;
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
 * @param {Array<{userId: number, userName: string}>} users
 */
export const assignLeadUsers = async (leadId, users) => {
  await api.post(`/facebook/leads/${leadId}/users`, { users });
};

/** Removes a user assignment from a specific lead */
export const removeLeadUser = async (leadId, userId) => {
  await api.delete(`/facebook/leads/${leadId}/users/${userId}`);
};

// ─── Department / Assigned-User Leads (no brand required) ────────────────────

/**
 * Fetches leads assigned to the current authenticated user (via JWT) and/or
 * a specific department. Does NOT require an active brand — safe for HR/Sales.
 * @param {object} opts
 * @param {number|string} [opts.departmentId] - Optional department filter
 * @param {string}        [opts.status]       - Optional CRM status filter
 */
export const getAssignedLeads = async ({ departmentId, status } = {}) => {
  const res = await api.get("/leads/assigned", {
    params: {
      departmentId: departmentId || undefined,
      status:       status       || undefined,
    },
  });
  return res.data || [];
};

/**
 * Update CRM status for an assigned lead (no brand required).
 * @param {number} leadId
 * @param {string} status
 */
export const updateAssignedLeadStatus = async (leadId, status) => {
  await api.put(
    `/leads/${leadId}/status`,
    JSON.stringify(status),
    { headers: { "Content-Type": "application/json" } }
  );
};

/**
 * Save an internal remark on an assigned lead (no brand required).
 * @param {number} leadId
 * @param {string} remark
 */
export const saveAssignedLeadRemark = async (leadId, remark) => {
  await api.put(
    `/leads/${leadId}/remark`,
    JSON.stringify(remark),
    { headers: { "Content-Type": "application/json" } }
  );
};

/**
 * Assign a lead to a user — brand-free (HR/Sales managers).
 * Uses PUT /api/leads/{id}/assign in DepartmentLeadsController.
 * @param {number} leadId
 * @param {{ userId: number|null, userName: string|null, remark?: string }} payload
 */
export const assignDeptLead = async (leadId, { userId, userName, remark = "" }) => {
  await api.put(`/leads/${leadId}/assign`, { userId, userName, remark });
};

/**
 * Get full remark/assignment history for a lead (brand-free).
 * @param {number} leadId
 */
export const getLeadHistory = async (leadId) => {
  const res = await api.get(`/leads/${leadId}/history`);
  return res.data || [];
};

/** Edit the remark text of a specific history entry */
export const editLeadRemark = async (leadId, historyId, remark) => {
  await api.put(
    `/leads/${leadId}/remarks/${historyId}`,
    JSON.stringify(remark),
    { headers: { "Content-Type": "application/json" } }
  );
};

/** Delete a specific remark/history entry */
export const deleteLeadRemark = async (leadId, historyId) => {
  await api.delete(`/leads/${leadId}/remarks/${historyId}`);
};

// ─── Brand-free Multi-User Assignment ────────────────────────────────────────

/** Returns all users assigned to a specific lead (brand-free) */
export const getLeadUsersBrandFree = async (leadId) => {
  const res = await api.get(`/leads/${leadId}/users`);
  return res.data || [];
};

/**
 * Assigns one or more users to a lead (brand-free).
 * @param {string|number} leadId
 * @param {Array<{userId: number, userName: string}>} users
 */
export const assignLeadUsersBrandFree = async (leadId, users) => {
  await api.post(`/leads/${leadId}/users`, { users });
};

/** Removes a user assignment from a specific lead (brand-free) */
export const removeLeadUserBrandFree = async (leadId, userId) => {
  await api.delete(`/leads/${leadId}/users/${userId}`);
};
