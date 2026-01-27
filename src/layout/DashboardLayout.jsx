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
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar />

        <div style={{ flex: 1, background: "#f5f6f8" }}>
          <Topbar />

          {/* ⚠️ PAGE NOT SELECTED WARNING */}
          {caps && !caps.hasActivePage && (
            <div className="card" style={{ margin: 20 }}>
              ⚠ No Facebook Page Selected  
              <br />
              <a href="/facebook/pages/select">
                Select a Page
              </a>
            </div>
          )}

          <div style={{ padding: "20px" }}>
            <Outlet />
          </div>
        </div>
      </div>
    </FacebookPageProvider>
  );
}
