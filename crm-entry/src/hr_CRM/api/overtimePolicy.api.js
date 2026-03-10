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
    const payload = {
      departmentId: parseInt(data.departmentId, 10),
      standardDailyHours: parseInt(data.standardDailyHours, 10),
      maxWeeklyOvertimeHours: parseInt(data.maxWeeklyOvertimeHours, 10)
    };
    
    // 1. Log what we are actually sending
    console.log("🚀 Payload being sent to backend:", JSON.stringify(payload)); 

    const response = await hrApi.post("/api/OvertimePolicy", payload);
    return response.data;
  } catch (error) {
    // 2. Log the EXACT error message the backend is returning
    console.error("❌ Backend rejected the request. Details:", error.response?.data || error.message);
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