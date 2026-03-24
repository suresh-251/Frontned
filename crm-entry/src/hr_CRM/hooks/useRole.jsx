// import { jwtDecode } from "jwt-decode";

// export const useRole = () => {
//   const token = localStorage.getItem("accessToken");
//   if (!token) return { isManager: false, isUser: false, role: null };

//   try {
//     const decoded = jwtDecode(token);
//     const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
//     const role = decoded[ROLE_CLAIM];

//     return {
//       isManager: role === "HR_MANAGER",
//       isUser: role === "HR_USER",
//       role: role
//     };
//   } catch (e) {
//     return { isManager: false, isUser: false, role: null };
//   }
// };




// import { jwtDecode } from "jwt-decode";

// export const useRole = () => {
//   const token = localStorage.getItem("accessToken");
//   if (!token) return { isManager: false, isUser: false, role: null };

//   try {
//     const decoded = jwtDecode(token);
//     const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    
//     // Get values from your specific token structure
//     const role = decoded[ROLE_CLAIM]; // This is "ADMIN" in your case
//     const permission = decoded.perm;  // This is "CRM_FULL_ACCESS" in your case

//     // Check if user is Manager OR has Full Access Permission
//     const hasManagerPower = role === "HR_MANAGER" || permission === "CRM_FULL_ACCESS";

//     return {
//       isManager: hasManagerPower,
//       isUser: role === "HR_USER",
//       role: role
//     };
//   } catch (e) {
//     return { isManager: false, isUser: false, role: null };
//   }
// };




import { jwtDecode } from "jwt-decode";
import { getAccessToken } from "../../utils/authStorage";

export const useRole = () => {
  const token = getAccessToken();
  if (!token) return { isManager: false, isUser: false, role: null };
  
  try {
    const decoded = jwtDecode(token);
    const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const role = decoded[ROLE_CLAIM];
    const permission = decoded.perm;

    // Admin should usually have Manager power
    const hasManagerPower = role === "HR_MANAGER" || role === "ADMIN" || permission === "CRM_FULL_ACCESS";
    
    return {
      isManager: hasManagerPower,
      isUser: role === "HR_USER",
      role: role // Returning raw role for the Layout check
    };
  } catch (e) {
    return { isManager: false, isUser: false, role: null };
  }
};