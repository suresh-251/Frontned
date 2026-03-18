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

/**
 * Upload a logo image for a brand. Stores as bytes in DB.
 * Returns the updated brand response.
 */
export const uploadBrandLogo = async (slug, file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post(`/brands/${slug}/logo`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/**
 * Returns a data-URI src string for a brand logo, or null if no logo.
 * Usage: <img src={getBrandLogoSrc(brand)} />
 */
export const getBrandLogoSrc = (brand) => {
  if (brand?.logoBase64 && brand?.logoContentType) {
    return `data:${brand.logoContentType};base64,${brand.logoBase64}`;
  }
  return null;
};

/** Create a new brand (not active by default) */
export const createBrand = async ({ name, description }) => {
  const res = await api.post("/brands", { name, description });
  return res.data;
};

/** Update a brand's details */
export const updateBrand = async (slug, { name, description }) => {
  const res = await api.put(`/brands/${slug}`, { name, description });
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

// ── Google Sheets config ──────────────────────────────────────────────

/** Get Google Sheets configuration for a brand */
export const getGoogleSheetConfig = async (slug) => {
  const res = await api.get(`/brands/${slug}/google-sheets`);
  return res.data;
};

/** Update Google Sheets configuration for a brand */
export const updateGoogleSheetConfig = async (slug, { spreadsheetId, sheetName, enabled }) => {
  const res = await api.put(`/brands/${slug}/google-sheets`, {
    spreadsheetId,
    sheetName,
    enabled,
  });
  return res.data;
};
