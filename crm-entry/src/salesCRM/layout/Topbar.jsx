import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Bell, Menu } from "lucide-react";

export default function Topbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const profileRef = React.useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onMouseDown = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("salesCrmToken");
    navigate("/");
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 120,
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.08)" : "none",
      }}
    >
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          background: "#ffffff",
          color: "#475569",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Menu size={18} />
      </button>
      <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>Sales Overview</div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          onClick={() => navigate("/crm/sales/calendar")}
          title="Calendar"
          aria-label="Open sales calendar"
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            color: "#475569",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <CalendarDays size={18} />
        </button>
        <button
          type="button"
          title="Notifications"
          aria-label="Notifications"
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            color: "#475569",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Bell size={18} />
        </button>
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            onClick={() => setProfileOpen((current) => !current)}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "none",
              background: "linear-gradient(135deg,#5b4cf5,#8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            SM
          </button>

          {profileOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 10px)",
                minWidth: "150px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                boxShadow: "0 18px 34px rgba(15,23,42,0.14)",
                padding: "8px",
                zIndex: 240,
              }}
            >
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#fff5f5",
                  color: "#dc2626",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
