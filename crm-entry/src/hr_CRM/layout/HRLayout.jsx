// import React, { useState, useEffect } from "react";
// import { NavLink, Outlet, useLocation } from "react-router-dom";
// import { 
//   LayoutDashboard, Users, MapPin, Briefcase, 
//   Fingerprint, UserPlus, CheckSquare, LogOut, 
//   ChevronDown, Menu, Building2, BookOpen, Clock, 
//   FolderKanban, ClipboardCheck
// } from "lucide-react";
// import { jwtDecode } from "jwt-decode";
// import Topbar from "./Topbar";

// export default function HRLayout() {
//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const [isBranchOpen, setIsBranchOpen] = useState(false);
//   const [isDeptOpen, setIsDeptOpen] = useState(false);
//   const [isShiftOpen, setIsShiftOpen] = useState(false);
//   const [isRecruitOpen, setIsRecruitOpen] = useState(false);
//   const [user, setUser] = useState({ name: "User", role: "HR" });
//   const location = useLocation();

//   useEffect(() => {
//     const path = location.pathname;
//     if (path.includes('branch') || path.includes('employees')) setIsBranchOpen(true);
//     if (path.includes('department')) setIsDeptOpen(true);
//     if (path.includes('shift') || path.includes('overtime')) setIsShiftOpen(true);
//     if (path.includes('recruitment') || path.includes('onboarding')) setIsRecruitOpen(true);
//   }, [location.pathname]);

//   useEffect(() => {
//     const token = localStorage.getItem("accessToken");
//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
//         setUser({
//           name: decoded.name || decoded.username || "Admin",
//           role: decoded.role || "Management"
//         });
//       } catch (error) { console.error("Token Error", error); }
//     }
//   }, []);

//   const linkClass = (isActive) =>
//     `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-200 ${
//       isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
//     } ${isCollapsed ? "justify-center px-0 mx-auto w-10" : ""}`;

//   const subLinkClass = (isActive) =>
//     `flex items-center gap-2 px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-all ${
//       isActive ? "text-indigo-600 bg-indigo-50/50" : "text-slate-400 hover:text-slate-700"
//     }`;

//   return (
//     <div className="h-screen w-screen bg-[#F8FAFC] flex overflow-hidden font-sans text-slate-900">
//       <aside className={`${isCollapsed ? "w-[60px]" : "w-[210px]"} bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 shadow-sm`}>
//         <div className="p-3 mb-2 flex items-center justify-between">
//           {!isCollapsed && (
//             <div className="flex items-center gap-2">
//               <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
//                 <Briefcase className="text-white w-4 h-4" />
//               </div>
//               <div className="overflow-hidden">
//                 <h2 className="text-sm font-bold text-slate-800 truncate">HR</h2>
//                 <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">Management</p>
//               </div>
//             </div>
//           )}
//           <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-slate-50 rounded text-slate-400 mx-auto">
//             <Menu size={18} />
//           </button>
//         </div>

//         <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
//           <NavLink to="/crm/hr/dashboard" className={({isActive}) => linkClass(isActive)}>
//             <LayoutDashboard size={18} />
//             {!isCollapsed && <span>Dashboard</span>}
//           </NavLink>

//           <NavLink 
//     to="/crm/hr/leads" 
//     className={({ isActive }) => linkClass(isActive)}
//   >
//     <Users size={18} />
//     {!isCollapsed && <span>Leads</span>}
//   </NavLink>



//           <div className="space-y-0.5">
//             <div className={`${linkClass(isBranchOpen)} cursor-pointer`} onClick={() => !isCollapsed && setIsBranchOpen(!isBranchOpen)}>
//               <MapPin size={18} />
//               {!isCollapsed && <span className="flex-1">Branch</span>}
//               {!isCollapsed && <ChevronDown size={12} className={`transition-transform ${isBranchOpen ? "rotate-180" : ""}`} />}
//             </div>
//             {!isCollapsed && isBranchOpen && (
//               <div className="ml-3 pl-3 border-l border-slate-100 flex flex-col">
//                 <NavLink to="/crm/hr/branch" className={({isActive}) => subLinkClass(isActive)}>Branch List</NavLink>
//                 <NavLink to="/crm/hr/employees" className={({isActive}) => subLinkClass(isActive)}>Employees</NavLink>
//               </div>
//             )}
//           </div>

