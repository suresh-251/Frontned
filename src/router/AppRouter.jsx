import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import OAuthCallback from "../pages/OAuthCallback";
import PageSelection from "../pages/PageSelection";
import DashboardLayout from "../layout/DashboardLayout";
import Dashboard from "../pages/Dashboard";
import CreatePost from "../pages/CreatePost";
import MultiPagePost from "../pages/MultiPagePost";
import LeadForms from "../pages/LeadForms";
import Leads from "../pages/Leads";


export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/oauth/callback/facebook" element={<OAuthCallback />} />
      <Route path="/facebook/pages/select" element={<PageSelection />} />
      {/* Protected Dashboard */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/post/create" element={<CreatePost />} />
        <Route path="/post/multi" element={<MultiPagePost />} />
        <Route path="/leads/forms" element={<LeadForms />} />
        <Route path="/leads" element={<Leads />} />
      </Route>
    </Routes>
  );
}
