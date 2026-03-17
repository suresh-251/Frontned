import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { CalendarDays } from "lucide-react";

const NAV_LINKS = [
  { name: "Leads", path: "/crm/sales/leads" },
  { name: "Deals", path: "/crm/sales/deals" },
];

export default function Topbar() {
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
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "64px",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        zIndex: 200,
        boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.08)" : "none",
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: "20px",
          marginRight: "30px",
          cursor: "pointer",
        }}
        onClick={() => navigate("/crm/sales/leads")}
      >
        Sales CRM
      </div>

      <ul
        style={{
          listStyle: "none",
          display: "flex",
          gap: "6px",
          margin: 0,
          padding: 0,
        }}
      >
        {NAV_LINKS.map((link) => (
          <li key={link.path}>
            <NavLink
              to={link.path}
              end={link.path === "/crm/sales"}
              style={({ isActive }) => ({
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "17px",
                fontWeight: 600,
                background: isActive ? "#eef2ff" : "transparent",
                color: isActive ? "#5b4cf5" : "#6b7280",
              })}
            >
              {link.name}
            </NavLink>
          </li>
        ))}
      </ul>

      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/crm/sales/calendar")}
          title="Calendar"
          aria-label="Open sales calendar"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            color: "#475569",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 10px 20px rgba(15,23,42,0.05)",
          }}
        >
          <CalendarDays size={18} />
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