//           <div className="space-y-0.5">
//             <div className={`${linkClass(isRecruitOpen)} cursor-pointer`} onClick={() => !isCollapsed && setIsRecruitOpen(!isRecruitOpen)}>
//               <UserPlus size={18} />
//               {!isCollapsed && <span className="flex-1">Recruitment</span>}
//               {!isCollapsed && <ChevronDown size={12} className={`transition-transform ${isRecruitOpen ? "rotate-180" : ""}`} />}
//             </div>
//             {!isCollapsed && isRecruitOpen && (
//               <div className="ml-3 pl-3 border-l border-slate-100 flex flex-col">
//                 <NavLink to="/crm/hr/recruitment" className={({isActive}) => subLinkClass(isActive)}>Recruitment List</NavLink>
//                 <NavLink to="/crm/hr/onboarding" className={({isActive}) => subLinkClass(isActive)}>Onboarding</NavLink>
//               </div>
//             )}
//           </div>

//           <NavLink to="/crm/hr/attendance" className={({isActive}) => linkClass(isActive)}>
//             <Fingerprint size={18} />
//             {!isCollapsed && <span>Attendance</span>}
//           </NavLink>

//           <NavLink to="/crm/hr/project" className={({isActive}) => linkClass(isActive)}>
//             <FolderKanban size={18} />
//             {!isCollapsed && <span>Project</span>}
//           </NavLink>

//           <div className="space-y-0.5">
//             <div className={`${linkClass(isDeptOpen)} cursor-pointer`} onClick={() => !isCollapsed && setIsDeptOpen(!isDeptOpen)}>
//               <Building2 size={18} />
//               {!isCollapsed && <span className="flex-1">Departments</span>}
//               {!isCollapsed && <ChevronDown size={12} className={`transition-transform ${isDeptOpen ? "rotate-180" : ""}`} />}
//             </div>
//             {!isCollapsed && isDeptOpen && (
//               <div className="ml-3 pl-3 border-l border-slate-100 flex flex-col">
//                 <NavLink to="/crm/hr/departments" className={({isActive}) => subLinkClass(isActive)}>Dept Overview</NavLink>
//                 <NavLink to="/crm/hr/department-budget" className={({isActive}) => subLinkClass(isActive)}>Dept Budget</NavLink>
//                 <NavLink to="/crm/hr/budget-change" className={({isActive}) => subLinkClass(isActive)}>Budget Change</NavLink>
//                 <NavLink to="/crm/hr/department-role" className={({isActive}) => subLinkClass(isActive)}>Dept Roles</NavLink>
//               </div>
//             )}
//           </div>

//           <div className="space-y-0.5">
//             <div className={`${linkClass(isShiftOpen)} cursor-pointer`} onClick={() => !isCollapsed && setIsShiftOpen(!isShiftOpen)}>
//               <Clock size={18} />
//               {!isCollapsed && <span className="flex-1">Shift</span>}
//               {!isCollapsed && <ChevronDown size={12} className={`transition-transform ${isShiftOpen ? "rotate-180" : ""}`} />}
//             </div>
//             {!isCollapsed && isShiftOpen && (
//               <div className="ml-3 pl-3 border-l border-slate-100 flex flex-col">
//                 <NavLink to="/crm/hr/shift" className={({isActive}) => subLinkClass(isActive)}>Shift Management</NavLink>
//                 <NavLink to="/crm/hr/overtimeApproval" className={({isActive}) => subLinkClass(isActive)}>Overtime Approval</NavLink>
//                 <NavLink to="/crm/hr/overtime-policy" className={({isActive}) => subLinkClass(isActive)}>Overtime Policy</NavLink>
//                 <NavLink to="/crm/hr/overtime-record" className={({isActive}) => subLinkClass(isActive)}>Overtime Record</NavLink>
//               </div>
//             )}
//           </div>

