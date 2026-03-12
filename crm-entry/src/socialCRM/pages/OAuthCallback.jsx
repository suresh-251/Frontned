import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getBrands } from "../api/brand.api";

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

    if (status === "connected_select_resource" || status === "connected") {
      toast.success("Account connected successfully 🎉");

      getBrands()
        .then((brands) => {
          const hasActive = brands.some((b) => b.isActive);
          if (brands.length === 0 || !hasActive) {
            navigate("/crm/socialmedia/brand/setup", { replace: true });
          } else {
            navigate(returnUrl || "/crm/socialmedia/dashboard", { replace: true });
          }
        })
        .catch(() => {
          navigate("/crm/socialmedia/brand/setup", { replace: true });
        });
      return;
    }

    if (status === "connected_create_resource") {
      toast(message || "No page/account available. Create one in Meta, then reconnect.");
      navigate("/crm/socialmedia/dashboard", { replace: true });
      return;
    }

    if (status === "error") {
      toast.error(message || "Social media connection failed");
      navigate("/crm/socialmedia/dashboard", { replace: true });
      return;
    }

    navigate("/crm/socialmedia/dashboard", { replace: true });
  }, [navigate, params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-gray-600 font-medium">Finalizing connection...</p>
      </div>
    </div>
  );
}
