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
import ProtectedRoute from "./ProtectedRoute";
import PageSubscriptions from "../pages/PageSubscriptions";
import TestPage from "../pages/TestPage";

import BrandGate from "../pages/BrandGate";

export default function AppRouter() {
  return (
    <Routes>
      {/* Login routes */}
      {/* <Route path="login" element={<Login />} /> */}
      <Route path="oauth/callback/:platform" element={<OAuthCallback />} />
      <Route path="facebook/pages/select" element={<PageSelection />} />
      <Route path="test" element={<TestPage />} />
      
      {/* Dashboard - No Protection, freely accessible */}
      <Route element={<BrandGate />}>
       <Route element={<DashboardLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="post/create" element={<CreatePost />} />
        {/* <Route path="post/multi" element={<MultiPagePost />} /> */}
        <Route path="leads/forms" element={<LeadForms />} />
        <Route path="leads" element={<Leads />} />
        
        {/* 🔥 NEW PAGE */}
        <Route path="facebook/pages/subscriptions" element={<PageSubscriptions />} />
      </Route>
      </Route>
    </Routes>
  );
}
