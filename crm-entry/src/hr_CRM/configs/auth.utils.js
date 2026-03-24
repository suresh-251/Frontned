import { jwtDecode } from "jwt-decode";
import { getAccessToken } from "../../utils/authStorage";

const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export const getAuthDetails = () => {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    const role = decoded[ROLE_CLAIM] || decoded.role;
    
    // Convert permissions to an array regardless of format
    let perms = decoded.perm || [];
    if (typeof perms === 'string') perms = [perms];

    // Master Admin bypass (Optional - remove role check if you want 100% strictness)
    const isMasterAdmin = role === "ADMIN" || perms.includes("CRM_FULL_ACCESS");

    return {
      userId: decoded.sub || decoded.id,
      username: decoded.username || "User",
      role: role,
      permissions: perms, 
      isAdmin: isMasterAdmin,
    };
  } catch (error) {
    return null;
  }
};

/**
 * The only function you need to call in components
 * Example: hasPermission("SHIFT_CREATE")
 */
export const hasPermission = (requiredPermission) => {
  const user = getAuthDetails();
  if (!user) return false;
  
  // If user is Admin, they get everything. 
  // Otherwise, strictly check the permissions array.
  if (user.isAdmin) return true;

  return user.permissions.includes(requiredPermission);
};

export const debugAuth = () => {
  const auth = getAuthDetails();
  if (auth) {
    console.group("🛡️ PERMISSION DEBUGGER");
    console.log("Role:", auth.role);
    console.log("Permissions Count:", auth.permissions.length);
    console.log("Permissions List:", auth.permissions);
    console.groupEnd();
  }
};