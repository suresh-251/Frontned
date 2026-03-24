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

// Instagram via Facebook — uses Facebook OAuth to get Instagram Business accounts linked to FB Pages
// This is the recommended method for Instagram Business/Creator accounts
export const connectInstagramViaFacebook = async () => {
  await revokeFacebook();
  connect("instagram");
};

// Instagram Direct — uses direct Instagram Basic Display API (for personal accounts)
// Note: This has limited API access compared to Instagram via Facebook
export const connectInstagramDirect = () => {
  connect("instagram-direct");
};

// Instagram — default method (via Facebook for Business accounts)
export const connectInstagram = () => {
  connectInstagramViaFacebook();
};

// Optional generic export
export const connectPlatform = (platform) => {
  if (platform === "facebook") {
    connectFacebookWithRevoke();
  } else if (platform === "instagram") {
    connectInstagramViaFacebook();
  } else if (platform === "instagram-direct") {
    connectInstagramDirect();
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
  } else if (platform === "instagram") {
    // Instagram via Facebook — revoke first for fresh account selection
    try { await api.post("/auth/facebook/revoke-permissions"); } catch { /* ignore */ }
    window.location.href =
      `${BASE_URL}/auth/instagram/connect?access_token=${encodeURIComponent(token)}&returnUrl=${encodeURIComponent(returnUrl)}`;
  } else {
    // LinkedIn and other platforms use direct OAuth
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
