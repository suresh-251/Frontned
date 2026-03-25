import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  LayoutGrid,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const navItems = [
  { label: "Leads", path: "/crm/sales/leads", Icon: LayoutGrid },
  {
    label: "Activities",
    path: "/crm/sales/activities",
    children: [
      { label: "Tasks", path: "/crm/sales/activities?tab=tasks" },
      { label: "Calls", path: "/crm/sales/activities?tab=calls" },
      { label: "Meetings", path: "/crm/sales/activities?tab=meetings" },
      { label: "Emails", path: "/crm/sales/activities?tab=emails" },
    ],
  },
  { label: "Deals", path: "/crm/sales/deals", Icon: Layers },
  { label: "Accounts", path: "/crm/sales/accounts", Icon: Building2 },
];

export default function Sidebar({
  collapsed = false,
  isMobile = false,
  isOpen = false,
  onToggleCollapse,
  onClose,
}) {
  const location = useLocation();
  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const sidebarClassName = [
    "salescrm-sidebar",
    collapsed ? "salescrm-sidebar--collapsed" : "",
    isMobile ? "salescrm-sidebar--mobile" : "",
    isMobile && isOpen ? "salescrm-sidebar--mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const isActivitiesChildActive =
    location.pathname === "/crm/sales/activities" &&
    ["?tab=tasks", "?tab=calls", "?tab=meetings", "?tab=emails"].includes(location.search);
  const showActivitiesChildren = !collapsed && (activitiesOpen || isActivitiesChildActive);

  return (
    <>
      {isMobile && (
        <button
          type="button"
          aria-label="Close sidebar"
          className={`salescrm-sidebar__backdrop ${isOpen ? "salescrm-sidebar__backdrop--visible" : ""}`}
          onClick={onClose}
        />
      )}
      <aside className={sidebarClassName}>
        <div className="salescrm-sidebar__header">
          <div className="salescrm-sidebar__brand">
            <div className="salescrm-sidebar__logo">S</div>
            <div className="salescrm-sidebar__logo-text">
              <h2>Sales CRM</h2>
              <p>Pipeline workspace</p>
            </div>
          </div>
          {!isMobile ? (
            <button
              type="button"
              className="salescrm-sidebar__collapse-btn"
              onClick={onToggleCollapse}
              title={collapsed ? "Open sidebar" : "Close sidebar"}
              aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          ) : null}
        </div>

        <nav className="salescrm-sidebar__nav">
          {navItems.map((item) => {
            const { label, path, children } = item;
            const isActivitiesGroup = Array.isArray(children) && children.length > 0;

            if (!isActivitiesGroup) {
              const LinkIcon = item.Icon;
              return (
                <NavLink
                  key={path}
                  to={path}
                  title={label}
                  onClick={() => {
                    if (isMobile && onClose) onClose();
                  }}
                  className={({ isActive }) =>
                    `salescrm-navlink ${isActive ? "salescrm-navlink--active" : ""}`
                  }
                >
                  <LinkIcon size={18} />
                  <span className="salescrm-sidebar__label">{label}</span>
                </NavLink>
              );
            }

            return (
              <div key={path} className="salescrm-navgroup">
                <button
                  type="button"
                  className={`salescrm-navlink salescrm-navlink--toggle ${
                    isActivitiesChildActive ? "salescrm-navlink--active" : ""
                  }`}
                  aria-expanded={activitiesOpen}
                  title={label}
                  onClick={() => {
                    if (!collapsed) setActivitiesOpen((open) => !open);
                  }}
                >
                  <ClipboardList size={18} />
                  <span className="salescrm-sidebar__label">{label}</span>
                  {!collapsed ? (
                    <span className="salescrm-navlink__chevron" aria-hidden="true">
                      {showActivitiesChildren ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                  ) : null}
                </button>

                {showActivitiesChildren ? (
                  <div className="salescrm-sidebar__subnav">
                    {children.map((child) => {
                      const isChildActive = `${location.pathname}${location.search}` === child.path;
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          title={child.label}
                          onClick={() => {
                            if (isMobile && onClose) onClose();
                          }}
                          className={() =>
                            `salescrm-sublink ${isChildActive ? "salescrm-sublink--active" : ""}`
                          }
                        >
                          <span className="salescrm-sidebar__sublabel">{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
