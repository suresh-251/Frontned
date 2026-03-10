import hrApi from "./hr.api";

/**
 * Employee Onboarding API Handlers
 * Handles multipart/form-data for document uploads and JSON for records.
 */
export const onboardingApi = {
  // POST: Create a new onboarding record with files
  // Note: 'data' should be a FormData object
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
};

export default onboardingApi;