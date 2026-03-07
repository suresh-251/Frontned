// import { Routes, Route, Navigate } from "react-router-dom";

// /* Layout */
// import HRLayout from "../layout/HRLayout";

// /* Pages */
// import Dashboard from "../pages/Dashboard";
// import Employees from "../pages/Employees";
// import Branch from "../pages/Branch";
// import Project from "../pages/Project";
// import HRLeads from "../pages/HRLeads";
// import Attendance from "../pages/Attendance";
// import Departments from "../../hr_CRM/pages/Deparments";
// import Recruitment from "../pages/Recruitment";
// import Todo from "../pages/Todo";
// import Shift from "../pages/Shift";
// import OTApproval from "../pages/shift/OTApproval";
// import OvertimePolicy from "../pages/shift/OverTimePolicy";
// import OvertimeRecord from "../pages/shift/OvertimeRecord";
// import Knowledge from "../pages/Knowledge";
// import DeptRole from "../pages/dept/DeptRole";
// import DeptBudget from "../pages/dept/DeptBudget";
// import BudgetChange from "../pages/dept/BudgetChange";
// import Onboarding from "../pages/Onboarding";

// export default function HrRoutes() {
//   return (
//     <Routes>
//       <Route element={<HRLayout />}>
        
//         {/* Default redirect */}
//         <Route index element={<Navigate to="dashboard" replace />} />

//         <Route path="dashboard" element={<Dashboard />} />
//         <Route path="employees" element={<Employees />} />
//         <Route path="branch" element={<Branch />} />
//         <Route path="departments" element={<Departments />} />
//         <Route path="project" element={<Project />} />
//         <Route path="overtimeApproval" element={<OTApproval />} />
//         <Route path="overtime-policy" element={<OvertimePolicy />} />
//         <Route path="department-role" element={<DeptRole />} />
//         <Route path="leads" element={<HRLeads />} />
//         <Route path="onboarding" element={<Onboarding />} />
//         <Route path="attendance" element={<Attendance />} />
//         <Route path="shift" element={<Shift />} />
//         <Route path="overtime-record" element={<OvertimeRecord />} />
//         <Route path="knowledge" element={<Knowledge />} />
//         <Route path="recruitment" element={<Recruitment />}  />
//         <Route path="todo" element={<Todo />} /> 
//         <Route path="department-budget" element={<DeptBudget />} /> 
//         <Route path="budget-change" element={<BudgetChange />} /> 

//       </Route>
//     </Routes>
//   );
// }

// ============================================                 multi working login routes             =========================================



// import React, { useMemo } from "react";
// import { Routes, Route, Navigate } from "react-router-dom";
// import { jwtDecode } from "jwt-decode";
// import HRLayout from "../layout/HRLayout";

// /* Pages */
// import Dashboard from "../pages/Dashboard";
// import Employees from "../pages/Employees";
// import Branch from "../pages/Branch";
// import Project from "../pages/Project";
// import HRLeads from "../pages/HRLeads";
// import Attendance from "../pages/Attendance";
// import Departments from "../../hr_CRM/pages/Deparments";
// import Recruitment from "../pages/Recruitment";
// import Todo from "../pages/Todo";
// import Shift from "../pages/Shift";
// import OTApproval from "../pages/shift/OTApproval";
// import OvertimePolicy from "../pages/shift/OverTimePolicy";
// import OvertimeRecord from "../pages/shift/OvertimeRecord";
// import Knowledge from "../pages/Knowledge";
// import DeptRole from "../pages/dept/DeptRole";
// import DeptBudget from "../pages/dept/DeptBudget";
// import BudgetChange from "../pages/dept/BudgetChange";
// import Onboarding from "../pages/Onboarding";

// /* Configs */
// import { USER_MENU } from "../configs/userManu";
// import { MANAGER_MENU } from "../configs/managerMenu";

// export default function HrRoutes() {
//   const token = localStorage.getItem("accessToken");
//   const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

//   const role = useMemo(() => {
//     if (!token) return null;
//     try {
//       const decoded = jwtDecode(token);
//       return decoded[ROLE_CLAIM]; // Use bracket notation here too
//     } catch (e) { return null; }
//   }, [token]);

//   const activeMenu = role === "HR_MANAGER" ? MANAGER_MENU : USER_MENU;

//   // Build a whitelist of allowed path slugs
//   const allowedPaths = useMemo(() => {
//     const paths = [];
//     activeMenu.forEach(item => {
//       if (item.type === 'link') {
//         paths.push(item.path.split('/').pop());
//       } else if (item.type === 'dropdown') {
//         item.children.forEach(child => paths.push(child.path.split('/').pop()));
//       }
//     });
//     return paths;
//   }, [activeMenu]);

//   const isAllowed = (slug) => allowedPaths.includes(slug);

//   return (
//     <Routes>
//       <Route element={<HRLayout />}>
//         <Route index element={<Navigate to="dashboard" replace />} />

