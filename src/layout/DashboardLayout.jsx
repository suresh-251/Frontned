import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { loadCapabilities } from "../store/capabilities.store";
import { FacebookPageProvider } from "../context/FacebookPageContext";

export default function DashboardLayout() {
  const [caps, setCaps] = useState(null);

  useEffect(() => {
    loadCapabilities()
      .then(setCaps)
      .catch(() => {});
  }, []);

  return (
    <FacebookPageProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />

          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </FacebookPageProvider>
  );
}
