// import React, { useState, useEffect, useMemo } from "react";
// import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
// import { ChevronDown, Menu, Briefcase } from "lucide-react";
// import { jwtDecode } from "jwt-decode";
// import Topbar from "./Topbar";
// import { USER_MENU } from "../configs/userManu";
// import { MANAGER_MENU } from "../configs/managerMenu";

// export default function HRLayout() {
//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const [dropdowns, setDropdowns] = useState({});
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();

//   const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
//   const NAME_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

//   useEffect(() => {
//     // Theme Init
//     const savedTheme = localStorage.getItem("hr-crm-theme") || "light";
//     document.documentElement.setAttribute("data-theme", savedTheme);
    
//     // Auth Check
//     const token = localStorage.getItem("accessToken");
//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
//         setUser({
//           ...decoded,
//           name: decoded[NAME_CLAIM] || decoded.unique_name || "Authorized User",
//           role: decoded[ROLE_CLAIM]
//         });
//       } catch (error) { navigate("/crm/hr/login"); }
//     } else { navigate("/crm/hr/login"); }
//   }, [navigate]);

//   const activeMenu = useMemo(() => {
//     if (!user) return [];
//     return (user.role === "HR_MANAGER" || user.role === "ADMIN") ? MANAGER_MENU : USER_MENU;
//   }, [user]);

//   if (!user) return null;

//   const toggleDropdown = (key) => {
//     if (!isCollapsed) setDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
//   };

//   const linkClass = (isActive) =>
//     `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-all ${
//       isActive 
//         ? "bg-indigo-50/10 text-indigo-500 border border-indigo-500/20" 
//         : "text-slate-500 hover:bg-slate-50/10 hover:text-[var(--text-main)]"
//     } ${isCollapsed ? "justify-center px-0 mx-auto w-10" : ""}`;

//   return (
//     <div className="h-screen w-screen bg-[var(--bg-body)] flex overflow-hidden font-sans transition-colors duration-300">
//       {/* SIDEBAR */}
//       <aside className={`${isCollapsed ? "w-[60px]" : "w-[210px]"} bg-[var(--bg-card)] border-r border-[var(--border-color)] flex flex-col z-20 transition-all duration-300 shadow-sm`}>
//         <div className="p-3 mb-2 flex items-center justify-between">
//           {!isCollapsed && (
//             <div className="flex items-center gap-2">
//               <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
//                 <Briefcase className="text-white w-4 h-4" />
//               </div>
//               <h2 className="text-sm font-bold text-[var(--text-main)]">HR CRM</h2>
//             </div>
//           )}
//           <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-slate-50/10 rounded text-slate-400 mx-auto">
//             <Menu size={18} />
//           </button>
//         </div>

//         <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
//           {activeMenu.map((item, index) => (
//             <React.Fragment key={index}>
//               {item.type === 'link' ? (
//                 <NavLink to={item.path} className={({isActive}) => linkClass(isActive)}>
//                   <item.icon size={18} />
//                   {!isCollapsed && <span>{item.label}</span>}
//                 </NavLink>
//               ) : (
//                 <div className="space-y-0.5">
//                   <div className={`${linkClass(dropdowns[item.stateKey])} cursor-pointer`} onClick={() => toggleDropdown(item.stateKey)}>
//                     <item.icon size={18} />
//                     {!isCollapsed && <span className="flex-1">{item.label}</span>}
//                     {!isCollapsed && <ChevronDown size={12} className={dropdowns[item.stateKey] ? "rotate-180" : ""} />}
//                   </div>
//                   {!isCollapsed && dropdowns[item.stateKey] && (
//                     <div className="ml-3 pl-3 border-l border-[var(--border-color)] flex flex-col">
//                       {item.children.map((child, idx) => (
//                         <NavLink key={idx} to={child.path} className={({isActive}) => `text-[11.5px] py-1.5 transition-colors ${isActive ? 'text-indigo-500 font-bold' : 'text-slate-400 hover:text-indigo-400'}`}>
//                           {child.label}
//                         </NavLink>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )}
//             </React.Fragment>
//           ))}
//         </nav>
//       </aside>

//       <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         <Topbar userData={user} />
//         <main className="flex-1 overflow-y-auto p-4 bg-[var(--bg-body)]">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }




// ====updated admin control -=======


import React, { useState, useEffect, useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, Briefcase } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import Topbar from "./Topbar";
import { USER_MENU } from "../configs/userManu";
import { MANAGER_MENU } from "../configs/managerMenu";

export default function HRLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dropdowns, setDropdowns] = useState({});
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
  const NAME_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

  useEffect(() => {
    // Theme Init — shared key with sales/social CRM
    const savedTheme = localStorage.getItem("crm-theme") || localStorage.getItem("hr-crm-theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    
    // Auth Check
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const role = decoded[ROLE_CLAIM];
        const perms = decoded.perm || [];

        // ✅ Master Admin Logic: CRM_FULL_ACCESS grants everything
        const hasFullAccess = role === "ADMIN" || perms.includes("CRM_FULL_ACCESS");

        setUser({
          ...decoded,
          name: decoded[NAME_CLAIM] || decoded.unique_name || "Authorized User",
          role: role,
          isAdmin: hasFullAccess,
          permissions: perms
        });
      } catch (error) { navigate("/crm/hr/login"); }
    } else { navigate("/crm/hr/login"); }
  }, [navigate]);

  const activeMenu = useMemo(() => {
    if (!user) return [];
    // ✅ Logic: Admin (Full Access) or HR_MANAGER gets the full menu
    return (user.isAdmin || user.role === "HR_MANAGER") ? MANAGER_MENU : USER_MENU;
  }, [user]);

  if (!user) return null;

  const toggleDropdown = (key) => {
    if (!isCollapsed) setDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
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
        <div className="p-3 mb-2 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Briefcase className="text-white w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-[var(--text-main)]">HR CRM</h2>
            </div>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-slate-50/10 rounded text-slate-400 mx-auto">
            <Menu size={18} />
          </button>
        </div>

        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          {activeMenu.map((item, index) => (
            <React.Fragment key={index}>
              {item.type === 'link' ? (
                <NavLink to={item.path} className={({isActive}) => linkClass(isActive)}>
                  <item.icon size={18} />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              ) : (
                <div className="space-y-0.5">
                  <div className={`${linkClass(dropdowns[item.stateKey])} cursor-pointer`} onClick={() => toggleDropdown(item.stateKey)}>
                    <item.icon size={18} />
                    {!isCollapsed && <span className="flex-1">{item.label}</span>}
                    {!isCollapsed && <ChevronDown size={12} className={dropdowns[item.stateKey] ? "rotate-180" : ""} />}
                  </div>
                  {!isCollapsed && dropdowns[item.stateKey] && (
                    <div className="ml-3 pl-3 border-l border-[var(--border-color)] flex flex-col">
                      {item.children.map((child, idx) => (
                        <NavLink key={idx} to={child.path} className={({isActive}) => `text-[11.5px] py-1.5 transition-colors ${isActive ? 'text-indigo-500 font-bold' : 'text-slate-400 hover:text-indigo-400'}`}>
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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar userData={user} />
        <main className="flex-1 overflow-y-auto p-4 bg-[var(--bg-body)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}