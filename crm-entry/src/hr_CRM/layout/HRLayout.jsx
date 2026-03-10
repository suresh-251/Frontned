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
//   const location = useLocation();
//   const navigate = useNavigate();

//   // Microsoft Identity Claims
//   const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
//   const NAME_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

//   // --- THEME INITIALIZATION ---
//   useEffect(() => {
//     const savedTheme = localStorage.getItem("hr-crm-theme") || "light";
//     document.documentElement.setAttribute("data-theme", savedTheme);
//   }, []);

//   // --- TOKEN DECODING & AUTH CHECK ---
//   useEffect(() => {
//     const token = localStorage.getItem("accessToken");
//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
//         setUser({
//           ...decoded,
//           name: decoded[NAME_CLAIM] || decoded.unique_name || decoded.name || "Authorized User",
//           role: decoded[ROLE_CLAIM]
//         });
//       } catch (error) {
//         console.error("Token Error", error);
//         navigate("/crm/hr/login");
//       }
//     } else {
//       navigate("/crm/hr/login");
//     }
//   }, [navigate]);

//   // --- MENU DECISION (Admin Fix) ---
//   // We use useMemo to prevent the menu from recalculating unnecessarily, which stops loops.
//   const activeMenu = useMemo(() => {
//     if (!user) return [];
//     // 🛑 THE CRITICAL FIX: Explicitly include ADMIN here
//     return (user.role === "HR_MANAGER" || user.role === "ADMIN") ? MANAGER_MENU : USER_MENU;
//   }, [user]);

//   if (!user) {
//     return (
//       <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg-body)]">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
//       </div>
//     );
//   }

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
//     <div className="h-screen w-screen bg-[var(--bg-body)] flex overflow-hidden font-sans text-[var(--text-main)] transition-colors duration-300">
      
//       {/* SIDEBAR */}
//       <aside className={`${isCollapsed ? "w-[60px]" : "w-[210px]"} bg-[var(--bg-card)] border-r border-[var(--border-color)] flex flex-col z-20 transition-all duration-300 shadow-sm`}>
//         <div className="p-3 mb-2 flex items-center justify-between">
//           {!isCollapsed && (
//             <div className="flex items-center gap-2">
//               <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
//                 <Briefcase className="text-white w-4 h-4" />
//               </div>
//               <h2 className="text-sm font-bold">HR</h2>
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

//       {/* MAIN CONTENT AREA */}
//       <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         <Topbar userData={user} />
//         <main className="flex-1 overflow-y-auto p-4 bg-[var(--bg-body)] transition-colors duration-300">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }






