import hrApi from "./hr.api";

/**
 * Get all overtime policies
 */
export const getOvertimePolicies = async () => {
  try {
    const response = await hrApi.get("/api/OvertimePolicy");
    return response.data;
  } catch (error) {
    console.error("Error fetching overtime policies:", error);
    throw error;
  }
};

/**
 * Create a new overtime policy
 */
export const createOvertimePolicy = async (data) => {
  try {
    const response = await hrApi.post("/api/OvertimePolicy", {
      departmentId: parseInt(data.departmentId),
      standardDailyHours: parseInt(data.standardDailyHours),
      maxWeeklyOvertimeHours: parseInt(data.maxWeeklyOvertimeHours)
    });
    return response.data;
  } catch (error) {
    console.error("Error creating overtime policy:", error);
    throw error;
  }
};

/**
 * Update an existing policy
 * Swagger: PUT /api/OvertimePolicy/{id}
 */
export const updateOvertimePolicy = async (id, data) => {
  try {
    const response = await hrApi.put(`/api/OvertimePolicy/${id}`, {
      standardDailyHours: parseInt(data.standardDailyHours),
      maxWeeklyOvertimeHours: parseInt(data.maxWeeklyOvertimeHours)
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating policy ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a policy
 */
export const deleteOvertimePolicy = async (id) => {
  try {
    const response = await hrApi.delete(`/api/OvertimePolicy/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting policy ${id}:`, error);
    throw error;
  }
};