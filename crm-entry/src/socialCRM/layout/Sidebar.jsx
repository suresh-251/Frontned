import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building2,
  ClipboardList,
  Home,
  Inbox,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  RadioTower,
  UsersRound,
} from "lucide-react";
import nafaLogo from "../../assets/nafa.png";
import { useAuth } from "../../auth/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/crm/socialmedia/dashboard", Icon: Home },
  { label: "Posts / Schedule", path: "/crm/socialmedia/post/history", Icon: ClipboardList, matchPrefix: "/crm/socialmedia/post" },
  { label: "Inbox", path: "/crm/socialmedia/inbox", Icon: Inbox },
  { label: "Analytics", path: "/crm/socialmedia/analytics", Icon: BarChart3 },
  { section: "Leads" },
  { label: "Leads", path: "/crm/socialmedia/leads", Icon: UsersRound },
  { label: "Subscriptions", path: "/crm/socialmedia/facebook/pages/subscriptions", Icon: RadioTower },
  { section: "Brands" },
  { label: "Manage Brands", path: "/crm/socialmedia/brands", Icon: Building2 },
];

export default function Sidebar({
  collapsed = false,
  isMobile = false,
  isOpen = false,
  onToggleCollapse,
  onClose,
}) {
  const location = useLocation();
  const { logout } = useAuth();

  const sidebarClassName = [
    "socialcrm-sidebar",
    collapsed ? "socialcrm-sidebar--collapsed" : "",
    isMobile ? "socialcrm-sidebar--mobile" : "",
    isMobile && isOpen ? "socialcrm-sidebar--mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {isMobile && (
        <button
          type="button"
          aria-label="Close sidebar"
          className={`socialcrm-sidebar__backdrop ${isOpen ? "socialcrm-sidebar__backdrop--visible" : ""}`}
          onClick={onClose}
        />
      )}
      <aside className={sidebarClassName}>
        <div className="socialcrm-sidebar__header">
          <div className="socialcrm-sidebar__brand">
            <div className="socialcrm-sidebar__logo">
              <img src={nafaLogo} alt="NaFa Social" className="socialcrm-sidebar__logo-img" />
            </div>
            <div className="socialcrm-sidebar__logo-text">
              <h2>NaFa Social</h2>
              <p>Social workspace</p>
            </div>
          </div>
          {!isMobile ? (
            <button
              type="button"
              className="socialcrm-sidebar__collapse-btn"
              onClick={onToggleCollapse}
              title={collapsed ? "Open sidebar" : "Close sidebar"}
              aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          ) : null}
        </div>

        <nav className="socialcrm-sidebar__nav">
          {navItems.map((item, i) => {
            if (item.section) {
              if (collapsed) return null;
              return (
                <div key={`s-${i}`} className="socialcrm-sidebar__section">
                  <p>{item.section}</p>
                </div>
              );
            }

            const active = item.matchPrefix
              ? location.pathname.startsWith(item.matchPrefix)
              : undefined;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={item.label}
                onClick={() => {
                  if (isMobile && onClose) onClose();
                }}
                className={({ isActive: routerActive }) =>
                  `socialcrm-navlink ${(active ?? routerActive) ? "socialcrm-navlink--active" : ""}`
                }
              >
                <item.Icon size={18} />
                <span className="socialcrm-sidebar__label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="socialcrm-sidebar__footer">
          <button
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
            className="socialcrm-sidebar__logout"
            title="Logout"
          >
            <LogOut size={18} />
            <span className="socialcrm-sidebar__label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
