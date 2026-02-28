// import React, { useState, useEffect } from "react";
// import { NavLink, Outlet, useLocation } from "react-router-dom";
// import { 
//   LayoutDashboard, Users, MapPin, Briefcase, 
//   Fingerprint, UserPlus, CheckSquare, LogOut, 
//   ChevronDown, Menu, Building2, BookOpen, Clock, 
//   ShieldCheck, FileText, ClipboardCheck
// } from "lucide-react";
// import { jwtDecode } from "jwt-decode";
// import Topbar from "./Topbar";

// export default function HRLayout() {
//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const [isBranchOpen, setIsBranchOpen] = useState(false);
//   const [isShiftOpen, setIsShiftOpen] = useState(false);
//   const [user, setUser] = useState({ name: "User", role: "HR" });
//   const location = useLocation();

//   // Handle auto-opening dropdowns based on current path
//   useEffect(() => {
//     const path = location.pathname;
//     if (path.includes('branch') || path.includes('departments') || path.includes('employees')) {
//       setIsBranchOpen(true);
//     }
//     if (path.includes('overtime') || path.includes('shift')) {
//       setIsShiftOpen(true);
//     }
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
//     `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
//       isActive
//         ? "bg-indigo-50 text-indigo-600 shadow-sm"
//         : "text-slate-500 hover:bg-gray-50 hover:text-slate-900"
//     } ${isCollapsed ? "justify-center px-0" : ""}`;

//   return (
//     <div className="h-screen w-screen bg-[#F8FAFC] flex overflow-hidden font-sans text-slate-900">
//       {/* Sidebar */}
//       <aside className={`${isCollapsed ? "w-20" : "w-72"} bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 shadow-sm`}>
        
//         {/* Header */}
//         <div className="p-6 flex items-center justify-between">
//           {!isCollapsed && (
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
//                 <Briefcase className="text-white w-5 h-5" />
//               </div>
//               <div>
//                 <h2 className="text-lg font-bold text-slate-800 leading-none">HR</h2>
//                 <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Management</p>
//               </div>
//             </div>
//           )}
//           <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
//             <Menu size={20} />
//           </button>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
//           <NavLink to="/crm/hr/dashboard" className={({isActive}) => linkClass(isActive)}>
//             <LayoutDashboard size={20} />
//             {!isCollapsed && <span>Dashboard</span>}
//           </NavLink>

//           {/* Branch Dropdown */}
//           <div className="space-y-1">
//             <NavLink 
//               to="/crm/hr/branch" 
//               className={({isActive}) => `${linkClass(isActive || location.pathname.includes('branch'))} w-full`}
//               onClick={() => !isCollapsed && setIsBranchOpen(!isBranchOpen)}
//             >
//               <MapPin size={20} />
//               {!isCollapsed && <span className="flex-1">Branch</span>}
//               {!isCollapsed && <ChevronDown size={14} className={`transition-transform ${isBranchOpen ? "rotate-180" : ""}`} />}
//             </NavLink>
//             {!isCollapsed && isBranchOpen && (
//               <div className="ml-4 pl-4 border-l-2 border-slate-50 space-y-1">
//                 <NavLink to="/crm/hr/departments" className={({isActive}) => linkClass(isActive)}>
//                   <Building2 size={18} /> <span>Departments</span>
//                 </NavLink>
//                 <NavLink to="/crm/hr/employees" className={({isActive}) => linkClass(isActive)}>
//                   <Users size={18} /> <span>Employees</span>
//                 </NavLink>
//               </div>
//             )}
//           </div>

//           <NavLink to="/crm/hr/recruitment" className={({isActive}) => linkClass(isActive)}>
//             <UserPlus size={20} />
//             {!isCollapsed && <span>Recruitment</span>}
//           </NavLink>

//           <NavLink to="/crm/hr/attendance" className={({isActive}) => linkClass(isActive)}>
//             <Fingerprint size={20} />
//             {!isCollapsed && <span>Attendance</span>}
//           </NavLink>

//           {/* Shift Dropdown */}
//           <div className="space-y-1">
//             <button 
//               className={`${linkClass(location.pathname.includes('overtime'))} w-full`}
//               onClick={() => !isCollapsed && setIsShiftOpen(!isShiftOpen)}
//             >
//               <Clock size={20} />
//               {!isCollapsed && <span className="flex-1 text-left">Shift</span>}
//               {!isCollapsed && <ChevronDown size={14} className={`transition-transform ${isShiftOpen ? "rotate-180" : ""}`} />}
//             </button>
//             {!isCollapsed && isShiftOpen && (
//               <div className="ml-4 pl-4 border-l-2 border-slate-50 space-y-1">
//                 <NavLink to="/crm/hr/overtime-approval" className={({isActive}) => linkClass(isActive)}>
//                   <ShieldCheck size={18} /> <span>Overtime Approval</span>
//                 </NavLink>
//                 <NavLink to="/crm/hr/overtime-policy" className={({isActive}) => linkClass(isActive)}>
//                   <FileText size={18} /> <span>Overtime Policy</span>
//                 </NavLink>
//                 <NavLink to="/crm/hr/overtime-record" className={({isActive}) => linkClass(isActive)}>
//                   <ClipboardCheck size={18} /> <span>Overtime Record</span>
//                 </NavLink>
//               </div>
//             )}
//           </div>

