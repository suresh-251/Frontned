// import api from "./api"; // Ensure this is your axios instance

export const getSelfProfile = async () => {
  try {
    const response = await api.get("/api/self/profile");
    return response.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Explicitly assigning to ensure the export is recognized
// in case of strict tree-shaking issues
// export { getSelfProfile };