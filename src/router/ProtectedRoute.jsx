import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getFacebookCapabilities } from "../api/facebook.capabilities.api";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    getFacebookCapabilities()
      .then(res => {
        if (res.isConnected) {
          setAllowed(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Checking login...</p>;

  if (!allowed) return <Navigate to="/" replace />;

  return children;
}
