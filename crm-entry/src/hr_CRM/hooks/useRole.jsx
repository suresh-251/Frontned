import { jwtDecode } from "jwt-decode";

export const useRole = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return { isManager: false, isUser: false, role: null };

  try {
    const decoded = jwtDecode(token);
    const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const role = decoded[ROLE_CLAIM];

    return {
      isManager: role === "HR_MANAGER",
      isUser: role === "HR_USER",
      role: role
    };
  } catch (e) {
    return { isManager: false, isUser: false, role: null };
  }
};