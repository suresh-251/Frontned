// import { NavLink, Outlet } from "react-router-dom";

// const linkClass = ({ isActive }) =>
//   `block px-4 py-2 rounded-lg transition-all ${
//     isActive
//       ? "bg-indigo-600 text-white"
//       : "text-gray-600 hover:bg-gray-200"
//   }`;

// export default function HRLayout() {
//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       {/* Sidebar */}
//       <aside className="w-64 bg-white shadow-md p-5">
//         <h2 className="text-xl font-bold mb-6 text-gray-800">HR CRM</h2>

//         <nav className="space-y-3">
//           <NavLink to="/crm/hr/dashboard" className={linkClass}>
//             Dashboard
//           </NavLink>

//           <NavLink to="/crm/hr/employees" className={linkClass}>
//             Employees
//           </NavLink>

//           <NavLink to="/crm/hr/branch" className={linkClass}>
//             Branch
//           </NavLink>
          
//           <NavLink to="/crm/hr/project" className={linkClass}>
//             Project
//           </NavLink>

//           <NavLink to="/crm/hr/leads" className={linkClass}>
//           Leads
//           </NavLink>
//           <NavLink to="/crm/hr/departments" className={linkClass}>
//             Departments
//           </NavLink>


//           <NavLink to="/crm/hr/attendence" className={linkClass}>
//             Attendence
//           </NavLink>

//           <NavLink to="/crm/hr/payroll" className={linkClass}>
//             Payroll
//           </NavLink>
//         </nav>
//       </aside>

//       {/* Page Content */}
//       <main className="flex-1 p-8">
//         <Outlet />
//       </main>
//     </div>
//   );
// }












// import { NavLink, Outlet } from "react-router-dom";

// const linkClass = ({ isActive }) =>
//   `flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
//    ${
//      isActive
//        ? "bg-white text-indigo-600 shadow-md"
//        : "text-white/90 hover:bg-white/20"
//    }`;

// export default function HRLayout() {
//   return (
//     <div className="h-screen w-screen bg-gray-100 flex items-center justify-center">
      
//       {/* App Container */}
//       <div className="w-[97%] h-[94%] bg-white rounded-3xl shadow-xl flex overflow-hidden">
        
//         {/* Sidebar (Colorful but Light) */}
//         <aside className="w-64 p-6 bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 flex flex-col">
          
//           {/* Header */}
//           <div className="mb-8">
//             <h2 className="text-2xl font-bold text-white tracking-wide">
//               HR CRM
//             </h2>
//             <p className="text-xs text-white/80">
//               Management Control Panel
//             </p>
//           </div>

//           {/* Menu */}
//           <nav className="space-y-2 flex-1">
//             <NavLink to="/crm/hr/dashboard" className={linkClass}>
//               Dashboard
//             </NavLink>

//             <NavLink to="/crm/hr/employees" className={linkClass}>
//               Employees
//             </NavLink>

//             <NavLink to="/crm/hr/branch" className={linkClass}>
//               Branch
//             </NavLink>

//             <NavLink to="/crm/hr/project" className={linkClass}>
//               Project
//             </NavLink>

//             <NavLink to="/crm/hr/leads" className={linkClass}>
//               Leads
//             </NavLink>

//             <NavLink to="/crm/hr/departments" className={linkClass}>
//               Departments
//             </NavLink>

//             <NavLink to="/crm/hr/attendence" className={linkClass}>
//               Attendance
//             </NavLink>

//             <NavLink to="/crm/hr/payroll" className={linkClass}>
//               Payroll
//             </NavLink>
//           </nav>
//         </aside>

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
        
        {/* Sidebar (Colorful but Light) */}
        <aside className="w-64 p-6 bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 flex flex-col">
          
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-wide">HR CRM</h2>
            <p className="text-xs text-white/80">Management Control Panel</p>
          </div>
          
          {/* Menu */}
          <nav className="space-y-2 flex-1">
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
            <NavLink to="/crm/hr/payroll" className={linkClass}>
              Payroll
            </NavLink>
          </nav>
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