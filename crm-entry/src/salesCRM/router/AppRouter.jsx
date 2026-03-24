import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";

const Leads = lazy(() => import("../pages/Leads"));
const Activities = lazy(() => import("../pages/Activities"));
const Deals = lazy(() => import("../pages/Deals"));
const Accounts = lazy(() => import("../pages/Accounts"));
const Calendar = lazy(() => import("../pages/Calendar"));

const routeFallback = (
  <div style={{ padding: 18, color: "#64748b", fontSize: 13, fontWeight: 600 }}>
    Loading...
  </div>
);

const AppRouter = () => {
  return (
    <Suspense fallback={routeFallback}>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="leads" replace />} />
          <Route path="leads" element={<Leads />} />
          <Route path="activities" element={<Activities />} />
          <Route path="deals" element={<Deals />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="calendar" element={<Calendar />} />
        </Route>
        <Route path="*" element={<Navigate to="/crm/sales" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
