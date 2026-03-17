import { Routes, Route } from "react-router-dom";

/* Auth */
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";
import PostLoginRouter from "./routes/PostLoginRouter";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import Logout from "./pages/auth/Logout";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetForgotPassword from "./pages/auth/ResetForgotPassword"
/* Admin */
import AdminLayout from "./pages/admin/AdminLayout";
import Domains from "./pages/admin/Domains";
import Users from "./pages/admin/Users";
import Roles from "./pages/admin/Roles";
import Permissions from "./pages/admin/Permissions";

/* CRM */
import CrmShell from "./pages/crm/CrmShell";

const App = () => {
  return (
    <Routes>
      {/* AUTH */}
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<PostLoginRouter />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route  path="/reset-forgot-password" element={<ResetForgotPassword />}/>
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ADMIN */}
      <Route path="/admin" element={
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
  );
};

export default App;







