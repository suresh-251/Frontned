import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { FacebookPageProvider } from "../context/FacebookPageContext";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <FacebookPageProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar — fixed, never scrolls the page */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Right side: topbar + scrollable content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar — fixed at top, never moves */}
          <Topbar />

          {/* Scrollable content area */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </FacebookPageProvider>
  );
}
