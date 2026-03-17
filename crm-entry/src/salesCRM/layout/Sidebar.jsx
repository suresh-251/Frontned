import { NavLink } from "react-router-dom";
import { CalendarDays, LayoutGrid, Layers } from "lucide-react";

const navItems = [
  { label: "Leads", path: "/crm/sales/leads", Icon: LayoutGrid },
  { label: "Deals", path: "/crm/sales/deals", Icon: Layers },
  { label: "Calendar", path: "/crm/sales/calendar", Icon: CalendarDays },
];

export default function Sidebar() {
  return (
    <div className="w-56 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold">
            S
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Sales CRM</h2>
            <p className="text-xs text-gray-500">Pipeline workspace</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ label, path, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-600 font-semibold shadow-sm"
                  : "text-gray-700 hover:bg-gray-50"
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  );
}
