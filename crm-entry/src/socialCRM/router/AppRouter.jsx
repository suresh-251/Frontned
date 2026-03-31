import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import OAuthCallback from "../pages/OAuthCallback";
import PageSelection from "../pages/PageSelection";
import DashboardLayout from "../layout/DashboardLayout";
import Dashboard from "../pages/Dashboard";
import PostHistory from "../pages/PostHistory";
import Leads from "../pages/Leads";
import PageSubscriptions from "../pages/PageSubscriptions";
import TestPage from "../pages/TestPage";
import BrandGate from "../pages/BrandGate";
import BrandSetupPage from "../pages/BrandSetupPage";
import BrandManager from "../pages/BrandManager";
import BrandDetail from "../pages/BrandDetail";
import BrandMembers from "../pages/BrandMembers";
import SocialAccounts from "../pages/SocialAccounts";
import Inbox from "../pages/Inbox";
import Analytics from "../pages/Analytics";
import { BrandProvider } from "../context/BrandContext";

export default function AppRouter() {
  return (
    <BrandProvider>
      <Routes>
        {/* Public / OAuth */}
        <Route path="oauth/callback/:platform" element={<OAuthCallback />} />
        <Route path="facebook/pages/select" element={<PageSelection />} />
        <Route path="test" element={<TestPage />} />

        {/* Brand setup — shown when user has no brand after social login */}
        <Route path="brand/setup" element={<BrandSetupPage />} />

        {/* Protected dashboard — requires an active brand */}
        <Route element={<BrandGate />}>
          <Route element={<DashboardLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="brands" element={<BrandManager />} />
            <Route path="brands/:slug" element={<BrandDetail />} />
            <Route path="brands/members" element={<BrandMembers />} />
            <Route path="accounts" element={<SocialAccounts />} />
            <Route path="post/create" element={<Navigate to="/crm/socialmedia/post/history" replace />} />
            <Route path="post/history" element={<PostHistory />} />
            <Route path="leads/forms" element={<Navigate to="/crm/socialmedia/leads" replace />} />
            <Route path="leads" element={<Leads />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="facebook/pages/subscriptions" element={<PageSubscriptions />} />
          </Route>
        </Route>
      </Routes>
    </BrandProvider>
  );
}
