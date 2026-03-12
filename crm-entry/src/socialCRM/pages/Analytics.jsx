import { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { FiRefreshCw, FiTrendingUp, FiUsers, FiEye, FiHeart, FiMessageSquare, FiMousePointer, FiAward, FiDownloadCloud } from "react-icons/fi";
import { useBrand } from "../context/BrandContext";
import useAnalytics from "../hooks/useAnalytics";

// ── Colors ──────────────────────────────────────────────────────────────────
const PLATFORM_COLORS = {
  facebook: "#1877F2",
  instagram: "#E1306C",
  linkedin: "#0A66C2",
};
const PIE_FALLBACK = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

// ── Day filter options ───────────────────────────────────────────────────────
const DAY_OPTIONS = [
  { label: "7 days",  value: 7  },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
];

// ── Formatters ───────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}
function fmtDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
      <div className="h-3 bg-slate-200 rounded w-1/2 mb-3" />
      <div className="h-7 bg-slate-200 rounded w-2/3" />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  const colorMap = {
    blue:    "bg-blue-50 text-blue-600",
    indigo:  "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose:    "bg-rose-50 text-rose-600",
    orange:  "bg-orange-50 text-orange-600",
    violet:  "bg-violet-50 text-violet-600",
    slate:   "bg-slate-100 text-slate-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color] ?? colorMap.slate}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-xl font-black text-slate-800 mt-0.5">{fmt(value)}</p>
      </div>
    </div>
  );
}

// ── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-bold text-slate-700 mb-2">{fmtDate(label)}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 capitalize">{p.dataKey}:</span>
          <span className="font-bold text-slate-800">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Platform icon (inline svg) ───────────────────────────────────────────────
function PlatformDot({ platform }) {
  const color = PLATFORM_COLORS[platform?.toLowerCase()] ?? "#94a3b8";
  return <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 flex-shrink-0" style={{ background: color }} />;
}

