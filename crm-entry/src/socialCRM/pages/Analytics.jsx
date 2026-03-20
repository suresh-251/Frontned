import { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip,
} from "recharts";
import {
  FiRefreshCw, FiTrendingUp, FiUsers, FiEye, FiHeart,
  FiAward, FiDownloadCloud, FiZap, FiBarChart2, FiShare2, FiStar,
} from "react-icons/fi";
import { useBrand } from "../context/BrandContext";
import useAnalytics from "../hooks/useAnalytics";

// ── Colors ───────────────────────────────────────────────────────────────────
const PLATFORM_COLORS = {
  facebook:  "#1877F2",
  instagram: "#E1306C",
  linkedin:  "#0A66C2",
};

// ── Day filter ────────────────────────────────────────────────────────────────
const DAY_OPTIONS = [
  { label: "7 days",  value: 7  },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
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
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Read a numeric field from an object trying multiple key names (API shape varies). */
function pick(obj, ...keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null && !isNaN(Number(v))) return Number(v);
  }
  return 0;
}

// ── Skeleton loaders ──────────────────────────────────────────────────────────
function SkeletonCard({ tall }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 animate-pulse ${tall ? "h-44" : "h-28"}`}>
      <div className="h-2.5 bg-slate-200 rounded w-1/3 mb-3" />
      <div className="h-6 bg-slate-200 rounded w-1/2" />
    </div>
  );
}
function SkeletonDonutCard() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col items-center gap-3 animate-pulse">
      <div className="w-36 h-36 rounded-full bg-slate-200" />
      <div className="h-2.5 w-20 rounded-full bg-slate-200" />
      <div className="h-5 w-14 rounded-full bg-slate-100" />
    </div>
  );
}

// ── Custom chart tooltip ──────────────────────────────────────────────────────
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

// ── Platform dot ──────────────────────────────────────────────────────────────
function PlatformDot({ platform }) {
  const color = PLATFORM_COLORS[platform?.toLowerCase()] ?? "#94a3b8";
  return <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />;
}

// ── Platform icon (SVG) ───────────────────────────────────────────────────────
function PlatformIcon({ platform, size = 14 }) {
  const p = platform?.toLowerCase();
  if (p === "facebook")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  if (p === "instagram")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#E1306C">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
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

// ── Gauge card (semi-circle) ──────────────────────────────────────────────────
function GaugeCard({ platform, label, value, sub, percent }) {
  const color = PLATFORM_COLORS[platform?.toLowerCase()] ?? "#94a3b8";
  const W = 160, cy = 74, r = 56, cx = W / 2;
  const p = Math.min(percent ?? 0, 1);
  const angle = Math.PI * (1 - p);
  const ex = cx + r * Math.cos(angle);
  const ey = cy - r * Math.sin(angle);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 mb-1">
        <PlatformIcon platform={platform} />
        <span className="text-[11px] font-bold text-slate-600 capitalize">{platform}</span>
      </div>
      <p className="text-[11px] text-slate-400 font-medium mb-3">{label}</p>
      <div className="relative flex justify-center">
        <svg width={W} height={cy + 10} viewBox={`0 0 ${W} ${cy + 10}`}>
          <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`}
            fill="none" stroke={`${color}20`} strokeWidth="10" strokeLinecap="round" />
          {p > 0.01 && (
            <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${ex} ${ey}`}
              fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
          {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Simple metric card ────────────────────────────────────────────────────────
function MetricCard({ platform, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 mb-1">
        <PlatformIcon platform={platform} />
        <span className="text-[11px] font-bold text-slate-600 capitalize">{platform}</span>
      </div>
      <p className="text-[11px] text-slate-400 font-medium mb-3">{label}</p>
      <p className="text-3xl font-black text-slate-800 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-2">{sub}</p>}
    </div>
  );
}

// ============================================================================
// PREMIUM DONUT CARD
// ============================================================================
function DonutCard({ icon, label, value, percent }) {
  const SIZE = 120;
  const STROKE = 10;
  const r = (SIZE - STROKE) / 2;
  const circ = 2 * Math.PI * r;

const safePercent = Math.max(0.02, Math.min(percent || 0, 1));
const offset = circ * (1 - safePercent);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center hover:shadow-md transition">
      
      {/* Donut */}
      <div className="relative mb-3">
        <svg width={SIZE} height={SIZE} style={{ transform: "rotate(-90deg)" }}>
          
          {/* Background ring */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={r}
            stroke="#e5e7eb"
            strokeWidth={STROKE}
            fill="none"
          />

          {/* Progress ring */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={r}
            stroke="#6366f1"
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "all 0.6s ease" }}
          />
        </svg>

        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-indigo-500 mb-1">{icon}</div>
          <p className="text-lg font-bold text-slate-800">{value}</p>
        </div>
      </div>

      {/* Label */}
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function Analytics() {

  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [days, setDays] = useState(7);
  const { activeBrand } = useBrand();

  // All three endpoints now fetched in parallel
  const { summary, channels, platforms, loading, error, refresh, sync, syncing, syncResult } =
    useAnalytics(days);

  if (!activeBrand) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] p-6 flex items-center justify-center">
        <p className="text-slate-400 font-medium text-sm">No active brand — please select or create a brand first.</p>
      </div>
    );
  }

  // ── 1. Build per-platform map from channels (real per-account data) ──────
  //   channels  → followers, newFollowers, engagement, reach, impressions, leads
  //   platforms → totalPosts per platform (from getPlatformBreakdown)
  const byPlatform = (channels || []).reduce((acc, ch) => {
    const key = ch.platform?.toLowerCase();
    if (!key) return acc;
    if (!acc[key]) acc[key] = {
      platform:        key,
      totalFollowers:  0,
      newFollowers:    0,
      totalEngagement: 0,
      totalReach:      0,
      totalImpressions:0,
      totalLeads:      0,
      totalPosts:      0,
    };
   acc[key].totalFollowers += pick(
  ch,
  "totalFollowers",
  "followers",
  "fan_count",          // ✅ Facebook
  "followers_count"     // ✅ common API
);

acc[key].newFollowers += pick(
  ch,
  "newFollowers",
  "newFollower",
  "new_followers"
);

acc[key].totalEngagement += pick(
  ch,
  "totalEngagement",
  "engagement",
  "engagement_count"
);

acc[key].totalReach += pick(
  ch,
  "totalReach",
  "reach",
  "reach_count"
);

acc[key].totalImpressions += pick(
  ch,
  "totalImpressions",
  "impressions",
  "impression_count"
);

acc[key].totalLeads += pick(
  ch,
  "totalLeads",
  "leads"
);
    return acc;
  }, {});

  // Merge totalPosts from dedicated getPlatformBreakdown response
  (platforms || []).forEach((pb) => {
    const key = pb.platform?.toLowerCase();
    if (!key) return;
    if (!byPlatform[key]) byPlatform[key] = {
      platform: key, totalFollowers: 0, newFollowers: 0,
      totalEngagement: 0, totalReach: 0, totalImpressions: 0, totalLeads: 0, totalPosts: 0,
    };
    byPlatform[key].totalPosts = pick(pb, "totalPosts", "postCount", "posts", "total_posts");
    // Also take engagement from platforms endpoint if channels returned 0
    if (byPlatform[key].totalEngagement === 0) {
      byPlatform[key].totalEngagement = pick(pb, "totalEngagement", "engagement");
    }
  });

  // Also pull from summary.platformBreakdown as final fallback
  (summary?.platformBreakdown || []).forEach((pb) => {
    const key = pb.platform?.toLowerCase();
    if (!key) return;
    if (!byPlatform[key]) byPlatform[key] = {
      platform: key, totalFollowers: 0, newFollowers: 0,
      totalEngagement: 0, totalReach: 0, totalImpressions: 0, totalLeads: 0, totalPosts: 0,
    };
    if (byPlatform[key].totalPosts === 0)
      byPlatform[key].totalPosts = pick(pb, "totalPosts", "postCount", "posts");
    if (byPlatform[key].totalEngagement === 0)
      byPlatform[key].totalEngagement = pick(pb, "totalEngagement", "engagement");
    if (byPlatform[key].totalReach === 0)
      byPlatform[key].totalReach = pick(pb, "totalReach", "reach");
  });

  const platformList = Object.values(byPlatform);

  // ── 2. Visible list for "By Platform" section ─────────────────────────────
  const visiblePlatforms =
    selectedPlatform === "all"
      ? platformList
      : platformList.filter((p) => p.platform === selectedPlatform);

  // ── 3. Resolved totals for donut cards ────────────────────────────────────
  const active = selectedPlatform !== "all" ? byPlatform[selectedPlatform] : null;

  const resolvedFollowers    = active ? active.totalFollowers   : platformList.reduce((s, p) => s + p.totalFollowers,   0);
  const resolvedNewFollowers = active ? active.newFollowers     : platformList.reduce((s, p) => s + p.newFollowers,     0);
  const resolvedEngagement   = active ? active.totalEngagement  : (summary?.totalEngagement  ?? platformList.reduce((s, p) => s + p.totalEngagement,  0));
  const resolvedReach        = active ? active.totalReach       : (summary?.totalReach       ?? platformList.reduce((s, p) => s + p.totalReach,       0));
  const resolvedImpressions  = active ? active.totalImpressions : (summary?.totalImpressions ?? platformList.reduce((s, p) => s + p.totalImpressions, 0));
  const resolvedLeads        = active ? active.totalLeads       : (summary?.totalLeads       ?? platformList.reduce((s, p) => s + p.totalLeads,       0));
  const resolvedPosts        = active ? active.totalPosts       : (summary?.totalPosts       ?? platformList.reduce((s, p) => s + p.totalPosts,       0));

  // ── 4. Engagement rate (user-specified formula) ───────────────────────────
  const engagementRate =
    resolvedReach > 0
      ? ((resolvedEngagement / resolvedReach) * 100).toFixed(2)
      : resolvedFollowers > 0
      ? ((resolvedEngagement / resolvedFollowers) * 100).toFixed(2)
      : "0.00";

  // ── 5. Arc percent helper ─────────────────────────────────────────────────
  // Uses a soft-cap scale per metric so the arc NEVER fills completely
  // (max arc = 88%) — the same approach used by Sprout Social / Hootsuite.
  // Tune the caps to match your expected data range.
const pct = (value, max) => {
  if (!value || value <= 0) return 0.02; // small visible arc
  return Math.min(value / max, 1);
};
const maxFollowers   = 10000;
const maxEngagement  = 5000;
const maxReach       = 20000;
const maxImpressions = 40000;
const maxPosts       = 20;
const maxLeads       = 100;

  // Dynamic soft caps — 2× the current resolved value so arc sits ~50 %
  // but never goes above 88 %. Falls back to a sensible minimum per metric.
  const capFollowers    = Math.max(resolvedFollowers    * 2, 10_000);
  const capEngagement   = Math.max(resolvedEngagement   * 2,  1_000);
  const capReach        = Math.max(resolvedReach        * 2, 10_000);
  const capImpressions  = Math.max(resolvedImpressions  * 2, 20_000);
  const capNewFollowers = Math.max(resolvedNewFollowers  * 2,  1_000);
const capPosts = Math.max(resolvedPosts * 2, 10);

  const capLeads        = Math.max(resolvedLeads         * 2,    100);

  // ── 6. Donut cards ────────────────────────────────────────────────────────
  const PRIMARY = "#6366f1";     
const SECONDARY = "#a5b4fc";   
  const donutCards = [
    {
      icon: <FiUsers size={17} />,
      label: "Followers",
      value: fmt(resolvedFollowers),
      subValue: `+${fmt(resolvedNewFollowers)}`,
      subLabel: "new",
      color: PRIMARY,
      gradientEnd: SECONDARY,
percent: pct(resolvedFollowers, maxFollowers),
    },
    {
      icon: <FiHeart size={17} />,
      label: "Engagement",
      value: fmt(resolvedEngagement),
      subValue: `${engagementRate}%`,
      subLabel: "rate",
      color: PRIMARY,
      gradientEnd: SECONDARY,
percent: pct(resolvedEngagement, maxEngagement),
    },
   {
  icon: <FiEye size={17} />,
  label: "Reach",
  value: fmt(resolvedReach || 0),
  subLabel: resolvedReach === 0 ? "no data" : "",
  color: PRIMARY,
  gradientEnd: SECONDARY,
  percent: pct(resolvedReach || 1, maxReach),
},
    {
  icon: <FiBarChart2 size={17} />,
  label: "Impressions",
  value: fmt(resolvedImpressions || 0),
  subLabel: resolvedImpressions === 0 ? "no data" : "",
  color: PRIMARY,
  gradientEnd: SECONDARY,
  percent: pct(resolvedImpressions || 1, maxImpressions),
},
    {
      icon: <FiTrendingUp size={17} />,
      label: "New Followers",
      value: fmt(resolvedNewFollowers),
      color: PRIMARY,
      gradientEnd: SECONDARY,
      percent: pct(resolvedNewFollowers, capNewFollowers),
    },
    {
      icon: <FiZap size={17} />,
      label: "Engagement Rate",
      value: `${engagementRate}%`,
      color: PRIMARY,
      gradientEnd: SECONDARY,
      // Rate arc: 15 % rate = 88 % fill — adjust cap to your industry
      percent: pct(parseFloat(engagementRate), 15),
    },
    {
      icon: <FiShare2 size={17} />,
      label: "Total Posts",
      value: resolvedPosts > 0 ? fmt(resolvedPosts) : "—",
      color: PRIMARY,
      gradientEnd: SECONDARY,
percent: resolvedPosts > 0 ? 0.6 : 0,    },
  {
  icon: <FiStar size={17} />,
  label: "Leads",
  value: fmt(resolvedLeads || 0),
  subLabel: resolvedLeads === 0 ? "no data" : "",
  color: PRIMARY,
  gradientEnd: SECONDARY,
  percent: pct(resolvedLeads || 1, capLeads),
},
  ];

  // ── 6. Grid column class ──────────────────────────────────────────────────
  const colClass =
    visiblePlatforms.length === 1 ? "grid-cols-1 max-w-xs" :
    visiblePlatforms.length === 2 ? "grid-cols-2" :
    "grid-cols-3";

  // ── 7. Chart + table data ─────────────────────────────────────────────────
  const daily    = summary?.dailyBreakdown ?? [];
  const topPosts = summary?.topPosts       ?? [];
    console.log({
  channels,
  platforms,
  summary,
  byPlatform,
  resolvedFollowers,
  resolvedReach,
  resolvedEngagement,
});
console.log("CHANNEL SAMPLE:", channels[0]);
console.log("SUMMARY:", summary);
  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Brand: <span className="font-bold text-slate-700">{activeBrand.name}</span>
            {" · "}{days}-day window
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-sm"
          >
            <option value="all">All Platforms</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
          </select>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {DAY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-4 py-2 text-xs font-bold transition-all ${
                  days === opt.value ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={sync}
            disabled={syncing || loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <FiDownloadCloud size={13} className={syncing ? "animate-bounce" : ""} />
            {syncing ? "Syncing…" : "Sync"}
          </button>

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

      {/* ── Banners ──────────────────────────────────────────────────────────── */}
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
      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* ── DONUT CARDS ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonDonutCard key={i} />)
          : donutCards.map((card, i) => <DonutCard key={i} {...card} />)
        }
      </div>

      {/* ── BY PLATFORM ──────────────────────────────────────────────────────── */}
      {(loading || visiblePlatforms.length > 0) && (
        <div className="mb-8">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">By Platform</h2>

          {/* Row 1 — Engagement Rate gauge */}
          <div className={`grid ${colClass} gap-4 mb-4`}>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} tall />)
              : visiblePlatforms.map((p) => {
                  const rate = p.totalFollowers > 0
                    ? ((p.totalEngagement / p.totalFollowers) * 100).toFixed(2)
                    : p.totalPosts > 0
                    ? ((p.totalEngagement / p.totalPosts) * 100).toFixed(2)
                    : "0";
                  return (
                    <GaugeCard
                      key={`${p.platform}-rate`}
                      platform={p.platform}
                      label="Post engagement rate"
                      value={`${rate}%`}
                      sub="engagement rate"
                      percent={Math.min(parseFloat(rate) / 10, 1)}
                    />
                  );
                })
            }
          </div>

          {/* Row 2 — Followers */}
          <div className={`grid ${colClass} gap-4 mb-4`}>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : visiblePlatforms.map((p) => (
                  <MetricCard key={`${p.platform}-followers`}
                    platform={p.platform} label="Followers"
                    value={fmt(p.totalFollowers)}
                    sub={`+${fmt(p.newFollowers)} new`} />
                ))
            }
          </div>

          {/* Row 3 — Total Engagement */}
          <div className={`grid ${colClass} gap-4 mb-4`}>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : visiblePlatforms.map((p) => (
                  <MetricCard key={`${p.platform}-engagement`}
                    platform={p.platform} label="Total Engagement"
                    value={fmt(p.totalEngagement)}
                    sub={`last ${days} days`} />
                ))
            }
          </div>

          {/* Row 4 — Reach */}
          <div className={`grid ${colClass} gap-4 mb-4`}>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : visiblePlatforms.map((p) => (
                  <MetricCard key={`${p.platform}-reach`}
                    platform={p.platform} label="Reach"
                    value={p.totalReach > 0 ? fmt(p.totalReach) : "—"}
                    sub={`last ${days} days`} />
                ))
            }
          </div>

          {/* Row 5 — Total Posts */}
          <div className={`grid ${colClass} gap-4`}>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : visiblePlatforms.map((p) => (
                  <MetricCard key={`${p.platform}-posts`}
                    platform={p.platform} label="Total Posts"
                    value={p.totalPosts > 0 ? fmt(p.totalPosts) : "—"}
                    sub={`last ${days} days`} />
                ))
            }
          </div>
        </div>
      )}

      {/* ── Engagement Trend chart ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Engagement Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={daily}>
            <defs>
              <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={fmtDate} />
            <YAxis />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="totalEngagement" stroke="#6366f1" fillOpacity={1} fill="url(#colorEng)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Top Posts Table ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <FiAward className="text-yellow-500" size={14} /> Top Posts by Engagement
          </h3>
          <span className="text-[10px] text-slate-400 font-semibold">Top 10 · last {days} days</span>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-slate-400 text-sm animate-pulse">Loading posts…</div>
        ) : topPosts.length === 0 ? (
          <Empty message="No post metrics yet. Sync to pull fresh data." />
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
                  <tr key={post.postId ?? idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-xs font-bold text-slate-400">#{idx + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <PlatformDot platform={post.platform} />
                        <span className="text-xs font-bold text-slate-700 capitalize">{post.platform}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-slate-500 font-mono truncate max-w-30 inline-block">{post.postId}</span>
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
  );
}

