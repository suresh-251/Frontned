export const connectFacebook = () => {
  const token = localStorage.getItem("access_token");

  // Pass JWT via query param ONLY for connect step
  window.location.href =
    `https://localhost:7015/api/auth/facebook/connect?access_token=${token}`;
};
