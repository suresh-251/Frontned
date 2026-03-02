import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, MapPin, Briefcase, 
  Fingerprint, UserPlus, CheckSquare, LogOut, 
  ChevronDown, Menu, Building2, BookOpen, Clock, 
  ShieldCheck, FileText, ClipboardCheck, Wallet, History
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import Topbar from "./Topbar";

export default function HRLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [user, setUser] = useState({ name: "User", role: "HR" });
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('branch') || path.includes('employees')) setIsBranchOpen(true);
    if (path.includes('department-budget') || path.includes('budget-change') || path.includes('department-role')) setIsDeptOpen(true);
    if (path.includes('shift') || path.includes('overtime')) setIsShiftOpen(true);
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
    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-200 ${
      isActive
        ? "bg-indigo-50 text-indigo-600"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    } ${isCollapsed ? "justify-center px-0 mx-auto w-10" : ""}`;

  const subLinkClass = (isActive) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-md text-[11.5px] font-medium transition-all ${
      isActive ? "text-indigo-600 bg-indigo-50/50" : "text-slate-400 hover:text-slate-700"
    }`;

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] flex overflow-hidden font-sans text-slate-900">
      
      {/* SIDEBAR - Fixed narrow width at 210px */}
      <aside className={`${isCollapsed ? "w-[60px]" : "w-[210px]"} bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 shadow-sm`}>
        
        {/* Header */}
        <div className="p-3 mb-2 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Briefcase className="text-white w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-bold text-slate-800 truncate">HR</h2>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">Management</p>
              </div>
            </div>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-slate-50 rounded text-slate-400 mx-auto">
            <Menu size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          
          <NavLink to="/crm/hr/dashboard" className={({isActive}) => linkClass(isActive)}>
            <LayoutDashboard size={18} />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>

          {/* Branch Dropdown */}
          <div className="space-y-0.5">
            <div className={`${linkClass(isBranchOpen)} cursor-pointer`} onClick={() => !isCollapsed && setIsBranchOpen(!isBranchOpen)}>
              <MapPin size={18} />
              {!isCollapsed && <span className="flex-1">Branch</span>}
              {!isCollapsed && <ChevronDown size={12} className={`transition-transform ${isBranchOpen ? "rotate-180" : ""}`} />}
            </div>
            {!isCollapsed && isBranchOpen && (
              <div className="ml-3 pl-3 border-l border-slate-100 flex flex-col">
                <NavLink to="/crm/hr/branch" className={({isActive}) => subLinkClass(isActive)}>Branch List</NavLink>
                <NavLink to="/crm/hr/employees" className={({isActive}) => subLinkClass(isActive)}>Employees</NavLink>
              </div>
            )}
          </div>

          <NavLink to="/crm/hr/recruitment" className={({isActive}) => linkClass(isActive)}>
            <UserPlus size={18} />
            {!isCollapsed && <span>Recruitment</span>}
          </NavLink>

          <NavLink to="/crm/hr/attendance" className={({isActive}) => linkClass(isActive)}>
            <Fingerprint size={18} />
            {!isCollapsed && <span>Attendance</span>}
          </NavLink>

          {/* Departments Dropdown */}
          <div className="space-y-0.5">
            <div className={`${linkClass(isDeptOpen)} cursor-pointer`} onClick={() => !isCollapsed && setIsDeptOpen(!isDeptOpen)}>
              <Building2 size={18} />
              {!isCollapsed && <span className="flex-1">Departments</span>}
              {!isCollapsed && <ChevronDown size={12} className={`transition-transform ${isDeptOpen ? "rotate-180" : ""}`} />}
            </div>
            {!isCollapsed && isDeptOpen && (
              <div className="ml-3 pl-3 border-l border-slate-100 flex flex-col">
                <NavLink to="/crm/hr/departments" className={({isActive}) => subLinkClass(isActive)}>Dept Overview</NavLink>
                <NavLink to="/crm/hr/department-budget" className={({isActive}) => subLinkClass(isActive)}>Dept Budget</NavLink>
                <NavLink to="/crm/hr/budget-change" className={({isActive}) => subLinkClass(isActive)}>Budget Change</NavLink>
                <NavLink to="/crm/hr/department-role" className={({isActive}) => subLinkClass(isActive)}>Dept Roles</NavLink>
              </div>
            )}
          </div>

          {/* Shift Dropdown */}
          <div className="space-y-0.5">
            <div className={`${linkClass(isShiftOpen)} cursor-pointer`} onClick={() => !isCollapsed && setIsShiftOpen(!isShiftOpen)}>
              <Clock size={18} />
              {!isCollapsed && <span className="flex-1">Shift</span>}
              {!isCollapsed && <ChevronDown size={12} className={`transition-transform ${isShiftOpen ? "rotate-180" : ""}`} />}
            </div>
            {!isCollapsed && isShiftOpen && (
              <div className="ml-3 pl-3 border-l border-slate-100 flex flex-col">
                <NavLink to="/crm/hr/shift" className={({isActive}) => subLinkClass(isActive)}>Shift Management</NavLink>
                <NavLink to="/crm/hr/overtimeApproval" className={({isActive}) => subLinkClass(isActive)}>Overtime Approval</NavLink>
                <NavLink to="/crm/hr/overtime-policy" className={({isActive}) => subLinkClass(isActive)}>Overtime Policy</NavLink>
                <NavLink to="/crm/hr/overtime-record" className={({isActive}) => subLinkClass(isActive)}>Overtime Record</NavLink>
              </div>
            )}
          </div>

          <NavLink to="/crm/hr/knowledge" className={({isActive}) => linkClass(isActive)}>
            <BookOpen size={18} />
            {!isCollapsed && <span>Knowledge</span>}
          </NavLink>

          <NavLink to="/crm/hr/todo" className={({isActive}) => linkClass(isActive)}>
            <CheckSquare size={18} />
            {!isCollapsed && <span>Todo</span>}
          </NavLink>
        </nav>

        {/* User Footer */}
        <div className="p-2 border-t border-slate-100">
          <button
            onClick={() => { localStorage.removeItem("accessToken"); window.location.href = "/crm/hr/login"; }}
            className={`flex items-center gap-2.5 w-full px-2.5 py-2 text-[12.5px] font-semibold text-rose-500 hover:bg-rose-50 rounded-lg transition-all ${isCollapsed ? "justify-center" : ""}`}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar userData={user} />
        <main className="flex-1 overflow-y-auto p-4 bg-[#F8FAFC]">
          <div className="max-w-[1600px] mx-auto h-full italic-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}