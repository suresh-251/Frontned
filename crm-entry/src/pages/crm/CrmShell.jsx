// import { useParams } from "react-router-dom";
// import SocialEntry from "../../socialCRM/SocialEntry";

// export default function CrmShell() {
//   const { domainCode } = useParams();

//   switch (domainCode) {
//     case "socialmedia":
//       return <SocialEntry />;

//     case "sales":
//       return <div>Sales CRM (coming soon)</div>;

//     case "hr":
//       return <div>HR CRM (coming soon)</div>;

//     default:
//       return (
//         <div style={{ padding: 40 }}>
//           <h2>CRM Not Available</h2>
//           <p>This CRM does not exist or is not enabled.</p>
//         </div>
//       );
//   }
// }

// import { useParams } from "react-router-dom";
// import SocialEntry from "../../socialCRM/SocialEntry";
// import HREntry from"../../hr_CRM/HREntry"

// export default function CrmShell() {
//   const { domainCode } = useParams();

//   // ✅ normalize backend values
//   const code = domainCode?.toLowerCase();

//   switch (code) {
//     case "socialmedia":
//       return <SocialEntry />;

//     case "sales":
//       return <div>Sales CRM (coming soon)</div>;

//     case "hr":
//     return <HREntry />;


//     default:
//       return (
//         <div style={{ padding: 40 }}>
//           <h2>CRM Not Available</h2>
//           <p>This CRM does not exist or is not enabled.</p>
//         </div>
//       );
//   }
// }













































// import { Routes, Route, Navigate, useParams } from "react-router-dom";

// /* SOCIAL CRM */
// import SocialEntry from "../../socialCRM/SocialEntry";

// /* HR CRM */
// import HRLayout from "../../hr_CRM/Layout/HRLayout";
// import Dashboard from "../../hr_CRM/pages/Dashboard";
// import Employees from "../../hr_CRM/pages/Employees";

// // import AttendancePage from "../../HR_CRM/pages/AttendancePage";
// import Attendence from "../../hr_CRM/pages/Attendence";


// // branch 
// import Branch from "../../hr_CRM/pages/Branch";


// //project 
// import Project from "../../hr_CRM/pages/Project";

// import HRLeads from "../../hr_CRM/pages/HRLeads";


// export default function CrmShell() {
//   const { domainCode } = useParams();
//   const code = domainCode?.toLowerCase();

//   /* ================= SOCIAL CRM ================= */
//   if (code === "socialmedia") {
//     return <SocialEntry />;
//   }

//   /* ================= HR CRM ================= */
//   if (code === "hr") {
//   return (
//     <Routes>
//       <Route element={<HRLayout />}>
//         <Route path="dashboard" element={<Dashboard />} />
//         <Route path="employees" element={<Employees />} />
//         <Route path="branch" element={<Branch />} />
//         <Route path="project" element={<Project />} />
//         <Route path="leads" element={<HRLeads />}  />
//         <Route path="attendence" element={<Attendence />} />
       
//       </Route>
//     </Routes>
//   );
// }


//   /* ================= SALES CRM ================= */
//   if (code === "sales") {
//     return (
//       <div className="p-10 text-center text-xl">
//         Sales CRM Coming Soon 🚀
//       </div>
//     );
//   }

//   /* ================= INVALID DOMAIN ================= */
//   return (
//     <div className="p-10 text-center text-red-500 text-xl">
//       CRM Not Available ❌
//     </div>
//   );
// }

















































import { useParams } from "react-router-dom";

/* SOCIAL CRM */
import SocialEntry from "../../socialCRM/SocialEntry";

/* SALES CRM */
import SalesEntry from "../../salesCRM/SalesEntry";

/* HR CRM */
import HrRoutes from "../../hr_CRM/routes/Hr.routes";

export default function CrmShell() {
  const { domainCode } = useParams();
  const code = domainCode?.toLowerCase();

  /* ================= SOCIAL CRM ================= */
  if (code === "socialmedia") {
    return <SocialEntry />;
  }

  /* ================= SALES CRM ================= */
  if (code === "sales") {
    return <SalesEntry />;
  }

  /* ================= HR CRM ================= */
  if (code === "hr") {
    return <HrRoutes />;
  }

  /* ================= INVALID DOMAIN ================= */
  return (
    <div className="p-10 text-center text-red-500 text-xl">
      CRM Not Available ❌
    </div>
  );
}
