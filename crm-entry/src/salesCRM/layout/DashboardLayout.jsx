import { Outlet } from "react-router-dom";
<<<<<<< HEAD
import { useState, useEffect } from "react";
=======
import { useEffect, useState } from "react";
>>>>>>> 643632a8ec9f6b8b9be2351b46874b5ecbf09455
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { applyTheme, getStoredTheme } from "../../components/ThemeToggle";

const DashboardLayout = () => {
<<<<<<< HEAD
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  return (
    <div className="flex h-screen" style={{ background: "var(--bg-body)" }}>
      {sidebarOpen ? <Sidebar /> : null}
      <div className="flex-1 overflow-auto">
        <Topbar onToggleSidebar={() => setSidebarOpen((current) => !current)} />
        <main className="sales-crm-scroll p-6" style={{ background: "var(--bg-body)" }}>
=======
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
        <Topbar onToggleSidebar={handleToggleSidebar} showSidebarToggle={isMobile} />
        <main className="sales-crm-scroll salescrm-layout__main" style={{ background: "var(--bg-body)" }}>
>>>>>>> 643632a8ec9f6b8b9be2351b46874b5ecbf09455
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
