import React, { useState, useEffect, useRef, useCallback, cloneElement } from "react";
import api from "../api/apiClient";
import { connectPlatform } from "../api/auth.api";
import { selectPage } from "../api/facebook.pages.api";
import { activateInstagramAccount } from "../api/instagram.accounts.api";
import { getChannelMetrics, syncAnalytics, getGrowthMetrics } from "../api/analytics.api";
import { getSelectedQuickActions, getQuickActions, saveQuickActions } from "../api/quickActions.api";
import { appCache } from "../utils/cache";
import { useBrand } from "../context/BrandContext";
import { useNavigate } from "react-router-dom";
import {
  FiEdit, FiUsers, FiSettings, FiActivity,
  FiZap, FiChevronDown, FiRefreshCw, FiSliders,
  FiBarChart2, FiMessageCircle, FiCalendar, FiBriefcase, FiBookOpen,
  FiTrendingUp, FiTrendingDown, FiMinus,
} from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { Cell } from "recharts";

// Icon map for quick action modules
const ICON_MAP = {
  analytics:  <FiBarChart2 />,
  leads:      <FiUsers />,
  inbox:      <FiMessageCircle />,
  posts:      <FiEdit />,
  scheduler:  <FiCalendar />,
  contacts:   <FiBookOpen />,
  brands:     <FiBriefcase />,
  settings:   <FiSettings />,
};

const COLOR_MAP = {
  analytics:  "bg-blue-600",
  leads:      "bg-indigo-600",
  inbox:      "bg-emerald-600",
  posts:      "bg-violet-600",
  scheduler:  "bg-amber-600",
  contacts:   "bg-teal-600",
  brands:     "bg-slate-700",
  settings:   "bg-gray-600",
};

