import hrApi from "./hr.api";

/**
 * ✅ Get All Branches
 */
export const getBranches = async () => {
  const response = await hrApi.get("/api/Branch");
  return response.data; // Returns the array of branch objects
};

/**
 * ✅ Create Branch
 */
export const createBranch = async (branchData) => {
  const response = await hrApi.post("/api/Branch", branchData);
  return response.data;
};

/**
 * ✅ Update Branch
 * Your Swagger shows it needs the ID in the URL
 */
export const updateBranch = async (id, branchData) => {
  const response = await hrApi.put(`/api/Branch/${id}`, branchData);
  return response.data;
};

/**
 * ✅ Deactivate Branch (Delete)
 * Per your Swagger, the DELETE method returns "Branch deactivated successfully"
 */
export const deleteBranch = async (id) => {
  const response = await hrApi.delete(`/api/Branch/${id}`);
  return response.data;
};