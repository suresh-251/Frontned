import { NavLink } from "react-router-dom";
import { Building2, CalendarDays, LayoutGrid, Layers, PanelLeftClose, PanelLeftOpen } from "lucide-react";

const navItems = [
  { label: "Leads", path: "/crm/sales/leads", Icon: LayoutGrid },
  { label: "Deals", path: "/crm/sales/deals", Icon: Layers },
  { label: "Accounts", path: "/crm/sales/accounts", Icon: Building2 },
  { label: "Calendar", path: "/crm/sales/calendar", Icon: CalendarDays },
];

export default function Sidebar({
  collapsed = false,
  isMobile = false,
  isOpen = false,
  onToggleCollapse,
  onClose,
}) {
  const sidebarClassName = [
    "salescrm-sidebar",
    collapsed ? "salescrm-sidebar--collapsed" : "",
    isMobile ? "salescrm-sidebar--mobile" : "",
    isMobile && isOpen ? "salescrm-sidebar--mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

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
          {navItems.map(({ label, path, Icon }) => (
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
              <Icon size={18} />
              <span className="salescrm-sidebar__label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
