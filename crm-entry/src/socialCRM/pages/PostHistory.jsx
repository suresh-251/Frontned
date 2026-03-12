import { useCallback, useEffect, useState } from "react";
import api from "../api/apiClient";
import { BASE_URL } from "../api/apiClient";
import { useBrand } from "../context/BrandContext";
import { connectPlatform } from "../api/auth.api";

// ── Constants ──────────────────────────────────────────────────────────────────
const POST_TYPES = [
  { key: "Text",     label: "📝 Text",     needsMedia: false, multi: false },
  { key: "Image",    label: "🖼️ Image",    needsMedia: true,  multi: false, accept: "image/*" },
  { key: "Carousel", label: "🎠 Carousel", needsMedia: true,  multi: true,  accept: "image/*" },
  { key: "Video",    label: "🎥 Video",    needsMedia: true,  multi: false, accept: "video/*" },
  { key: "Reel",     label: "🎬 Reel",     needsMedia: true,  multi: false, accept: "video/*",         platforms: ["Facebook","Instagram"] },
  { key: "Story",    label: "⚡ Story",    needsMedia: true,  multi: false, accept: "image/*,video/*",  platforms: ["Facebook","Instagram"] },
  { key: "Document", label: "📄 Document", needsMedia: true,  multi: false, accept: ".pdf",             platforms: ["LinkedIn"] },
];

const PLATFORM_META = {
  Facebook:  { color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",  badge: "bg-blue-100 text-blue-700",    icon: "FB", label: "Facebook Pages"     },
  Instagram: { color: "text-pink-600",   bg: "bg-pink-50",   border: "border-pink-200",  badge: "bg-pink-100 text-pink-700",    icon: "IG", label: "Instagram Accounts" },
  LinkedIn:  { color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700", icon: "LI", label: "LinkedIn Pages"    },
};

// Tabs: Published first, then Scheduled, then Failed
const STATUS_TABS = [
  { key: "completed", label: "Published", badge: "bg-green-100 text-green-700", icon: "published", iconColor: "text-green-600" },
  { key: "scheduled", label: "Scheduled", badge: "bg-blue-100 text-blue-700",   icon: "scheduled", iconColor: "text-blue-600" },
  { key: "failed",    label: "Failed",    badge: "bg-red-100 text-red-700",     icon: "failed", iconColor: "text-red-600" },
];

const PLATFORM_COLORS = {
  Facebook:  "bg-blue-100 text-blue-700",
  Instagram: "bg-pink-100 text-pink-700",
  LinkedIn:  "bg-indigo-100 text-indigo-700",
};

const PLATFORM_FILTER_OPTIONS = [
  { key: "All",       label: "All",       text: "text-slate-600",  border: "border-slate-300",  fill: "bg-slate-600" },
  { key: "Instagram", label: "Instagram", text: "text-pink-600",   border: "border-pink-300",   fill: "bg-gradient-to-r from-orange-500 to-pink-500" },
  { key: "Facebook",  label: "Facebook",  text: "text-blue-600",   border: "border-blue-300",   fill: "bg-blue-600" },
  { key: "LinkedIn",  label: "LinkedIn",  text: "text-purple-600", border: "border-purple-300", fill: "bg-purple-600" },
];

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Helpers ────────────────────────────────────────────────────────────────────
const normPlatform = (p) => { const m = { facebook:"Facebook", instagram:"Instagram", linkedin:"LinkedIn" }; return m[(p??"").toLowerCase()] ?? p; };

function parsePlatforms(raw) {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw) ?? []; } catch { return []; }
}
function parseAccountIds(raw) {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw) ?? []; } catch { return []; }
}
function parseResults(raw) {
  if (!raw) return [];
  try { return JSON.parse(raw) ?? []; } catch { return []; }
}
function getPostPlatforms(post = {}) {
  const fromExplicit = parsePlatforms(post.platforms).map(normPlatform).filter(Boolean);
  const fromResults = parseResults(post.postResultsJson)
    .map(r => normPlatform(r.platform || (r.accountId || "").split("_")[0]))
    .filter(Boolean);
  const fromTargets = parseAccountIds(post.targetAccountIds)
    .map(id => normPlatform((id || "").split("_")[0]))
    .filter(Boolean);
  return [...new Set([...fromExplicit, ...fromResults, ...fromTargets])];
}
function fmtLocal(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}
function getPostDate(post) { return post.scheduledAt || post.processedAt || post.createdAt; }

