// import React, { useMemo } from "react";
// import { Routes, Route, Navigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// import HRLayout from "../layout/HRLayout";

// // EXISTING IMPORTS
// import OffBoarding from "../pages/OffBoarding";
// import Leave from "../pages/shift/Leave";
// import Dashboard from "../pages/Dashboard";
// import Employees from "../pages/Employees";
// import Branch from "../pages/Branch";
// import Project from "../pages/Project";
// import HRLeads from "../pages/HRLeads";
// import Attendance from "../pages/Attendance";
// import Departments from "../../hr_CRM/pages/Deparments";
// import Recruitment from "../pages/Recruitment";
// import Onboarding from "../pages/Onboarding";
// import Shift from "../pages/Shift";
// import OTApproval from "../pages/shift/OTApproval";
// import OvertimePolicy from "../pages/shift/OverTimePolicy";
// import OvertimeRecord from "../pages/shift/OvertimeRecord";
// import Knowledge from "../pages/Knowledge";
// import Todo from "../pages/Todo";
// import DeptRole from "../pages/dept/DeptRole";
// import DeptBudget from "../pages/dept/DeptBudget";
// import BudgetChange from "../pages/dept/BudgetChange";

// // NEW MODULE IMPORTS
// import ExitInterview from "../pages/Recruitment/ExitInterview";
// import EmployeeTraining from "../pages/Recruitment/EmployeeTraining";
// import DigitalSignature from "../pages/Recruitment/DigitalSignature";
// import Payroll from "../pages/PayRoll";
// import Learning from "../pages/Learning";

// import { USER_MENU } from "../configs/userManu";
// import { MANAGER_MENU } from "../configs/managerMenu";

// export default function HrRoutes() {
//   const token = localStorage.getItem("accessToken");
//   const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

//   const role = useMemo(() => {
//     if (!token) return null;
//     try { return jwtDecode(token)[ROLE_CLAIM]; } catch { return null; }
//   }, [token]);

//   const activeMenu = (role === "HR_MANAGER" || role === "ADMIN") ? MANAGER_MENU : USER_MENU;
  
//   const allowedPaths = useMemo(() => {
//     const paths = [];
//     activeMenu.forEach(item => {
//       if (item.type === 'link') {
//         paths.push(item.path.split('/').pop());
//       } else if (item.children) {
//         item.children.forEach(c => paths.push(c.path.split('/').pop()));
//       }
//     });
//     return paths;
//   }, [activeMenu]);

//   const isAllowed = (slug) => allowedPaths.includes(slug);

//   return (
//     <Routes>
//       <Route element={<HRLayout />}>
//         {/* DEFAULT REDIRECT */}
//         <Route index element={<Navigate to="/crm/hr/dashboard" replace />} />
        
//         {/* CORE MODULES */}
//         {isAllowed("dashboard") && <Route path="dashboard" element={<Dashboard />} />}
//         {isAllowed("branch") && <Route path="branch" element={<Branch />} />}
//         {isAllowed("employees") && <Route path="employees" element={<Employees />} />}
//         {isAllowed("departments") && <Route path="departments" element={<Departments />} />}
//         {isAllowed("project") && <Route path="project" element={<Project />} />}
//         {isAllowed("leads") && <Route path="leads" element={<HRLeads />} />}
//         {isAllowed("attendance") && <Route path="attendance" element={<Attendance />} />}
        
//         {/* RECRUITMENT & OFFBOARDING */}
//         {isAllowed("recruitment") && <Route path="recruitment" element={<Recruitment />} />}
//         {isAllowed("onboarding") && <Route path="onboarding" element={<Onboarding />} />}
//         {isAllowed("offboarding") && <Route path="offboarding" element={<OffBoarding />} />}
//         {isAllowed("exit-interview") && <Route path="exit-interview" element={<ExitInterview />} />}
//         {isAllowed("employee-training") && <Route path="employee-training" element={<EmployeeTraining />} />}
//         {isAllowed("digital-signature") && <Route path="digital-signature" element={<DigitalSignature />} />}

//         {/* PAYROLL */}
//         {isAllowed("payroll") && <Route path="payroll" element={<Payroll />} />}

//         {/* SHIFT & TIME */}
//         {isAllowed("shift") && <Route path="shift" element={<Shift />} />}
//         {isAllowed("leave") && <Route path="leave" element={<Leave />} />}
//         {isAllowed("overtimeApproval") && <Route path="overtimeApproval" element={<OTApproval />} />}
//         {isAllowed("overtime-policy") && <Route path="overtime-policy" element={<OvertimePolicy />} />}
//         {isAllowed("overtime-record") && <Route path="overtime-record" element={<OvertimeRecord />} />}

//         {/* GROWTH TRACKER */}
//         {isAllowed("learning") && <Route path="learning" element={<Learning />} />}
//         {isAllowed("knowledge") && <Route path="knowledge" element={<Knowledge />} />}
//         {isAllowed("todo") && <Route path="todo" element={<Todo />} />}

//         {/* DEPARTMENT FINANCE */}
//         {isAllowed("department-budget") && <Route path="department-budget" element={<DeptBudget />} />}
//         {isAllowed("budget-change") && <Route path="budget-change" element={<BudgetChange />} />}
//         {isAllowed("department-role") && <Route path="department-role" element={<DeptRole />} />}

//         {/* FALLBACK */}
//         <Route path="*" element={<Navigate to="/crm/hr/dashboard" replace />} />
//       </Route>
//     </Routes>
//   );
// }












