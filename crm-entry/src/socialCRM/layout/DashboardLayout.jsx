import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { FacebookPageProvider } from "../context/FacebookPageContext";
import { applyTheme, getStoredTheme } from "../../components/ThemeToggle";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return (
    <FacebookPageProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-body)" }}>
        {/* Sidebar */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Right side: topbar + scrollable content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />

          {/* Scrollable content area */}
          <main className="flex-1 overflow-y-auto" style={{ background: "var(--bg-body)" }}>
            <div className="p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </FacebookPageProvider>
  );
}
