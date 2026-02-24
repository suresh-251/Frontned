import { NavLink, Outlet } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
    isActive
      ? "bg-white text-indigo-600 shadow-md"
      : "text-white/90 hover:bg-white/20"
  }`;

export default function HRLayout() {
  return (
    <div className="h-screen w-screen bg-gray-100 flex items-center justify-center">
      {/* App Container */}
      <div className="w-[97%] h-[94%] bg-white rounded-3xl shadow-xl flex overflow-hidden">
        
        {/* Sidebar */}
<aside className="w-64 bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 flex flex-col rounded-l-3xl">

  {/* Inner Wrapper */}
  <div className="flex flex-col h-full px-5 py-5">

    {/* Header */}
    <div className="mb-6">
      <h2 className="text-xl font-bold text-white tracking-wide">
        HR CRM
      </h2>
      <p className="text-[11px] text-white/80">
        Management Control Panel
      </p>
    </div>

    {/* Navigation */}
    <nav className="flex flex-col gap-1 flex-1">
      <NavLink to="/crm/hr/dashboard" className={linkClass}>
        Dashboard
      </NavLink>
      <NavLink to="/crm/hr/employees" className={linkClass}>
        Employees
      </NavLink>
      <NavLink to="/crm/hr/branch" className={linkClass}>
        Branch
      </NavLink>
      <NavLink to="/crm/hr/project" className={linkClass}>
        Project
      </NavLink>
      <NavLink to="/crm/hr/leads" className={linkClass}>
        Leads
      </NavLink>
      <NavLink to="/crm/hr/departments" className={linkClass}>
        Departments
      </NavLink>
      <NavLink to="/crm/hr/attendance" className={linkClass}>
        Attendance
      </NavLink>
      <NavLink to="/crm/hr/recruitment" className={linkClass}>
        Recruitment
      </NavLink>
      <NavLink to="/crm/hr/todo" className={linkClass}>
        Todo
      </NavLink>
    </nav>

    {/* Logout */}
    <button
      onClick={() => {
        localStorage.removeItem("accessToken");
        window.location.href = "/crm/hr/login";
      }}
      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 
                 rounded-xl bg-white text-red-600 font-semibold 
                 hover:bg-red-600 hover:text-white 
                 transition-all duration-300 shadow-md"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      Logout
    </button>

  </div>
</aside>
        
        {/* Main Content (Clean & Light) */}
        <main className="flex-1 bg-gray-50 p-6 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-sm h-full p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}