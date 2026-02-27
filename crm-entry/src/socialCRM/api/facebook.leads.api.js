// import api from "./apiClient";

// /* ============================
//    GET LEAD FORMS (ACTIVE PAGE)
//    ============================ */
// export const getLeadForms = async (pageId) => {
//   const res = await api.get("/facebook/leads/forms", {
//     params: { pageId }
//   });
//   return res.data || [];
// };



// /* ============================
//    SYNC LEADS FROM FORM
//    ============================ */
// export const syncLeadsByForm = async (formId) => {
//   const res = await api.post(
//     `/facebook/leads/forms/${formId}/sync`
//   );
//   return res.data;
// };

// /* ============================
//    GET LEADS (CRM)
//    ============================ */
// export const getLeads = async ({
//   pageId,
//   formId,
//   status,
//   assignedToUserId
// } = {}) => {
//   const res = await api.get("/facebook/leads", {
//     params: {
//       pageId,
//       formId,
//       status,
//       assignedToUserId
//     }
//   });

//   return res.data || [];
// };

// /* ============================
//    UPDATE LEAD STATUS
//    ============================ */
// export const updateLeadStatus = async (leadId, status) => {
//   await api.put(
//     `/facebook/leads/${leadId}/status`,
//     JSON.stringify(status),
//     {
//       headers: {
//         "Content-Type": "application/json"
//       }
//     }
//   );
// };
// /* ============================
//    🔥 ASSIGN LEAD (NEW)
//    ============================ */
// export const assignLead = async (leadId, payload) => {
//   await api.put(
//     `/facebook/leads/${leadId}/assign`,
//     payload
//   );
// };












import api from "./apiClient";

/* ============================
   GET LEAD FORMS
   ============================ */
export const getLeadForms = async (pageId) => {
  const res = await api.get("/facebook/leads/forms", {
    params: { pageId },
  });

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
  formId,
  status,
  assignedToUserId,
} = {}) => {

  const res = await api.get("/facebook/leads", {
    params: {
      formId: formId || undefined,
      status: status || undefined,
      assignedToUserId: assignedToUserId || undefined,
    },
  });

  return res.data || [];
};


/* ============================
   UPDATE LEAD STATUS
   ⚠️ FIXED BODY FORMAT
   ============================ */
export const updateLeadStatus = async (leadId, status) => {
  await api.put(
    `/facebook/leads/${leadId}/status`,
    {
      status: status, // ✅ MUST be object
    }
  );
};


/* ============================
   ASSIGN LEAD
   ============================ */
export const assignLead = async (
  leadId,
  { userId, userName, remark }
) => {

  await api.put(
    `/facebook/leads/${leadId}/assign`,
    {
      userId,
      userName,
      remark,
    }
  );
};