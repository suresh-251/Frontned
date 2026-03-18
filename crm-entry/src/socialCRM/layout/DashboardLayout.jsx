import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { FacebookPageProvider } from "../context/FacebookPageContext";
import { applyTheme, getStoredTheme } from "../../components/ThemeToggle";

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobileViewport = window.innerWidth < 1024;
      setIsMobile(mobileViewport);
      if (!mobileViewport) {
        setIsMobileSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobile && isMobileSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isMobileSidebarOpen]);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen((current) => !current);
      return;
    }
    setSidebarCollapsed((current) => !current);
  };

  return (
    <FacebookPageProvider>
      <div className="socialcrm-layout" style={{ background: "var(--bg-body)" }}>
        <Sidebar
          collapsed={!isMobile && sidebarCollapsed}
          isMobile={isMobile}
          isOpen={isMobileSidebarOpen}
          onToggleCollapse={() => {
            if (!isMobile) setSidebarCollapsed((current) => !current);
          }}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
        <div className="socialcrm-layout__content">
          <Topbar onToggleSidebar={handleToggleSidebar} showSidebarToggle={isMobile} />
          <main className="social-crm-scroll socialcrm-layout__main" style={{ background: "var(--bg-body)" }}>
            <Outlet />
          </main>
        </div>
      </div>
    </FacebookPageProvider>
  );
};

export default DashboardLayout;
