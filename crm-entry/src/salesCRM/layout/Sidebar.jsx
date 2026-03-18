import { NavLink } from "react-router-dom";
<<<<<<< HEAD
import { CalendarDays, LayoutGrid, Layers } from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";
import nafaLogo from "../../assets/nafa.png";
=======
import { Building2, CalendarDays, LayoutGrid, Layers, PanelLeftClose, PanelLeftOpen } from "lucide-react";
>>>>>>> 643632a8ec9f6b8b9be2351b46874b5ecbf09455

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
<<<<<<< HEAD
    <div
      className="w-56 flex flex-col min-h-screen"
      style={{
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-color)",
      }}
    >
      <div className="p-6" style={{ borderBottom: "1px solid var(--border-color)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ background: `linear-gradient(135deg, var(--logo-gradient-from), var(--logo-gradient-to))` }}
          >
            <img src={nafaLogo} alt="NaFa" className="w-10 h-10 object-cover" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-main)" }}>Sales CRM</h2>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Pipeline workspace</p>
=======
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
>>>>>>> 643632a8ec9f6b8b9be2351b46874b5ecbf09455
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

<<<<<<< HEAD
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ label, path, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
            style={({ isActive }) =>
              isActive
                ? { background: "var(--primary-light)", color: "var(--primary-text)", fontWeight: 600, boxShadow: "var(--shadow-sm)" }
                : { color: "var(--text-secondary)" }
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Theme toggle at bottom */}
      <div className="p-4" style={{ borderTop: "1px solid var(--border-color)" }}>
        <ThemeToggle />
      </div>
    </div>
=======
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
>>>>>>> 643632a8ec9f6b8b9be2351b46874b5ecbf09455
  );
}
