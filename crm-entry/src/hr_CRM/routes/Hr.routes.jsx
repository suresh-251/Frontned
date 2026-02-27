import { Routes, Route, Navigate } from "react-router-dom";

/* Layout */
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

// import Knowledge from "../pages/Knowledge";

export default function HrRoutes() {
  return (
    <Routes>
      <Route element={<HRLayout />}>
        
        {/* Default redirect */}
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="branch" element={<Branch />} />
        <Route path="departments" element={<Departments />} />
        <Route path="project" element={<Project />} />
        <Route path="leads" element={<HRLeads />} />
        <Route path="attendance" element={<Attendance />} />
        {/* <Route path="knowledge" element={<Knowledge />} /> */}
        <Route path="recruitment" element={<Recruitment />}  />
        <Route path="todo" element={<Todo />} /> 

      </Route>
    </Routes>
  );
}
