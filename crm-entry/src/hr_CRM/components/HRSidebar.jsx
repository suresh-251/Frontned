import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Clock,
  Building2,
  FolderKanban,
  UserPlus,
  BookOpen,
  CheckSquare,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/hr/dashboard" },
  { name: "Employees", icon: Users, path: "/hr/employees" },
  { name: "Attendance", icon: Clock, path: "/hr/attendance" },
  { name: "Branches", icon: Building2, path: "/hr/branches" },
  { name: "Projects", icon: FolderKanban, path: "/hr/projects" },
  { name: "Recruitment", icon: UserPlus, path: "/hr/recruitment" },
  { name: "Knowledge", icon: BookOpen, path: "/hr/knowledge" },
  { name: "Todo", icon: CheckSquare, path: "/hr/todo" }
];

export default function HRSidebar({ collapsed, setCollapsed }) {
  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-white/5 backdrop-blur-xl border-r border-white/10 
      transition-all duration-300 ease-in-out flex flex-col`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
            HR CRM
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-white/10 transition"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                 ${
                   isActive
                     ? "bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30"
                     : "hover:bg-white/10 hover:translate-x-1"
                 }`
              }
            >
              <Icon size={20} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
