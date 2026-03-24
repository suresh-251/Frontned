import { useState, useEffect } from "react";
import { useRef } from "react";

import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

import {
  FiRefreshCw, FiTrendingUp, FiTrendingDown, FiMinus, FiUsers, FiEye, FiHeart,
  FiMessageSquare, FiAward, FiDownloadCloud,
  FiZap, FiBarChart2, FiShare2, FiStar, FiChevronLeft,
  FiChevronRight, FiImage, FiExternalLink,
} from "react-icons/fi";
import { useBrand } from "../context/BrandContext";
import useAnalytics from "../hooks/useAnalytics";
import { getChannelMetrics, getGrowthMetrics } from "../api/analytics.api";

// ── Constants ─────────────────────────────────────────────────────────────────
const PLATFORM_COLORS = {
  facebook:  "#1877F2",
  instagram: "#E1306C",
  linkedin:  "#0A66C2",
};

const PLATFORMS = [
  { value: "all",       label: "All Platforms" },
  { value: "facebook",  label: "Facebook"      },
  { value: "instagram", label: "Instagram"     },
  { value: "linkedin",  label: "LinkedIn"      },
];

const DAY_OPTIONS = [
  { label: "7d",  value: 7  },
  { label: "14d", value: 14 },
  { label: "30d", value: 30 },
  { label: "60d", value: 60 },
  { label: "90d", value: 90 },
];

const ENGAGEMENT_TREND_METRICS = [
  { key: "likes", label: "Likes", color: "#ef4444" },
  { key: "comments", label: "Comments", color: "#f59e0b" },
  { key: "views", label: "Impressions", color: "#8b5cf6" },
];

// ── Formatters ────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null || n === "") return "—";
  const num = Number(n);
  if (isNaN(num)) return "—";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000)     return (num / 1_000).toFixed(1) + "K";
  return num.toLocaleString();
}
function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pick(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null && !isNaN(Number(v))) return Number(v);
  }
  return 0;
}

