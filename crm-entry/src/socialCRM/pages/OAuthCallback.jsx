import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const status = params.get("status");
    const returnUrl = params.get("returnUrl");
    const message = params.get("message");

    if (status === "connected") {
      toast.success("Account connected successfully 🎉");
      navigate(returnUrl || "/crm/socialmedia/post/create", { replace: true });
      return;
    }

    if (status === "error") {
      toast.error(message || "Social media connection failed");
      navigate("/crm/socialmedia/post/create", { replace: true });
      return;
    }

    navigate("/crm/socialmedia/post/create", { replace: true });
  }, [navigate, params]);

  return <p>Finalizing connection...</p>;
}
