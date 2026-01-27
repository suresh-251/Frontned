import api from "../api/apiClient";

/* =========================
   GET ALL CONNECTED PAGES
   ========================= */
export const getAvailablePages = async () => {
  const res = await api.get("/facebook/pages");
  return res.data;
};

/* =========================
   GET ACTIVE PAGE
   ========================= */
export const getActivePage = async () => {
  const res = await api.get("/facebook/pages/active");
  return res.data;
};

/* =========================
   SELECT ACTIVE PAGE
   ========================= */
export const selectPage = async (pageId) => {
  await api.post("/facebook/pages/select", { pageId });
};


export const subscribePage = async (pageId) => {
  await api.post(`/facebook/pages/${pageId}/subscribe`);
};

export const unsubscribePage = async (pageId) => {
  await api.post(`/facebook/pages/${pageId}/unsubscribe`);
};