//           <NavLink to="/crm/hr/knowledge" className={({isActive}) => linkClass(isActive)}>
//             <BookOpen size={18} />
//             {!isCollapsed && <span>Knowledge</span>}
//           </NavLink>

//           <NavLink to="/crm/hr/todo" className={({isActive}) => linkClass(isActive)}>
//             <CheckSquare size={18} />
//             {!isCollapsed && <span>Todo</span>}
//           </NavLink>
//         </nav>

//         <div className="p-2 border-t border-slate-100">
//           <button
//             onClick={() => { localStorage.removeItem("accessToken"); window.location.href = "/crm/hr/login"; }}
//             className={`flex items-center gap-2.5 w-full px-2.5 py-2 text-[12.5px] font-semibold text-rose-500 hover:bg-rose-50 rounded-lg transition-all ${isCollapsed ? "justify-center" : ""}`}
//           >
//             <LogOut size={18} />
//             {!isCollapsed && <span>Logout</span>}
//           </button>
//         </div>
//       </aside>

//       <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         <Topbar userData={user} />
//         <main className="flex-1 overflow-y-auto p-4 bg-[#F8FAFC]">
//           <div className="max-w-[1600px] mx-auto h-full italic-none">
//             <Outlet />
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }



//     working hrlayout ===============================================================


// import React, { useState, useEffect } from "react";
// import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
// import { ChevronDown, Menu, LogOut, Briefcase } from "lucide-react";
// import { jwtDecode } from "jwt-decode";
// import Topbar from "./Topbar";
// import { USER_MENU } from "../configs/userManu";
// import { MANAGER_MENU } from "../configs/managerMenu";

// export default function HRLayout() {
//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const [dropdowns, setDropdowns] = useState({});
//   const [user, setUser] = useState({ name: "User", role: "" });
//   const location = useLocation();
//   const navigate = useNavigate();

//   // The specific key used by Microsoft Identity
//   const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

//   useEffect(() => {
//     const token = localStorage.getItem("accessToken");
//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
//         // FIX: Accessing the role using bracket notation
//         const detectedRole = decoded[ROLE_CLAIM]; 
        
//         setUser({
//           name: decoded.name || "User",
//           role: detectedRole 
//         });
//       } catch (error) { console.error("Token Error", error); }
//     }
//   }, []);

//   // Determine which menu to show based on the verified role string
//   const activeMenu = user.role === "HR_MANAGER" ? MANAGER_MENU : USER_MENU;

//   const toggleDropdown = (key) => {
//     if (!isCollapsed) {
//       setDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
//     }
//   };

//   const linkClass = (isActive) =>
//     `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-200 ${
//       isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
//     } ${isCollapsed ? "justify-center px-0 mx-auto w-10" : ""}`;

//   return (
//     <div className="h-screen w-screen bg-[#F8FAFC] flex overflow-hidden">
//       <aside className={`${isCollapsed ? "w-[60px]" : "w-[210px]"} bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 shadow-sm`}>
        
//         <div className="p-3 mb-2 flex items-center justify-between">
//           {!isCollapsed && (
//             <div className="flex items-center gap-2">
//               <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
//                 <Briefcase className="text-white w-4 h-4" />
//               </div>
//               <div className="overflow-hidden">
//                 <h2 className="text-sm font-bold text-slate-800 truncate">HR CRM</h2>
//                 <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">
//                    {user.role === "HR_MANAGER" ? "Management" : "Staff"}
//                 </p>
//               </div>
//             </div>
//           )}
//           <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-slate-50 rounded text-slate-400 mx-auto">
//             <Menu size={18} />
//           </button>
//         </div>

//         <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
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
//                     <div className="ml-3 pl-3 border-l border-slate-100 flex flex-col">
//                       {item.children.map((child, idx) => (
//                         <NavLink key={idx} to={child.path} className={({isActive}) => `text-[11.5px] py-1.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
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

//       <div className="flex-1 flex flex-col overflow-hidden">
//         <Topbar userData={user} />
//         <main className="flex-1 overflow-y-auto p-4 bg-[#F8FAFC]">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }



// import React, { useState, useEffect } from "react";
// import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
// import { ChevronDown, Menu, LogOut, Briefcase } from "lucide-react";
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
//       } catch (error) { console.error("Token Error", error); }
//     }
//   }, []);