function getCalendarDays(year, month) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function StatusTabIcon({ type, cls = "w-4 h-4" }) {
  if (type === "published") {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (type === "scheduled") {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01m8.99-4a9 9 0 11-17.98 0 9 9 0 0117.98 0z" />
    </svg>
  );
}

// ── Platform SVG ───────────────────────────────────────────────────────────────
function PlatformSvg({ p, cls = "w-4 h-4" }) {
  if (p === "Facebook") return (
    <svg className={cls} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
  if (p === "Instagram") return (
    <svg className={cls} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
  return (
    <svg className={cls} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

// ── Media Thumbnail (fetches with auth) ────────────────────────────────────────
function MediaThumbnail({ postId, contentType, className }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let objectUrl;
    api.get(`/post/${postId}/media`, { responseType: "blob" })
      .then(res => { objectUrl = URL.createObjectURL(res.data); setSrc(objectUrl); })
      .catch(() => {});
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [postId]);

  if (!src) return <div className={`bg-gray-100 animate-pulse ${className}`} />;
  if (contentType?.startsWith("video/")) return <video src={src} className={`${className} object-cover`} muted />;
  return <img src={src} alt="Post media" className={`${className} object-cover`} />;
}

// ── Post Card (Meta Business Suite style) ─────────────────────────────────────
const PLATFORM_ICON_COLOR = {
  Facebook:  "text-blue-600",
  Instagram: "text-pink-600",
  LinkedIn:  "text-indigo-600",
};

function platformFromUrl(url = "") {
  if (!url) return "";
  if (url.includes("facebook.com"))  return "Facebook";
  if (url.includes("instagram.com")) return "Instagram";
  if (url.includes("linkedin.com"))  return "LinkedIn";
  return "";
}

// Build a best-effort platform URL when viewUrl is absent (older posts)
function buildFallbackUrl(r) {
  const p  = (r.platform || "").toLowerCase();
  const id = r.postId || r.platformPostId || "";
  if (!id) return null;
  if (p === "facebook") {
    // postId can be "{pageId}_{objectId}" or just "{objectId}"
    if (id.includes("_")) {
      const [pageId, objectId] = id.split("_");
      return `https://www.facebook.com/${pageId}/posts/${objectId}`;
    }
    const acct = r.accountId || "";
    return `https://www.facebook.com/${acct}/posts/${id}`;
  }
  if (p === "instagram") return `https://www.instagram.com/p/${id}/`;
  if (p === "linkedin")  return `https://www.linkedin.com/feed/update/${encodeURIComponent(id)}`;
  return null;
}

// Build a view link object from a StoredPostResult, always attempting a URL
function buildViewLink(r) {
  const url = r.viewUrl || r.viewPostUrl || buildFallbackUrl(r);
  if (!url) return null;
  return {
    url,
    platform:    r.platform || platformFromUrl(url) || normPlatform((r.accountId || "").split("_")[0]),
    accountName: r.accountName || r.accountId || "",
  };
}

function PostCard({ post, onEdit, onDelete }) {
  const platforms    = parsePlatforms(post.platforms);
  const results      = parseResults(post.postResultsJson);
  const successResults = results.filter(r => r.success);
  const successCount   = successResults.length;
  const totalReach     = results.reduce((s, r) => s + (r.reach ?? 0), 0);

  // Build view links for ALL success results — always try to construct a URL
  const viewLinks = successResults.map(buildViewLink).filter(Boolean);

  const isImage = ["Image","Carousel"].includes(post.postType);
  const isVideo = ["Video","Reel","Story"].includes(post.postType);
  const hasMedia = post.hasMedia && (isImage || isVideo);

  const statusColor = post.status === "Completed" ? "border-l-green-400" : "border-l-red-400";

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm flex overflow-hidden border-l-4 ${statusColor} hover:shadow-md transition-shadow`}>
      {/* Thumbnail */}
      <div className="shrink-0 w-24 h-24 bg-gray-50 flex items-center justify-center self-center m-3 rounded-lg overflow-hidden">
        {hasMedia ? (
          <MediaThumbnail postId={post.id} contentType={post.mediaContentType} className="w-24 h-24" />
        ) : (
          <span className="text-3xl">
            {post.postType === "Text" ? "📝" : post.postType === "Document" ? "📄" : post.postType === "Reel" ? "🎬" : post.postType === "Story" ? "⚡" : "📄"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 py-3 pr-3 min-w-0">
        {/* Top row: type badge + platform chips + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {post.postType}
            </span>
            {platforms.map(p => (
              <span key={p} className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${PLATFORM_COLORS[p] ?? "bg-gray-100 text-gray-600"}`}>
                <PlatformSvg p={p} cls="w-2.5 h-2.5" />{p}
              </span>
            ))}
          </div>
          {post.status === "Completed" ? (
            <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">✓ Published</span>
          ) : (
            <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full whitespace-nowrap">✗ Failed</span>
          )}
        </div>

        {/* Caption */}
        <p className="text-sm text-gray-700 mt-1.5 line-clamp-2 leading-snug">
          {post.content || <span className="italic text-gray-400">No caption</span>}
        </p>

        {/* Meta row: published at + reach + accounts count */}
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {fmtLocal(post.processedAt ?? post.scheduledAt)}
          </span>
          {/* ── Reach column ── */}
          <span className="text-[11px] font-medium text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Reach: {totalReach > 0 ? totalReach.toLocaleString() : "—"}
          </span>
          {results.length > 0 && (
            <span className="text-[11px] text-gray-400">
              {successCount}/{results.length} accounts
            </span>
          )}
        </div>

        {/* View Post section: one row per platform account */}
        {viewLinks.length > 0 && (
          <div className="mt-2.5 border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
            <div className="px-2.5 py-1 bg-gray-50">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Published on</span>
            </div>
            {viewLinks.map((link, i) => (
              <div key={i} className="flex items-center justify-between px-2.5 py-1.5 bg-white">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[11px] font-semibold ${PLATFORM_ICON_COLOR[link.platform] ?? "text-gray-600"}`}>
                    <PlatformSvg p={link.platform} cls="w-3.5 h-3.5 inline mr-0.5" />
                    {link.platform}
                  </span>
                  {link.accountName && (
                    <span className="text-[11px] text-gray-500 truncate">· {link.accountName}</span>
                  )}
                </div>
                <a href={link.url} target="_blank" rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Post
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {post.status === "Failed" && post.errorMessage && (
          <p className="text-[11px] text-red-500 mt-2 truncate" title={post.errorMessage}>
            ⚠ {post.errorMessage}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          {post.status === "Completed" && (
            <button onClick={() => onEdit(post)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </button>
          )}
          <button onClick={() => onDelete(post)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Scheduled Card ─────────────────────────────────────────────────────────────
function ScheduledCard({ post, cancellingId, onCancel }) {
  const platforms = parsePlatforms(post.platforms);
  const accs      = parseAccountIds(post.targetAccountIds);
  const hasMedia  = post.hasMedia;
  const isImage   = ["Image","Carousel"].includes(post.postType);
  const isVideo   = ["Video","Reel","Story"].includes(post.postType);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex overflow-hidden border-l-4 border-l-blue-400 hover:shadow-md transition-shadow">
      <div className="shrink-0 w-20 h-20 bg-gray-50 flex items-center justify-center self-center m-3 rounded-lg overflow-hidden">
        {hasMedia && (isImage || isVideo) ? (
          <MediaThumbnail postId={post.id} contentType={post.mediaContentType} className="w-20 h-20" />
        ) : (
          <span className="text-2xl">
            {post.postType === "Text" ? "📝" : post.postType === "Document" ? "📄" : "🖼️"}
          </span>
        )}
      </div>
      <div className="flex-1 py-3 pr-3 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{post.postType}</span>
          {platforms.map(p => (
            <span key={p} className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${PLATFORM_COLORS[p] ?? "bg-gray-100 text-gray-600"}`}>
              <PlatformSvg p={p} cls="w-2.5 h-2.5" />{p.slice(0,2)}
            </span>
          ))}
          <span className="ml-auto text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">⏰ Scheduled</span>
        </div>
        <p className="text-sm text-gray-700 mt-1.5 line-clamp-2 leading-snug">
          {post.content || <span className="italic text-gray-400">No caption</span>}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-gray-400">
            📅 {fmtLocal(post.scheduledAt)} · {accs.length} account{accs.length !== 1 ? "s" : ""}
          </span>
          <button onClick={() => onCancel(post.id)} disabled={cancellingId === post.id}
            className="px-2.5 py-1 text-[11px] font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors">
            {cancellingId === post.id ? "Cancelling…" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Post Modal ────────────────────────────────────────────────────────────
function EditPostModal({ post, onClose, onSaved }) {
  const [content, setContent] = useState(post.content || "");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async () => {
    setSaving(true); setError("");
    try {
      await api.patch(`/post/history/${post.id}`, { content });
      onSaved(post.id, content);
      onClose();
    } catch (e) {
      setError(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Edit Post Caption</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <textarea rows={5} value={content} onChange={e => setContent(e.target.value)}
          className="w-full text-sm text-gray-900 resize-none border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-300" />
        <p className="text-[10px] text-gray-400 mt-1">Caption syncs to Facebook &amp; LinkedIn. Instagram does not support editing published posts.</p>
        {error && <p className="text-xs text-red-600 mt-2">⚠ {error}</p>}
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={save} disabled={saving}
            className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition-colors">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Post Preview ───────────────────────────────────────────────────────────────
function PostPreview({ platform, content, mode, brandName, filePreviewUrls }) {
  const previewUrl = filePreviewUrls?.[0] ?? null;
  const initial = (brandName || "B").charAt(0).toUpperCase();

  if (platform === "Instagram") return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-xs shadow-sm">
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {previewUrl ? <img src={previewUrl} alt="preview" className="w-full h-full object-cover" /> : <span className="text-gray-300 text-4xl">🖼️</span>}
      </div>
      <div className="p-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-5 h-5 bg-linear-to-br from-pink-500 to-purple-600 rounded-full" />
          <span className="font-semibold text-gray-900 text-[10px]">{brandName || "your_brand"}</span>
        </div>
        <p className="text-gray-700 leading-relaxed line-clamp-3 text-[10px]">{content || <span className="text-gray-300">Caption will appear here…</span>}</p>
      </div>
      <div className="px-2.5 py-1.5 border-t border-gray-100 flex gap-3 text-gray-400 text-[9px]">
        <span>❤️ Like</span><span>💬 Comment</span><span>✈️ Share</span>
      </div>
    </div>
  );

  if (platform === "LinkedIn") return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-xs shadow-sm">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">{initial}</div>
          <div>
            <p className="font-semibold text-gray-900 text-[10px]">{brandName || "Your Company"}</p>
            <p className="text-gray-400 text-[9px]">Company · Just now · 🌐</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-5 text-[10px]">{content || <span className="text-gray-300">Post content…</span>}</p>
        {previewUrl && mode !== "Document" && <div className="mt-2 rounded-lg overflow-hidden bg-gray-100 aspect-video"><img src={previewUrl} alt="preview" className="w-full h-full object-cover" /></div>}
      </div>
      <div className="px-3 py-1.5 border-t border-gray-100 flex gap-3 text-gray-400 text-[9px]">
        <span>👍 Like</span><span>💬 Comment</span><span>🔁 Repost</span>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-xs shadow-sm">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">{initial}</div>
          <div>
            <p className="font-semibold text-gray-900 text-[10px]">{brandName || "Your Page"}</p>
            <p className="text-gray-400 text-[9px]">Just now · 🌐</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-5 text-[10px]">{content || <span className="text-gray-300">Post content…</span>}</p>
        {previewUrl && (mode === "Image" || mode === "Carousel") && <div className="mt-2 rounded-lg overflow-hidden bg-gray-100"><img src={previewUrl} alt="preview" className="w-full object-cover max-h-40" /></div>}
        {previewUrl && (mode === "Video" || mode === "Reel") && <div className="mt-2 rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center"><span className="text-white text-2xl">▶</span></div>}
      </div>
      <div className="px-3 py-1.5 border-t border-gray-100 flex gap-3 text-gray-400 text-[9px]">
        <span>👍 Like</span><span>💬 Comment</span><span>↗️ Share</span>
      </div>
    </div>
  );
}

// ── Calendar View (Meta Business Suite style) ──────────────────────────────────
function CalendarPostPopover({ post, onClose }) {
  const results  = parseResults(post.postResultsJson);
  const viewLinks = results.filter(r => r.success).map(buildViewLink).filter(Boolean);
  const isImage  = ["Image","Carousel"].includes(post.postType);
  const isVideo  = ["Video","Reel","Story"].includes(post.postType);
  const hasMedia = post.hasMedia && (isImage || isVideo);

  return (
    <div className="absolute z-50 left-full top-0 ml-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      style={{ maxWidth: "90vw" }}
      onClick={e => e.stopPropagation()}>
      {hasMedia && (
        <div className="w-full h-32 bg-gray-100 overflow-hidden">
          <MediaThumbnail postId={post.id} contentType={post.mediaContentType} className="w-full h-32" />
        </div>
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex flex-wrap gap-1">
            {parsePlatforms(post.platforms).map(p => (
              <span key={p} className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${PLATFORM_COLORS[p] ?? "bg-gray-100 text-gray-600"}`}>
                <PlatformSvg p={p} cls="w-2.5 h-2.5" />{p}
              </span>
            ))}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${post.status === "Completed" ? "bg-green-100 text-green-700" : post.status === "Scheduled" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600"}`}>
              {post.status === "Completed" ? "Published" : post.status === "Scheduled" ? "Scheduled" : "Failed"}
            </span>
          </div>
          <button onClick={onClose} className="p-0.5 hover:bg-gray-100 rounded shrink-0 text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="text-xs text-gray-700 line-clamp-3 leading-snug mb-1.5">
          {post.content || <span className="italic text-gray-400">No caption</span>}
        </p>
        <p className="text-[10px] text-gray-400 mb-2">📅 {fmtLocal(post.scheduledAt ?? post.processedAt)}</p>
        {viewLinks.length > 0 && (
          <div className="flex flex-col gap-1">
            {viewLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${PLATFORM_META[link.platform]?.bg ?? "bg-gray-50"} ${PLATFORM_META[link.platform]?.color ?? "text-gray-700"} hover:opacity-90`}>
                <PlatformSvg p={link.platform} cls="w-3 h-3" />
                View on {link.platform}{link.accountName ? ` · ${link.accountName}` : ""}
                <svg className="w-3 h-3 ml-auto opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarView({ year, month, onPrev, onNext, onPrevYear, onNextYear, onSetYear, posts, tab }) {
  const days  = getCalendarDays(year, month);
  const today = new Date();
  const [activePost, setActivePost] = useState(null); // { postId, dayIdx }
  const [yearInput, setYearInput]   = useState(false);
  const [yearDraft, setYearDraft]   = useState(String(year));

  const filtered = posts.filter(p => {
    if (tab === "scheduled") return p.status !== "Completed" && p.status !== "Failed";
    if (tab === "completed") return p.status === "Completed";
    if (tab === "failed")    return p.status === "Failed";
    return true;
  });

  const byDay = {};
  filtered.forEach(post => {
    const d = new Date(getPostDate(post));
    if (d.getFullYear() === year && d.getMonth() === month)
      (byDay[d.getDate()] = byDay[d.getDate()] || []).push(post);
  });

  const isToday = (day) => day && day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const goToday = () => { onSetYear(today.getFullYear()); };

  const chipColor = (status) =>
    status === "Completed" ? "bg-green-500 text-white" :
    status === "Failed"    ? "bg-red-400 text-white" :
    "bg-blue-500 text-white";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white">
        {/* Year nav */}
        <button onClick={onPrevYear} title="Previous year" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          </svg>
        </button>
        {/* Month nav */}
        <button onClick={onPrev} title="Previous month" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Month + Year (click year to edit inline) */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="text-sm font-bold text-gray-900">{MONTH_NAMES[month]}</span>
          {yearInput ? (
            <form onSubmit={e => { e.preventDefault(); const y = parseInt(yearDraft); if (y >= 2000 && y <= 2100) { onSetYear(y); } setYearInput(false); }}>
              <input autoFocus type="number" min="2000" max="2100" value={yearDraft}
                onChange={e => setYearDraft(e.target.value)}
                onBlur={() => setYearInput(false)}
                className="w-20 text-center text-sm font-bold text-blue-600 border-b-2 border-blue-400 outline-none bg-transparent" />
            </form>
          ) : (
            <button onClick={() => { setYearDraft(String(year)); setYearInput(true); }}
              className="text-sm font-bold text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline transition-colors">
              {year}
            </button>
          )}
        </div>

        <button onClick={onNext} title="Next month" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button onClick={onNextYear} title="Next year" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M6 5l7 7-7 7" />
          </svg>
        </button>

        <button onClick={goToday}
          className="ml-1 px-2.5 py-1 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
          Today
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
        {DAY_NAMES.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-100" onClick={() => setActivePost(null)}>
        {days.map((day, i) => {
          const dayPosts = day ? (byDay[day] || []) : [];
          return (
            <div key={i} className={`min-h-27.5 p-1.5 transition-colors relative
              ${!day ? "bg-gray-50/60" : ""}
              ${isToday(day) ? "bg-blue-50/50" : day ? "hover:bg-gray-50/80" : ""}`}>
              {day && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`inline-flex w-6 h-6 items-center justify-center text-xs font-bold rounded-full
                      ${isToday(day) ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:bg-gray-200 cursor-default"}`}>
                      {day}
                    </span>
                    {dayPosts.length > 0 && (
                      <span className="text-[9px] text-gray-400 font-semibold">{dayPosts.length}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayPosts.slice(0, 3).map((post, j) => {
                      const pls  = parsePlatforms(post.platforms);
                      const time = new Date(getPostDate(post));
                      const timeStr = time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
                      const isActive = activePost?.postId === post.id && activePost?.dayIdx === i;
                      return (
                        <div key={j} className="relative">
                          <button
                            onClick={e => { e.stopPropagation(); setActivePost(isActive ? null : { postId: post.id, dayIdx: i }); }}
                            className={`w-full text-left text-[10px] px-1.5 py-1 rounded-md leading-tight truncate transition-all
                              ${chipColor(post.status)} hover:opacity-90 shadow-sm`}>
                            <span className="font-bold mr-0.5">{timeStr}</span>
                            {pls[0] ? `· ${pls[0].slice(0,2)} ` : ""}
                            {post.content?.slice(0, 22) || post.postType}
                          </button>
                          {isActive && (
                            <CalendarPostPopover post={post} onClose={() => setActivePost(null)} />
                          )}
                        </div>
                      );
                    })}
                    {dayPosts.length > 3 && (
                      <button className="text-[10px] text-blue-500 font-semibold pl-0.5 hover:text-blue-700 text-left transition-colors">
                        +{dayPosts.length - 3} more
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 bg-gray-50">
        <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-green-500 inline-block"></span>Published
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span>Scheduled
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-red-400 inline-block"></span>Failed
        </span>
      </div>
    </div>
  );
}

// ── Compose Modal (centered) ───────────────────────────────────────────────────
function ComposeModal({ activeBrand, onClose, onPosted }) {
  const [accounts, setAccounts]           = useState([]);
  const [accountsLoading, setALoading]    = useState(true);
  const [selected, setSelected]           = useState(new Set());
  const [mode, setMode]                   = useState("Text");
  const [content, setContent]             = useState("");
  const [files, setFiles]                 = useState([]);
  const [documentTitle, setDocTitle]      = useState("");
  const [scheduleEnabled, setSched]       = useState(false);
  const [scheduledAt, setScheduledAt]     = useState("");
  const [posting, setPosting]             = useState(false);
  const [results, setResults]             = useState(null);
  const [error, setError]                 = useState("");
  const [showPreview, setShowPreview]     = useState(false);
  const [previewPlatform, setPreviewPl]   = useState("Facebook");
  const [filePreviewUrls, setPreviewUrls] = useState([]);

  const currentType = POST_TYPES.find(t => t.key === mode);

  useEffect(() => {
    if (!activeBrand?.slug) { setALoading(false); return; }
    api.get(`/brands/${activeBrand.slug}/accounts`)
      .then(res => {
        const raw = res.data.accounts ?? [];
        setAccounts(raw.map(a => ({
          platform: normPlatform(a.platform), pageIdentifier: a.pageIdentifier,
          displayName: a.displayName, isActive: a.isActive,
        })));
      })
      .catch(() => setAccounts([]))
      .finally(() => setALoading(false));
  }, [activeBrand?.slug]);

  useEffect(() => { setFiles([]); setPreviewUrls([]); }, [mode]);

  useEffect(() => {
    if (!files.length) { setPreviewUrls([]); return; }
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [files]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const byPlatform = accounts.reduce((acc, a) => { (acc[a.platform] = acc[a.platform] || []).push(a); return acc; }, {});
  const toggle = (pid) => setSelected(prev => { const s = new Set(prev); s.has(pid) ? s.delete(pid) : s.add(pid); return s; });
  const togglePlatform = (pAccs, check) => setSelected(prev => { const s = new Set(prev); pAccs.forEach(a => check ? s.add(a.pageIdentifier) : s.delete(a.pageIdentifier)); return s; });
  const selectedAccounts = accounts.filter(a => selected.has(a.pageIdentifier));
  const accountsMap = new Map(accounts.map(a => [a.pageIdentifier, a]));
  const previewPlatforms = selectedAccounts.length > 0 ? [...new Set(selectedAccounts.map(a => a.platform))] : ["Facebook","Instagram","LinkedIn"];
  const handleFileChange = (e) => setFiles(currentType?.multi ? Array.from(e.target.files) : e.target.files[0] ? [e.target.files[0]] : []);

  const minDateTime = (() => {
    const d = new Date(Date.now() + 2 * 60000);
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  const submit = async () => {
    if (!selected.size)                               { setError("Select at least one account"); return; }
    if (currentType?.needsMedia && !files.length)     { setError(`Select a file for ${mode} post`); return; }
    if (mode === "Document" && !documentTitle.trim()) { setError("Enter a document title"); return; }
    if (scheduleEnabled && !scheduledAt)              { setError("Pick a scheduled date/time"); return; }

    setPosting(true); setError(""); setResults(null);

    const platforms = [...new Set(selectedAccounts.map(a => a.platform))];
    const form = new FormData();
    platforms.forEach(p => form.append("Platforms", p));
    selectedAccounts.forEach(a => form.append("TargetAccountIds", a.pageIdentifier));
    form.append("Type", mode);
    form.append("Content", content || "");
    files.forEach(f => form.append("MediaFiles", f));
    if (documentTitle) form.append("DocumentTitle", documentTitle);
    if (scheduleEnabled && scheduledAt) form.append("ScheduledAt", new Date(scheduledAt).toISOString());

    try {
      const res = await api.post("/post", form, {
        headers: { "Content-Type": "multipart/form-data", "X-Brand-Id": activeBrand?.slug },
      });
      setResults(res.data);
      if (!scheduleEnabled) { setContent(""); setFiles([]); setSelected(new Set()); }
      onPosted?.({ scheduled: scheduleEnabled });
    } catch (e) {
      setError(e.message || "Failed to post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Centered dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-gray-900">Compose Post</h2>
            {activeBrand && <span className="text-xs text-gray-400">· {activeBrand.name}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPreview(v => !v)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors ${showPreview ? "bg-blue-50 text-blue-600 border-blue-200" : "text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
              {showPreview ? "Hide Preview" : "Preview"}
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex min-h-0">

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* Accounts */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Post to</span>
                {selected.size > 0 && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">{selected.size} selected</span>}
              </div>
              {accountsLoading ? (
                <div className="p-4 text-center text-xs text-gray-400 animate-pulse">Loading accounts…</div>
              ) : accounts.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">No accounts. <button onClick={() => connectPlatform("facebook")} className="text-blue-600 underline">Connect Facebook</button></div>
              ) : (
                <div className="p-2 space-y-3">
                  {Object.entries(byPlatform).map(([platform, pAccounts]) => {
                    const meta = PLATFORM_META[platform] ?? PLATFORM_META.Facebook;
                    const allChecked = pAccounts.every(a => selected.has(a.pageIdentifier));
                    return (
                      <div key={platform}>
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${meta.bg}`}>
                          <PlatformSvg p={platform} cls={`w-3 h-3 ${meta.color}`} />
                          <span className={`text-[10px] font-bold ${meta.color}`}>{meta.label}</span>
                          <button onClick={() => togglePlatform(pAccounts, !allChecked)} className={`ml-auto text-[10px] ${meta.color} hover:underline`}>
                            {allChecked ? "Deselect all" : "Select all"}
                          </button>
                        </div>
                        <div className="mt-0.5 space-y-0.5 pl-1">
                          {pAccounts.map(acc => (
                            <label key={acc.pageIdentifier} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white rounded-lg cursor-pointer">
                              <input type="checkbox" checked={selected.has(acc.pageIdentifier)} onChange={() => toggle(acc.pageIdentifier)} className="w-3.5 h-3.5 accent-blue-600" />
                              <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${meta.badge}`}>{meta.icon}</span>
                              <span className="text-xs text-gray-800 truncate">{acc.displayName || acc.pageIdentifier}</span>
                              {!acc.isActive && <span className="ml-auto text-[10px] text-gray-400">inactive</span>}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Post type */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Post Type</p>
              <div className="flex flex-wrap gap-1">
                {POST_TYPES.map(t => (
                  <button key={t.key} onClick={() => setMode(t.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${mode === t.key ? "bg-blue-50 text-blue-600 border-blue-400" : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100"}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              {currentType?.platforms && <p className="mt-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-md inline-block">⚠️ Only: {currentType.platforms.join(", ")}</p>}
            </div>

            {/* Caption */}
            <textarea rows={4} placeholder="What would you like to share?" value={content} onChange={e => setContent(e.target.value)}
              className="w-full text-sm text-gray-900 resize-none border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400" />

            {mode === "Document" && (
              <input type="text" placeholder="Document title (required)" value={documentTitle} onChange={e => setDocTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            )}

            {currentType?.needsMedia && (
              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${files.length > 0 ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"}`}>
                  {files.length > 0 ? (
                    <div><p className="text-green-600 font-medium text-sm">✓ {files.length === 1 ? files[0].name : `${files.length} files`}</p><p className="text-xs text-gray-400">Click to change</p></div>
                  ) : (
                    <div><div className="text-2xl mb-1">{mode === "Document" ? "📄" : (mode === "Video" || mode === "Reel") ? "🎥" : "🖼️"}</div><p className="text-xs text-gray-500">{mode === "Carousel" ? "Select multiple images" : `Select ${mode.toLowerCase()} file`}</p></div>
                  )}
                </div>
                <input type="file" accept={currentType.accept} multiple={currentType.multi} onChange={handleFileChange} className="hidden" />
              </label>
            )}

            {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs">⚠️ {error}</div>}

            {/* Schedule + post */}
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2.5">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div onClick={() => { setSched(v => !v); if (scheduleEnabled) setScheduledAt(""); }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${scheduleEnabled ? "bg-blue-600" : "bg-gray-300"}`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${scheduleEnabled ? "translate-x-4.5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Schedule for later</span>
                </label>
                {scheduleEnabled && (
                  <input type="datetime-local" min={minDateTime} value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white min-w-0" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">{selected.size > 0 ? `${selected.size} account${selected.size > 1 ? "s" : ""} selected` : "No accounts selected"}</p>
                <button onClick={submit} disabled={posting || !selected.size}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-xs shadow-sm">
                  {posting ? (<><svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>{scheduleEnabled ? "Scheduling…" : "Posting…"}</>) : scheduleEnabled ? "📅 Schedule" : "🚀 Post Now"}
                </button>
              </div>
            </div>

            {results && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {results.scheduled ? (
                  <div className="p-3 flex items-start gap-2 bg-blue-50"><span className="text-xl">📅</span><div><p className="font-semibold text-blue-800 text-sm">Post Scheduled!</p><p className="text-xs text-blue-600 mt-0.5">{results.message}</p></div></div>
                ) : (
                  <>
                    <div className="px-3 py-2 border-b border-gray-100"><h3 className="font-semibold text-gray-900 text-xs">Post Results</h3></div>
                    <div className="divide-y divide-gray-100">
                      {(Array.isArray(results) ? results : []).map(r => (
                        <div key={r.targetAccountId} className={`flex items-center justify-between px-3 py-2 ${r.success ? "" : "bg-red-50"}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{r.success ? "✅" : "❌"}</span>
                            <div>
                              <p className="text-xs font-medium text-gray-900">{accountsMap.get(r.targetAccountId)?.displayName || r.targetAccountName || r.targetAccountId}</p>
                              <p className={`text-[10px] ${r.success ? "text-green-600" : "text-red-600"}`}>{r.message || r.status}</p>
                            </div>
                          </div>
                          {r.success && r.viewPostUrl && <a href={r.viewPostUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-[10px] font-medium hover:underline">View →</a>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Preview panel (optional) */}
          {showPreview && (
            <div className="w-60 border-l border-gray-200 bg-gray-50/80 p-3 overflow-y-auto shrink-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Preview</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {previewPlatforms.map(p => {
                  const meta = PLATFORM_META[p] ?? PLATFORM_META.Facebook;
                  return (
                    <button key={p} onClick={() => setPreviewPl(p)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all border ${previewPlatform === p ? `${meta.badge} border-transparent` : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100"}`}>
                      <PlatformSvg p={p} cls="w-2.5 h-2.5" />{p.slice(0,2).toUpperCase()}
                    </button>
                  );
                })}
              </div>
              <PostPreview platform={previewPlatform} content={content} mode={mode} brandName={activeBrand?.name} filePreviewUrls={filePreviewUrls} />
              <p className="mt-2 text-[10px] text-gray-400 text-center">Preview may differ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Post Table (Meta Business Suite style tabular view) ───────────────────────
function PostTableRow({ post, onEdit, onDelete }) {
  const platforms  = parsePlatforms(post.platforms);
  const [results, setResults] = useState(() => parseResults(post.postResultsJson));
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsFetched, setInsightsFetched] = useState(false);

  // Re-sync if parent data changes
  useEffect(() => { setResults(parseResults(post.postResultsJson)); }, [post.postResultsJson]);

  const successResults = results.filter(r => r.success);
  const totalReach = results.reduce((s, r) => s + (r.reach ?? 0), 0);
  const isImage = ["Image","Carousel"].includes(post.postType);
  const isVideo = ["Video","Reel","Story"].includes(post.postType);
  const hasMedia = post.hasMedia && (isImage || isVideo);

  // Build view links for ALL success results — always try to construct a URL
  const viewLinks = successResults.map(buildViewLink).filter(Boolean);

  const fetchInsights = async () => {
    if (loadingInsights) return;
    setLoadingInsights(true);
    try {
      const res = await api.post(`/post/history/${post.id}/insights`);
      if (res.data?.insights) {
        setResults(prev => {
          const updated = [...prev];
          for (const ins of res.data.insights) {
            const idx = updated.findIndex(r => r.accountId === ins.accountId);
            if (idx >= 0) {
              updated[idx] = {
                ...updated[idx],
                reach:   ins.reach ?? updated[idx].reach,
                viewUrl: ins.viewUrl || updated[idx].viewUrl || updated[idx].viewPostUrl,
              };
            }
          }
          return updated;
        });
        setInsightsFetched(true);
      }
    } catch { /* silently fail */ }
    finally { setLoadingInsights(false); }
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors group">
      {/* Thumbnail + Caption */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 max-w-xs">
          <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            {hasMedia
              ? <MediaThumbnail postId={post.id} contentType={post.mediaContentType} className="w-12 h-12" />
              : <div className="w-12 h-12 flex items-center justify-center text-xl">
                  {post.postType === "Text" ? "📝" : post.postType === "Document" ? "📄" : post.postType === "Reel" ? "🎬" : "📄"}
                </div>
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-800 line-clamp-2 leading-snug">
              {post.content || <span className="italic text-gray-400">No caption</span>}
            </p>
            <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              {post.postType}
            </span>
          </div>
        </div>
      </td>

      {/* Platforms */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          {platforms.map(p => (
            <span key={p} className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit ${PLATFORM_COLORS[p] ?? "bg-gray-100 text-gray-600"}`}>
              <PlatformSvg p={p} cls="w-3 h-3" />{p}
            </span>
          ))}
        </div>
      </td>

      {/* Date Published */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-xs text-gray-600">{fmtLocal(post.processedAt ?? post.scheduledAt)}</span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {post.status === "Completed"
          ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">✓ Published</span>
          : <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">✗ Failed</span>
        }
        {post.status === "Failed" && post.errorMessage && (
          <p className="text-[10px] text-red-400 mt-0.5 max-w-30 truncate" title={post.errorMessage}>{post.errorMessage}</p>
        )}
      </td>

      {/* View on Platform */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          {viewLinks.length === 0 ? (
            <span className="text-xs text-gray-400 italic">No link available</span>
          ) : (
            viewLinks.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline group/link">
                <PlatformSvg p={link.platform} cls="w-3.5 h-3.5" />
                <span className="truncate max-w-32.5">
                  {link.platform}{link.accountName ? ` · ${link.accountName}` : ""}
                </span>
                <svg className="w-3 h-3 opacity-0 group-hover/link:opacity-70 shrink-0 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))
          )}
        </div>
      </td>

      {/* Reach */}
      <td className="px-4 py-3 text-center">
        <div className="flex flex-col items-center gap-1">
          {totalReach > 0 ? (
            <span className="text-sm font-bold text-violet-700">{totalReach.toLocaleString()}</span>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
          {post.status === "Completed" && (
            <button onClick={fetchInsights} disabled={loadingInsights}
              title={insightsFetched ? "Refresh reach" : "Sync reach from platforms"}
              className="text-[9px] font-semibold text-indigo-500 hover:text-indigo-700 disabled:opacity-50 flex items-center gap-0.5 transition-colors">
              {loadingInsights
                ? <span className="w-2.5 h-2.5 border border-indigo-500 border-t-transparent rounded-full animate-spin" />
                : <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              }
              {loadingInsights ? "syncing…" : insightsFetched ? "refresh" : "sync"}
            </button>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {post.status === "Completed" && (
            <button onClick={() => onEdit(post)} title="Edit post"
              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          <button onClick={() => onDelete(post)} title="Delete post"
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

function PostTable({ posts, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Post</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Platforms</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Date Published</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">View Post</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Reach</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <PostTableRow key={post.id} post={post} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PostHistory() {
  const { activeBrand, brands, loading: brandLoading, switchBrand } = useBrand();
  // Use active brand; fall back to first available brand if none is marked active
  const effectiveBrand = activeBrand ?? brands?.[0] ?? null;

  // Auto-activate first brand if none is active — backend requires an active brand for all API calls
  useEffect(() => {
    if (!brandLoading && !activeBrand && brands.length > 0) {
      switchBrand(brands[0].slug);
    }
  }, [brandLoading, activeBrand, brands, switchBrand]);

  const [tab, setTab]             = useState("completed");
  const [viewMode, setViewMode]   = useState("table");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [hoveredPlatformFilter, setHoveredPlatformFilter] = useState(null);
  const [showCompose, setCompose] = useState(false);
  const [editingPost, setEditing] = useState(null);
  const [deletingPost, setDeleting] = useState(null);
  const [deleteLoading, setDelLoad] = useState(false);

  const today = new Date();
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [scheduled, setScheduled]           = useState([]);
  const [scheduledLoading, setSchedLoad]    = useState(false);
  const [history, setHistory]               = useState([]);
  const [historyLoading, setHistLoad]       = useState(false);
  const [historyPage, setHistoryPage]       = useState(1);
  const [historyTotal, setHistoryTotal]     = useState(0);
  const [cancellingId, setCancellingId]     = useState(null);
  const [error, setError]                   = useState("");
  const PAGE_SIZE = 20;

  const loadScheduled = useCallback(async () => {
    if (!effectiveBrand?.slug) return;
    setSchedLoad(true); setError("");
    try {
      const res = await api.get("/post/scheduled");
      const data = res.data;
      setScheduled(Array.isArray(data) ? data : (data?.posts ?? data?.items ?? []));
    } catch { setError("Failed to load scheduled posts."); }
    finally { setSchedLoad(false); }
  }, [effectiveBrand?.slug]);

  const loadHistory = useCallback(async (page = 1) => {
    if (!effectiveBrand?.slug) return;
    setHistLoad(true); setError("");
    try {
      const res  = await api.get("/post/history", { params: { page, pageSize: PAGE_SIZE } });
      const data = res.data;
      if (Array.isArray(data)) { setHistory(data); setHistoryTotal(data.length); }
      else { setHistory(data.posts ?? data.items ?? []); setHistoryTotal(data.total ?? data.totalCount ?? 0); }
      setHistoryPage(page);
    } catch { setError("Failed to load post history."); }
    finally { setHistLoad(false); }
  }, [effectiveBrand?.slug]);

  useEffect(() => { loadScheduled(); loadHistory(1); }, [loadScheduled, loadHistory]);

  const refresh = () => { loadScheduled(); loadHistory(historyPage); };

  const cancelPost = async (id) => {
    if (!window.confirm("Cancel this scheduled post?")) return;
    setCancellingId(id);
    try { await api.delete(`/post/scheduled/${id}`); setScheduled(prev => prev.filter(p => p.id !== id)); }
    catch { setError("Failed to cancel post."); }
    finally { setCancellingId(null); }
  };

  const confirmDelete = async () => {
    if (!deletingPost) return;
    setDelLoad(true);
    try {
      await api.delete(`/post/history/${deletingPost.id}`);
      setHistory(prev => prev.filter(p => p.id !== deletingPost.id));
      setDeleting(null);
    } catch { setError("Failed to delete post."); }
    finally { setDelLoad(false); }
  };

  const handleSaved = (id, newContent) => {
    setHistory(prev => prev.map(p => p.id === id ? { ...p, content: newContent } : p));
  };

  const filterByPlatform = useCallback((posts) => {
    if (platformFilter === "All") return posts;
    return posts.filter(post => getPostPlatforms(post).includes(platformFilter));
  }, [platformFilter]);

  const completed = history.filter(p => p.status === "Completed");
  const failed    = history.filter(p => p.status === "Failed");
  const allPosts  = [...scheduled, ...history];
  const filteredCompleted = filterByPlatform(completed);
  const filteredFailed    = filterByPlatform(failed);
  const filteredScheduled = filterByPlatform(scheduled);
  const filteredAllPosts  = filterByPlatform(allPosts);

  const counts = { completed: completed.length, scheduled: scheduled.length, failed: failed.length };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-3 space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Posts</h1>
            {!effectiveBrand && !brandLoading && (
              <p className="text-xs text-amber-600 mt-0.5">No brand found — please create a brand first.</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
              <button onClick={() => setViewMode("table")} title="Table view"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "table" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
                ☰ Table
              </button>
              <button onClick={() => setViewMode("calendar")} title="Calendar view"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "calendar" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
                📅 Calendar
              </button>
            </div>
            <button onClick={() => setCompose(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-all shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Compose
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">⚠️ {error}</div>}

        {/* Tabs */}
        <div className="flex items-center gap-0.5 border-b border-gray-200">
          {STATUS_TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all ${tab === t.key ? "border-blue-600 text-blue-600 bg-blue-50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}>
              <StatusTabIcon type={t.icon} cls={`w-4 h-4 ${t.iconColor}`} />
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${t.badge}`}>{counts[t.key]}</span>
            </button>
          ))}
          <button onClick={refresh} className="ml-auto mb-1 px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-1 transition-all">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>

        {/* Platform filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {PLATFORM_FILTER_OPTIONS.map(option => {
            const active = platformFilter === option.key;
            const hovered = hoveredPlatformFilter === option.key;
            return (
              <button
                key={option.key}
                onClick={() => setPlatformFilter(option.key)}
                onMouseEnter={() => setHoveredPlatformFilter(option.key)}
                onMouseLeave={() => setHoveredPlatformFilter(null)}
                onBlur={() => setHoveredPlatformFilter(null)}
                className={`relative overflow-hidden px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${option.border}`}
              >
                <span
                  className={`pointer-events-none absolute inset-0 ${option.fill} ${active ? "transition-none" : "transition-transform duration-700 ease-in-out"} ${(active || hovered) ? "scale-x-100 origin-left" : "scale-x-0 origin-left"}`}
                />
                <span className={`relative z-10 transition-colors duration-200 ${(active || hovered) ? "text-white" : option.text}`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {viewMode === "calendar" ? (
          <CalendarView year={calYear} month={calMonth}
            onPrev={() => { if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11); } else setCalMonth(m => m-1); }}
            onNext={() => { if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0); } else setCalMonth(m => m+1); }}
            onPrevYear={() => setCalYear(y => y - 1)}
            onNextYear={() => setCalYear(y => y + 1)}
            onSetYear={(y) => { setCalYear(y); if (y === new Date().getFullYear()) setCalMonth(new Date().getMonth()); }}
            posts={filteredAllPosts} tab={tab} />
        ) : (
          <>
            {/* Published / Failed — table */}
            {(tab === "completed" || tab === "failed") && (
              historyLoading ? <LoadingCard /> :
              (tab === "completed" ? filteredCompleted : filteredFailed).length === 0
                ? <EmptyCard
                    icon={tab === "completed" ? "✅" : "❌"}
                    msg={tab === "completed"
                      ? (platformFilter === "All" ? "No published posts yet." : `No published ${platformFilter} posts yet.`)
                      : (platformFilter === "All" ? "No failed posts." : `No failed ${platformFilter} posts.`)}
                  />
                : <PostTable posts={tab === "completed" ? filteredCompleted : filteredFailed} onEdit={setEditing} onDelete={setDeleting} />
            )}

            {/* Scheduled — card list */}
            {tab === "scheduled" && (
              scheduledLoading ? <LoadingCard /> :
              filteredScheduled.length === 0
                ? <EmptyCard icon="🗓" msg={platformFilter === "All" ? "No scheduled posts." : `No scheduled ${platformFilter} posts.`} />
                :
              <div className="space-y-2">
                {filteredScheduled.map(post => (
                  <ScheduledCard key={post.id} post={post} cancellingId={cancellingId} onCancel={cancelPost} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {(tab === "completed" || tab === "failed") && historyTotal > PAGE_SIZE && (
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <span>{historyTotal} total posts</span>
                <div className="flex gap-2">
                  <button disabled={historyPage <= 1} onClick={() => loadHistory(historyPage-1)} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
                  <span className="px-3 py-1.5">Page {historyPage}</span>
                  <button disabled={historyPage * PAGE_SIZE >= historyTotal} onClick={() => loadHistory(historyPage+1)} className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setCompose(true)} title="Compose post"
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center z-40">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>

      {showCompose && <ComposeModal activeBrand={effectiveBrand} onClose={() => setCompose(false)} onPosted={({ scheduled } = {}) => { setTimeout(refresh, 500); if (scheduled) setTab("scheduled"); }} />}
      {editingPost && <EditPostModal post={editingPost} onClose={() => setEditing(null)} onSaved={handleSaved} />}

      {/* Delete confirmation */}
      {deletingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleting(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Delete Post?</h3>
              <p className="text-xs text-gray-500 mb-4">This will remove it from your history and attempt to delete it from the platform.</p>
              <p className="text-xs text-gray-700 bg-gray-50 rounded-lg p-2 mb-4 line-clamp-2">{deletingPost.content || "No caption"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleting(null)} className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={deleteLoading}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-300 transition-colors">
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingCard() {
  return <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm animate-pulse">Loading…</div>;
}
function EmptyCard({ icon, msg }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm">{msg}</p>
    </div>
  );
}
