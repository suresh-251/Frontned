import hrApi from "./hr.api";

/**
 * Fetch all overtime records for a specific user
 * GET /api/OvertimeRecord/user/{userId}
 */
export const getUserOvertimeRecords = async (userId) => {
  try {
    const response = await hrApi.get(`/api/OvertimeRecord/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch records for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Fetch weekly overtime summary for a specific user
 * GET /api/OvertimeRecord/weekly/{userId}
 */
export const getWeeklyOvertimeSummary = async (userId) => {
  try {
    const response = await hrApi.get(`/api/OvertimeRecord/weekly/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch weekly summary for user ${userId}:`, error);
    throw error;
  }
};