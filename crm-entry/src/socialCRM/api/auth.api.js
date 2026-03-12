import api, { BASE_URL } from "./apiClient";

// Revoke FB permissions first so the next OAuth shows fresh page/consent selection
const revokeFacebook = async () => {
  try {
    await api.post("/auth/facebook/revoke-permissions");
  } catch {
    // Ignore — proceed to OAuth anyway
  }
};

// Generic connect function (recommended)
const connect = (platform) => {
  const token = localStorage.getItem("accessToken");
  const returnUrl = window.location.pathname;

  window.location.href =
    `${BASE_URL}/auth/${platform}/connect?access_token=${token}&returnUrl=${encodeURIComponent(returnUrl)}`;
};

// Connect with forced permission reset for Facebook
const connectFacebookWithRevoke = async () => {
  await revokeFacebook();
  connect("facebook");
};

// Facebook
export const connectFacebook = () => {
  connectFacebookWithRevoke();
};

// LinkedIn
export const connectLinkedIn = () => {
  connect("linkedin");
};

// Instagram (uses Facebook OAuth — also revoke first)
export const connectInstagram = () => {
  connectFacebookWithRevoke();
};

// Optional generic export
export const connectPlatform = (platform) => {
  if (platform === "facebook" || platform === "instagram") {
    connectFacebookWithRevoke();
  } else {
    connect(platform);
  }
};

/**
 * Connect a channel to a specific brand.
 * 1. Activates the brand so OAuth callback assigns pages to it.
 * 2. Redirects to the existing platform OAuth connect flow.
 */
export const connectBrandChannel = async (brandSlug, platform) => {
  const token = localStorage.getItem("accessToken");
  const returnUrl = "/crm/socialmedia/brands";

  // Activate the brand first via existing endpoint
  await api.post(`/brands/${brandSlug}/activate`);
  localStorage.setItem("brandSlug", brandSlug);

  if (platform === "facebook" || platform === "instagram") {
    try { await api.post("/auth/facebook/revoke-permissions"); } catch { /* ignore */ }
    window.location.href =
      `${BASE_URL}/auth/facebook/connect?access_token=${encodeURIComponent(token)}&returnUrl=${encodeURIComponent(returnUrl)}`;
  } else {
    window.location.href =
      `${BASE_URL}/auth/${platform}/connect?access_token=${encodeURIComponent(token)}&returnUrl=${encodeURIComponent(returnUrl)}`;
  }
};
