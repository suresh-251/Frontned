import hrApi from "./hr.api"; // Update this path to where your hrApi file is located

/**
 * Get all overtime approval records
 */
export const getAllOvertimeApprovals = async () => {
  try {
    // We use /api/ since your baseURL is just the IP:Port
    const response = await hrApi.get("api/OvertimeApproval");
    return response.data;
  } catch (error) {
    console.error("Error fetching overtime approvals:", error);
    throw error;
  }
};

/**
 * Submit a new overtime request
 */
export const createOvertimeApproval = async (data) => {
  try {
    const response = await hrApi.post("api/OvertimeApproval", {
      userId: parseInt(data.userId),
      validFrom: data.validFrom,
      validTo: data.validTo
    });
    return response.data;
  } catch (error) {
    console.error("Error creating overtime approval:", error);
    throw error;
  }
};

/**
 * Update/Approve an overtime request
 */
export const updateOvertimeApproval = async (id, data) => {
  try {
    const response = await hrApi.put(`api/OvertimeApproval/${id}`, {
      validFrom: data.validFrom,
      validTo: data.validTo,
      isApproved: data.isApproved
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating overtime approval ${id}:`, error);
    throw error;
  }
};