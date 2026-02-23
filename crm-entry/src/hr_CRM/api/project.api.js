import hrApi from "./hr.api";

/**
 * ===============================
 * 📌 PROJECT API - HR CRM
 * ===============================
 */

/**
 * ✅ Get All Projects
 * GET: /api/Project
 */
export const getProjects = async () => {
  try {
    const response = await hrApi.get("/api/Project");
    return response.data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

/**
 * ✅ Create Project
 * POST: /api/Project
 *
 * Body:
 * {
 *   projectName: string,
 *   duration: string,
 *   status: string,
 *   managerId: number,
 *   departmentId: number
 * }
 */

/* ================= GET DEPARTMENTS ================= */
export const getDepartments = async () => {
  try {
    const response = await hrApi.get("/api/Department");
    return response.data;
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
};



export const createProject = async (projectData) => {
  try {
    const response = await hrApi.post("/api/Project", projectData);
    return response.data;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

/**
 * ✅ Update Project
 * PUT: /api/Project/{id}
 */
export const updateProject = async (id, projectData) => {
  try {
    const response = await hrApi.put(
      `/api/Project/${id}`,
      projectData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

/**
 * ✅ Delete Project
 * DELETE: /api/Project/{id}
 */
export const deleteProject = async (id) => {
  try {
    const response = await hrApi.delete(`/api/Project/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};