import hrApi from "./hr.api";

/**
 * Employee Onboarding API Handlers
 */
export const onboardingApi = {
  // POST: Create a new onboarding record with files
  createOnboarding: (formData) => {
    return hrApi.post("api/EmployeeOnboarding", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // GET: Fetch all onboarding records
  getOnboardingList: () => {
    return hrApi.get("api/EmployeeOnboarding");
  },

  // GET: Fetch a specific record by ID
  getOnboardingById: (id) => {
    return hrApi.get(`api/EmployeeOnboarding/${id}`);
  },

  // DELETE: Remove a record by ID
  deleteOnboarding: (id) => {
    return hrApi.delete(`api/EmployeeOnboarding/${id}`);
  },
};

export default onboardingApi;