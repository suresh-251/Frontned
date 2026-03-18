import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  Home,
  Inbox,
  PanelLeftClose,
  PanelLeftOpen,
  RadioTower,
  UsersRound,
} from "lucide-react";
import { useBrand } from "../context/BrandContext";
import { getBrandLogoSrc } from "../api/brand.api";

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { activeBrand } = useBrand();

  const isActive = (path) => location.pathname === path;
  const startsWith = (prefix) => location.pathname.startsWith(prefix);

  // Use the active brand's logo as the app logo; fallback to gradient "N"
  const brandLogo = activeBrand ? getBrandLogoSrc(activeBrand) : null;

  const navItems = [
    { to: "/crm/socialmedia/dashboard", label: "Dashboard", match: (p) => p === "/crm/socialmedia/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { to: "/crm/socialmedia/post/history", label: "Posts / Schedule", match: (p) => p.startsWith("/crm/socialmedia/post"), icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
    { to: "/crm/socialmedia/inbox", label: "Inbox", match: (p) => p === "/crm/socialmedia/inbox", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
    { to: "/crm/socialmedia/analytics", label: "Analytics", match: (p) => p === "/crm/socialmedia/analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { section: "Leads" },
    { to: "/crm/socialmedia/leads", label: "Leads", match: (p) => p === "/crm/socialmedia/leads" || p === "/crm/socialmedia/leads/forms", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { to: "/crm/socialmedia/facebook/pages/subscriptions", label: "Subscriptions", match: (p) => p === "/crm/socialmedia/facebook/pages/subscriptions", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
        { section: "Brands" },
    { to: "/crm/socialmedia/brands", label: "Manage Brands", match: (p) => p === "/crm/socialmedia/brands", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  ];

  return (
    <div
      className={`flex flex-col bg-white border-r border-gray-200 h-full shrink-0 transition-all duration-200 ${
        collapsed ? "w-[68px]" : "w-64"
      }`}
    >
      {/* Logo — clickable to toggle collapse */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className={`flex items-center gap-3 border-b border-gray-200 shrink-0 cursor-pointer select-none hover:bg-gray-50 transition-colors ${collapsed ? "px-3 py-4 justify-center" : "px-5 py-4"}`}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
          {brandLogo ? (
            <img src={brandLogo} alt="NaFa Social" className="w-10 h-10 object-cover" />
          ) : (
            <span className="text-white text-xl font-bold">N</span>
          )}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900 leading-tight">NaFa Social</h2>
            {activeBrand && (
              <p className="text-[11px] text-blue-600 font-semibold truncate max-w-[130px]">{activeBrand.name}</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation — scrollable */}
      <nav className={`flex-1 overflow-y-auto ${collapsed ? "px-2 py-3" : "p-3"} space-y-1`}>
        {navItems.map((item, i) => {
          if (item.section) {
            if (collapsed) return null;
            return (
              <div key={`s-${i}`} className="pt-4 pb-1">
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.section}</p>
              </div>
            );
          }

          const active = item.match(location.pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl transition-all ${
                collapsed ? "justify-center p-3" : "px-3 py-2.5"
              } ${
                active
                  ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout — pinned at bottom */}
      <div className={`border-t border-gray-200 shrink-0 ${collapsed ? "px-2 py-3" : "p-3"} space-y-1`}>
        <button
          onClick={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("brandSlug");
            window.location.href = "/crm/socialmedia/login";
          }}
          className={`w-full flex items-center gap-3 rounded-xl text-red-600 hover:bg-red-50 transition-all ${
            collapsed ? "justify-center p-3" : "px-3 py-2.5"
          }`}
          title="Logout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span className="text-sm font-semibold">Logout</span>}
        </button>
      </div>
    </div>
  );
}
