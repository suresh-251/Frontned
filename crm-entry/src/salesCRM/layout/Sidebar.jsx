import { NavLink } from "react-router-dom";
import { CalendarDays, LayoutGrid, Layers } from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";
import nafaLogo from "../../assets/nafa.png";

const navItems = [
  { label: "Leads", path: "/crm/sales/leads", Icon: LayoutGrid },
  { label: "Deals", path: "/crm/sales/deals", Icon: Layers },
  { label: "Calendar", path: "/crm/sales/calendar", Icon: CalendarDays },
];

export default function Sidebar() {
  return (
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
          </div>
        </div>
      </div>

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
  );
}
