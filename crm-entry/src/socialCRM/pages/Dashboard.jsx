import React, { useState, useEffect, cloneElement } from "react";
import useFacebookDashboard from "../hooks/useFacebookDashboard";
import api from "../api/apiClient";
import { connectPlatform } from "../api/auth.api";
import { selectPage } from "../api/facebook.pages.api";
import { activateInstagramAccount } from "../api/instagram.accounts.api";
import { getChannelMetrics, syncAnalytics } from "../api/analytics.api";
import { useBrand } from "../context/BrandContext";
import { useNavigate } from "react-router-dom";
import { FiEdit, FiUsers, FiFileText, FiSettings, FiActivity, FiInfo, FiZap, FiWifi, FiWifiOff, FiChevronDown } from "react-icons/fi";

// ── Platform helpers ────────────────────────────────────────────────────────
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

// ── Stat cell ───────────────────────────────────────────────────────────────
function StatCell({ value }) {
  if (value == null || value === "—") return <span className="text-slate-300 font-semibold">—</span>;
  const n = typeof value === "number" ? value.toLocaleString() : value;
  return <span className="font-bold text-slate-800">{n}</span>;
}

export default function Dashboard() {
  const rawStats = useFacebookDashboard();
  const stats = rawStats ?? { totalLeads: 0, newLeads: 0, enabledForms: 0, pageName: null };
  const navigate = useNavigate();
  const { activeBrand } = useBrand();

  // All accounts grouped by platform
  const [accountsByPlatform, setAccountsByPlatform] = useState({});
  // Selected account per platform (for dropdown)
  const [selectedAccount, setSelectedAccount] = useState({});
  // Channel metrics from /api/analytics/brand/channels
  const [channelMetrics, setChannelMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  const PLATFORMS = ["Facebook", "Instagram", "LinkedIn"];
  const normPlatform = (p) =>
    ({ facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn" }[(p ?? "").toLowerCase()] ?? p);

  const loadData = async (slug) => {
    if (!slug) { setLoading(false); return; }
    setLoading(true);
    try {
      const [accsRes, igRes, channelsRes] = await Promise.allSettled([
        api.get(`/brands/${slug}/accounts`),
        api.get("/instagram/accounts"),
        getChannelMetrics(30),
      ]);
      const rawAccs = accsRes.status === "fulfilled" ? (accsRes.value.data.accounts ?? []) : [];
      const igList = igRes.status === "fulfilled" ? (igRes.value.data ?? []) : [];
      const igMap = new Map(igList.map(a => [a.instagramBusinessId, a]));

      // Group by platform
      const grouped = {};
      for (const a of rawAccs) {
        const plat = normPlatform(a.platform);
        let displayName = a.displayName;
        if (plat === "Instagram") {
          const ig = igMap.get(a.pageIdentifier);
          if (ig) displayName = ig.username || ig.name || ig.displayName || displayName;
        }
        if (!grouped[plat]) grouped[plat] = [];
        grouped[plat].push({ ...a, platform: plat, displayName });
      }
      setAccountsByPlatform(grouped);

      // Default selected = active account per platform
      const sel = {};
      for (const [plat, accs] of Object.entries(grouped)) {
        sel[plat] = (accs.find(a => a.isActive) ?? accs[0])?.pageIdentifier ?? null;
      }
      setSelectedAccount(sel);

      // Channel metrics from analytics pipeline
      setChannelMetrics(channelsRes.status === "fulfilled" ? (channelsRes.value ?? []) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(activeBrand?.slug); }, [activeBrand?.slug]);

  const handleSync = async () => {
    setSyncing(true); setSyncMsg(null);
    try {
      const result = await syncAnalytics();
      setSyncMsg({ ok: true, text: `Synced ${result.postsSynced ?? 0} posts` });
      await loadData(activeBrand?.slug);
    } catch (e) {
      setSyncMsg({ ok: false, text: e.message || "Sync failed" });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  const activateAccount = async (platform, pageIdentifier) => {
    setActivating(pageIdentifier);
    try {
      if (platform === "Facebook") await selectPage(pageIdentifier);
      else if (platform === "Instagram") await activateInstagramAccount(pageIdentifier);
      await loadData(activeBrand?.slug);
    } catch (e) { console.error("Activate failed", e); }
    finally { setActivating(null); }
  };

  const handleAccountSelect = async (platform, pageIdentifier) => {
    setSelectedAccount(prev => ({ ...prev, [platform]: pageIdentifier }));
    // Also activate it
    await activateAccount(platform, pageIdentifier);
  };

  if (!activeBrand) return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-6 flex items-center justify-center">
      <p className="text-slate-400 font-medium text-sm">No active brand — please select or create a brand first.</p>
    </div>
  );

  const getMetrics = (platform) => {
    const accs = accountsByPlatform[platform] ?? [];
    const selId = selectedAccount[platform];
    const acc = accs.find(a => a.pageIdentifier === selId) ?? accs[0];
    if (!acc) return null;

    // Look up from the analytics pipeline channel metrics
    const ch = channelMetrics.find(
      c => c.accountId === acc.pageIdentifier ||
           c.platform?.toLowerCase() === platform.toLowerCase()
    );

    return {
      acc,
      totalFollowers: ch?.totalFollowers ?? null,
      newFollowers:   ch?.newFollowers   ?? null,
      reach:          ch?.totalReach     > 0 ? ch.totalReach     : null,
      engagement:     ch?.totalEngagement > 0 ? ch.totalEngagement : null,
      leads:          ch?.totalLeads     ?? null,
    };
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-6">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Brand: <span className="font-bold text-slate-700">{activeBrand.name}</span>
          </p>
        </div>
        <button onClick={() => navigate("/crm/socialmedia/post/create")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-all">
          <FiEdit size={14} /> New Post
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* ── Section 1: Connected Channels ──────────────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <FiWifi className="text-green-500" size={14} /> Connected Channels
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {PLATFORMS.map(plat => {
                const accs = accountsByPlatform[plat] ?? [];
                const connected = accs.length > 0;
                const active = accs.find(a => a.isActive);
                return (
                  <div key={plat} className="px-6 py-3 flex items-center gap-4">
                    <PlatformIcon platform={plat} size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{plat}</p>
                      {connected && (
                        <p className="text-xs text-slate-500">{active?.displayName || accs[0]?.displayName || "Connected"}</p>
                      )}
                    </div>
                    {connected ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Connected
                      </span>
                    ) : (
                      <button onClick={() => connectPlatform(plat.toLowerCase())}
                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 px-3 py-1 rounded-full transition-all">
                        <FiWifiOff size={12} /> Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Section 2: Performance Metrics Table ───────────────────────── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <FiActivity className="text-blue-500" size={14} /> Performance Metrics
              </h3>
              <div className="flex items-center gap-2">
                {syncMsg && (
                  <span className={`text-xs font-medium ${syncMsg.ok ? "text-green-600" : "text-red-500"}`}>
                    {syncMsg.ok ? "✓" : "⚠"} {syncMsg.text}
                  </span>
                )}
                <button onClick={handleSync} disabled={syncing}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50">
                  {syncing
                    ? <span className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                    : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  }
                  {syncing ? "Syncing…" : "Sync"}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="px-6 py-10 text-center text-slate-400 text-sm animate-pulse">Loading metrics…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Connected Channel</th>
                      <th className="px-5 py-3 text-right">Total Followers</th>
                      <th className="px-5 py-3 text-right">New Followers</th>
                      <th className="px-5 py-3 text-right">Reach</th>
                      <th className="px-5 py-3 text-right">Engagement</th>
                      <th className="px-5 py-3 text-right">Leads</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {PLATFORMS.map(plat => {
                      const accs = accountsByPlatform[plat] ?? [];
                      const metrics = getMetrics(plat);
                      if (accs.length === 0) {
                        return (
                          <tr key={plat} className="hover:bg-slate-50/50">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <PlatformIcon platform={plat} size={18} />
                                <div>
                                  <p className="text-sm font-semibold text-slate-400 italic">Not connected</p>
                                  <button onClick={() => connectPlatform(plat.toLowerCase())}
                                    className="text-[10px] text-blue-600 font-medium hover:underline mt-0.5">+ Connect {plat}</button>
                                </div>
                              </div>
                            </td>
                            {[...Array(5)].map((_, i) => (
                              <td key={i} className="px-5 py-4 text-right text-slate-300 text-sm">—</td>
                            ))}
                          </tr>
                        );
                      }

                      const selId = selectedAccount[plat];
                      const selAcc = accs.find(a => a.pageIdentifier === selId) ?? accs[0];
                      const isActivating = activating === selId;

                      return (
                        <tr key={plat} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <PlatformIcon platform={plat} size={18} />
                              <div className="min-w-0">
                                {/* Account dropdown if multiple */}
                                {accs.length > 1 ? (
                                  <div className="relative inline-block">
                                    <select
                                      value={selId ?? ""}
                                      onChange={e => handleAccountSelect(plat, e.target.value)}
                                      disabled={isActivating}
                                      className="text-sm font-bold text-slate-800 bg-transparent pr-5 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-300 rounded"
                                    >
                                      {accs.map(a => (
                                        <option key={a.pageIdentifier} value={a.pageIdentifier}>
                                          {a.displayName || a.pageIdentifier}
                                        </option>
                                      ))}
                                    </select>
                                    <FiChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                  </div>
                                ) : (
                                  <p className="text-sm font-bold text-slate-800 truncate max-w-[160px]">
                                    {selAcc?.displayName || selAcc?.pageIdentifier}
                                  </p>
                                )}
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{plat}</span>
                                  {selAcc?.isActive
                                    ? <span className="text-[9px] text-green-600 font-semibold">● active</span>
                                    : plat !== "LinkedIn" && (
                                      <button onClick={() => activateAccount(plat, selId)}
                                        disabled={isActivating}
                                        className="text-[9px] text-blue-600 font-semibold flex items-center gap-0.5 hover:text-blue-800 disabled:opacity-50">
                                        {isActivating ? <span className="w-2 h-2 border border-blue-600 border-t-transparent rounded-full animate-spin" /> : <FiZap size={8} />}
                                        {isActivating ? "…" : "Activate"}
                                      </button>
                                    )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right text-sm"><StatCell value={metrics?.totalFollowers} /></td>
                          <td className="px-5 py-4 text-right text-sm"><StatCell value={metrics?.newFollowers} /></td>
                          <td className="px-5 py-4 text-right text-sm"><StatCell value={metrics?.reach} /></td>
                          <td className="px-5 py-4 text-right text-sm"><StatCell value={metrics?.engagement} /></td>
                          <td className="px-5 py-4 text-right text-sm"><StatCell value={metrics?.leads} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Quick Actions + Activity ──────────────────────────────── */}
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


