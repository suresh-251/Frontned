import hrApi from "./hr.api";

/**
 * Fetch all Overtime Policies
 * GET /api/OvertimePolicy
 */
export const getOvertimePolicies = async () => {
  try {
    const response = await hrApi.get("/api/OvertimePolicy");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch Overtime Policies:", error);
    throw error;
  }
};

/**
 * Create a new Overtime Policy
 * POST /api/OvertimePolicy
 * @param {Object} data - { departmentId, standardDailyHours, maxWeeklyOvertimeHours }
 */
export const createOvertimePolicy = async (data) => {
  try {
    const response = await hrApi.post("/api/OvertimePolicy", data);
    return response.data;
  } catch (error) {
    console.error("Failed to create Overtime Policy:", error);
    throw error;
  }
};

/**
 * Update an existing Overtime Policy
 * PUT /api/OvertimePolicy/{id}
 * @param {number} id - The Policy ID (integer)
 * @param {Object} data - { standardDailyHours, maxWeeklyOvertimeHours }
 */
export const updateOvertimePolicy = async (id, data) => {
  try {
    const response = await hrApi.put(`/api/OvertimePolicy/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Failed to update Overtime Policy:", error);
    throw error;
  }
};

/**
 * Delete an Overtime Policy
 * DELETE /api/OvertimePolicy/{id}
 * @param {number} id - The Policy ID
 */
export const deleteOvertimePolicy = async (id) => {
  try {
    const response = await hrApi.delete(`/api/OvertimePolicy/${id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete Overtime Policy:", error);
    throw error;
  }
};