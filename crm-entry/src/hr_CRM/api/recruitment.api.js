// import hrApi from "./hr.api";

// /**
//  * ===============================
//  * 📌 RECRUITMENT API - HR CRM
//  * ===============================
//  */

// /**
//  * ✅ Get All Recruitment Applications
//  * GET: /api/Recruitment
//  */
// export const getRecruitments = async () => {
//   try {
//     const response = await hrApi.get("/api/Recruitment");
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching recruitments:", error);
//     throw error;
//   }
// };

// /**
//  * ✅ Create Recruitment Application
//  * POST: /api/Recruitment
//  *
//  * Body:
//  * {
//  *   firstName: string,
//  *   lastName: string,
//  *   email: string,
//  *   phone: string,
//  *   appliedPosition: string,
//  *   departmentId: number,
//  *   applicationDate: string (ISO format),
//  *   status: string,
//  *   source: string
//  * }
//  */
// export const createRecruitment = async (recruitmentData) => {
//   try {
//     const response = await hrApi.post(
//       "/api/Recruitment",
//       recruitmentData
//     );
//     return response.data;
//   } catch (error) {
//     console.error("Error creating recruitment:", error);
//     throw error;
//   }
// };



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

/**
 * ✅ Update Recruitment Application
 * PUT: /api/Recruitment/{id}
 *
 * Params:
 *   id: number
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
export const updateRecruitment = async (id, recruitmentData) => {
  try {
    const response = await hrApi.put(
      `/api/Recruitment/${id}`,
      recruitmentData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating recruitment:", error);
    throw error;
  }
};

/**
 * ✅ Delete Recruitment Application
 * DELETE: /api/Recruitment/{id}
 *
 * Params:
 *   id: number
 */
export const deleteRecruitment = async (id) => {
  try {
    const response = await hrApi.delete(
      `/api/Recruitment/${id}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting recruitment:", error);
    throw error;
  }
};