import React, { useState, useEffect, useMemo } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
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
    // Theme Init
    const savedTheme = localStorage.getItem("hr-crm-theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    
    // Auth Check
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          ...decoded,
          name: decoded[NAME_CLAIM] || decoded.unique_name || "Authorized User",
          role: decoded[ROLE_CLAIM]
        });
      } catch (error) { navigate("/crm/hr/login"); }
    } else { navigate("/crm/hr/login"); }
  }, [navigate]);

  const activeMenu = useMemo(() => {
    if (!user) return [];
    return (user.role === "HR_MANAGER" || user.role === "ADMIN") ? MANAGER_MENU : USER_MENU;
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























// new sidebar


// import React, { useState, useEffect, useMemo } from "react";
// import { NavLink, Outlet, useNavigate } from "react-router-dom";
// import { ChevronDown, Menu, Briefcase, LogOut } from "lucide-react";
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

//   // --- YOUR ORIGINAL LOGIC START ---
//   useEffect(() => {
//     const token = localStorage.getItem("accessToken");
//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
//         setUser({
//           ...decoded,
//           name: decoded[NAME_CLAIM] || decoded.unique_name || "Melisa Doğan",
//           role: decoded[ROLE_CLAIM] || "Öğretmen"
//         });
//       } catch (error) { navigate("/crm/hr/login"); }
//     } else { navigate("/crm/hr/login"); }
//   }, [navigate]);

//   const activeMenu = useMemo(() => {
//     if (!user) return [];
//     return (user.role === "HR_MANAGER" || user.role === "ADMIN") ? MANAGER_MENU : USER_MENU;
//   }, [user]);

//   const toggleDropdown = (key) => {
//     if (!isCollapsed) setDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
//   };
//   // --- YOUR ORIGINAL LOGIC END ---

//   if (!user) return null;

//   return (
//     <div className="fixed-design-layout" style={styles.container}>
//       {/* SIDEBAR - FLOATING DESIGN */}
//       <aside 
//         style={{ 
//           ...styles.sidebar, 
//           width: isCollapsed ? '80px' : '260px' 
//         }}
//       >
//         {/* Profile Card Section (Image Style) */}
//         {!isCollapsed && (
//           <div style={styles.profileWrapper}>
//             <div style={styles.profilePill}>
//               <img 
//                 src="https://i.pravatar.cc/100?u=melisa" 
//                 style={styles.avatar} 
//                 alt="profile" 
//               />
//               <div style={styles.profileText}>
//                 <span style={styles.userName}>{user.name}</span>
//                 <span style={styles.userRole}>{user.role}</span>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Navigation - Your Logic Map */}
//         <nav style={styles.navContainer} className="custom-scrollbar">
//           {activeMenu.map((item, index) => (
//             <React.Fragment key={index}>
//               {item.type === 'link' ? (
//                 <NavLink 
//                   to={item.path} 
//                   className={({isActive}) => isActive ? "nav-link active" : "nav-link"}
//                 >
//                   <item.icon size={18} />
//                   {!isCollapsed && <span>{item.label}</span>}
//                 </NavLink>
//               ) : (
//                 <div className="dropdown-wrapper">
//                   <div 
//                     className={`nav-link ${dropdowns[item.stateKey] ? 'dropdown-open' : ''}`}
//                     onClick={() => toggleDropdown(item.stateKey)}
//                   >
//                     <item.icon size={18} />
//                     {!isCollapsed && <span style={{flex: 1}}>{item.label}</span>}
//                     {!isCollapsed && <ChevronDown size={14} style={{transform: dropdowns[item.stateKey] ? 'rotate(180deg)' : 'none', transition: '0.3s'}} />}
//                   </div>
                  
//                   {!isCollapsed && dropdowns[item.stateKey] && (
//                     <div style={styles.dropdownContent}>
//                       {item.children.map((child, idx) => (
//                         <NavLink 
//                           key={idx} 
//                           to={child.path} 
//                           className={({isActive}) => isActive ? "sub-link active-sub" : "sub-link"}
//                         >
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

//         {/* Fixed Logout at Bottom */}
//         <div style={styles.logoutSection}>
//           <button style={styles.logoutBtn}>
//             <div style={styles.logoutIconCircle}><LogOut size={14} /></div>
//             {!isCollapsed && <span>Oturumu Kapat</span>}
//           </button>
//         </div>
//       </aside>

//       {/* MAIN CONTENT */}
//       <div style={styles.mainWrapper}>
//         <Topbar userData={user} />
//         <main style={styles.mainContent}>
//           <Outlet />
//         </main>
//       </div>

//       {/* SCOOPED CSS INJECTED */}
//       <style>{`
//         .fixed-design-layout .nav-link {
//           display: flex;
//           align-items: center;
//           gap: 15px;
//           padding: 12px 20px;
//           color: rgba(255,255,255,0.6);
//           text-decoration: none;
//           font-size: 13.5px;
//           font-weight: 500;
//           transition: all 0.3s;
//           cursor: pointer;
//           position: relative;
//         }
//         .fixed-design-layout .nav-link:hover { color: #fff; }

//         /* The Image "Scoop" Effect */
//         .fixed-design-layout .nav-link.active {
//           background-color: #f3f4f9; /* Body background color */
//           color: #2c3652;
//           border-radius: 40px 0 0 40px;
//           margin-right: -1px; 
//           z-index: 5;
//         }

//         /* Top Corner Scoop */
//         .fixed-design-layout .nav-link.active::before {
//           content: "";
//           position: absolute;
//           top: -20px;
//           right: 0;
//           width: 20px;
//           height: 20px;
//           background-color: transparent;
//           border-bottom-right-radius: 20px;
//           box-shadow: 10px 0 0 0 #f3f4f9;
//         }

//         /* Bottom Corner Scoop */
//         .fixed-design-layout .nav-link.active::after {
//           content: "";
//           position: absolute;
//           bottom: -20px;
//           right: 0;
//           width: 20px;
//           height: 20px;
//           background-color: transparent;
//           border-top-right-radius: 20px;
//           box-shadow: 10px 0 0 0 #f3f4f9;
//         }

//         .fixed-design-layout .sub-link {
//           padding: 8px 0;
//           font-size: 12px;
//           color: rgba(255,255,255,0.5);
//           text-decoration: none;
//           transition: 0.3s;
//         }
//         .fixed-design-layout .sub-link:hover { color: #fff; }
//         .fixed-design-layout .active-sub { color: #fff; font-weight: bold; }

//         .custom-scrollbar::-webkit-scrollbar { width: 3px; }
//         .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
//       `}</style>
//     </div>
//   );
// }

// // Fixed Styles to prevent theme bleeding
// const styles = {
//   container: {
//     display: 'flex',
//     height: '100vh',
//     width: '100vw',
//     backgroundColor: '#f3f4f9',
//     overflow: 'hidden',
//     fontFamily: '"Inter", sans-serif',
//   },
//   sidebar: {
//     backgroundColor: '#2c3652',
//     margin: '15px',
//     borderRadius: '30px',
//     display: 'flex',
//     flexDirection: 'column',
//     transition: 'width 0.3s ease',
//     boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
//     zIndex: 10,
//   },
//   profileWrapper: {
//     padding: '30px 20px 20px 20px',
//   },
//   profilePill: {
//     backgroundColor: 'rgba(255,255,255,0.08)',
//     borderRadius: '50px',
//     padding: '6px 12px',
//     display: 'flex',
//     alignItems: 'center',
//     gap: '12px',
//     border: '1px solid rgba(255,255,255,0.1)',
//   },
//   avatar: {
//     width: '36px',
//     height: '36px',
//     borderRadius: '50%',
//     border: '2px solid #fff',
//     objectFit: 'cover',
//   },
//   profileText: {
//     display: 'flex',
//     flexDirection: 'column',
//     overflow: 'hidden',
//   },
//   userName: { color: '#fff', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' },
//   userRole: { color: 'rgba(255,255,255,0.5)', fontSize: '10px', textTransform: 'uppercase' },
//   navContainer: {
//     flex: 1,
//     paddingLeft: '20px',
//     overflowY: 'auto',
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '2px',
//   },
//   dropdownContent: {
//     display: 'flex',
//     flexDirection: 'column',
//     paddingLeft: '35px',
//     marginBottom: '10px',
//   },
//   logoutSection: {
//     padding: '20px',
//     borderTop: '1px solid rgba(255,255,255,0.05)',
//   },
//   logoutBtn: {
//     background: 'none',
//     border: 'none',
//     display: 'flex',
//     alignItems: 'center',
//     gap: '12px',
//     color: 'rgba(255,255,255,0.6)',
//     fontSize: '13px',
//     cursor: 'pointer',
//     width: '100%',
//   },
//   logoutIconCircle: {
//     width: '32px',
//     height: '32px',
//     borderRadius: '50%',
//     border: '1px solid rgba(255,255,255,0.2)',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   mainWrapper: {
//     flex: 1,
//     display: 'flex',
//     flexDirection: 'column',
//     minWidth: 0,
//   },
//   mainContent: {
//     flex: 1,
//     padding: '10px 25px 25px 25px',
//     overflowY: 'auto',
//   }
// };