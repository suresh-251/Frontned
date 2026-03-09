import React, { useState, useEffect, cloneElement } from "react";
import useFacebookDashboard from "../hooks/useFacebookDashboard";
import api from "../api/apiClient";
import { connectPlatform } from "../api/auth.api";
import { useBrand } from "../context/BrandContext";
import { useNavigate } from "react-router-dom";
import { FiEdit, FiUsers, FiFileText, FiSettings, FiActivity, FiInfo } from "react-icons/fi";

const FB_COLOR   = "text-blue-600 bg-blue-50";
const IG_COLOR   = "text-pink-500 bg-pink-50";
const LI_COLOR   = "text-sky-700 bg-sky-50";

function PlatformBadge({ platform }) {
  const MAP = {
    Facebook:  { label: "Facebook",  cls: "bg-blue-100 text-blue-700"  },
    Instagram: { label: "Instagram", cls: "bg-pink-100 text-pink-700"  },
    LinkedIn:  { label: "LinkedIn",  cls: "bg-sky-100 text-sky-700"    },
  };
  const m = MAP[platform] ?? { label: platform, cls: "bg-gray-100 text-gray-600" };
  return <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${m.cls}`}>{m.label}</span>;
}

function PlatformIcon({ platform, size = 18 }) {
  if (platform === "Facebook") return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className="text-blue-600">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
  if (platform === "Instagram") return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className="text-pink-500">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className="text-sky-700">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

export default function Dashboard() {
  const stats = useFacebookDashboard();
  const navigate = useNavigate();
  const { activeBrand } = useBrand();

  const [accounts, setAccounts] = useState([]);   // all accounts for active brand
  const [fbAnalytics, setFbAnalytics] = useState(null);  // page analytics (active page)
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Load brand-scoped accounts (single call) + FB analytics in parallel
  useEffect(() => {
    if (!activeBrand?.slug) { setLoadingAccounts(false); return; }
    setLoadingAccounts(true);
    const normP = (p) => ({ facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn" }[(p ?? "").toLowerCase()] ?? p);
    Promise.allSettled([
      api.get(`/brands/${activeBrand.slug}/accounts`),
      api.get("/analytics/facebook/page"),
    ]).then(([accsRes, analyticsRes]) => {
      const raw = accsRes.status === "fulfilled" ? (accsRes.value.data.accounts ?? []) : [];
      setAccounts(raw.map(a => ({
        id:             a.pageIdentifier,
        platform:       normP(a.platform),
        pageIdentifier: a.pageIdentifier,
        displayName:    a.displayName,
        isActive:       a.isActive,
      })));
      setFbAnalytics(analyticsRes.status === "fulfilled" ? analyticsRes.value?.data ?? null : null);
    }).finally(() => setLoadingAccounts(false));
  }, [activeBrand?.slug]);

  if (!stats) return null;

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-6 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard</h1>
        <p className="text-xs text-slate-500 font-medium">
          {activeBrand ? <>Brand: <span className="font-bold text-slate-700">{activeBrand.name}</span></> : "Welcome back!"}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* LEFT: Brand Health + Growth */}
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* BRAND HEALTH TABLE */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                Brand Health <FiInfo className="text-slate-300" size={14} />
              </h3>
              {activeBrand && (
                <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                  {activeBrand.name}
                </span>
              )}
            </div>

            <div className="overflow-y-auto max-h-[320px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider sticky top-0 z-10 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Channel</th>
                    <th className="px-6 py-3">Followers / Fans</th>
                    <th className="px-6 py-3">Reach</th>
                    <th className="px-6 py-3">Leads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loadingAccounts ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm animate-pulse">Loading channels...</td></tr>
                  ) : accounts.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">No accounts connected to this brand</td></tr>
                  ) : (
                    accounts.map(acc => {
                      // For the active FB page, show real analytics; otherwise show "—"
                      const isFbActive = acc.platform === "Facebook" && acc.isActive;
                      const followers = isFbActive && fbAnalytics
                        ? (fbAnalytics.followers_count ?? fbAnalytics.fan_count ?? "—").toLocaleString?.() ?? fbAnalytics.followers_count ?? fbAnalytics.fan_count
                        : "—";
                      const reach = isFbActive && fbAnalytics?.reach ? fbAnalytics.reach.toLocaleString?.() ?? fbAnalytics.reach : "—";
                      return (
                        <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <PlatformIcon platform={acc.platform} size={18} />
                              <div>
                                <p className="text-[11px] font-bold text-slate-700 leading-tight">{acc.displayName || acc.pageIdentifier}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <PlatformBadge platform={acc.platform} />
                                  {acc.isActive && <span className="text-[9px] text-green-600 font-semibold">● active</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{followers}</td>
                          <td className="px-6 py-4 text-[11px] font-bold text-slate-600">{reach}</td>
                          <td className="px-6 py-4">
                            <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {acc.platform === "Facebook" ? stats.totalLeads : "—"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Connect new */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect New:</span>
              <div className="flex gap-5">
                <button onClick={() => connectPlatform("facebook")} className="flex items-center gap-1.5 text-slate-300 hover:text-blue-600 transition-all hover:scale-105 text-[9px] font-black uppercase tracking-tighter">
                  <PlatformIcon platform="Facebook" size={14}/> Facebook
                </button>
                <button onClick={() => connectPlatform("facebook")} className="flex items-center gap-1.5 text-slate-300 hover:text-pink-500 transition-all hover:scale-105 text-[9px] font-black uppercase tracking-tighter">
                  <PlatformIcon platform="Instagram" size={14}/> Instagram
                </button>
                <button onClick={() => connectPlatform("linkedin")} className="flex items-center gap-1.5 text-slate-300 hover:text-sky-700 transition-all hover:scale-105 text-[9px] font-black uppercase tracking-tighter">
                  <PlatformIcon platform="LinkedIn" size={14}/> LinkedIn
                </button>
              </div>
            </div>
          </div>

          {/* FB ANALYTICS CARD (only when active page has data) */}
          {fbAnalytics && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Page Fans",      value: fbAnalytics.fan_count?.toLocaleString() ?? "—",       icon: "👥" },
                { label: "Followers",      value: fbAnalytics.followers_count?.toLocaleString() ?? "—", icon: "📣" },
                { label: "Category",       value: fbAnalytics.category ?? "—",                          icon: "🏷️" },
              ].map(m => (
                <div key={m.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{m.icon} {m.label}</p>
                  <p className="text-xl font-black text-slate-800">{m.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Quick Actions + Activity */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-slate-800 font-bold text-[10px] uppercase tracking-widest mb-5">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <CompactAction icon={<FiEdit />}     label="Post"   color="bg-blue-600"    onClick={() => navigate("/crm/socialmedia/post/create")} />
              <CompactAction icon={<FiUsers />}    label="Leads"  color="bg-indigo-600"  onClick={() => navigate("/crm/socialmedia/leads")} />
              <CompactAction icon={<FiFileText />} label="Forms"  color="bg-emerald-600" onClick={() => navigate("/crm/socialmedia/leads/forms")} />
              <CompactAction icon={<FiSettings />} label="Config" color="bg-slate-700"   onClick={() => navigate("/crm/socialmedia/facebook/pages/subscriptions")} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-slate-800 font-bold text-[10px] uppercase tracking-widest">Recent Activity</h3>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            </div>
            <div className="space-y-4">
              <ActivityItem text="Facebook Sync" time="2m ago" />
              <ActivityItem text="New Lead Received" time="15m ago" />
              <ActivityItem text="Instagram Updated" time="1h ago" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactAction({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all active:scale-95 group">
      <div className={`w-10 h-10 rounded-lg ${color} text-white flex items-center justify-center shadow-md mb-2 group-hover:-translate-y-1 transition-transform`}>
        {cloneElement(icon, { size: 18 })}
      </div>
      <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function ActivityItem({ text, time }) {
  return (
    <div className="flex items-center justify-between border-l-2 border-slate-100 pl-4 py-1">
      <p className="text-[11px] font-bold text-slate-600">{text}</p>
      <span className="text-[9px] font-bold text-slate-300 uppercase">{time}</span>
    </div>
  );
}


