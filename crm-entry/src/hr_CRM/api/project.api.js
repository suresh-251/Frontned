import hrApi from "./hr.api";

/**
 * ✅ Get All Projects
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
 */
export const createProject = async (projectData) => {
  try {
    const response = await hrApi.post("/api/Project", {
      ...projectData,
      managerId: parseInt(projectData.managerId),
      departmentId: parseInt(projectData.departmentId)
    });
    return response.data;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

/**
 * ✅ Update Project
 */
export const updateProject = async (id, projectData) => {
  try {
    const response = await hrApi.put(`/api/Project/${id}`, {
      ...projectData,
      managerId: parseInt(projectData.managerId),
      departmentId: parseInt(projectData.departmentId)
    });
    return response.data;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

/**
 * ✅ Delete Project
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