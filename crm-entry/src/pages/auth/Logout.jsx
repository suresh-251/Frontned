// import { Navigate } from "react-router-dom";
// import { useAuth } from "../../auth/AuthContext";

// export default function Logout() {
//   const { logout } = useAuth();
//   logout();
//   return <Navigate to="/login" replace />;
// }



import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function Logout() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, []);

  return <Navigate to="/login" replace />;
}