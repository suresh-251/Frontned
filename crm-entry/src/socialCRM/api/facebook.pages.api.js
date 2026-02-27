  // import api from "../api/apiClient";

  // /* =========================
  //   GET ALL CONNECTED PAGES
  //   ========================= */
  // export const getAvailablePages = async () => {
  //   const res = await api.get("/facebook/pages");
  //   return res.data;
  // };

  // /* =========================
  //   GET ACTIVE PAGE
  //   ========================= */
  // export const getActivePage = async () => {
  //   const res = await api.get("/facebook/pages/active");
  //   return res.data;
  // };

  // /* =========================
  //   SELECT ACTIVE PAGE
  //   ========================= */
  // export const selectPage = async (pageId) => {
  //   await api.post("/facebook/pages/select", { pageId });
  // };


  // export const subscribePage = async (pageId) => {
  //     // console.log("Calling subscribe API for:", pageId);

  //   await api.post(`/facebook/pages/${pageId}/subscribe`);
  // };

  // export const unsubscribePage = async (pageId) => {
  //         // console.log("Calling unsubscribe API for:", pageId);
  //   await api.post(`/facebook/pages/${pageId}/unsubscribe`);
  // };





  import api from "../api/apiClient";

/* =========================
   GET ALL CONNECTED PAGES
   (/facebook/pages)
   ========================= */
export const getConnectedPages = async () => {
  const res = await api.get("/facebook/pages");
  return res.data || [];
};


/* =========================
   GET AVAILABLE PAGES
   (/facebook/pages/available)
   ========================= */
export const getAvailablePages = async () => {
  const res = await api.get("/facebook/pages/available");
  return res.data || [];
};


/* =========================
   GET ACTIVE PAGE
   ========================= */
export const getActivePage = async () => {
  const res = await api.get("/facebook/pages/active");
  return res.data || null;
};


/* =========================
   SELECT ACTIVE PAGE
   ========================= */
export const selectPage = async (pageId) => {
  await api.post("/facebook/pages/select", {
    pageId: String(pageId), // must be string
  });
};


/* =========================
   SUBSCRIBE PAGE
   ========================= */
export const subscribePage = async (pageId) => {
  await api.post(`/facebook/pages/${pageId}/subscribe`);
};


/* =========================
   UNSUBSCRIBE PAGE
   ========================= */
export const unsubscribePage = async (pageId) => {
  await api.post(`/facebook/pages/${pageId}/unsubscribe`);
};