export const connectFacebook = () => {
  // Redirects browser to backend OAuth endpoint
  window.location.href = "https://localhost:7015/api/auth/facebook/connect";
};
