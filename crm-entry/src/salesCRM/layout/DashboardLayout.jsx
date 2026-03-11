import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";

const DashboardLayout = () => {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      
      {/* Navbar */}
      <Topbar />

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6 pt-20">
        <Outlet />
      </main>

    </div>
  );
};

export default DashboardLayout;