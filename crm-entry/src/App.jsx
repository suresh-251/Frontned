import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

/* Auth — keep eager (small, always needed) */
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";
import PostLoginRouter from "./routes/PostLoginRouter";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import Logout from "./pages/auth/Logout";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetForgotPassword from "./pages/auth/ResetForgotPassword";

/* Admin — lazy (only admins need these) */
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Domains = lazy(() => import("./pages/admin/Domains"));
const Users = lazy(() => import("./pages/admin/Users"));
const Roles = lazy(() => import("./pages/admin/Roles"));
const Permissions = lazy(() => import("./pages/admin/Permissions"));

/* CRM Shell — lazy (loads per-module lazily inside) */
const CrmShell = lazy(() => import("./pages/crm/CrmShell"));

const Fallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
  </div>
);

const App = () => {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<PostLoginRouter />} />
        <Route path="/reset-forgot-password" element={<ResetForgotPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="domains" element={<Domains />} />
          <Route path="users" element={<Users />} />
          <Route path="roles" element={<Roles />} />
          <Route path="permissions" element={<Permissions />} />
        </Route>

        {/* CRM */}
        <Route
          path="/crm/:domainCode/*"
          element={
            <ProtectedRoute>
              <CrmShell />
            </ProtectedRoute>
          }
        />

        {/* LOGOUT */}
        <Route path="/logout" element={<Logout />} />
        <Route path="/access-denied" element={<div>Access Denied</div>} />
      </Routes>
    </Suspense>
  );
};

export default App;