// ── Empty state ───────────────────────────────────────────────────────────────
function Empty({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-slate-400">
      <FiTrendingUp size={32} className="mb-3 opacity-40" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function Analytics() {
  const [days, setDays] = useState(7);
  const { activeBrand } = useBrand();
  const { summary, loading, error, refresh, sync, syncing, syncResult } = useAnalytics(days);

  if (!activeBrand) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] p-6 flex items-center justify-center">
        <p className="text-slate-400 font-medium text-sm">No active brand — please select or create a brand first.</p>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const daily    = summary?.dailyBreakdown    ?? [];
  const platforms = summary?.platformBreakdown ?? [];
  const topPosts  = summary?.topPosts          ?? [];

  // Pie chart data — engagement per platform
  const pieData = platforms.map((p, i) => ({
    name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    value: Number(p.totalEngagement) || 0,
    color: PLATFORM_COLORS[p.platform] ?? PIE_FALLBACK[i % PIE_FALLBACK.length],
  }));

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Brand: <span className="font-bold text-slate-700">{activeBrand.name}</span>
            {" · "}{days}-day window
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Day filter */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {DAY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-4 py-2 text-xs font-bold transition-all ${
                  days === opt.value
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sync from platforms */}
          <button
            onClick={sync}
            disabled={syncing || loading}
            title="Pull fresh metrics from Facebook / Instagram / LinkedIn"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <FiDownloadCloud size={13} className={syncing ? "animate-bounce" : ""} />
            {syncing ? "Syncing…" : "Sync"}
          </button>

          {/* Refresh */}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
          >
            <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Sync result banner ───────────────────────────────────────────────── */}
      {syncResult && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-xs font-medium border ${
          syncResult.errors?.length > 0
            ? "bg-rose-50 border-rose-200 text-rose-700"
            : "bg-emerald-50 border-emerald-200 text-emerald-700"
        }`}>
          {syncResult.message && <p>{syncResult.message}</p>}
          {syncResult.errors?.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* ── KPI STAT CARDS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon={<FiTrendingUp size={18} />} label="Total Posts"       value={summary?.totalPosts}       color="blue"    />
            <StatCard icon={<FiEye        size={18} />} label="Total Reach"       value={summary?.totalReach}       color="indigo"  />
            <StatCard icon={<FiEye        size={18} />} label="Impressions"       value={summary?.totalImpressions} color="violet"  />
            <StatCard icon={<FiHeart      size={18} />} label="Total Engagement"  value={summary?.totalEngagement}  color="rose"    />
            <StatCard icon={<FiUsers      size={18} />} label="Total Leads"       value={summary?.totalLeads}       color="emerald" />
            <StatCard icon={<FiMousePointer size={18}/>} label="Total Clicks"    value={summary?.totalClicks}      color="orange"  />
          </>
        )}
      </div>

      {/* ── MAIN GRID ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">

        {/* LEFT — Engagement trend chart (8/12) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <FiTrendingUp className="text-blue-500" size={14} /> Engagement Trend
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">Last {days} days</span>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="h-52 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : daily.length === 0 ? (
              <Empty message="No trend data yet. Metrics sync runs every 15 minutes." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={daily} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradEngagement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDate}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={fmt}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="totalEngagement"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#gradEngagement)"
                    dot={false}
                    name="engagement"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalReach"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gradReach)"
                    dot={false}
                    name="reach"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* RIGHT — Platform breakdown pie (4/12) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <FiAward className="text-indigo-500" size={14} /> Platform Breakdown
            </h3>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="h-52 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pieData.length === 0 || pieData.every(d => d.value === 0) ? (
              <Empty message="No platform data yet." />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="space-y-2 mt-2">
                  {pieData.map((p) => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                        <span className="text-slate-600 font-semibold">{p.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">{fmt(p.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Platform details table (8/12) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <FiMessageSquare className="text-emerald-500" size={14} /> Platform Metrics
            </h3>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
          ) : platforms.length === 0 ? (
            <Empty message="No platform metrics available." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Platform</th>
                    <th className="px-5 py-3 text-right">Posts</th>
                    <th className="px-5 py-3 text-right">Likes</th>
                    <th className="px-5 py-3 text-right">Comments</th>
                    <th className="px-5 py-3 text-right">Shares</th>
                    <th className="px-5 py-3 text-right">Reach</th>
                    <th className="px-5 py-3 text-right">Impressions</th>
                    <th className="px-5 py-3 text-right">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {platforms.map((p) => (
                    <tr key={p.platform} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <PlatformDot platform={p.platform} />
                          <span className="text-sm font-bold text-slate-700 capitalize">{p.platform}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-slate-700">{fmt(p.postsCount)}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-slate-700">{fmt(p.totalLikes)}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-slate-700">{fmt(p.totalComments)}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-slate-700">{fmt(p.totalShares)}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-slate-700">{fmt(p.totalReach)}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-slate-700">{fmt(p.totalImpressions)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-block bg-indigo-50 text-indigo-700 font-bold text-xs px-2.5 py-1 rounded-full">
                          {fmt(p.totalEngagement)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Daily posts bar chart (4/12) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <FiTrendingUp className="text-orange-500" size={14} /> Daily Posts
            </h3>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : daily.length === 0 ? (
              <Empty message="No post data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDate}
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="postsCount" fill="#f97316" radius={[4, 4, 0, 0]} name="posts" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top posts table (full width) */}
        <div className="col-span-12 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <FiAward className="text-yellow-500" size={14} /> Top Posts by Engagement
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">Top 10 · last {days} days</span>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-slate-400 text-sm animate-pulse">Loading posts…</div>
          ) : topPosts.length === 0 ? (
            <Empty message="No post metrics yet. Metrics sync runs every 15 minutes." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Platform</th>
                    <th className="px-5 py-3">Post ID</th>
                    <th className="px-5 py-3 text-right">Likes</th>
                    <th className="px-5 py-3 text-right">Comments</th>
                    <th className="px-5 py-3 text-right">Shares</th>
                    <th className="px-5 py-3 text-right">Reach</th>
                    <th className="px-5 py-3 text-right">Impressions</th>
                    <th className="px-5 py-3 text-right">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topPosts.map((post, idx) => (
                    <tr key={post.postId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 text-xs font-bold text-slate-400">#{idx + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <PlatformDot platform={post.platform} />
                          <span className="text-xs font-bold text-slate-700 capitalize">{post.platform}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-slate-500 font-mono truncate max-w-[120px] inline-block">
                          {post.postId}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-slate-700">{fmt(post.likes)}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-slate-700">{fmt(post.comments)}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-slate-700">{fmt(post.shares)}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-slate-700">{fmt(post.reach)}</td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-slate-700">{fmt(post.impressions)}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-block bg-indigo-50 text-indigo-700 font-bold text-xs px-2.5 py-1 rounded-full">
                          {fmt(post.engagement)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
