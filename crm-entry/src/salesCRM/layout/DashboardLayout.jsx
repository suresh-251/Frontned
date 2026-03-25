import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem("sales-crm-theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
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

  const handleOpenCalendar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
      return;
    }

    setSidebarCollapsed(true);
  };

  return (
    <div className="salescrm-layout" style={{ background: "var(--bg-body)" }}>
      <Sidebar
        collapsed={!isMobile && sidebarCollapsed}
        isMobile={isMobile}
        isOpen={isMobileSidebarOpen}
        onToggleCollapse={() => {
          if (!isMobile) setSidebarCollapsed((current) => !current);
        }}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="salescrm-layout__content">
        <Topbar
          onToggleSidebar={handleToggleSidebar}
          onOpenCalendar={handleOpenCalendar}
          showSidebarToggle={isMobile}
        />
        <main className="sales-crm-scroll salescrm-layout__main" style={{ background: "var(--bg-body)" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