// profile check




import React, { useMemo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import HRLayout from "../layout/HRLayout";

// EXISTING IMPORTS
import OffBoarding from "../pages/OffBoarding";
import Leave from "../pages/shift/Leave";
import Dashboard from "../pages/Dashboard";
import Employees from "../pages/Employees";
import Branch from "../pages/Branch";
import Project from "../pages/Project";
import HRLeads from "../pages/HRLeads";
import Attendance from "../pages/Attendance";
import Departments from "../../hr_CRM/pages/Deparments";
import Recruitment from "../pages/Recruitment";
import Onboarding from "../pages/Onboarding";
import Shift from "../pages/Shift";
import OTApproval from "../pages/shift/OTApproval";
import OvertimePolicy from "../pages/shift/OverTimePolicy";
import OvertimeRecord from "../pages/shift/OvertimeRecord";
import Knowledge from "../pages/Knowledge";
import Todo from "../pages/Todo";
import DeptRole from "../pages/dept/DeptRole";
import DeptBudget from "../pages/dept/DeptBudget";
import BudgetChange from "../pages/dept/BudgetChange";
import ExitInterview from "../pages/Recruitment/ExitInterview";
import EmployeeTraining from "../pages/Recruitment/EmployeeTraining";
import DigitalSignature from "../pages/Recruitment/DigitalSignature";
import Payroll from "../pages/PayRoll";
import Learning from "../pages/Learning";

// ✅ 1. ADD PROFILE IMPORT
// import Profile from "../pages/Profile"; 

import { USER_MENU } from "../configs/userManu";
import { MANAGER_MENU } from "../configs/managerMenu";

export default function HrRoutes() {
  const token = localStorage.getItem("accessToken");
  const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

  const role = useMemo(() => {
    if (!token) return null;
    try { return jwtDecode(token)[ROLE_CLAIM]; } catch { return null; }
  }, [token]);

  const activeMenu = (role === "HR_MANAGER" || role === "ADMIN") ? MANAGER_MENU : USER_MENU;
  
  const allowedPaths = useMemo(() => {
    const paths = [];
    activeMenu.forEach(item => {
      if (item.type === 'link') {
        paths.push(item.path.split('/').pop());
      } else if (item.children) {
        item.children.forEach(c => paths.push(c.path.split('/').pop()));
      }
    });
    return paths;
  }, [activeMenu]);

  const isAllowed = (slug) => allowedPaths.includes(slug);

  return (
    <Routes>
      <Route element={<HRLayout />}>
        {/* DEFAULT REDIRECT */}
        <Route index element={<Navigate to="/crm/hr/dashboard" replace />} />
        
        {/* ✅ 2. REGISTER PROFILE ROUTE (Independent of menu permissions) */}
        {/* <Route path="profile" element={<Profile />} /> */}

        {/* CORE MODULES */}
        {isAllowed("dashboard") && <Route path="dashboard" element={<Dashboard />} />}
        {isAllowed("branch") && <Route path="branch" element={<Branch />} />}
        {isAllowed("employees") && <Route path="employees" element={<Employees />} />}
        {isAllowed("departments") && <Route path="departments" element={<Departments />} />}
        {isAllowed("project") && <Route path="project" element={<Project />} />}
        {isAllowed("leads") && <Route path="leads" element={<HRLeads />} />}
        {isAllowed("attendance") && <Route path="attendance" element={<Attendance />} />}
        
        {/* RECRUITMENT & OFFBOARDING */}
        {isAllowed("recruitment") && <Route path="recruitment" element={<Recruitment />} />}
        {isAllowed("onboarding") && <Route path="onboarding" element={<Onboarding />} />}
        {isAllowed("offboarding") && <Route path="offboarding" element={<OffBoarding />} />}
        {isAllowed("exit-interview") && <Route path="exit-interview" element={<ExitInterview />} />}
        {isAllowed("employee-training") && <Route path="employee-training" element={<EmployeeTraining />} />}
        {isAllowed("digital-signature") && <Route path="digital-signature" element={<DigitalSignature />} />}

        {/* PAYROLL */}
        {isAllowed("payroll") && <Route path="payroll" element={<Payroll />} />}

        {/* SHIFT & TIME */}
        {isAllowed("shift") && <Route path="shift" element={<Shift />} />}
        {isAllowed("leave") && <Route path="leave" element={<Leave />} />}
        {isAllowed("overtimeApproval") && <Route path="overtimeApproval" element={<OTApproval />} />}
        {isAllowed("overtime-policy") && <Route path="overtime-policy" element={<OvertimePolicy />} />}
        {isAllowed("overtime-record") && <Route path="overtime-record" element={<OvertimeRecord />} />}

        {/* GROWTH TRACKER */}
        {isAllowed("learning") && <Route path="learning" element={<Learning />} />}
        {isAllowed("knowledge") && <Route path="knowledge" element={<Knowledge />} />}
        {isAllowed("todo") && <Route path="todo" element={<Todo />} />}

        {/* DEPARTMENT FINANCE */}
        {isAllowed("department-budget") && <Route path="department-budget" element={<DeptBudget />} />}
        {isAllowed("budget-change") && <Route path="budget-change" element={<BudgetChange />} />}
        {isAllowed("department-role") && <Route path="department-role" element={<DeptRole />} />}

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/crm/hr/dashboard" replace />} />
      </Route>
    </Routes>
  );
}