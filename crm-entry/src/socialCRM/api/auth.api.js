import api, { BASE_URL } from "./apiClient";
import { getAccessToken } from "../../utils/authStorage";
import { secureStorage } from "../../utils/secureStorage";

// Revoke FB permissions - ONLY use this when user explicitly wants to remove all FB access
// WARNING: This will invalidate tokens for ALL users connected to this FB account!
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

// Facebook — uses Facebook OAuth to get FB Pages
// Note: Now uses auth_type=reauthenticate to avoid invalidating other users' tokens
export const connectFacebook = () => {
  connect("facebook");
};

// LinkedIn
export const connectLinkedIn = () => {
  connect("linkedin");
};

/**
 * Fetch Instagram accounts using EXISTING Facebook token.
 * This avoids doing a new OAuth which would invalidate existing tokens.
 * Use this when user already has Facebook connected.
 */
export const fetchInstagramWithExistingFacebook = async () => {
  const res = await api.post("/auth/instagram/fetch-with-existing-facebook");
  return res.data;
};

// Instagram via Facebook — uses Facebook OAuth to get Instagram Business accounts linked to FB Pages
// WARNING: This does a new OAuth flow which may invalidate existing tokens for other users.
// Prefer using fetchInstagramWithExistingFacebook() if user already has FB connected.
export const connectInstagramViaFacebook = async () => {
  const token = getAccessToken();
  const returnUrl = window.location.pathname;
  window.location.href =
    `${BASE_URL}/auth/instagram/connect-via-facebook?access_token=${encodeURIComponent(token)}&returnUrl=${encodeURIComponent(returnUrl)}`;
};

// Instagram Direct — uses direct Instagram Basic Display API (for personal accounts)
// Note: This has limited API access compared to Instagram via Facebook
export const connectInstagramDirect = () => {
  connect("instagram");
};

// Instagram — Try to use existing FB token first, fallback to OAuth
export const connectInstagram = async () => {
  try {
    // First try to fetch IG accounts using existing FB token (no new OAuth needed)
    const result = await fetchInstagramWithExistingFacebook();
    if (result.completed && !result.needsCreation && result.resources?.length > 0) {
      // Successfully fetched IG accounts with existing token
      // Reload the current page to show the new accounts
      window.location.reload();
      return;
    }
  } catch (err) {
    // No existing FB token or it failed — fall through to OAuth
    console.log("No existing FB token, proceeding with OAuth:", err?.response?.data?.message || err.message);
  }
  
  // Fallback: do OAuth flow (will invalidate other tokens for same FB user)
  connectInstagramViaFacebook();
};

// Optional generic export
export const connectPlatform = (platform) => {
  if (platform === "facebook") {
    connectFacebook();
  } else if (platform === "instagram") {
    connectInstagram();
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
    // Facebook uses direct OAuth with auth_type=reauthenticate (no revoke needed)
    window.location.href =
      `${BASE_URL}/auth/facebook/connect?access_token=${encodeURIComponent(token)}&returnUrl=${encodeURIComponent(returnUrl)}`;
  } else if (platform === "instagram") {
    // Instagram: try existing FB token first
    try {
      const result = await fetchInstagramWithExistingFacebook();
      if (result.completed && !result.needsCreation && result.resources?.length > 0) {
        window.location.href = returnUrl;
        return;
      }
    } catch {
      // Fall through to OAuth
    }
    // Fallback to OAuth
    window.location.href =
      `${BASE_URL}/auth/instagram/connect-via-facebook?access_token=${encodeURIComponent(token)}&returnUrl=${encodeURIComponent(returnUrl)}`;
  } else {
    // LinkedIn and other platforms use direct OAuth
    window.location.href =
      `${BASE_URL}/auth/${platform}/connect?access_token=${encodeURIComponent(token)}&returnUrl=${encodeURIComponent(returnUrl)}`;
  }
};

/**
 * Force reconnect with fresh OAuth - use when token is invalid/expired.
 * This will do a new OAuth flow (may invalidate other users' tokens).
 */
export const forceReconnect = (platform) => {
  if (platform === "facebook" || platform === "instagram") {
    connect("facebook"); // Both use Facebook OAuth
  } else {
    connect(platform);
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

export const getAccountsSummary = async () => {
  const res = await api.get("/auth/accounts/summary");
  return res.data;
};

export const getPlatformResources = async (platform) => {
  const res = await api.get(`/auth/${platform}/resources`);
  return res.data;
};

export const disconnectPlatform = async (platform) => {
  const res = await api.delete(`/auth/${platform}/disconnect`);
  return res.data;
};