//         {/* --- Guarded Routes --- */}
//         {isAllowed("dashboard") && <Route path="dashboard" element={<Dashboard />} />}
//         {isAllowed("branch") && <Route path="branch" element={<Branch />} />}
//         {isAllowed("employees") && <Route path="employees" element={<Employees />} />}
//         {isAllowed("departments") && <Route path="departments" element={<Departments />} />}
//         {isAllowed("project") && <Route path="project" element={<Project />} />}
//         {isAllowed("leads") && <Route path="leads" element={<HRLeads />} />}
//         {isAllowed("recruitment") && <Route path="recruitment" element={<Recruitment />} />}
//         {isAllowed("onboarding") && <Route path="onboarding" element={<Onboarding />} />}
//         {isAllowed("attendance") && <Route path="attendance" element={<Attendance />} />}
//         {isAllowed("shift") && <Route path="shift" element={<Shift />} />}
//         {isAllowed("overtimeApproval") && <Route path="overtimeApproval" element={<OTApproval />} />}
//         {isAllowed("overtime-policy") && <Route path="overtime-policy" element={<OvertimePolicy />} />}
//         {isAllowed("overtime-record") && <Route path="overtime-record" element={<OvertimeRecord />} />}
//         {isAllowed("knowledge") && <Route path="knowledge" element={<Knowledge />} />}
//         {isAllowed("todo") && <Route path="todo" element={<Todo />} />}
//         {isAllowed("department-budget") && <Route path="department-budget" element={<DeptBudget />} />}
//         {isAllowed("budget-change") && <Route path="budget-change" element={<BudgetChange />} />}
//         {isAllowed("department-role") && <Route path="department-role" element={<DeptRole />} />}

//         {/* Catch-all: If route isn't in whitelist, redirect to dashboard */}
//         <Route path="*" element={<Navigate to="dashboard" replace />} />
//       </Route>
//     </Routes>
//   );
// }


















import React, { useMemo } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import HRLayout from "../layout/HRLayout";

/* Pages */
import Dashboard from "../pages/Dashboard";
import Employees from "../pages/Employees";
import Branch from "../pages/Branch";
import Project from "../pages/Project";
import HRLeads from "../pages/HRLeads";
import Attendance from "../pages/Attendance";
import Departments from "../../hr_CRM/pages/Deparments";
import Recruitment from "../pages/Recruitment";
import Todo from "../pages/Todo";
import Shift from "../pages/Shift";
import OTApproval from "../pages/shift/OTApproval";
import OvertimePolicy from "../pages/shift/OverTimePolicy";
import OvertimeRecord from "../pages/shift/OvertimeRecord";
import Knowledge from "../pages/Knowledge";
import DeptRole from "../pages/dept/DeptRole";
import DeptBudget from "../pages/dept/DeptBudget";
import BudgetChange from "../pages/dept/BudgetChange";
import Onboarding from "../pages/Onboarding";

import { USER_MENU } from "../configs/userManu";
import { MANAGER_MENU } from "../configs/managerMenu";

export default function HrRoutes() {
  const token = localStorage.getItem("accessToken");
  const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

  const role = useMemo(() => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded[ROLE_CLAIM];
    } catch (e) { return null; }
  }, [token]);

  const activeMenu = role === "HR_MANAGER" ? MANAGER_MENU : USER_MENU;

  const allowedPaths = useMemo(() => {
    const paths = [];
    activeMenu.forEach(item => {
      if (item.type === 'link') paths.push(item.path.split('/').pop());
      else if (item.type === 'dropdown') item.children.forEach(c => paths.push(c.path.split('/').pop()));
    });
    return paths;
  }, [activeMenu]);

  const isAllowed = (slug) => allowedPaths.includes(slug);

  return (
    <Routes>
      <Route element={<HRLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        
        {isAllowed("dashboard") && <Route path="dashboard" element={<Dashboard />} />}
        {isAllowed("branch") && <Route path="branch" element={<Branch />} />}
        {isAllowed("employees") && <Route path="employees" element={<Employees />} />}
        {isAllowed("departments") && <Route path="departments" element={<Departments />} />}
        {isAllowed("project") && <Route path="project" element={<Project />} />}
        {isAllowed("leads") && <Route path="leads" element={<HRLeads />} />}
        {isAllowed("recruitment") && <Route path="recruitment" element={<Recruitment />} />}
        {isAllowed("onboarding") && <Route path="onboarding" element={<Onboarding />} />}
        {isAllowed("attendance") && <Route path="attendance" element={<Attendance />} />}
        {isAllowed("shift") && <Route path="shift" element={<Shift />} />}
        {isAllowed("overtimeApproval") && <Route path="overtimeApproval" element={<OTApproval />} />}
        {isAllowed("overtime-policy") && <Route path="overtime-policy" element={<OvertimePolicy />} />}
        {isAllowed("overtime-record") && <Route path="overtime-record" element={<OvertimeRecord />} />}
        {isAllowed("knowledge") && <Route path="knowledge" element={<Knowledge />} />}
        {isAllowed("todo") && <Route path="todo" element={<Todo />} />}
        {isAllowed("department-budget") && <Route path="department-budget" element={<DeptBudget />} />}
        {isAllowed("budget-change") && <Route path="budget-change" element={<BudgetChange />} />}
        {isAllowed("department-role") && <Route path="department-role" element={<DeptRole />} />}

        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}