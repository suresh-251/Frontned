

import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Original states from your code
  const [pwdResetRequired, setPwdResetRequired] = useState(false);
  const [pwdResetCompleted, setPwdResetCompleted] = useState(false);
  const [authChecking, setAuthChecking] = useState(false);

  // 🔁 Restore session on refresh
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && token !== "null" && token !== "undefined") {
      try {
        setSession(token);
      } catch {
        logout();
      }
    }
    setLoading(false);
  }, []);

  // ⏱️ Auto logout on expiry
  useEffect(() => {
    if (!accessToken) return;
    try {
      const { exp } = jwtDecode(accessToken);
      const timeout = exp * 1000 - Date.now();
      if (timeout <= 0) {
        logout();
        return;
      }
      const timer = setTimeout(logout, timeout);
      return () => clearTimeout(timer);
    } catch (e) {
      logout();
    }
  }, [accessToken]);

  const setSession = (token) => {
    if (!token || token.split(".").length !== 3) {
      throw new Error("Invalid JWT");
    }

    localStorage.setItem("accessToken", token);
    setAccessToken(token);

    const decoded = jwtDecode(token);
    setUser(decoded);

    // Original logic for password resets
    setPwdResetRequired(decoded.pwd_reset_required === "true");
    setPwdResetCompleted(decoded.pwd_reset_completed === "true");

    // Original logic for permissions
    const perms = Array.isArray(decoded?.perm)
      ? decoded.perm
      : decoded?.perm
      ? [decoded.perm]
      : [];
    setPermissions(perms);

    // --- NEW ROLE-BASED REDIRECT LOGIC ---
    // Extract role from JWT (Assuming key is 'role')
    const userRole = (decoded.role || "").toUpperCase();
    
    if (userRole === "HR") return "/crm/hr";
    if (userRole === "SALES") return "/crm/sales";
    if (userRole === "SOCIAL_MEDIA") return "/crm/socialmedia";
    
    return "/"; // Default fallback
  };

  const logout = () => {
    localStorage.clear();
    setAccessToken(null);
    setUser(null);
    setPermissions([]);
    setPwdResetRequired(false);
    setPwdResetCompleted(false);
    setAuthChecking(false);
  };

  const isAuthenticated = !!accessToken;

  // Your original Admin check logic
  const isAdmin = permissions.some((p) =>
    [
      "CRM_FULL_ACCESS",
      
    ].includes(p)
  );

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        permissions,
        pwdResetRequired,
        pwdResetCompleted,
        authChecking,
        setAuthChecking,
        isAuthenticated,
        isAdmin,
        setSession,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);