import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Bell, Menu, LogOut } from "lucide-react";
import ThemeChange from "../components/ui/ThemeChange";

export default function Topbar({ onToggleSidebar, showSidebarToggle = true }) {
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
      className="salescrm-topbar"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 120,
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border-color)",
<<<<<<< HEAD
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: scrolled ? "var(--shadow-md)" : "none",
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
          border: "1px solid var(--border-color)",
          background: "var(--bg-card)",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Menu size={18} />
      </button>
      <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-main)" }}>Sales Overview</div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
=======
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.08)" : "none",
      }}
    >
      {showSidebarToggle ? (
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "9px",
            border: "1px solid var(--border-color)",
            background: "var(--bg-card)",
            color: "var(--text-main)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Menu size={17} />
        </button>
      ) : null}
      <div className="salescrm-topbar__title" style={{ fontWeight: 700, fontSize: 15, color: "var(--text-main)" }}>
        Sales Overview
      </div>
      <div className="salescrm-topbar__actions" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
>>>>>>> 643632a8ec9f6b8b9be2351b46874b5ecbf09455
        <button
          type="button"
          onClick={() => navigate("/crm/sales/calendar")}
          title="Calendar"
          aria-label="Open sales calendar"
          className="salescrm-topbar__action-btn"
          style={{
<<<<<<< HEAD
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            border: "1px solid var(--border-color)",
            background: "var(--bg-card)",
            color: "var(--text-secondary)",
=======
            width: "34px",
            height: "34px",
            borderRadius: "9px",
            border: "1px solid var(--border-color)",
            background: "var(--bg-card)",
            color: "var(--text-main)",
>>>>>>> 643632a8ec9f6b8b9be2351b46874b5ecbf09455
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <CalendarDays size={17} />
        </button>
        <button
          type="button"
          title="Notifications"
          aria-label="Notifications"
          className="salescrm-topbar__action-btn"
          style={{
<<<<<<< HEAD
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            border: "1px solid var(--border-color)",
            background: "var(--bg-card)",
            color: "var(--text-secondary)",
=======
            width: "34px",
            height: "34px",
            borderRadius: "9px",
            border: "1px solid var(--border-color)",
            background: "var(--bg-card)",
            color: "var(--text-main)",
>>>>>>> 643632a8ec9f6b8b9be2351b46874b5ecbf09455
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Bell size={17} />
        </button>
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            onClick={() => setProfileOpen((current) => !current)}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: "none",
              background: "linear-gradient(135deg, var(--logo-gradient-from), var(--logo-gradient-to))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "11px",
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
<<<<<<< HEAD
                minWidth: "150px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                boxShadow: "var(--shadow-md)",
                padding: "8px",
=======
                minWidth: "230px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                boxShadow: "0 18px 34px rgba(15,23,42,0.14)",
                padding: "8px 0",
>>>>>>> 643632a8ec9f6b8b9be2351b46874b5ecbf09455
                zIndex: 240,
              }}
            >
              <div
                style={{
                  padding: "8px 16px",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <p
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                  }}
                >
                  Account Hub
                </p>
              </div>

              <div style={{ borderTop: "1px solid var(--border-color)", marginTop: 4 }}>
                <ThemeChange />
              </div>

              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 16px",
                  border: "none",
<<<<<<< HEAD
                  borderRadius: "8px",
                  background: "var(--primary-light)",
                  color: "#dc2626",
=======
                  background: "transparent",
                  color: "#ef4444",
>>>>>>> 643632a8ec9f6b8b9be2351b46874b5ecbf09455
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "8px",
                    background: "rgba(239,68,68,0.12)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LogOut size={14} />
                </span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