// ── Metric card (exact GrowthCard design, with optional previous-period compare) ─
function MetricCard({ icon, label, current, previous, color = "#6366f1", displayValue }) {
  const hasPrev   = previous != null;
  const change    = hasPrev ? (current ?? 0) - previous : null;
  const percent   = (hasPrev && previous !== 0) ? ((change / previous) * 100) : null;
  const isUp      = change != null && change > 0;
  const isDown    = change != null && change < 0;
  const tColor    = isUp ? "text-emerald-600" : isDown ? "text-red-500" : "text-slate-400";
  const tBg       = isUp ? "bg-emerald-50"    : isDown ? "bg-red-50"    : "bg-slate-50";
  const TrendIcon = isUp ? FiTrendingUp : isDown ? FiTrendingDown : FiMinus;
  const sign      = isUp ? "+" : "";
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        {hasPrev ? (
          <span className={`${tBg} ${tColor} text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1`}>
            <TrendIcon size={10} />
            {sign}{(percent ?? 0).toFixed(1)}%
          </span>
        ) : (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, color }}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xl font-black text-slate-800">{displayValue ?? fmt(current)}</p>
          {hasPrev && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              vs <span className="font-semibold">{fmt(previous)}</span> last period
            </p>
          )}
        </div>
        {hasPrev && change != null && (
          <div className={`text-xs font-bold ${tColor}`}>
            {sign}{fmt(change)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[140px]">
      <p className="font-semibold text-slate-500 mb-2">{fmtDate(label)}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-500 capitalize">{p.name ?? p.dataKey}</span>
          </div>
          <span className="font-bold text-slate-800">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat card (summary row under top posts) ──────────────────────────────────
const STAT_COLORS = {
  blue:    "bg-blue-50 text-blue-600 border-blue-200",
  indigo:  "bg-indigo-50 text-indigo-600 border-indigo-200",
  rose:    "bg-rose-50 text-rose-600 border-rose-200",
  orange:  "bg-orange-50 text-orange-600 border-orange-200",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
  violet:  "bg-violet-50 text-violet-600 border-violet-200",
};
function StatCard({ icon, label, value, color = "blue" }) {
  const cls = STAT_COLORS[color] || STAT_COLORS.blue;
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold ${cls}`}>
      {icon}
      <span>{label}</span>
      <span className="font-black">{fmt(value)}</span>
    </div>
  );
}


// ── Empty state ───────────────────────────────────────────────────────────────
function Empty({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <FiBarChart2 size={28} className="text-slate-300" />
      <p className="text-xs text-slate-400 max-w-[200px] text-center leading-relaxed">{message}</p>
    </div>
  );
}

function getPostUrl(post) {
  const platform = post.platform?.toLowerCase();
  if (platform === "facebook" && post.postId?.includes("_")) {
    const [pageId, postId] = post.postId.split("_");
    return `https://www.facebook.com/${pageId}/posts/${postId}`;
  }
  if (platform === "instagram") return `https://www.instagram.com/p/${post.postId}/`;
  if (platform === "linkedin") return `https://www.linkedin.com/feed/update/${post.postId}/`;
  return null;
}

function PostImage({ post }) {
  const [imgError, setImgError] = useState(false);
  const postUrl = getPostUrl(post);

  if (!post.mediaUrl || imgError) {
    return (
      <div className="w-full h-40 bg-slate-100 flex flex-col items-center justify-center gap-2">
        <FiImage size={20} className="text-slate-300" />
        {postUrl ? (
          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-indigo-500 hover:underline"
          >
            <FiExternalLink size={11} /> View post
          </a>
        ) : (
          <span className="text-[10px] text-slate-400">No image</span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-40 overflow-hidden bg-slate-100">
      <img
        src={post.mediaUrl}
        alt="Post"
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        loading="lazy"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function Analytics() {
  const [days,             setDays]             = useState(7);
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [postSort,         setPostSort]         = useState("engagement");

  const { activeBrand } = useBrand();
  const { summary, loading, error, refresh, sync, syncing, syncResult } =
    useAnalytics(days, selectedPlatform, postSort);

  const [channelMetrics, setChannelMetrics] = useState([]);
  const [growthData,     setGrowthData]     = useState(null);
  const postsScrollRef = useRef(null);

  useEffect(() => {
    if (!activeBrand?.slug) return;
    getChannelMetrics(days).then(setChannelMetrics).catch(() => setChannelMetrics([]));
    getGrowthMetrics(days).then(setGrowthData).catch(() => setGrowthData(null));
  }, [activeBrand?.slug, days]);

  // ── Debug: log raw API responses to spot blank fields ─────────────────────
  useEffect(() => {
    if (summary)       console.log("[Analytics] summary →",       summary);
    if (channelMetrics?.length) console.log("[Analytics] channelMetrics →", channelMetrics);
    if (growthData)    console.log("[Analytics] growthData →",    growthData);
  }, [summary, channelMetrics, growthData]);

  if (!activeBrand) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Select a brand to view analytics.</p>
      </div>
    );
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const daily       = summary?.dailyBreakdown ?? [];
  const topPosts    = summary?.topPosts ?? [];
  const filteredPosts = selectedPlatform === "all"
    ? topPosts
    : topPosts.filter((post) => post.platform === selectedPlatform);
  const dailyWithEngagementMetrics = daily.map((d) => ({
    ...d,
    likes: pick(d ?? {}, "totalLikes", "likes"),
    comments: pick(d ?? {}, "totalComments", "comments"),
    views: pick(d ?? {}, "totalImpressions", "impressions", "views"),
  }));

  // ── Derive accurate per-period totals from dailyBreakdown ─────────────────
  // dailyBreakdown is already filtered by the selected `days` on the backend,
  // so summing it here gives numbers that truly match the chosen time range.
  // If daily data is available, always prefer it over the pre-aggregated summary
  // totals (which may count all-time records instead of the filtered window).
  const hasDailyData = daily.length > 0;
  const _sum = (key) => daily.reduce((s, d) => s + (Number(d[key]) || 0), 0);

  const totPosts       = hasDailyData ? _sum("postsCount")       : pick(summary ?? {}, "totalPosts");
  const totReach       = hasDailyData ? _sum("totalReach")       : pick(summary ?? {}, "totalReach");
  const totImpr        = hasDailyData ? _sum("totalImpressions") : pick(summary ?? {}, "totalImpressions");
  const totEngagement  = hasDailyData ? _sum("totalEngagement")  : pick(summary ?? {}, "totalEngagement");
  const totComments    = hasDailyData ? _sum("totalComments")    : pick(summary ?? {}, "totalComments");
  const totClicks      = hasDailyData ? _sum("totalClicks")      : pick(summary ?? {}, "totalClicks");

  // Followers, leads, unfollows, profile visits are not in the daily breakdown
  // — keep reading them from summary / channelMetrics as before
  const totLeads         = pick(summary ?? {}, "totalLeads");
  const totFollowers     = pick(summary ?? {}, "totalFollowers");
  // newFollowers: sum across all channels (getChannelMetrics is the correct source)
  const totNewFollowers  = channelMetrics.reduce((sum, ch) => sum + (Number(ch.newFollowers) || 0), 0);
  const totUnfollows     = pick(summary ?? {}, "unfollows", "followersLost", "followerLoss");
  const totProfileVisits = pick(summary ?? {}, "profileVisits", "pageVisits", "profilePageViews");
  // growthRate: getGrowthMetrics returns followersGrowthPercent (confirmed from Dashboard.jsx)
  // If previousFollowers === 0, the backend sets 100% (division-by-zero cap) — treat as "New"
  const rawGrowthRate        = growthData?.followersGrowthPercent ?? null;
  const prevFollowers        = growthData?.previousFollowers ?? null;
  const isFirstTimeTracking  = prevFollowers === 0 && rawGrowthRate != null;
  const avgPostReach     = totPosts > 0 ? Math.round(totReach / totPosts) : 0;

  const audienceCards = [
    {
      icon:    <FiUsers size={18} />,
      label:   "Total Followers",
      current: totFollowers,
      previous: growthData?.previousFollowers ?? null,
      color:   "#6366f1",
    },
    {
      icon:    <FiTrendingUp size={18} />,
      label:   "New Followers",
      current: totNewFollowers,
      previous: null,
      color:   "#10b981",
    },
    {
      icon:    <FiZap size={18} />,
      label:   "Growth Rate",
      current: rawGrowthRate != null ? Math.abs(rawGrowthRate) : 0,
      previous: null,
      color:   "#8b5cf6",
      displayValue: isFirstTimeTracking ? "New" : rawGrowthRate != null ? `${Number(rawGrowthRate).toFixed(1)}%` : "—",
    },
    {
      icon:    <FiShare2 size={18} />,
      label:   "Unfollows",
      current: totUnfollows,
      previous: null,
      color:   "#ef4444",
    },
  ];

  const reachCards = [
    {
      icon:    <FiEye size={18} />,
      label:   "Reach",
      current: totReach,
      previous: growthData?.previousMonthReach ?? null,
      color:   "#10b981",
    },
    {
      icon:    <FiBarChart2 size={18} />,
      label:   "Impressions",
      current: totImpr,
      previous: growthData?.previousMonthImpressions ?? null,
      color:   "#8b5cf6",
    },
    {
      icon:    <FiStar size={18} />,
      label:   "Profile Visits",
      current: totProfileVisits,
      previous: null,
      color:   "#f59e0b",
    },
    {
      icon:    <FiImage size={18} />,
      label:   "Post Reach",
      current: avgPostReach,
      previous: null,
      color:   "#3b82f6",
    },
    {
      icon:    <FiAward size={18} />,
      label:   "Total Posts",
      current: totPosts,
      previous: growthData?.previousMonthPosts ?? null,
      color:   "#f97316",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-slate-50 p-6 space-y-5">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
              <FiBarChart2 className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-tight">Analytics</h1>
              <p className="text-xs text-slate-400 font-medium">
                {activeBrand.name} · Last {days} days
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Platform select */}
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="h-9 px-3 text-xs font-bold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            {/* Day pills */}
            <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              {DAY_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setDays(opt.value)}
                  className={`px-3 py-2 text-xs font-bold transition-all ${
                    days === opt.value
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-800"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Sync */}
            <button onClick={sync} disabled={syncing || loading}
              className="h-9 flex items-center gap-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-colors">
              <FiDownloadCloud size={14} className={syncing ? "animate-bounce" : ""} />
              {syncing ? "Syncing…" : "Sync Data"}
            </button>

            {/* Refresh */}
            <button onClick={refresh} disabled={loading}
              className="h-9 flex items-center gap-2 px-3 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-colors disabled:opacity-40">
              <FiRefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── ALERTS ────────────────────────────────────────────────────────── */}
      {syncResult && (
        <div className={`flex items-start gap-3 px-5 py-3 rounded-xl text-xs font-medium border ${
          syncResult.errors?.length > 0
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-emerald-50 border-emerald-200 text-emerald-700"
        }`}>
          <div className="space-y-0.5">
            {syncResult.message && <p className="font-semibold">{syncResult.message}</p>}
            {syncResult.errors?.map((e, i) => <p key={i}>{e}</p>)}
          </div>
        </div>
      )}
      {error && (
        <div className="px-5 py-3 rounded-xl text-xs font-medium bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}
      {!loading && !error && summary?.totalPosts === 0 &&
        (summary?.totalPostsInDb > 0 || (syncResult?.postsSynced > 0 && !syncResult?.errors?.length)) && (
        <div className="px-5 py-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-700 text-xs font-medium">
          {summary?.totalPostsInDb > 0
            ? `${summary.totalPostsInDb} post(s) exist but none fall within the last ${days} days.`
            : `${syncResult.postsSynced} post(s) synced but none fall within the last ${days} days.`}
          {" "}Try a wider date range.
        </div>
      )}

      {/* ── AUDIENCE METRICS ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
            <FiUsers className="text-violet-500" size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Audience Metrics</h3>
            <p className="text-[10px] text-slate-400">Follower growth · Last {days} days</p>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />)
            : audienceCards.map((card, i) => <MetricCard key={i} {...card} />)
          }
        </div>
      </div>

      {/* ── REACH & VISIBILITY ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <FiEye className="text-emerald-500" size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Reach & Visibility Metrics</h3>
            <p className="text-[10px] text-slate-400">Content distribution · Last {days} days</p>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />)
            : reachCards.map((card, i) => <MetricCard key={i} {...card} />)
          }
        </div>
      </div>

      {/* ── ENGAGEMENT TREND ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Dark header */}
        <div className="bg-slate-900 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <FiTrendingUp size={16} />
            <h3 className="text-sm font-bold">Engagement Trend</h3>
            <span className="text-slate-400 text-xs">· Last {days} days</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {ENGAGEMENT_TREND_METRICS.map((metric) => (
              <div key={metric.key} className="px-3 py-1 rounded-full text-[11px] font-bold text-white" style={{ background: metric.color }}>
                {metric.label}
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="p-5">
          {loading ? (
            <div className="h-52 flex items-center justify-center">
              <FiRefreshCw size={20} className="text-slate-300 animate-spin" />
            </div>
          ) : daily.length === 0 ? (
            <Empty message="No trend data yet. Metrics sync runs every 15 minutes." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={dailyWithEngagementMetrics} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  {ENGAGEMENT_TREND_METRICS.map((metric) => (
                    <linearGradient key={metric.key} id={`grad-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={metric.color} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={metric.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tickFormatter={fmtDate}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false} tickLine={false} dy={6} />
                <YAxis tickFormatter={fmt}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<ChartTooltip />} />
                {ENGAGEMENT_TREND_METRICS.map((metric) => (
                  <Area key={metric.key} type="monotone" dataKey={metric.key}
                    stroke={metric.color} strokeWidth={2.5}
                    fill={`url(#grad-${metric.key})`} name={metric.label}
                    dot={false} activeDot={{ r: 4, fill: metric.color }} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
              <FiTrendingUp className="text-rose-500" size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {postSort === "latest" ? "Latest Posts" : "Top Posts by Engagement"}
              </h3>
              <p className="text-[10px] text-slate-400">
                {selectedPlatform === "all" ? "All platforms" : <span className="capitalize">{selectedPlatform}</span>}
                {" · "}Last {days} days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-semibold">Sort:</span>
            <div className="flex bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
              {[
                { value: "engagement", label: "Engagement" },
                { value: "latest", label: "Latest" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPostSort(opt.value)}
                  className={`px-3 py-1.5 text-xs font-bold transition-all ${
                    postSort === opt.value
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => postsScrollRef.current?.scrollBy({ left: -310, behavior: "smooth" })}
              className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
            >
              <FiChevronLeft size={16} />
            </button>
            <button
              onClick={() => postsScrollRef.current?.scrollBy({ left: 310, behavior: "smooth" })}
              className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-12 flex items-center justify-center">
            <FiRefreshCw size={20} className="text-slate-300 animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <Empty message="No post metrics yet. Sync to pull fresh data from your platforms." />
        ) : (
          <>
          <div className="px-6 py-4 flex flex-wrap gap-2">
            <StatCard icon={<FiTrendingUp    size={14} />} label="Total Posts"  value={totPosts}      color="blue"    />
            <StatCard icon={<FiEye           size={14} />} label="Views"        value={totImpr}       color="indigo"  />
            <StatCard icon={<FiHeart         size={14} />} label="Engagement"   value={totEngagement} color="rose"    />
            <StatCard icon={<FiMessageSquare size={14} />} label="Comments"     value={totComments}   color="orange"  />
            <StatCard icon={<FiUsers         size={14} />} label="Total Leads"  value={totLeads}      color="emerald" />
            <StatCard icon={<FiTrendingUp    size={14} />} label="Clicks"       value={totClicks}     color="violet"  />
          </div>
          <div
            ref={postsScrollRef}
            className="flex overflow-x-auto gap-4 px-5 pb-5"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {filteredPosts.map((post, idx) => {
              const platformColor = PLATFORM_COLORS[post.platform?.toLowerCase()] ?? "#94a3b8";
              return (
                <div
                  key={post.postId}
                  className="flex-shrink-0 w-72 bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  <div className="h-1 w-full" style={{ background: platformColor }} />

                  <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                    {post.pageProfilePictureUrl ? (
                      <img
                        src={post.pageProfilePictureUrl}
                        alt={post.pageName || post.platform}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextElementSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
                      style={{ background: platformColor, display: post.pageProfilePictureUrl ? "none" : "flex" }}
                    >
                      {post.platform?.charAt(0).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {post.pageName || post.platform}
                      </p>
                      {(post.createdAt || post.recordedAt) && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(post.createdAt || post.recordedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                    {postSort !== "latest" && (
                      <span className="text-[10px] font-black text-slate-400">#{idx + 1}</span>
                    )}
                  </div>

                  <PostImage post={post} />

                  <div className="px-4 py-3 flex-1 border-b border-slate-100">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {post.message || <span className="text-slate-400 italic">No caption</span>}
                    </p>
                  </div>

                  <div className="grid grid-cols-4 divide-x divide-slate-100">
                    {[
                      { icon: <FiHeart size={11} />, color: "#ef4444", val: post.likes, tip: "Likes" },
                      { icon: <FiMessageSquare size={11} />, color: "#3b82f6", val: post.comments, tip: "Comments" },
                      { icon: <FiShare2 size={11} />, color: "#10b981", val: post.shares, tip: "Shares" },
                      { icon: <FiEye size={11} />, color: "#8b5cf6", val: post.reach, tip: "Reach" },
                    ].map((stat, index) => (
                      <div key={index} className="flex flex-col items-center gap-0.5 py-2.5" title={stat.tip}>
                        <span style={{ color: stat.color }}>{stat.icon}</span>
                        <span className="text-[10px] font-bold text-slate-700">{fmt(stat.val)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
                    <span className="text-[10px] text-slate-400">
                      Imp: <span className="text-slate-600 font-semibold">{fmt(post.impressions)}</span>
                    </span>
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-md text-white"
                      style={{ background: platformColor }}
                    >
                      {fmt(post.engagement)} eng
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>

    </div>
  );
}
