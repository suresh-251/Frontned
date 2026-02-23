import hrApi from "./hr.api";

/**
 * ===============================
 * 📌 RECRUITMENT API - HR CRM
 * ===============================
 */

/**
 * ✅ Get All Recruitment Applications
 * GET: /api/Recruitment
 */
export const getRecruitments = async () => {
  try {
    const response = await hrApi.get("/api/Recruitment");
    return response.data;
  } catch (error) {
    console.error("Error fetching recruitments:", error);
    throw error;
  }
};

/**
 * ✅ Create Recruitment Application
 * POST: /api/Recruitment
 *
 * Body:
 * {
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   phone: string,
 *   appliedPosition: string,
 *   departmentId: number,
 *   applicationDate: string (ISO format),
 *   status: string,
 *   source: string
 * }
 */
export const createRecruitment = async (recruitmentData) => {
  try {
    const response = await hrApi.post(
      "/api/Recruitment",
      recruitmentData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating recruitment:", error);
    throw error;
  }
};