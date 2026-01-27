import api from "./apiClient";

/* ============================
   GET LEAD FORMS (ACTIVE PAGE)
   ============================ */
export const getLeadForms = async () => {
  const res = await api.get("/facebook/leads/forms");

  // ✅ backend already returns array
  return res.data || [];
};


/* ============================
   SYNC LEADS FROM FORM
   ============================ */
export const syncLeadsByForm = async (formId) => {
  const res = await api.post(
    `/facebook/leads/forms/${formId}/sync`
  );
  return res.data;
};

/* ============================
   GET LEADS (CRM)
   ============================ */
export const getLeads = async ({
  pageId,
  formId,
  status,
  assignedToUserId
} = {}) => {
  const res = await api.get("/facebook/leads", {
    params: {
      pageId,
      formId,
      status,
      assignedToUserId
    }
  });

  return res.data || [];
};

/* ============================
   UPDATE LEAD STATUS
   ============================ */
export const updateLeadStatus = async (leadId, status) => {
  await api.put(
    `/facebook/leads/${leadId}/status`,
    JSON.stringify(status),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};
