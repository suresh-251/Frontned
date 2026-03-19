import { useState, useRef } from "react";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { FiRefreshCw, FiTrendingUp, FiUsers, FiEye, FiHeart, FiMessageSquare, FiAward, FiDownloadCloud, FiChevronLeft, FiChevronRight, FiImage, FiExternalLink } from "react-icons/fi";
import { useBrand } from "../context/BrandContext";
import useAnalytics from "../hooks/useAnalytics";

// ── Colors ──────────────────────────────────────────────────────────────────
const PLATFORM_COLORS = {
  facebook:  "#1877F2",
  instagram: "#E1306C",
  linkedin:  "#0A66C2",
};
const PIE_FALLBACK = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

const PLATFORMS = [
  { value: "all",       label: "All Platforms" },
  { value: "facebook",  label: "Facebook"      },
  { value: "instagram", label: "Instagram"     },
  { value: "linkedin",  label: "LinkedIn"      },
];

// ── Day filter options ───────────────────────────────────────────────────────
const DAY_OPTIONS = [
  { label: "7 days",  value: 7  },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
];

// ── Trend metric options (for main area chart) ────────────────────────────────
const TREND_METRICS = [
  { key: "totalEngagement",  label: "Engagement",  color: "#6366f1" },
  { key: "totalReach",       label: "Reach",        color: "#10b981" },
  { key: "totalImpressions", label: "Impressions",  color: "#8b5cf6" },
  { key: "totalLikes",       label: "Likes",        color: "#ef4444" },
  { key: "totalComments",    label: "Comments",     color: "#f59e0b" },
  { key: "totalClicks",      label: "Clicks",       color: "#f97316" },
  { key: "postsCount",       label: "Posts",        color: "#3b82f6" },
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
          <span className="text-slate-500 capitalize">{p.name ?? p.dataKey}:</span>
          <span className="font-bold text-slate-800">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function Empty({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
      <FiTrendingUp size={28} className="mb-2 opacity-40" />
      <p className="text-xs font-medium">{message}</p>
    </div>
  );
}

// ── Post image with broken-image fallback ────────────────────────────────────
function getPostUrl(post) {
  const p = post.platform?.toLowerCase();
  if (p === "facebook" && post.postId?.includes("_")) {
    const parts = post.postId.split("_");
    return `https://www.facebook.com/${parts[0]}/posts/${parts[1]}`;
  }
  if (p === "instagram") return `https://www.instagram.com/p/${post.postId}/`;
  if (p === "linkedin")  return `https://www.linkedin.com/feed/update/${post.postId}/`;
  return null;
}

function PostImage({ post, platformColor }) {
  const [imgError, setImgError] = useState(false);
  const postUrl = getPostUrl(post);

  if (!post.mediaUrl || imgError) {
    return (
      <div className="w-full h-40 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center gap-2">
        <FiImage size={28} className="text-slate-300" />
        {postUrl ? (
          <a href={postUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
            <FiExternalLink size={12} /> View on {post.platform}
          </a>
        ) : (
          <span className="text-[10px] text-slate-400">Image unavailable</span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full aspect-square bg-slate-100 overflow-hidden relative">
      <img src={post.mediaUrl} alt="Post" className="w-full h-full object-cover" loading="lazy" onError={() => setImgError(true)} />
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function Analytics() {
  const [days, setDays]                       = useState(7);
  const [trendMetric, setTrendMetric]         = useState("totalEngagement");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [postSort, setPostSort]               = useState("engagement");
  const { activeBrand } = useBrand();
  const { summary, loading, error, refresh, sync, syncing, syncResult } = useAnalytics(days, selectedPlatform, postSort);
  const postsScrollRef = useRef(null);

  if (!activeBrand) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] p-6 flex items-center justify-center">
        <p className="text-slate-400 font-medium text-sm">No active brand — please select or create a brand first.</p>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const daily     = summary?.dailyBreakdown    ?? [];
  const platforms = summary?.platformBreakdown ?? [];
  const topPosts  = summary?.topPosts          ?? [];

  // Pie chart data — engagement per platform
  const pieData = platforms.map((p, i) => ({
    name:  p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    value: Number(p.totalEngagement) || 0,
    color: PLATFORM_COLORS[p.platform] ?? PIE_FALLBACK[i % PIE_FALLBACK.length],
  }));

  // Filtered top posts
  const filteredPosts = selectedPlatform === "all"
    ? topPosts
    : topPosts.filter(p => p.platform === selectedPlatform);

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

        <div className="flex flex-wrap items-center gap-3">

          {/* Platform selector dropdown */}
          <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
            style={selectedPlatform !== "all" ? { color: PLATFORM_COLORS[selectedPlatform], borderColor: PLATFORM_COLORS[selectedPlatform] + "80" } : {}}>
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

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

          {/* Sync */}
          <button onClick={sync} disabled={syncing || loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold shadow-sm transition-all">
            <FiDownloadCloud size={13} className={syncing ? "animate-bounce" : ""} />
            {syncing ? "Syncing…" : "Sync"}
          </button>

          {/* Refresh */}
          <button onClick={refresh} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50">
            <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Sync result banner ────────────────────────────────────────────── */}
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

      {/* ── Platform banner (when a specific platform is selected) ─────────── */}
      {selectedPlatform !== "all" && (
        <div className="mb-4 px-4 py-3 rounded-xl border flex items-center gap-3"
          style={{ background: PLATFORM_COLORS[selectedPlatform] + "10", borderColor: PLATFORM_COLORS[selectedPlatform] + "40" }}>
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PLATFORM_COLORS[selectedPlatform] }} />
          <span className="text-xs font-bold capitalize" style={{ color: PLATFORM_COLORS[selectedPlatform] }}>
            {selectedPlatform} — showing metrics for this platform
          </span>
        </div>
      )}

      {/* ── KPI STAT CARDS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon={<FiTrendingUp  size={18} />} label="Total Posts"      value={summary?.totalPosts}       color="blue"    />
            <StatCard icon={<FiEye         size={18} />} label="Total Reach"      value={summary?.totalReach}       color="indigo"  />
            <StatCard icon={<FiEye         size={18} />} label="Impressions"      value={summary?.totalImpressions} color="violet"  />
            <StatCard icon={<FiHeart       size={18} />} label="Engagement"       value={summary?.totalEngagement}  color="rose"    />
            <StatCard icon={<FiMessageSquare size={18}/>} label="Comments"        value={summary?.totalComments}    color="orange"  />
            <StatCard icon={<FiUsers       size={18} />} label="Total Leads"      value={summary?.totalLeads}       color="emerald" />
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
            <div className="flex items-center gap-3">
              <select value={trendMetric} onChange={(e) => setTrendMetric(e.target.value)}
                className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer">
                {TREND_METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
              <span className="text-[10px] text-slate-400 font-semibold">Last {days} days</span>
            </div>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="h-52 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : daily.length === 0 ? (
              <Empty message="No trend data yet. Metrics sync runs every 15 minutes." />
            ) : (() => {
              const activeMeta = TREND_METRICS.find(m => m.key === trendMetric) || TREND_METRICS[0];
              return (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={daily} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={activeMeta.color} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={activeMeta.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey={activeMeta.key} stroke={activeMeta.color} strokeWidth={2}
                      fill="url(#gradTrend)" dot={false} name={activeMeta.label.toLowerCase()} />
                  </AreaChart>
                </ResponsiveContainer>
              );
            })()}
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
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} opacity={selectedPlatform === "all" || selectedPlatform === entry.name.toLowerCase() ? 1 : 0.25} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {pieData.map((p) => (
                    <div key={p.name} className={`flex items-center justify-between text-xs transition-opacity ${
                      selectedPlatform !== "all" && selectedPlatform !== p.name.toLowerCase() ? "opacity-30" : ""
                    }`}>
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

        {/* Top posts — horizontal scrollable carousel (full width) */}
        <div className="col-span-12 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <FiAward className="text-yellow-500" size={14} />
              {postSort === "latest" ? "Latest Posts" : "Top Posts by Engagement"}
            </h3>
            <div className="flex items-center gap-3">
              <select value={postSort} onChange={(e) => setPostSort(e.target.value)}
                className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-yellow-300 cursor-pointer">
                <option value="engagement">Top Engagement</option>
                <option value="latest">Latest Posts</option>
              </select>
              <span className="text-[10px] text-slate-400 font-semibold">
                {selectedPlatform === "all" ? "All platforms" : <span className="capitalize">{selectedPlatform}</span>} · top 10 · last {days} days
              </span>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-slate-400 text-sm animate-pulse">Loading posts…</div>
          ) : filteredPosts.length === 0 ? (
            <Empty message="No post metrics yet. Metrics sync runs every 15 minutes." />
          ) : (() => {
            const scroll = (dir) => {
              if (postsScrollRef.current) postsScrollRef.current.scrollBy({ left: dir * 320, behavior: "smooth" });
            };
            return (
              <div className="relative group">
                <button onClick={() => scroll(-1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 border border-slate-200 shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100">
                  <FiChevronLeft size={20} />
                </button>
                <button onClick={() => scroll(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 border border-slate-200 shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100">
                  <FiChevronRight size={20} />
                </button>

                <div ref={postsScrollRef} className="flex overflow-x-auto gap-4 p-4 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {filteredPosts.map((post, idx) => {
                    const platformColor = PLATFORM_COLORS[post.platform?.toLowerCase()] ?? "#94a3b8";
                    return (
                      <div key={post.postId} className="flex-shrink-0 w-[280px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                        {/* Post header */}
                        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100">
                          {post.pageProfilePictureUrl ? (
                            <img src={post.pageProfilePictureUrl} alt={post.pageName || post.platform}
                              className="w-8 h-8 rounded-full object-cover border-2" style={{ borderColor: platformColor }}
                              onError={(e) => { e.target.style.display = "none"; e.target.nextElementSibling.style.display = "flex"; }} />
                          ) : null}
                          <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: platformColor, display: post.pageProfilePictureUrl ? "none" : "flex" }}>
                            {post.platform?.charAt(0).toUpperCase()}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate">{post.pageName || post.platform}</p>
                            {(post.createdAt || post.recordedAt) && (
                              <p className="text-[10px] text-slate-400">{new Date(post.createdAt || post.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                            )}
                          </div>
                          {postSort !== "latest" && (
                            <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                          )}
                        </div>

                        <PostImage post={post} platformColor={platformColor} />

                        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-slate-50">
                          <div className="flex items-center gap-1 text-rose-500">
                            <FiHeart size={14} />
                            <span className="text-xs font-bold">{fmt(post.likes)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-500">
                            <FiMessageSquare size={14} />
                            <span className="text-xs font-bold">{fmt(post.comments)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-emerald-500">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            <span className="text-xs font-bold">{fmt(post.shares)}</span>
                          </div>
                          <div className="ml-auto">
                            <span className="inline-block bg-indigo-50 text-indigo-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                              {fmt(post.engagement)}
                            </span>
                          </div>
                        </div>

                        <div className="px-4 py-3 flex-1">
                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                            {post.message || <span className="text-slate-400 italic">No caption</span>}
                          </p>
                        </div>

                        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 text-[10px] font-semibold text-slate-400">
                          <span><FiEye className="inline mr-1" size={11} />Reach: {fmt(post.reach)}</span>
                          <span>Imp: {fmt(post.impressions)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
}
