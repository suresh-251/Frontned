import hrApi from "./hr.api";

/**
 * ✅ Get All Branches
 * GET: /api/Branch
 */
export const getBranches = async () => {
  const response = await hrApi.get("/api/Branch");
  return response.data;
};

/**
 * ✅ Create Branch
 * POST: /api/Branch
 * Body:
 * {
 *   branchName: string,
 *   location: string,
 *   status: string
 * }
 */
export const createBranch = async (branchData) => {
  const response = await hrApi.post("/api/Branch", branchData);
  return response.data;
};

/**
 * ✅ Update Branch
 * PUT: /api/Branch/{id}
 * Body:
 * {
 *   branchName: string,
 *   location: string,
 *   status: string
 * }
 */
export const updateBranch = async (id, branchData) => {
  const response = await hrApi.put(`/api/Branch/${id}`, branchData);
  return response.data;
};

/**
 * ✅ Delete Branch
 * DELETE: /api/Branch/{id}
 */
export const deleteBranch = async (id) => {
  const response = await hrApi.delete(`/api/Branch/${id}`);
  return response.data;
};


