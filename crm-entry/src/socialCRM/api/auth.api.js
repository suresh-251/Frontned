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
