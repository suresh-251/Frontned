// import { Routes, Route, Navigate } from "react-router-dom";
// import HRLayout from "./layout/HRLayout";

// /* Pages */
// // import Dashboard from "../hr_CRM/pages/Dashboard";
// // import Employees from "../hr_CRM/pages/Employees";
// // import Attendence from "../hr_CRM/pages/Attendence";
// // import Branch from "../hr_CRM/pages/Branch";
// // import Projects from "../hr_CRM/pages/Projects";
// // import Recruitment from "../hr_CRM/pages/Recruitment";
// // import Knowledge from "../hr_CRM/pages/Knowledge";
// // import Todo from "../hr_CRM/pages/Todo";

// export default function HREntry() {
//   return (
//     <Routes>
//       <Route element={<HRLayout />}>
//         <Route path="/" element={<Navigate to="dashboard" replace />} />
//         <Route path="dashboard" element={<Dashboard />} />
//         <Route path="employees" element={<Employees />} />
//         <Route path="attendence" element={<Attendence />} />
//         <Route path="branch" element={<Branch />} />
//         <Route path="projects" element={<Projects />} />
//         <Route path="recruitment" element={<Recruitment />} />
//         <Route path="knowledge" element={<Knowledge />} />
//         <Route path="todo" element={<Todo />} />
//       </Route>
//     </Routes>
//   );
// }










import { Routes, Route, Navigate } from "react-router-dom";
import HRLayout from "./layout/HRLayout";
import Branch from "./pages/Branch";
import Dashboard from "./pages/Dashboard";


export default function HREntry() {
  return (
    <Routes>
      <Route element={<HRLayout />}>
        <Route path="/" element={<Navigate to="branch" replace />} />
        <Route path="branch" element={<Branch />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