//   useEffect(() => {
//   const token = localStorage.getItem("accessToken");
//   if (token) {
//     try {
//       const decoded = jwtDecode(token);

//       // 🔍 ADD THIS LINE HERE:
//       console.log("MY DECODED TOKEN:", decoded);

//       setUser({
//         ...decoded,
//         name: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || decoded.unique_name || "User",
//         role: decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
//       });
//     } catch (error) {
//       console.error("Token Error", error);
//     }
//   }
// }, []);

//   if (!user) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;

//   const activeMenu = user.role === "HR_MANAGER" ? MANAGER_MENU : USER_MENU;

//   const toggleDropdown = (key) => {
//     if (!isCollapsed) setDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
//   };

//   const linkClass = (isActive) =>
//     `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-all ${
//       isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
//     } ${isCollapsed ? "justify-center px-0 mx-auto w-10" : ""}`;

//   return (
//     <div className="h-screen w-screen bg-[#F8FAFC] flex overflow-hidden font-sans text-slate-900">
//       <aside className={`${isCollapsed ? "w-[60px]" : "w-[210px]"} bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 shadow-sm`}>
//         <div className="p-3 mb-2 flex items-center justify-between">
//           {!isCollapsed && (
//             <div className="flex items-center gap-2">
//               <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
//                 <Briefcase className="text-white w-4 h-4" />
//               </div>
//               <h2 className="text-sm font-bold text-slate-800">HR</h2>
//             </div>
//           )}
//           <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-slate-50 rounded text-slate-400 mx-auto">
//             <Menu size={18} />
//           </button>
//         </div>

//         <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
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
//                     <div className="ml-3 pl-3 border-l border-slate-100 flex flex-col">
//                       {item.children.map((child, idx) => (
//                         <NavLink key={idx} to={child.path} className={({isActive}) => `text-[11.5px] py-1.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
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
//         <main className="flex-1 overflow-y-auto p-4 bg-[#F8FAFC]">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }






// import React, { useState, useEffect } from "react";
// import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
// import { ChevronDown, Menu, LogOut, Briefcase } from "lucide-react";
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

//   // --- THEME INITIALIZATION ---
//   useEffect(() => {
//     // On mount, apply the theme saved in localStorage to the document
//     const savedTheme = localStorage.getItem("hr-crm-theme") || "light";
//     document.documentElement.setAttribute("data-theme", savedTheme);
//   }, []);

//   // Microsoft Identity Claims
//   const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
//   const NAME_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

//   useEffect(() => {
//     const token = localStorage.getItem("accessToken");
//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
//         console.log("MY DECODED TOKEN:", decoded);
//         setUser({
//           ...decoded,
//           name: decoded[NAME_CLAIM] || decoded.unique_name || decoded.name || "Authorized User",
//           role: decoded[ROLE_CLAIM]
//         });
//       } catch (error) { console.error("Token Error", error); }
//     }
//   }, []);

//   if (!user) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;

//   const activeMenu = user.role === "HR_MANAGER" ? MANAGER_MENU : USER_MENU;

//   const toggleDropdown = (key) => {
//     if (!isCollapsed) setDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
//   };

//   // --- THEME-AWARE CLASSES ---
//   // We use bg-[var(--bg-card)] and text-[var(--text-main)] to link to our CSS variables
//   const linkClass = (isActive) =>
//     `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-all ${
//       isActive 
//         ? "bg-indigo-50/10 text-indigo-500 border border-indigo-500/20" 
//         : "text-slate-500 hover:bg-slate-50/10 hover:text-[var(--text-main)]"
//     } ${isCollapsed ? "justify-center px-0 mx-auto w-10" : ""}`;

//   return (
//     /* Changed hardcoded bg-[#F8FAFC] to var(--bg-body) */
//     <div className="h-screen w-screen bg-[var(--bg-body)] flex overflow-hidden font-sans text-[var(--text-main)] transition-colors duration-300">
      
//       {/* Aside: Changed bg-white to var(--bg-card) and border color to variable */}
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

