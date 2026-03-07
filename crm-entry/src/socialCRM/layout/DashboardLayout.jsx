import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { FacebookPageProvider } from "../context/FacebookPageContext";

export default function DashboardLayout() {
  return (
    <FacebookPageProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 bg-gray-50 overflow-auto">
          <Topbar />
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </FacebookPageProvider>
  );
}
