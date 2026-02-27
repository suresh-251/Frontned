// import { NavLink, Outlet } from "react-router-dom";

// const linkClass = ({ isActive }) =>
//   `flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
//     isActive
//       ? "bg-white text-indigo-600 shadow-md"
//       : "text-white/90 hover:bg-white/20"
//   }`;

// export default function HRLayout() {
//   return (
//     <div className="h-screen w-screen bg-gray-100 flex items-center justify-center">
//       {/* App Container */}
//       <div className="w-[97%] h-[94%] bg-white rounded-3xl shadow-xl flex overflow-hidden">
        
//         {/* Sidebar */}
// <aside className="w-64 bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 flex flex-col rounded-l-3xl">

//   {/* Inner Wrapper */}
//   <div className="flex flex-col h-full px-5 py-5">

//     {/* Header */}
//     <div className="mb-6">
//       <h2 className="text-xl font-bold text-white tracking-wide">
//         HR CRM
//       </h2>
//       <p className="text-[11px] text-white/80">
//         Management Control Panel
//       </p>
//     </div>

//     {/* Navigation */}
//     <nav className="flex flex-col gap-1 flex-1">
//       <NavLink to="/crm/hr/dashboard" className={linkClass}>
//         Dashboard
//       </NavLink>
//       <NavLink to="/crm/hr/employees" className={linkClass}>
//         Employees
//       </NavLink>
//       <NavLink to="/crm/hr/branch" className={linkClass}>
//         Branch
//       </NavLink>
//       <NavLink to="/crm/hr/project" className={linkClass}>
//         Project
//       </NavLink>
//       <NavLink to="/crm/hr/leads" className={linkClass}>
//         Leads
//       </NavLink>
//       <NavLink to="/crm/hr/departments" className={linkClass}>
//         Departments
//       </NavLink>
//       <NavLink to="/crm/hr/attendance" className={linkClass}>
//         Attendance
//       </NavLink>
//       <NavLink to="/crm/hr/recruitment" className={linkClass}>
//         Recruitment
//       </NavLink>
//       {/* <NavLink to="/crm/hr/knowledge" className={linkClass}>
//         Knowledge
//       </NavLink> */}
//       <NavLink to="/crm/hr/todo" className={linkClass}>
//         Todo
//       </NavLink>
//     </nav>

//     {/* Logout */}
//     <button
//       onClick={() => {
//         localStorage.removeItem("accessToken");
//         window.location.href = "/crm/hr/login";
//       }}
//       className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 
//                  rounded-xl bg-white text-red-600 font-semibold 
//                  hover:bg-red-600 hover:text-white 
//                  transition-all duration-300 shadow-md"
//     >
//       <svg
//         className="w-4 h-4"
//         fill="none"
//         stroke="currentColor"
//         viewBox="0 0 24 24"
//       >
//         <path
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeWidth={2}
//           d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
//         />
//       </svg>
//       Logout
//     </button>

//   </div>
// </aside>
        
//         {/* Main Content (Clean & Light) */}
//         <main className="flex-1 bg-gray-50 p-6 overflow-hidden">
//           <div className="bg-white rounded-2xl shadow-sm h-full p-6">
//             <Outlet />
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }


// ================================================================================================




// import { NavLink, Outlet } from "react-router-dom";
// import { 
//   LayoutDashboard, Users, MapPin, Briefcase, 
//   Target, Fingerprint, UserPlus, CheckSquare, LogOut, ChevronRight
// } from "lucide-react";
// import Topbar from "./Topbar"; // Assuming you'll place Topbar in the same folder

// const linkClass = ({ isActive }) =>
//   `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
//     isActive
//       ? "bg-indigo-50 text-indigo-600 shadow-sm"
//       : "text-slate-500 hover:bg-gray-50 hover:text-slate-900"
//   }`;

