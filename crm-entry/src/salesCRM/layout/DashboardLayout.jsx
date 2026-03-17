import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen ? <Sidebar /> : null}
      <div className="flex-1 overflow-auto">
        <Topbar onToggleSidebar={() => setSidebarOpen((current) => !current)} />
        <main className="sales-crm-scroll bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

