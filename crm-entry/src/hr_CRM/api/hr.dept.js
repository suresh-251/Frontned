import hrApi from "./hr.api";

/**
 * ✅ Get All Departments
 * GET: /api/Department
 */
export const getDepartments = async () => {
  const response = await hrApi.get("/api/Department");
  return response.data;
};

/**
 * ✅ Create Department
 * POST: /api/Department
 * Body:
 * {
 *   departmentName: string,
 *   branchId: number
 * }
 */
export const createDepartment = async (departmentData) => {
  const response = await hrApi.post("/api/Department", departmentData);
  return response.data;
};

/**
 * ✅ Update Department
 * PUT: /api/Department/{id}
 * Body:
 * {
 *   departmentName: string,
 *   branchId: number
 * }
 */
export const updateDepartment = async (id, departmentData) => {
  const response = await hrApi.put(
    `/api/Department/${id}`,
    departmentData
  );
  return response.data;
};

/**
 * ✅ Delete Department
 * DELETE: /api/Department/{id}
 */
export const deleteDepartment = async (id) => {
  const response = await hrApi.delete(`/api/Department/${id}`);
  return response.data;
};