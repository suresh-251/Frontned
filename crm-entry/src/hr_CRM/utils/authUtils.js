import { jwtDecode } from "jwt-decode";

export const getHRRole = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    // This must match the key in your JWT (e.g., decoded.role or decoded.domainCode)
    return decoded.role || decoded.domainCode; 
  } catch (error) {
    return null;
  }
};