// export default function HRLayout() {
//   return (
//     <div className="h-screen w-screen bg-[#F8FAFC] flex overflow-hidden">
//       {/* Sidebar */}
//       <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20">
//         <div className="p-6">
//           <div className="flex items-center gap-3 px-2">
//             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-lg">
//               <Briefcase className="text-white w-6 h-6" />
//             </div>
//             <div>
//               <h2 className="text-lg font-bold text-slate-800 leading-none">Synergy</h2>
//               <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">HR Management</p>
//             </div>
//           </div>
//         </div>

//         <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
//           <div className="pb-4">
//             <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2">Main Menu</p>
//             <NavLink to="/crm/hr/dashboard" className={linkClass}>
//               <LayoutDashboard size={18} /> Dashboard
//             </NavLink>
//           </div>

//           <div className="pb-4">
//             <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2">Organization</p>
//             <NavLink to="/crm/hr/branch" className={linkClass}>
//               <MapPin size={18} /> Branch
//             </NavLink>
//             {/* Indented Sub-links for Hierarchy */}
//             <div className="ml-4 border-l border-slate-100 mt-1 space-y-1">
//               <NavLink to="/crm/hr/departments" className={linkClass}>
//                 <ChevronRight size={14} className="opacity-50" /> Departments
//               </NavLink>
//               <NavLink to="/crm/hr/employees" className={linkClass}>
//                 <ChevronRight size={14} className="opacity-50" /> Employees
//               </NavLink>
//             </div>
//           </div>

//           <div className="pb-4">
//             <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2">Operations</p>
//             <NavLink to="/crm/hr/project" className={linkClass}>
//               <Briefcase size={18} /> Projects
//             </NavLink>
//             <NavLink to="/crm/hr/attendance" className={linkClass}>
//               <Fingerprint size={18} /> Attendance
//             </NavLink>
//             <NavLink to="/crm/hr/recruitment" className={linkClass}>
//               <UserPlus size={18} /> Recruitment
//             </NavLink>
//             <NavLink to="/crm/hr/todo" className={linkClass}>
//               <CheckSquare size={18} /> My Tasks
//             </NavLink>
//           </div>
//         </nav>

//         {/* User Footer / Logout */}
//         <div className="p-4 border-t border-slate-100">
//           <button
//             onClick={() => {
//               localStorage.removeItem("accessToken");
//               window.location.href = "/crm/hr/login";
//             }}
//             className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
//           >
//             <LogOut size={18} /> Logout
//           </button>
//         </div>
//       </aside>

//       {/* Main Content Area */}
//       <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         <Topbar />
//         <main className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
//           <div className="max-w-7xl mx-auto">
//             <Outlet />
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }


//===========================================================================================



import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, MapPin, Briefcase, 
  Fingerprint, UserPlus, CheckSquare, LogOut, 
  ChevronDown, Menu, Building2, BookOpen, Clock, 
  ShieldCheck, FileText, ClipboardCheck
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import Topbar from "./Topbar";