//           <NavLink to="/crm/hr/knowledge" className={({isActive}) => linkClass(isActive)}>
//             <BookOpen size={20} />
//             {!isCollapsed && <span>Knowledge</span>}
//           </NavLink>

//           <NavLink to="/crm/hr/todo" className={({isActive}) => linkClass(isActive)}>
//             <CheckSquare size={20} />
//             {!isCollapsed && <span>Todo</span>}
//           </NavLink>
//         </nav>

//         {/* Footer */}
//         <div className="p-4 border-t border-slate-100">
//           <button
//             onClick={() => { localStorage.removeItem("accessToken"); window.location.href = "/crm/hr/login"; }}
//             className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all ${isCollapsed ? "justify-center" : ""}`}
//           >
//             <LogOut size={20} />
//             {!isCollapsed && <span>Logout</span>}
//           </button>
//         </div>
//       </aside>

//       {/* Main Container */}
// <div className="flex-1 flex flex-col min-w-0">
//   <Topbar userData={user} onMenuClick={() => setIsMobileOpen(true)} />
  
//   {/* The p-4 or p-6 here adds the necessary "breathing room" around your content */}
//   <main className="flex-1 overflow-y-auto p-4 md:p-6">
//      <div className="max-w-7xl mx-auto">
//        <Outlet />
//      </div>
//   </main>
// </div>
//     </div>
//   );
// }









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

  // Handle auto-opening dropdowns based on current path logic
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('branch') || path.includes('departments') || path.includes('employees')) {
      setIsBranchOpen(true);
    }
    if (path.includes('shift') || path.includes('overtime')) {
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

        {/* Navigation Scroll Area */}
        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
          
          {/* Dashboard */}
          <NavLink to="/crm/hr/dashboard" className={({isActive}) => linkClass(isActive)}>
            <LayoutDashboard size={20} />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>

          {/* Branch Dropdown - Reference Logic */}
          <div className="space-y-1">
            <NavLink 
              to="/crm/hr/branch" 
              className={({isActive}) => `${linkClass(isActive || location.pathname.includes('departments') || location.pathname.includes('employees'))} w-full`}
              onClick={() => !isCollapsed && setIsBranchOpen(!isBranchOpen)}
            >
              <MapPin size={20} />
              {!isCollapsed && <span className="flex-1 text-left">Branch</span>}
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

          {/* Recruitment */}
          <NavLink to="/crm/hr/recruitment" className={({isActive}) => linkClass(isActive)}>
            <UserPlus size={20} />
            {!isCollapsed && <span>Recruitment</span>}
          </NavLink>

          {/* Attendance */}
          <NavLink to="/crm/hr/attendance" className={({isActive}) => linkClass(isActive)}>
            <Fingerprint size={20} />
            {!isCollapsed && <span>Attendance</span>}
          </NavLink>

          {/* Shift Dropdown - EXACT SAME LOGIC AS BRANCH */}
          <div className="space-y-1">
            <NavLink 
              to="/crm/hr/shift" 
              className={({isActive}) => `${linkClass(isActive || location.pathname.includes('overtime'))} w-full`}
              onClick={() => !isCollapsed && setIsShiftOpen(!isShiftOpen)}
            >
              <Clock size={20} />
              {!isCollapsed && <span className="flex-1 text-left">Shift</span>}
              {!isCollapsed && <ChevronDown size={14} className={`transition-transform ${isShiftOpen ? "rotate-180" : ""}`} />}
            </NavLink>
            
            {!isCollapsed && isShiftOpen && (
              <div className="ml-4 pl-4 border-l-2 border-slate-50 space-y-1">
                <NavLink to="/crm/hr/overtimeApproval" className={({isActive}) => linkClass(isActive)}>
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

          {/* Knowledge */}
          <NavLink to="/crm/hr/knowledge" className={({isActive}) => linkClass(isActive)}>
            <BookOpen size={20} />
            {!isCollapsed && <span>Knowledge</span>}
          </NavLink>

          {/* Todo */}
          <NavLink to="/crm/hr/todo" className={({isActive}) => linkClass(isActive)}>
            <CheckSquare size={20} />
            {!isCollapsed && <span>Todo</span>}
          </NavLink>
        </nav>

        {/* User Footer / Logout */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => { 
              localStorage.removeItem("accessToken"); 
              window.location.href = "/crm/hr/login"; 
            }}
            className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all ${isCollapsed ? "justify-center" : ""}`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar userData={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}