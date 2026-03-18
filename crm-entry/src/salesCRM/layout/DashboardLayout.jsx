import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { applyTheme, getStoredTheme } from "../../components/ThemeToggle";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return (
    <div className="flex h-screen" style={{ background: "var(--bg-body)" }}>
      {sidebarOpen ? <Sidebar /> : null}
      <div className="flex-1 overflow-auto">
        <Topbar onToggleSidebar={() => setSidebarOpen((current) => !current)} />
        <main className="sales-crm-scroll p-6" style={{ background: "var(--bg-body)" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
