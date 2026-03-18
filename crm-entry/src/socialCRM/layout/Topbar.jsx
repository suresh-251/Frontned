import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBrand } from "../context/BrandContext";
import { getBrandLogoSrc } from "../api/brand.api";
import { getUnreadCount, createInboxHubConnection } from "../api/inbox.api";
import { createLeadsHubConnection } from "../api/facebook.leads.api";
import { useAuth } from "../../auth/AuthContext";
import toast from "react-hot-toast";

// ── Brand Switcher + Add button ─────────────────────────────────────────────
function TopbarBrandSwitcher() {
  const { brands, activeBrand, switchBrand } = useBrand();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSwitch = async (slug) => {
    if (activeBrand?.slug === slug) { setOpen(false); return; }
    try { await switchBrand(slug); toast.success("Brand switched!"); } catch { toast.error("Failed to switch brand"); }
    setOpen(false);
  };

  const initials = (name) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const needsBrandScroll = brands.length > 3;

  return (
    <div className="flex items-center gap-1 relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-all">
        {activeBrand ? (
          <>
            <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-md bg-linear-to-br from-blue-600 to-purple-600">
              {getBrandLogoSrc(activeBrand)
                ? <img src={getBrandLogoSrc(activeBrand)} alt={activeBrand.name} className="w-5 h-5 object-cover" />
                : <span className="text-white text-[9px] font-bold">{initials(activeBrand.name)}</span>}
            </div>
            <span className="max-w-27.5 truncate text-sm font-semibold text-indigo-800">{activeBrand.name}</span>
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          </>
        ) : (
          <span className="text-sm font-medium text-yellow-700">No Brand</span>
        )}
        <svg className={`w-3.5 h-3.5 text-indigo-500 transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <button onClick={() => navigate("/crm/socialmedia/brands")}
        title="Add new brand"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-indigo-300 text-indigo-500 hover:bg-indigo-50 hover:border-indigo-400 transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Brands</p>
            <button onClick={() => { setOpen(false); navigate("/crm/socialmedia/brands"); }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Manage</button>
          </div>
          <div
            className={needsBrandScroll
              ? "max-h-35 overflow-y-scroll overscroll-contain pr-1"
              : "overflow-visible"
            }
            style={needsBrandScroll ? { scrollbarWidth: "thin", scrollbarGutter: "stable both-edges" } : undefined}
          >
            {brands.length === 0 && <p className="px-4 py-3 text-sm text-gray-500 text-center">No brands yet</p>}
            {brands.map(b => (
              <button key={b.slug} onClick={() => handleSwitch(b.slug)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-all text-left ${b.isActive ? "bg-blue-50" : ""}`}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-blue-600 to-purple-600">
                  {getBrandLogoSrc(b) ? <img src={getBrandLogoSrc(b)} alt={b.name} className="w-7 h-7 object-cover" /> : <span className="text-white text-[10px] font-bold">{initials(b.name)}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{b.name}</p>
                  {b.description && <p className="text-xs text-gray-500 truncate">{b.description}</p>}
                </div>
                {b.isActive && <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Active</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── User profile dropdown ────────────────────────────────────────────────────
function UserMenu() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const userName = auth?.user?.name || auth?.user?.unique_name || auth?.user?.email || "User";
  const initials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex h-10 items-center gap-2 rounded-xl p-1.5 hover:bg-gray-100 transition">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-pink-500">
          <span className="text-white text-sm font-bold">{initials}</span>
        </div>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
            {auth?.user?.email && <p className="text-xs text-gray-500 truncate">{auth.user.email}</p>}
          </div>
          <div className="py-1">
            <button onClick={() => { setOpen(false); navigate("/crm/socialmedia/settings"); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button onClick={() => { auth?.logout?.(); navigate("/login"); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Topbar() {
  const navigate = useNavigate();
  const { activeBrand, refresh: refreshBrands, invalidateAllBrandCaches } = useBrand();
  const [unread, setUnread] = useState(0);
  const [newLeads, setNewLeads] = useState(0);
  const hubRef = useRef(null);
  const leadsHubRef = useRef(null);

  // Fetch unread count on mount and brand change
  useEffect(() => {
    if (!activeBrand?.id) return;
    getUnreadCount().then((d) => setUnread(d.unreadCount ?? 0)).catch(() => {});
  }, [activeBrand?.id]);

  // Listen for real-time new messages via SignalR
  useEffect(() => {
    if (!activeBrand?.id) return;
    const conn = createInboxHubConnection();
    hubRef.current = conn;
    conn.on("NewMessage", (msg) => {
      if (msg.direction === "Incoming") setUnread((prev) => prev + 1);
    });
    conn.on("MessageRead", () => {
      getUnreadCount().then((d) => setUnread(d.unreadCount ?? 0)).catch(() => {});
    });
    conn.on("BrandSwitched", () => {
      invalidateAllBrandCaches();
      refreshBrands();
    });
    conn.start().then(async () => {
      await conn.invoke("JoinBrand", String(activeBrand.id)).catch(() => {});
    }).catch(() => {});
    return () => { conn.stop(); };
  }, [activeBrand?.id]);

  // Listen for real-time lead notifications via SignalR
  useEffect(() => {
    if (!activeBrand?.id) return;
    const conn = createLeadsHubConnection();
    leadsHubRef.current = conn;
    conn.on("LeadUpdated", () => {
      setNewLeads((prev) => prev + 1);
      toast("🟢 New lead received!", { duration: 4000, position: "top-right" });
    });
    conn.start().catch(() => {});
    return () => { conn.stop(); };
  }, [activeBrand?.id]);

  return (
    <div className="bg-white px-5 border-b border-gray-200 shadow-sm shrink-0 z-30 h-[57px] flex items-center">
      <div className="flex items-center justify-between gap-4 w-full">

        {/* Left: search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200" />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <TopbarBrandSwitcher />

          {/* Notifications — links to Inbox */}
          <button
            onClick={() => { setUnread(0); navigate("/crm/socialmedia/inbox"); }}
            title="Inbox messages"
            className="relative w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white px-1">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>

          {/* Lead notifications — links to Leads */}
          <button
            onClick={() => { setNewLeads(0); navigate("/crm/socialmedia/leads"); }}
            title="New leads"
            className="relative w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {newLeads > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-green-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white px-1">
                {newLeads > 99 ? "99+" : newLeads}
              </span>
            )}
          </button>

          <UserMenu />
        </div>
      </div>
    </div>
  );
}
