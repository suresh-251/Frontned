import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { connectFacebook } from "../api/auth.api";
import { loadCapabilities } from "../store/capabilities.store";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    loadCapabilities()
      .then(caps => {
        if (caps.connected) {
          navigate("/dashboard");
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>SocialMediaCRM</h1>
      <p>Manage Facebook like Zoho Social</p>
      <button onClick={connectFacebook}>
        Connect Facebook
      </button>
    </div>
  );
}
