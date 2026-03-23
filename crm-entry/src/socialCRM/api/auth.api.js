import api, { BASE_URL } from "./apiClient";
import { getAccessToken } from "../../utils/authStorage";
import { secureStorage } from "../../utils/secureStorage";

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
  const token = getAccessToken();
  const returnUrl = window.location.pathname;

  window.location.href =
    `${BASE_URL}/auth/${platform}/connect?access_token=${token}&returnUrl=${encodeURIComponent(returnUrl)}`;
};

// Connect with forced permission reset for Facebook
const connectFacebookWithRevoke = async () => {
  await revokeFacebook();
  connect("facebook");
};

// Facebook — uses Facebook OAuth to get FB Pages
export const connectFacebook = () => {
  connectFacebookWithRevoke();
};

// LinkedIn
export const connectLinkedIn = () => {
  connect("linkedin");
};

// Instagram — uses separate Instagram OAuth (different app/account)
export const connectInstagram = () => {
  connect("instagram");
};

// Optional generic export
export const connectPlatform = (platform) => {
  if (platform === "facebook") {
    connectFacebookWithRevoke();
  } else {
    connect(platform);
  }
};

/**
 * Connect a channel to a specific brand.
 * 1. Activates the brand so OAuth callback assigns pages to it.
 * 2. Redirects to the platform-specific OAuth connect flow.
 */
export const connectBrandChannel = async (brandSlug, platform) => {
  const token = getAccessToken();
  const returnUrl = "/crm/socialmedia/brands";

  // Activate the brand first via existing endpoint
  await api.post(`/brands/${brandSlug}/activate`);
  secureStorage.set("brandSlug", brandSlug);

  if (platform === "facebook") {
    // Facebook uses revoke + reconnect for fresh page selection
    try { await api.post("/auth/facebook/revoke-permissions"); } catch { /* ignore */ }
    window.location.href =
      `${BASE_URL}/auth/facebook/connect?access_token=${encodeURIComponent(token)}&returnUrl=${encodeURIComponent(returnUrl)}`;
  } else {
    // Instagram and LinkedIn use direct OAuth
    window.location.href =
      `${BASE_URL}/auth/${platform}/connect?access_token=${encodeURIComponent(token)}&returnUrl=${encodeURIComponent(returnUrl)}`;
  }
};

/**
 * Get account health status for all connected platforms.
 * Returns connection status, token expiry, and days until expiry.
 */
export const getAccountHealth = async () => {
  const res = await api.get("/auth/health");
  return res.data;
};
