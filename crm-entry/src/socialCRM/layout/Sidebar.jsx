import { useLayoutEffect, useRef, useState } from "react";
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

const LOGO_KEY = "nafaSocialLogo";
const NAV_SECTIONS = [
  {
    title: "Main",
    items: [
      { to: "/crm/socialmedia/dashboard", label: "Dashboard", icon: Home },
      { to: "/crm/socialmedia/post/history", label: "Post/Schedule", icon: ClipboardList, match: "prefix" },
      { to: "/crm/socialmedia/inbox", label: "Inbox", icon: Inbox },
      { to: "/crm/socialmedia/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Brands",
    items: [{ to: "/crm/socialmedia/brands", label: "Manage Brands", icon: Building2 }],
  },
  {
    title: "Leads",
    items: [
      { to: "/crm/socialmedia/leads", label: "Leads", icon: UsersRound },
      { to: "/crm/socialmedia/leads/forms", label: "Lead Forms", icon: FileText },
      {
        to: "/crm/socialmedia/facebook/pages/subscriptions",
        label: "Page Subscriptions",
        icon: RadioTower,
      },
    ],
  },
];
const COLLAPSED_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

function getInitials(value, fallback) {
  if (!value) return fallback;

  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Sidebar() {
  const location = useLocation();
  const { activeBrand } = useBrand();
  const fileRef = useRef(null);
  const [logo, setLogo] = useState(() => localStorage.getItem(LOGO_KEY) || null);
  const [collapsed, setCollapsed] = useState(false);
  const collapsedNavRef = useRef(null);
  const [collapsedIndicatorTop, setCollapsedIndicatorTop] = useState(null);
  const expandedNavRef = useRef(null);
  const [expandedIndicator, setExpandedIndicator] = useState(null);

  const isActive = (item) => {
    if (item.match === "prefix") {
      return location.pathname.startsWith(item.to);
    }

    return location.pathname === item.to;
  };

  useLayoutEffect(() => {
    if (!collapsed) {
      return undefined;
    }

    const navNode = collapsedNavRef.current;
    if (!navNode) return undefined;

    const syncIndicator = () => {
      const activeLink = navNode.querySelector('[data-sidebar-active="true"]');
      if (!activeLink) {
        setCollapsedIndicatorTop(null);
        return;
      }

      setCollapsedIndicatorTop(activeLink.offsetTop);
    };

    syncIndicator();
    const rafId = window.requestAnimationFrame(syncIndicator);
    window.addEventListener("resize", syncIndicator);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", syncIndicator);
    };
  }, [collapsed, location.pathname]);

  useLayoutEffect(() => {
    if (collapsed) {
      return undefined;
    }

    const navNode = expandedNavRef.current;
    if (!navNode) return undefined;

    const syncIndicator = () => {
      const activeLink = navNode.querySelector('[data-sidebar-active="true"]');
      if (!activeLink) {
        setExpandedIndicator(null);
        return;
      }

      setExpandedIndicator({
        top: activeLink.offsetTop,
        height: activeLink.offsetHeight,
      });
    };

    syncIndicator();
    const rafId = window.requestAnimationFrame(syncIndicator);
    window.addEventListener("resize", syncIndicator);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", syncIndicator);
    };
  }, [collapsed, location.pathname]);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      localStorage.setItem(LOGO_KEY, dataUrl);
      setLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const brandInitials = getInitials(activeBrand?.name, "NS");
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <div
      className={`social-sidebar-shell relative flex h-screen shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white ${
        collapsed ? "w-20 sidebar-collapsed" : "w-52 sidebar-expanded"
      }`}
    >
      {/* Logo / App Brand */}
      <div className={`social-shell-header flex items-center ${collapsed ? "justify-center px-3" : "border-b border-gray-200 px-4"}`}>
        <div className={`flex w-full items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div
            onClick={() => fileRef.current?.click()}
            title="Click to change logo"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 to-purple-600 transition-opacity hover:opacity-80"
          >
            {logo ? (
              <img src={logo} alt="NaFa Social" className="h-10 w-10 object-cover" />
            ) : (
              <span className="text-base font-bold text-white">{brandInitials}</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />

          <div className={`social-sidebar-copy min-w-0 ${collapsed ? "is-collapsed" : "is-expanded"}`}>
              <h2 className="text-sm font-bold text-gray-900">NaFa Social</h2>
              {activeBrand ? (
                <p className="max-w-28 truncate text-[11px] font-semibold text-blue-600" title={activeBrand.name}>
                  {activeBrand.name}
                </p>
              ) : (
                <p className="text-[11px] text-gray-500">CRM Dashboard</p>
              )}
            </div>

          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed((current) => !current)}
              aria-label="Collapse sidebar"
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-700"
            >
              <ToggleIcon size={17} strokeWidth={2.1} />
            </button>
          )}
        </div>
      </div>

      {collapsed && (
        <div className="px-2 py-2">
          <button
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            aria-label="Expand sidebar"
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-700"
          >
            <ToggleIcon size={17} strokeWidth={2.1} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex flex-1 overflow-hidden ${collapsed ? "px-3 py-2" : "flex-col justify-between pl-3 pr-2 py-4"}`}>
        {collapsed ? (
          <div
            ref={collapsedNavRef}
            className="relative grid h-full w-full items-center justify-items-center py-1"
            style={{ gridTemplateRows: `repeat(${COLLAPSED_ITEMS.length}, minmax(0, 1fr))` }}
          >
            {/* Animated indicator */}
            {collapsedIndicatorTop !== null && (
              <span
                className="animated-nav-indicator absolute left-1/2 -translate-x-1/2 z-10 h-10 w-10 rounded-full bg-blue-50 shadow-sm"
                style={{ top: `${collapsedIndicatorTop}px` }}
              />
            )}
            {COLLAPSED_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-sidebar-active={active ? "true" : "false"}
                  title={item.label}
                  className={`relative z-20 flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors duration-200 ${
                    active ? "text-blue-600" : "text-gray-700 hover:bg-gray-50"
                  }`}
                  style={{ pointerEvents: active ? 'none' : undefined }}
                >
                  <Icon size={18} strokeWidth={2} />
                </Link>
              );
            })}
          </div>
        ) : (
          <div ref={expandedNavRef} className="relative w-full">
            {expandedIndicator && (
              <span
                className="animated-nav-indicator-expanded pointer-events-none absolute inset-x-0 z-10 rounded-xl bg-blue-50 shadow-sm"
                style={{
                  top: `${expandedIndicator.top}px`,
                  height: `${expandedIndicator.height}px`,
                }}
              />
            )}
            {NAV_SECTIONS.map((section, sectionIndex) => (
              <section key={section.title} className={sectionIndex === 0 ? "w-full" : "w-full border-t border-gray-100 pt-3"}>
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">{section.title}</p>

                <div className="space-y-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item);

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        data-sidebar-active={active ? "true" : "false"}
                        className={`relative z-20 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 ${
                          active ? "text-blue-600 font-semibold" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={18} strokeWidth={2} />
                        <span className="social-sidebar-label is-expanded truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}
