import api from "./apiClient";

/** GET /api/dashboard/quick-actions — all modules with user's selection state */
export const getQuickActions = async () => {
  const res = await api.get("/dashboard/quick-actions");
  return res.data;
};

/** GET /api/dashboard/quick-actions/selected — only user's chosen quick actions */
export const getSelectedQuickActions = async () => {
  const res = await api.get("/dashboard/quick-actions/selected");
  return res.data;
};

/** PUT /api/dashboard/quick-actions — save user's module selection (ordered) */
export const saveQuickActions = async (moduleKeys) => {
  const res = await api.put("/dashboard/quick-actions", { moduleKeys });
  return res.data;
};