export default function HRLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [user, setUser] = useState({ name: "User", role: "HR" });
  const location = useLocation();

  // Handle auto-opening dropdowns based on current path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('branch') || path.includes('departments') || path.includes('employees')) {
      setIsBranchOpen(true);
    }
    if (path.includes('overtime') || path.includes('shift')) {
      setIsShiftOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          name: decoded.name || decoded.username || "Admin",
          role: decoded.role || "Management"
        });
      } catch (error) { console.error("Token Error", error); }
    }
  }, []);

  const linkClass = (isActive) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-indigo-50 text-indigo-600 shadow-sm"
        : "text-slate-500 hover:bg-gray-50 hover:text-slate-900"
    } ${isCollapsed ? "justify-center px-0" : ""}`;

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] flex overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? "w-20" : "w-72"} bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 shadow-sm`}>
        
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <Briefcase className="text-white w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 leading-none">HR</h2>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Management</p>
              </div>
            </div>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
            <Menu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
          <NavLink to="/crm/hr/dashboard" className={({isActive}) => linkClass(isActive)}>
            <LayoutDashboard size={20} />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>

          {/* Branch Dropdown */}
          <div className="space-y-1">
            <NavLink 
              to="/crm/hr/branch" 
              className={({isActive}) => `${linkClass(isActive || location.pathname.includes('branch'))} w-full`}
              onClick={() => !isCollapsed && setIsBranchOpen(!isBranchOpen)}
            >
              <MapPin size={20} />
              {!isCollapsed && <span className="flex-1">Branch</span>}
              {!isCollapsed && <ChevronDown size={14} className={`transition-transform ${isBranchOpen ? "rotate-180" : ""}`} />}
            </NavLink>
            {!isCollapsed && isBranchOpen && (
              <div className="ml-4 pl-4 border-l-2 border-slate-50 space-y-1">
                <NavLink to="/crm/hr/departments" className={({isActive}) => linkClass(isActive)}>
                  <Building2 size={18} /> <span>Departments</span>
                </NavLink>
                <NavLink to="/crm/hr/employees" className={({isActive}) => linkClass(isActive)}>
                  <Users size={18} /> <span>Employees</span>
                </NavLink>
              </div>
            )}
          </div>

          <NavLink to="/crm/hr/recruitment" className={({isActive}) => linkClass(isActive)}>
            <UserPlus size={20} />
            {!isCollapsed && <span>Recruitment</span>}
          </NavLink>

          <NavLink to="/crm/hr/attendance" className={({isActive}) => linkClass(isActive)}>
            <Fingerprint size={20} />
            {!isCollapsed && <span>Attendance</span>}
          </NavLink>

          {/* Shift Dropdown */}
          <div className="space-y-1">
            <button 
              className={`${linkClass(location.pathname.includes('overtime'))} w-full`}
              onClick={() => !isCollapsed && setIsShiftOpen(!isShiftOpen)}
            >
              <Clock size={20} />
              {!isCollapsed && <span className="flex-1 text-left">Shift</span>}
              {!isCollapsed && <ChevronDown size={14} className={`transition-transform ${isShiftOpen ? "rotate-180" : ""}`} />}
            </button>
            {!isCollapsed && isShiftOpen && (
              <div className="ml-4 pl-4 border-l-2 border-slate-50 space-y-1">
                <NavLink to="/crm/hr/overtime-approval" className={({isActive}) => linkClass(isActive)}>
                  <ShieldCheck size={18} /> <span>Overtime Approval</span>
                </NavLink>
                <NavLink to="/crm/hr/overtime-policy" className={({isActive}) => linkClass(isActive)}>
                  <FileText size={18} /> <span>Overtime Policy</span>
                </NavLink>
                <NavLink to="/crm/hr/overtime-record" className={({isActive}) => linkClass(isActive)}>
                  <ClipboardCheck size={18} /> <span>Overtime Record</span>
                </NavLink>
              </div>
            )}
          </div>

          <NavLink to="/crm/hr/knowledge" className={({isActive}) => linkClass(isActive)}>
            <BookOpen size={20} />
            {!isCollapsed && <span>Knowledge</span>}
          </NavLink>

          <NavLink to="/crm/hr/todo" className={({isActive}) => linkClass(isActive)}>
            <CheckSquare size={20} />
            {!isCollapsed && <span>Todo</span>}
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => { localStorage.removeItem("accessToken"); window.location.href = "/crm/hr/login"; }}
            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all ${isCollapsed ? "justify-center" : ""}`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
<div className="flex-1 flex flex-col min-w-0">
  <Topbar userData={user} onMenuClick={() => setIsMobileOpen(true)} />
  
  {/* The p-4 or p-6 here adds the necessary "breathing room" around your content */}
  <main className="flex-1 overflow-y-auto p-4 md:p-6">
     <div className="max-w-7xl mx-auto">
       <Outlet />
     </div>
  </main>
</div>
    </div>
  );
}