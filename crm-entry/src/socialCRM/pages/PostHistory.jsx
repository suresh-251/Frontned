import { useCallback, useEffect, useState } from "react";
import api from "../api/apiClient";
import { useBrand } from "../context/BrandContext";

const STATUS_TABS = [
  { key: "scheduled", label: "🗓 Scheduled",  badge: "bg-blue-100 text-blue-700"   },
  { key: "completed", label: "✅ Posted",     badge: "bg-green-100 text-green-700" },
  { key: "failed",    label: "❌ Failed",     badge: "bg-red-100 text-red-700"     },
];

const PLATFORM_COLORS = {
  Facebook:  "bg-blue-100 text-blue-700",
  Instagram: "bg-pink-100 text-pink-700",
  LinkedIn:  "bg-indigo-100 text-indigo-700",
};

function parsePlatforms(raw) {
  try { return JSON.parse(raw) ?? []; } catch { return []; }
}

function parseAccountIds(raw) {
  try { return JSON.parse(raw) ?? []; } catch { return []; }
}

function fmtLocal(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function PostHistory() {
  const { activeBrand } = useBrand();
  const [tab, setTab] = useState("scheduled");

  const [scheduled, setScheduled]       = useState([]);
  const [scheduledLoading, setScheduledLoading] = useState(false);

  const [history, setHistory]           = useState([]);
  const [historyLoading, setHistoryLoading]     = useState(false);
  const [historyPage, setHistoryPage]   = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const PAGE_SIZE = 20;

  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError]               = useState("");

  // ── Load scheduled (pending) posts ──
  const loadScheduled = useCallback(async () => {
    setScheduledLoading(true);
    setError("");
    try {
      const res = await api.get("/post/scheduled");
      setScheduled(res.data ?? []);
    } catch {
      setError("Failed to load scheduled posts.");
    } finally {
      setScheduledLoading(false);
    }
  }, []);

  // ── Load history (completed + failed) ──
  const loadHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    setError("");
    try {
      const res = await api.get("/post/history", { params: { page, pageSize: PAGE_SIZE } });
      setHistory(res.data.posts ?? []);
      setHistoryTotal(res.data.total ?? 0);
      setHistoryPage(page);
    } catch {
      setError("Failed to load post history.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScheduled();
    loadHistory(1);
  }, [loadScheduled, loadHistory]);

  // ── Cancel a scheduled post ──
  const cancelPost = async (id) => {
    if (!window.confirm("Cancel this scheduled post?")) return;
    setCancellingId(id);
    try {
      await api.delete(`/post/scheduled/${id}`);
      setScheduled(prev => prev.filter(p => p.id !== id));
    } catch {
      setError("Failed to cancel post.");
    } finally {
      setCancellingId(null);
    }
  };

  // Derive "failed" and "completed" from history
  const completed = history.filter(p => p.status === "Completed");
  const failed    = history.filter(p => p.status === "Failed");

  const counts = {
    scheduled: scheduled.length,
    completed: historyTotal > 0 ? completed.length : 0,
    failed:    failed.length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Post History</h1>
          {activeBrand && (
            <p className="text-sm text-gray-500 mt-0.5">
              Brand: <span className="font-semibold text-gray-700">{activeBrand.name}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-0">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
                tab === t.key
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${t.badge}`}>
                {counts[t.key]}
              </span>
            </button>
          ))}

          <button
            onClick={() => { loadScheduled(); loadHistory(historyPage); }}
            className="ml-auto mb-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-1.5 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* ── SCHEDULED TAB ── */}
        {tab === "scheduled" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {scheduledLoading ? (
              <div className="p-10 text-center text-gray-400 animate-pulse">Loading scheduled posts…</div>
            ) : scheduled.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <div className="text-4xl mb-2">🗓</div>
                <p className="text-sm">No scheduled posts pending.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Post</th>
                    <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Platforms</th>
                    <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Scheduled For (IST)</th>
                    <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {scheduled.map(post => (
                    <ScheduledRow
                      key={post.id}
                      post={post}
                      cancelling={cancellingId === post.id}
                      onCancel={() => cancelPost(post.id)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── COMPLETED TAB ── */}
        {tab === "completed" && (
          <HistoryTable
            posts={completed}
            loading={historyLoading}
            emptyIcon="✅"
            emptyMsg="No published posts yet."
          />
        )}

        {/* ── FAILED TAB ── */}
        {tab === "failed" && (
          <HistoryTable
            posts={failed}
            loading={historyLoading}
            emptyIcon="❌"
            emptyMsg="No failed posts."
            showError
          />
        )}

        {/* Pagination (history tabs) */}
        {(tab === "completed" || tab === "failed") && historyTotal > PAGE_SIZE && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{historyTotal} total posts</span>
            <div className="flex gap-2">
              <button
                disabled={historyPage <= 1 || historyLoading}
                onClick={() => loadHistory(historyPage - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >← Prev</button>
              <span className="px-3 py-1.5">Page {historyPage}</span>
              <button
                disabled={historyPage * PAGE_SIZE >= historyTotal || historyLoading}
                onClick={() => loadHistory(historyPage + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
              >Next →</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Scheduled row ──
function ScheduledRow({ post, cancelling, onCancel }) {
  const platforms = parsePlatforms(post.platforms);
  const accounts  = parseAccountIds(post.targetAccountIds);
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 max-w-xs">
        <p className="font-medium text-gray-900 text-xs uppercase tracking-wide">{post.postType}</p>
        <p className="text-gray-500 truncate text-xs mt-0.5">{post.content || <em>No caption</em>}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{accounts.length} account{accounts.length !== 1 ? "s" : ""}</p>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {platforms.map(p => (
            <span key={p} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${PLATFORM_COLORS[p] ?? "bg-gray-100 text-gray-600"}`}>{p}</span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtLocal(post.scheduledAt)}</td>
      <td className="px-4 py-3">
        <button
          onClick={onCancel}
          disabled={cancelling}
          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium disabled:opacity-50 transition-all"
        >
          {cancelling ? "Cancelling…" : "Cancel"}
        </button>
      </td>
    </tr>
  );
}

// ── History table (completed / failed) ──
function HistoryTable({ posts, loading, emptyIcon, emptyMsg, showError = false }) {
  if (loading) return <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400 animate-pulse">Loading…</div>;
  if (posts.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">
      <div className="text-4xl mb-2">{emptyIcon}</div>
      <p className="text-sm">{emptyMsg}</p>
    </div>
  );
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100 text-left">
            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Post</th>
            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Platforms</th>
            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Scheduled For (IST)</th>
            <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Processed (IST)</th>
            {showError && <th className="px-4 py-3 font-semibold text-gray-500 text-xs uppercase">Error</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {posts.map(post => {
            const platforms = parsePlatforms(post.platforms);
            const accounts  = parseAccountIds(post.targetAccountIds);
            return (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 max-w-xs">
                  <p className="font-medium text-gray-900 text-xs uppercase tracking-wide">{post.postType}</p>
                  <p className="text-gray-500 truncate text-xs mt-0.5">{post.content || <em>No caption</em>}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{accounts.length} account{accounts.length !== 1 ? "s" : ""}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {platforms.map(p => (
                      <span key={p} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${PLATFORM_COLORS[p] ?? "bg-gray-100 text-gray-600"}`}>{p}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-xs">{fmtLocal(post.scheduledAt)}</td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-xs">{fmtLocal(post.processedAt)}</td>
                {showError && (
                  <td className="px-4 py-3 text-red-500 text-xs max-w-xs truncate" title={post.errorMessage}>
                    {post.errorMessage || "—"}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