//         <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
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
//         {/* Main Content: Changed hardcoded bg to var(--bg-body) */}
//         <main className="flex-1 overflow-y-auto p-4 bg-[var(--bg-body)] transition-colors duration-300">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }





// import React, { useState, useEffect } from "react";
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

//   useEffect(() => {
//     const savedTheme = localStorage.getItem("hr-crm-theme") || "light";
//     document.documentElement.setAttribute("data-theme", savedTheme);
//   }, []);

//   // Microsoft Identity Claims
//   const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
//   const NAME_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

//   useEffect(() => {
//     const token = localStorage.getItem("accessToken");
//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
        
//         // --- LOGIC TO CAPTURE BOTH ROLES AND PERMISSIONS ---
//         // 1. Get Roles (Microsoft format or standard)
//         const roles = decoded[ROLE_CLAIM] || decoded.roles || decoded.role || [];
//         // 2. Get Permissions (Commonly in 'permissions' or 'scp' or 'extension_Permission')
//         const permissions = decoded.permissions || decoded.scp || decoded.extension_Permission || [];
        
//         // Flatten everything into one array for easy checking
//         const allAccess = [
//           ...(Array.isArray(roles) ? roles : [roles]),
//           ...(Array.isArray(permissions) ? permissions : (typeof permissions === 'string' ? permissions.split(' ') : [permissions]))
//         ];

//         console.log("Access Found:", allAccess); // Check your console to see if CRM_FULL_ACCESS is here

//         setUser({
//           ...decoded,
//           name: decoded[NAME_CLAIM] || decoded.unique_name || decoded.name || "Authorized User",
//           accessList: allAccess
//         });
//       } catch (error) { 
//         console.error("Token Error", error); 
//       }
//     }
//   }, []);

//   if (!user) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;

//   // --- MANAGER ACCESS LOGIC ---
//   // Check if either the Role (HR_MANAGER) or the Permission (CRM_FULL_ACCESS) exists
//   const hasManagerAccess = user.accessList.some(item => 
//     ["HR_MANAGER", "CRM_FULL_ACCESS"].includes(item)
//   );
  
//   const activeMenu = hasManagerAccess ? MANAGER_MENU : USER_MENU;

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

//         <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
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
//         <main className="flex-1 overflow-y-auto p-4 bg-[var(--bg-body)] transition-colors duration-300">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }












import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, Briefcase } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import Topbar from "./Topbar";
import { USER_MENU } from "../configs/userManu";
import { MANAGER_MENU } from "../configs/managerMenu";
import { useRole } from "../hooks/useRole"; 

export default function HRLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dropdowns, setDropdowns] = useState({});
  const [user, setUser] = useState(null);
  
  // Get the access status from our updated hook
  const { isManager } = useRole(); 
  
  const location = useLocation();
  const navigate = useNavigate();

  // --- THEME INITIALIZATION ---
  useEffect(() => {
    const savedTheme = localStorage.getItem("hr-crm-theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const NAME_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
        
        setUser({
          ...decoded,
          name: decoded[NAME_CLAIM] || decoded.unique_name || decoded.username || "Authorized User",
        });
      } catch (error) { console.error("Token Error", error); }
    }
  }, []);

  if (!user) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;

  // DECISION: Show Manager Menu if role is HR_MANAGER OR perm is CRM_FULL_ACCESS
  const activeMenu = isManager ? MANAGER_MENU : USER_MENU;

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
    <div className="h-screen w-screen bg-[var(--bg-body)] flex overflow-hidden font-sans text-[var(--text-main)] transition-colors duration-300">
      
      <aside className={`${isCollapsed ? "w-[60px]" : "w-[210px]"} bg-[var(--bg-card)] border-r border-[var(--border-color)] flex flex-col z-20 transition-all duration-300 shadow-sm`}>
        <div className="p-3 mb-2 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Briefcase className="text-white w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold">HR</h2>
            </div>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-slate-50/10 rounded text-slate-400 mx-auto">
            <Menu size={18} />
          </button>
        </div>

        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
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
        <main className="flex-1 overflow-y-auto p-4 bg-[var(--bg-body)] transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}