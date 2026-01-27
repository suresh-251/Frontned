import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const status = params.get("status");

    if (status === "connected") {
      navigate("/dashboard");
    }

    if (status === "connected_select_resource") {
      navigate("/facebook/pages/select");
    }

    if (!status) {
      navigate("/");
    }
  }, []);

  return <p>Finalizing Facebook connection...</p>;
}
