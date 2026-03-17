import api from "./apiClient";

export const getPlans           = ()        => api.get("/subscriptions/plans").then(r => r.data);
export const getCurrentPlan     = ()        => api.get("/subscriptions/current").then(r => r.data);
export const upgradePlan        = (planId)  => api.post("/subscriptions/upgrade", { planId }).then(r => r.data);
