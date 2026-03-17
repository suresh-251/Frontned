import hrApi from "./hr.api";

/**
 * Onboarding Invite API
 *
 * Swagger:
 * - POST   /api/OnboardingInvite/generate
 * - GET    /api/OnboardingInvite/validate/{token}
 * - GET    /api/OnboardingInvite/all
 */
export const onboardingInviteApi = {
  generate: async ({ employeeEmail, employeeName }) => {
    const res = await hrApi.post("/api/OnboardingInvite/generate", {
      employeeEmail,
      employeeName,
    });
    return res.data;
  },

  validate: async (token) => {
    const res = await hrApi.get(`/api/OnboardingInvite/validate/${encodeURIComponent(token)}`);
    return res.data;
  },

  getAll: async () => {
    const res = await hrApi.get("/api/OnboardingInvite/all");
    return res.data;
  },
};

export default onboardingInviteApi;

