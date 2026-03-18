import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { clearAccessToken, getAccessToken, hasPersistentAccessToken, setAccessToken as persistAccessToken } from "../utils/authStorage";
 
const AuthContext = createContext(null);
 
export const AuthProvider = ({ children }) => {
 
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
 
  const [pwdResetRequired, setPwdResetRequired] = useState(false);
  const [pwdResetCompleted, setPwdResetCompleted] = useState(false);
  const [authChecking, setAuthChecking] = useState(false);
 
 
  /*
  --------------------------------------------------
  SESSION RESTORE ON PAGE LOAD
  --------------------------------------------------
  */
 
  useEffect(() => {
 
    const initAuth = async () => {
 
      const token = getAccessToken();
 
      if (!token) {
        setLoading(false);
        return;
      }
 
      try {
 
        const { exp } = jwtDecode(token);
 
        // ACCESS TOKEN STILL VALID
        if (exp * 1000 > Date.now()) {
          setSession(token);
          setLoading(false);
          return;
        }
 
        // ACCESS TOKEN EXPIRED → TRY REFRESH
        const res = await fetch("/api/token/refresh", {
          method: "POST",
          credentials: "include",
        });
 
        if (!res.ok) {
          logout();
          setLoading(false);
          return;
        }
 
        const data = await res.json();
 
        if (!data?.accessToken) {
          logout();
          setLoading(false);
          return;
        }
 
        setSession(data.accessToken);
 
      } catch (err) {
 
        logout();
 
      }
 
      setLoading(false);
 
    };
 
    initAuth();
 
  }, []);
 
 
 
  /*
  --------------------------------------------------
  SET SESSION
  --------------------------------------------------
  */
 
  const setSession = (token, options = {}) => {
    const { persist = hasPersistentAccessToken() } = options;
 
    if (!token || token.split(".").length !== 3) {
      throw new Error("Invalid JWT");
    }
 
    persistAccessToken(token, persist);
    setAccessToken(token);
 
    const decoded = jwtDecode(token);
 
    setUser(decoded);
 
    setPwdResetRequired(decoded.pwd_reset_required === "true");
    setPwdResetCompleted(decoded.pwd_reset_completed === "true");
 
    const perms = Array.isArray(decoded?.perm)
      ? decoded.perm
      : decoded?.perm
      ? [decoded.perm]
      : [];
 
    setPermissions(perms);
 
  };
 
 
  /*
  --------------------------------------------------
  LOGOUT
  --------------------------------------------------
  */
 
  const logout = () => {
 
    clearAccessToken();
    localStorage.removeItem("salesCrmToken");
 
    setAccessToken(null);
    setUser(null);
    setPermissions([]);
 
    setPwdResetRequired(false);
    setPwdResetCompleted(false);
    setAuthChecking(false);
 
  };
 
 
  const isAuthenticated = !!accessToken;
 
 
  /*
  --------------------------------------------------
  ADMIN CHECK
  --------------------------------------------------
  */
 
  const isAdmin = permissions.some((p) =>
    [
      "CRM_FULL_ACCESS"
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
