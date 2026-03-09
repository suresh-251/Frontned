import api from "./apiClient";

/** Get all brands for the current user */
export const getBrands = async () => {
  const res = await api.get("/brands");
  return res.data;
};

/** Get a single brand by slug */
export const getBrandBySlug = async (slug) => {
  const res = await api.get(`/brands/${slug}`);
  return res.data;
};

/** Upload a logo image file, returns { url, blobName } */
export const uploadBrandLogo = async (file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/brands/logo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/** Create a new brand (not active by default) */
export const createBrand = async ({ name, logoUrl, description }) => {
  const res = await api.post("/brands", { name, logoUrl, description });
  return res.data;
};

/** Update a brand's details */
export const updateBrand = async (slug, { name, logoUrl, description }) => {
  const res = await api.put(`/brands/${slug}`, { name, logoUrl, description });
  return res.data;
};

/** Delete a brand */
export const deleteBrand = async (slug) => {
  await api.delete(`/brands/${slug}`);
};

/**
 * Activate a brand — backend deactivates all others for this user.
 * Also persists brandSlug to localStorage.
 */
export const activateBrand = async (slug) => {
  const res = await api.post(`/brands/${slug}/activate`);
  localStorage.setItem("brandSlug", slug);
  return res.data;
};

/** Clear the active brand */
export const clearActiveBrand = async () => {
  await api.delete("/brands/activate");
  localStorage.removeItem("brandSlug");
};

/** Get all social accounts connected under a brand */
export const getBrandAccounts = async (slug) => {
  const res = await api.get(`/brands/${slug}/accounts`);
  return res.data;
};
