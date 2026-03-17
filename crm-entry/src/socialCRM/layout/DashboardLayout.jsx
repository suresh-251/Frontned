import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { FacebookPageProvider } from "../context/FacebookPageContext";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <FacebookPageProvider>
<<<<<<< HEAD
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
=======
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col bg-gray-50">
          <Topbar />
          <div className="flex-1 overflow-auto p-6">
            <Outlet />
          </div>
>>>>>>> a10e2475c0327557ac0af1c22a1083c69d1860e1
        </div>
      </div>
    </FacebookPageProvider>
  );
}
