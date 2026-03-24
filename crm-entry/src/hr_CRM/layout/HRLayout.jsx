import React, { useState, useEffect, useMemo } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ChevronDown, Menu, Briefcase } from "lucide-react";
import Topbar from "./Topbar";

// CONFIG & AUTH IMPORTS
import { USER_MENU } from "../configs/userManu";
import { MANAGER_MENU } from "../configs/managerMenu";
import { useAuth } from "../../auth/AuthContext";

const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export default function HRLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dropdowns, setDropdowns] = useState({});

  // Use React-state-based auth — never touches localStorage directly
  const { user: jwtUser, permissions, isAdmin } = useAuth();

  useEffect(() => {
    // Initialize Theme
    const savedTheme = localStorage.getItem("hr-crm-theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  // Build a user object from the decoded JWT in AuthContext
  const user = useMemo(() => {
    if (!jwtUser) return null;
    return {
      userId: jwtUser.sub || jwtUser.id,
      username: jwtUser.username || jwtUser.name || "User",
      role: jwtUser[ROLE_CLAIM] || jwtUser.role,
      permissions,
      isAdmin,
    };
  }, [jwtUser, permissions, isAdmin]);

  // Determine which menu to show based on Role/Admin status
  const activeMenu = useMemo(() => {
    if (!user) return [];
    return (user.isAdmin || user.role === "HR_MANAGER") ? MANAGER_MENU : USER_MENU;
  }, [user]);

  // ProtectedRoute already guards this — if we reach here, user IS authenticated
  if (!user) return null;

  const toggleDropdown = (key) => {
    if (!isCollapsed) {
      setDropdowns(prev => ({ 
        ...prev, 
        [key]: !prev[key] 
      }));
    }
  };

  const linkClass = (isActive) =>
    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-all ${
      isActive 
        ? "bg-indigo-50/10 text-indigo-500 border border-indigo-500/20" 
        : "text-slate-500 hover:bg-slate-50/10 hover:text-[var(--text-main)]"
    } ${isCollapsed ? "justify-center px-0 mx-auto w-10" : ""}`;

  return (
    <div className="h-screen w-screen bg-[var(--bg-body)] flex overflow-hidden font-sans transition-colors duration-300">
      
      {/* SIDEBAR */}
      <aside className={`${isCollapsed ? "w-[60px]" : "w-[210px]"} bg-[var(--bg-card)] border-r border-[var(--border-color)] flex flex-col z-20 transition-all duration-300 shadow-sm`}>
        
        {/* LOGO SECTION */}
        <div className="p-3 mb-2 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Briefcase className="text-white w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-[var(--text-main)]">HR CRM</h2>
            </div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="p-1 hover:bg-slate-50/10 rounded text-slate-400 mx-auto"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          {activeMenu.map((item, index) => (
            <React.Fragment key={index}>
              {item.type === 'link' ? (
                /* SINGLE LINK ITEM */
                <NavLink 
                  to={item.path} 
                  className={({isActive}) => linkClass(isActive)}
                >
                  <item.icon size={18} />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              ) : (
                /* DROPDOWN MENU ITEM */
                <div className="space-y-0.5">
                  <div 
                    className={`${linkClass(dropdowns[item.stateKey])} cursor-pointer`} 
                    onClick={() => toggleDropdown(item.stateKey)}
                  >
                    <item.icon size={18} />
                    {!isCollapsed && <span className="flex-1">{item.label}</span>}
                    {!isCollapsed && (
                      <ChevronDown 
                        size={12} 
                        className={`transition-transform duration-200 ${dropdowns[item.stateKey] ? "rotate-180" : ""}`} 
                      />
                    )}
                  </div>
                  
                  {/* DROPDOWN CHILDREN */}
                  {!isCollapsed && dropdowns[item.stateKey] && (
                    <div className="ml-3 pl-3 border-l border-[var(--border-color)] flex flex-col">
                      {item.children.map((child, idx) => (
                        <NavLink 
                          key={idx} 
                          to={child.path} 
                          className={({isActive}) => `text-[11.5px] py-1.5 transition-colors ${
                            isActive ? 'text-indigo-500 font-bold' : 'text-slate-400 hover:text-indigo-400'
                          }`}
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOPBAR - Passes centralized user data */}
        <Topbar userData={user} />
        
        {/* MAIN VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-4 bg-[var(--bg-body)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}