const ROUTE_MAP = {
  analytics:  "/crm/socialmedia/analytics",
  leads:      "/crm/socialmedia/leads",
  inbox:      "/crm/socialmedia/inbox",
  posts:      "/crm/socialmedia/post/history",
  scheduler:  "/crm/socialmedia/post/history",
  contacts:   "/crm/socialmedia/leads",
  brands:     "/crm/socialmedia/brands",
  settings:   "/crm/socialmedia/facebook/pages/subscriptions",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const PLATFORMS = ["Facebook", "Instagram", "LinkedIn"];
const normPlat  = (p) =>
  ({ facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn" }[(p ?? "").toLowerCase()] ?? p);

const dashKey = (slug) => `sc_dash_${slug}`;

// ── Platform SVG icon ─────────────────────────────────────────────────────────
function PlatformIcon({ platform, size = 18 }) {
  if (platform === "Facebook") return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className="text-blue-600">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
  if (platform === "Instagram") return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className="text-pink-500">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className="text-sky-700">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// ── Skeleton row for table ────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0" />
          <div className="space-y-2">
            <div className="h-3.5 bg-slate-200 rounded w-28" />
            <div className="h-2.5 bg-slate-100 rounded w-16" />
          </div>
        </div>
      </td>
      {[...Array(5)].map((_, i) => (
        <td key={i} className="px-6 py-5 text-right">
          <div className="h-3.5 bg-slate-200 rounded w-12 ml-auto" />
        </td>
      ))}
    </tr>
  );
}

// ── Stat cell ─────────────────────────────────────────────────────────────────
function StatCell({ value }) {
  if (value == null || value === "—") return <span className="text-slate-300 font-semibold">—</span>;
  const n = typeof value === "number" ? value.toLocaleString() : value;
  return <span className="font-bold text-slate-800">{n}</span>;
}

function GrowthCard({ label, current, previous, change, percent }) {
  const isPositive = (change ?? 0) >= 0;
  const fmt = (n) => n == null ? "—" : Number(n) >= 1000 ? (Number(n) / 1000).toFixed(1) + "K" : Number(n).toLocaleString();
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-1 hover:shadow-sm transition-shadow">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-800 leading-none">{fmt(current)}</p>
      <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? "text-emerald-600" : "text-rose-500"}`}>
        <span>{isPositive ? "▲" : "▼"}</span>
        <span>{fmt(Math.abs(change ?? 0))}</span>
        {percent != null && <span className="text-slate-400 font-normal">({Number(percent).toFixed(1)}%)</span>}
      </div>
      <p className="text-[10px] text-slate-400">prev: {fmt(previous)}</p>
    </div>
  );
}

function CompactAction({ icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-bold shadow-sm hover:opacity-90 transition-opacity ${color}`}
    >
      <span className="text-base leading-none">{icon}</span>
      {label}
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function Dashboard() {
  const navigate    = useNavigate();
  const { activeBrand } = useBrand();

  const [accountsByPlatform, setAccountsByPlatform] = useState({});
  const [selectedAccount,    setSelectedAccount]    = useState({});
  const [channelMetrics,     setChannelMetrics]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false); // background refresh indicator
  const [activating,   setActivating]   = useState(null);
  const [syncing,      setSyncing]      = useState(false);
  const [syncMsg,      setSyncMsg]      = useState(null);
  const [quickActions, setQuickActions] = useState([]);
  const [allModules,   setAllModules]   = useState([]);
  const [showCustomize, setShowCustomize] = useState(false);
  const [savingQA,     setSavingQA]     = useState(false);
  const [growth,       setGrowth]       = useState(null);
  const [growthLoading, setGrowthLoading] = useState(true);

  // ── Fetch from server and update cache ──────────────────────────────────────
  const fetchFromServer = useCallback(async (slug) => {
    const [accsRes, channelsRes] = await Promise.allSettled([
      api.get(`/brands/${slug}/accounts`),
      getChannelMetrics(30),
    ]);

    const rawAccs   = accsRes.status     === "fulfilled" ? (accsRes.value.data.accounts ?? [])  : [];
    const chMetrics = channelsRes.status === "fulfilled" ? (channelsRes.value ?? []) : [];

    // Group accounts by platform (displayName already set by backend)
    const grouped = {};
    for (const a of rawAccs) {
      const plat = normPlat(a.platform);
      if (!grouped[plat]) grouped[plat] = [];
      grouped[plat].push({ ...a, platform: plat });
    }

    // Default selected = active account, or first
    const sel = {};
    for (const [plat, accs] of Object.entries(grouped)) {
      sel[plat] = (accs.find(a => a.isActive) ?? accs[0])?.pageIdentifier ?? null;
    }

    const payload = { accountsByPlatform: grouped, selectedAccount: sel, channelMetrics: chMetrics };
    appCache.set(dashKey(slug), payload);
    return payload;
  }, []);

  // ── Apply fetched/cached data to state ──────────────────────────────────────
  const applyData = useCallback((data) => {
    setAccountsByPlatform(data.accountsByPlatform);
    setSelectedAccount(data.selectedAccount);
    setChannelMetrics(data.channelMetrics);
  }, []);

  // ── Main load logic (SWR) ───────────────────────────────────────────────────
  const loadData = useCallback(async (slug, opts = {}) => {
    if (!slug) { setLoading(false); return; }

    const key    = dashKey(slug);
    const cached = appCache.get(key); // null if expired (> 20 min)

    if (cached && !opts.force) {
      // Serve from cache immediately — no loading spinner
      applyData(cached.data);
      setLoading(false);

      // Background refresh only if stale (3–20 min)
      if (appCache.isStale(key)) {
        setRefreshing(true);
        try {
          const fresh = await fetchFromServer(slug);
          applyData(fresh);
        } catch { /* keep stale data */ }
        finally { setRefreshing(false); }
      }
      return;
    }

    // No usable cache — show skeleton + fetch
    if (!opts.silent) setLoading(true);
    try {
      const fresh = await fetchFromServer(slug);
      applyData(fresh);
    } catch { /* leave empty */ }
    finally { setLoading(false); }
  }, [fetchFromServer, applyData]);

  useEffect(() => { loadData(activeBrand?.slug); }, [activeBrand?.slug]);

  // ── Load quick actions ───────────────────────────────────────────────────
  useEffect(() => {
    getSelectedQuickActions()
      .then(setQuickActions)
      .catch(() => setQuickActions([]));
  }, []);

  // ── Load growth metrics ─────────────────────────────────────────────────
  useEffect(() => {
    if (!activeBrand?.slug) return;
    setGrowthLoading(true);
    getGrowthMetrics()
      .then(setGrowth)
      .catch(() => setGrowth(null))
      .finally(() => setGrowthLoading(false));
  }, [activeBrand?.slug]);

  // ── Sync ────────────────────────────────────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true); setSyncMsg(null);
    try {
      const result = await syncAnalytics();
      const posts  = result?.postsSynced ?? 0;
      const errors = result?.errors ?? [];
      setSyncMsg({
        ok:   errors.length === 0,
        text: errors.length > 0
          ? `Synced ${posts} posts (${errors.length} error${errors.length > 1 ? "s" : ""})`
          : `Synced ${posts} posts across ${result?.platformsSynced ?? 0} platform(s)`,
      });
      appCache.invalidate(dashKey(activeBrand?.slug));
      await loadData(activeBrand?.slug, { force: true, silent: true });
      getGrowthMetrics().then(setGrowth).catch(() => {});
    } catch (e) {
      setSyncMsg({ ok: false, text: e?.message || "Sync failed" });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 8000);
    }
  };

  // ── Activate account ─────────────────────────────────────────────────────────
  const activateAccount = async (platform, pageIdentifier) => {
    setActivating(pageIdentifier);
    try {
      if (platform === "Facebook") await selectPage(pageIdentifier);
      else if (platform === "Instagram") await activateInstagramAccount(pageIdentifier);
      // Optimistic update — flip isActive in local state immediately
      setAccountsByPlatform(prev => {
        const next = { ...prev };
        if (next[platform]) {
          next[platform] = next[platform].map(a => ({ ...a, isActive: a.pageIdentifier === pageIdentifier }));
        }
        return next;
      });
      // Invalidate cache and background-refresh
      appCache.invalidate(dashKey(activeBrand?.slug));
      loadData(activeBrand?.slug, { force: true, silent: true });
    } catch (e) {
      console.error("Activate failed", e);
    } finally {
      setActivating(null);
    }
  };

  const handleAccountSelect = async (platform, pageIdentifier) => {
    setSelectedAccount(prev => ({ ...prev, [platform]: pageIdentifier }));
    await activateAccount(platform, pageIdentifier);
  };

  // ── No brand selected guard ───────────────────────────────────────────────
  if (!activeBrand) return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-6 flex items-center justify-center">
      <p className="text-slate-400 font-medium text-sm">No active brand — please select or create a brand first.</p>
    </div>
  );

  // ── Derived data ──────────────────────────────────────────────────────────
  const getMetrics = (platform) => {
    const accs  = accountsByPlatform[platform] ?? [];
    const selId = selectedAccount[platform];
    const acc   = accs.find(a => a.pageIdentifier === selId) ?? accs[0];
    if (!acc) return null;

    const ch =
      channelMetrics.find(c => c.accountId === acc.pageIdentifier) ??
      channelMetrics.find(c => c.platform?.toLowerCase() === platform.toLowerCase());

    return {
      acc,
      profilePictureUrl: acc?.profilePictureUrl || ch?.profilePictureUrl
        || (platform === "Facebook" && acc?.pageIdentifier
          ? `https://graph.facebook.com/${acc.pageIdentifier}/picture?type=large`
          : null),
      totalFollowers: ch?.totalFollowers ?? null,
      newFollowers:   ch?.newFollowers   ?? null,
      reach:          ch?.totalReach       > 0 ? ch.totalReach      : null,
      engagement:     ch?.totalEngagement  > 0 ? ch.totalEngagement : null,
      leads:          ch?.totalLeads       ?? null,
    };
  };

  const graphData = PLATFORMS.map(plat => {
    const m = getMetrics(plat) || {};
    return {
      platform:   plat,
      followers:  m?.totalFollowers || 0,
      reach:      m?.reach          || 0,
      engagement: m?.engagement     || 0,
      leads:      m?.leads          || 0,
    };
  });

  const hasAnyAccounts = Object.keys(accountsByPlatform).length > 0;

  // ── Quick actions customization ──────────────────────────────────────────
  const openCustomize = async () => {
    try {
      const all = await getQuickActions();
      setAllModules(all);
      setShowCustomize(true);
    } catch { setShowCustomize(true); }
  };

  const toggleModule = (key) => {
    setAllModules(prev => prev.map(m =>
      m.key === key ? { ...m, isSelected: !m.isSelected } : m
    ));
  };

  const handleSaveQA = async () => {
    const selected = allModules.filter(m => m.isSelected).map(m => m.key);
    if (selected.length === 0) return;
    setSavingQA(true);
    try {
      const updated = await saveQuickActions(selected);
      setQuickActions(updated.filter(m => m.isSelected));
      setShowCustomize(false);
    } catch { /* keep modal open */ }
    finally { setSavingQA(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-6">

      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            Brand: <span className="font-bold text-slate-700">{activeBrand.name}</span>
            {/* Background refresh indicator */}
            {refreshing && (
              <span className="flex items-center gap-1 text-blue-400 text-[10px] font-semibold">
                <FiRefreshCw size={10} className="animate-spin" /> Refreshing…
              </span>
            )}
          </p>
        </div>
        {/* <button onClick={() => navigate("/crm/socialmedia/post/create")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-all">
          <FiEdit size={14} /> New Post
        </button> */}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">

          {/* Performance Metrics Table */}
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
                  {syncing ? "Syncing…" : "Sync"}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="px-6 py-4 text-left text-[13px]">Channel</th>
                    <th className="px-6 py-4 text-right text-[13px]">Followers</th>
                    <th className="px-6 py-4 text-right text-[13px]">New</th>
                    <th className="px-6 py-4 text-right text-[13px]">Reach</th>
                    <th className="px-6 py-4 text-right text-[13px]">Engagement</th>
                    <th className="px-6 py-4 text-right text-[13px]">Leads</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {/* Loading skeleton — shown only on first load with no cache */}
                  {loading && !hasAnyAccounts ? (
                    PLATFORMS.map(p => <SkeletonRow key={p} />)
                  ) : (
                    PLATFORMS.map(plat => {
                      const accs    = accountsByPlatform[plat] ?? [];
                      const metrics = getMetrics(plat);

                      if (accs.length === 0) {
                        return (
                          <tr key={plat} className="hover:bg-slate-50 transition">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <PlatformIcon platform={plat} size={22} />
                                <div>
                                  <p className="text-[15px] font-semibold text-slate-400 italic">Not connected</p>
                                  <button onClick={() => connectPlatform(plat.toLowerCase())}
                                    className="text-[13px] text-blue-600 font-semibold hover:underline mt-1">
                                    + Connect {plat}
                                  </button>
                                </div>
                              </div>
                            </td>
                            {[...Array(5)].map((_, i) => (
                              <td key={i} className="px-6 py-5 text-right text-slate-300 text-[15px]">—</td>
                            ))}
                          </tr>
                        );
                      }

                      const selId       = selectedAccount[plat];
                      const selAcc      = accs.find(a => a.pageIdentifier === selId) ?? accs[0];
                      const isActivating = activating === selId;

                      return (
                        <tr key={plat} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              {metrics?.profilePictureUrl ? (
                                <img src={metrics.profilePictureUrl} alt={plat}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                  onError={e => { e.target.style.display = "none"; }} />
                              ) : (
                                <PlatformIcon platform={plat} size={22} />
                              )}

                              <div className="min-w-0">
                                {accs.length > 1 ? (
                                  <div className="relative inline-block">
                                    <select value={selId ?? ""} onChange={e => handleAccountSelect(plat, e.target.value)}
                                      disabled={isActivating}
                                      className="text-[15px] font-semibold text-slate-800 bg-transparent pr-5 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-300 rounded">
                                      {accs.map(a => (
                                        <option key={a.pageIdentifier} value={a.pageIdentifier}>
                                          {a.displayName || a.pageIdentifier}
                                        </option>
                                      ))}
                                    </select>
                                    <FiChevronDown size={14}
                                      className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                  </div>
                                ) : (
                                  <p className="text-[15px] font-semibold text-slate-800 truncate max-w-[200px]">
                                    {selAcc?.displayName || selAcc?.pageIdentifier}
                                  </p>
                                )}

                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[11px] font-semibold text-slate-400 uppercase">{plat}</span>
                                  {selAcc?.isActive ? (
                                    <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
                                  ) : (
                                    plat !== "LinkedIn" && (
                                      <button onClick={() => activateAccount(plat, selId)} disabled={isActivating}
                                        className="text-[12px] text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-800 disabled:opacity-50">
                                        {isActivating
                                          ? <span className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                                          : <FiZap size={11} />}
                                        Activate
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-right text-[15px] font-semibold text-slate-800">
                            <StatCell value={metrics?.totalFollowers} />
                          </td>
                          <td className="px-6 py-5 text-right text-[15px] font-semibold text-slate-800">
                            <StatCell value={metrics?.newFollowers} />
                          </td>
                          <td className="px-6 py-5 text-right text-[15px] font-semibold text-slate-800">
                            <StatCell value={metrics?.reach} />
                          </td>
                          <td className="px-6 py-5 text-right text-[15px] font-semibold text-slate-800">
                            <StatCell value={metrics?.engagement} />
                          </td>
                          <td className="px-6 py-5 text-right text-[15px] font-semibold text-slate-800">
                            <StatCell value={metrics?.leads} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Month-over-Month Growth */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <FiTrendingUp className="text-emerald-500" size={14} /> Monthly Growth
              </h3>
              {growth && (
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(growth.currentPeriodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" – "}
                  {new Date(growth.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" vs "}
                  {new Date(growth.previousPeriodStart).toLocaleDateString("en-US", { month: "short" })}
                </p>
              )}
            </div>
            <div className="p-4">
              {growthLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : growth ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <GrowthCard label="Followers"   current={growth.currentFollowers}        previous={growth.previousFollowers}        change={growth.followersChange}     percent={growth.followersGrowthPercent} />
                  <GrowthCard label="Leads"        current={growth.currentMonthLeads}       previous={growth.previousMonthLeads}       change={growth.leadsChange}         percent={growth.leadsGrowthPercent} />
                  <GrowthCard label="Engagement"   current={growth.currentMonthEngagement}  previous={growth.previousMonthEngagement}  change={growth.engagementChange}    percent={growth.engagementGrowthPercent} />
                  <GrowthCard label="Reach"        current={growth.currentMonthReach}        previous={growth.previousMonthReach}        change={growth.reachChange}         percent={growth.reachGrowthPercent} />
                  <GrowthCard label="Impressions"  current={growth.currentMonthImpressions}  previous={growth.previousMonthImpressions}  change={growth.impressionsChange}   percent={growth.impressionsGrowthPercent} />
                  <GrowthCard label="Posts"        current={growth.currentMonthPosts}        previous={growth.previousMonthPosts}        change={growth.postsChange}         percent={growth.postsGrowthPercent} />
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">No growth data available. Sync analytics first.</p>
              )}
            </div>
          </div>

          {/* Brand Growth Graph */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4">
              Brand Growth Overview
            </h3>
            {loading && !hasAnyAccounts ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="w-full" style={{ minHeight: 300 }}>
                <ResponsiveContainer width="100%" height={300} minWidth={0}>
                  <BarChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="followers"  name="Followers"  />
                    <Bar dataKey="reach"      name="Reach"      />
                    <Bar dataKey="engagement" name="Engagement" />
                    <Bar dataKey="leads"      name="Leads"      />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Quick Actions + Activity */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-slate-800 font-bold text-[10px] uppercase tracking-widest">Quick Actions</h3>
              <button onClick={openCustomize}
                className="text-slate-400 hover:text-blue-600 transition-colors" title="Customize quick actions">
                <FiSliders size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.length > 0 ? quickActions.map(qa => (
                <CompactAction
                  key={qa.key}
                  icon={ICON_MAP[qa.key] || <FiSettings />}
                  label={qa.label}
                  color={COLOR_MAP[qa.key] || "bg-slate-600"}
                  onClick={() => navigate(ROUTE_MAP[qa.key] || "/crm/socialmedia/dashboard")}
                />
              )) : (
                <>
                  <CompactAction icon={<FiBarChart2 />} label="Analytics" color="bg-blue-600"   onClick={() => navigate("/crm/socialmedia/analytics")} />
                  <CompactAction icon={<FiUsers />}     label="Leads"     color="bg-indigo-600"  onClick={() => navigate("/crm/socialmedia/leads")} />
                  <CompactAction icon={<FiMessageCircle />} label="Inbox" color="bg-emerald-600" onClick={() => navigate("/crm/socialmedia/inbox")} />
                  <CompactAction icon={<FiEdit />}      label="Posts"     color="bg-violet-600"  onClick={() => navigate("/crm/socialmedia/post/history")} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick Actions Customize Modal ────────────────────────────────── */}
        {showCustomize && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Customize Quick Actions</h3>
                <button onClick={() => setShowCustomize(false)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
              </div>
              <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                <p className="text-xs text-slate-500 mb-2">Select the modules you want as quick actions on your dashboard.</p>
                {allModules.map(m => (
                  <label key={m.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      m.isSelected ? "border-blue-300 bg-blue-50" : "border-slate-100 hover:bg-slate-50"
                    }`}>
                    <input type="checkbox" checked={m.isSelected} onChange={() => toggleModule(m.key)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <div className={`w-8 h-8 rounded-lg ${COLOR_MAP[m.key] || "bg-slate-600"} text-white flex items-center justify-center`}>
                      {cloneElement(ICON_MAP[m.key] || <FiSettings />, { size: 14 })}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{m.label}</span>
                  </label>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowCustomize(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveQA} disabled={savingQA || allModules.filter(m => m.isSelected).length === 0}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
                  {savingQA ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
 