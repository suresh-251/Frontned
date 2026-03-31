import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building2,
  ClipboardList,
  Home,
  Inbox,
  Link2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  RadioTower,
  Users,
  UsersRound,
} from "lucide-react";
import nafaLogo from "../../assets/nafa.png";
import { useAuth } from "../../auth/AuthContext";
import useMemberRole from "../hooks/useMemberRole";

/**
 * Each nav item can optionally declare a `module` key.
 * When present, the item is only rendered if the current user
 * has canRead access for that module (Owner / Admin always pass).
 * Items without a `module` key are always visible (e.g. Dashboard).
 */
const navItems = [
  { label: "Dashboard", path: "/crm/socialmedia/dashboard", Icon: Home },
  { label: "Posts / Schedule", path: "/crm/socialmedia/post/history", Icon: ClipboardList, matchPrefix: "/crm/socialmedia/post", module: "posts" },
  { label: "Inbox", path: "/crm/socialmedia/inbox", Icon: Inbox, module: "inbox" },
  { label: "Analytics", path: "/crm/socialmedia/analytics", Icon: BarChart3, module: "analytics" },
  { section: "Leads" },
  { label: "Leads", path: "/crm/socialmedia/leads", Icon: UsersRound, module: "leads" },
  { label: "Subscriptions", path: "/crm/socialmedia/facebook/pages/subscriptions", Icon: RadioTower, module: "leads" },
  { section: "Settings" },
  { label: "Brands", path: "/crm/socialmedia/brands", Icon: Building2, module: "brand_settings" },
  { label: "Social Channels", path: "/crm/socialmedia/accounts", Icon: Link2, module: "social_accounts" },
  { label: "Team Members", path: "/crm/socialmedia/brands/members", Icon: Users, module: "members" },
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
  const { canAccess } = useMemberRole();

  // Build a filtered list — hide items the user cannot access.
  // Section headers are kept only if at least one item after them is visible.
  const visibleItems = [];
  let pendingSection = null;

  for (const item of navItems) {
    if (item.section) {
      pendingSection = item;
      continue;
    }

    const allowed = !item.module || canAccess(item.module);
    if (!allowed) continue;

    // Flush the pending section header before the first visible child
    if (pendingSection) {
      visibleItems.push(pendingSection);
      pendingSection = null;
    }
    visibleItems.push(item);
  }

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
          {visibleItems.map((item, i) => {
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
