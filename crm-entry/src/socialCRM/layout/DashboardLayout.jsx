import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { FacebookPageProvider } from "../context/FacebookPageContext";

export default function DashboardLayout() {
  return (
    <FacebookPageProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col bg-gray-50">
          <Topbar />
          <div className="flex-1 overflow-auto p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </FacebookPageProvider>
  );
}
