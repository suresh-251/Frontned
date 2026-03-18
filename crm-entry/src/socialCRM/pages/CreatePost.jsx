import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/apiClient";
import { useBrand } from "../context/BrandContext";
import { connectPlatform } from "../api/auth.api";
import { saveDraft as apiSaveDraft } from "../api/unified.post.api";
import { getBestPostingTimes } from "../api/analytics.api";
import { useNavigate } from "react-router-dom";

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

// ── Toast container ──────────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none" style={{ maxWidth: "360px", width: "90vw" }}>
      {toasts.map(t => (
        <div key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto ${
          t.type === "success" ? "bg-green-50 border-green-200 text-green-800" :
          t.type === "error"   ? "bg-red-50   border-red-200   text-red-800"   :
          t.type === "info"    ? "bg-blue-50  border-blue-200  text-blue-800"  :
                                 "bg-gray-50  border-gray-200  text-gray-800"
        }`}>
          <span className="text-lg shrink-0">{t.icon}</span>
          <div className="flex-1 min-w-0">
            {t.title && <p className="text-sm font-bold">{t.title}</p>}
            <p className="text-sm">{t.message}</p>
            {t.details?.map((d, i) => (
              <p key={i} className="text-xs opacity-70 mt-0.5 truncate">· {d}</p>
            ))}
          </div>
          <button onClick={() => onDismiss(t.id)} className="opacity-50 hover:opacity-100 shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Per-platform account dropdown ────────────────────────────────────────────
function PlatformDropdown({ platform, accounts, selected, onToggle, onToggleAll }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const meta = PLATFORM_META[platform] ?? PLATFORM_META.Facebook;
  const selectedCount = accounts.filter(a => selected.has(a.pageIdentifier)).length;
  const allSelected   = accounts.length > 0 && accounts.every(a => selected.has(a.pageIdentifier));

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
          selectedCount > 0
            ? `${meta.bg} ${meta.color} ${meta.border}`
            : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
        }`}
      >
        <PlatformSvg p={platform} cls="w-3.5 h-3.5" />
        <span>{platform}</span>
        {selectedCount > 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.badge}`}>{selectedCount}</span>
        )}
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-56 bg-white rounded-xl border border-gray-200 shadow-xl z-30 overflow-hidden">
          <div className={`px-3 py-2 flex items-center justify-between border-b border-gray-100 ${meta.bg}`}>
            <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
            <button
              onClick={() => onToggleAll(accounts, !allSelected)}
              className={`text-[10px] font-medium ${meta.color} hover:underline`}
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>
          <div className="py-1">
            {accounts.map(acc => (
              <label key={acc.pageIdentifier} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(acc.pageIdentifier)}
                  onChange={() => onToggle(acc.pageIdentifier)}
                  className="w-3.5 h-3.5 accent-blue-600"
                />
                <img
                  src={acc.profilePictureUrl
                    || (platform === "Facebook" && acc.pageIdentifier ? `https://graph.facebook.com/${acc.pageIdentifier}/picture?type=small` : null)}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                  onError={e => { e.target.style.display = "none"; }}
                  style={(!acc.profilePictureUrl && platform !== "Facebook") ? { display: "none" } : undefined}
                />
                {!acc.profilePictureUrl && platform !== "Facebook" && (
                  <PlatformSvg p={platform} cls="w-4 h-4 shrink-0 text-gray-400" />
                )}
                <span className="text-sm text-gray-800 truncate flex-1">{acc.displayName || acc.pageIdentifier}</span>
                {!acc.isActive && <span className="text-[10px] text-gray-400">inactive</span>}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Exit confirmation modal ──────────────────────────────────────────────────
function ExitModal({ saving, onSaveDraft, onLeave, onStay }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onStay} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">📝</span>
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">Save your work?</h3>
        <p className="text-sm text-gray-500 mb-5">You have unsaved content. Save as a draft before leaving?</p>
        <div className="flex flex-col gap-2">
          <button onClick={onSaveDraft} disabled={saving}
            className="w-full px-4 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition-colors">
            {saving ? "Saving…" : "💾 Save as Draft & Leave"}
          </button>
          <button onClick={onLeave}
            className="w-full px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
            Leave Without Saving
          </button>
          <button onClick={onStay}
            className="w-full px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
            Stay on Page
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function CreatePost() {
  const { activeBrand } = useBrand();
  const navigate = useNavigate();

  const [mode, setMode]               = useState("Text");
  const [content, setContent]         = useState("");
  const [files, setFiles]             = useState([]);
  const [documentTitle, setDocumentTitle] = useState("");

  const [accounts, setAccounts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(new Set());

  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [bestTimes, setBestTimes] = useState(null);
  const [bestTimesLoading, setBestTimesLoading] = useState(false);

  const [posting, setPosting]         = useState(false);
  const [error, setError]             = useState("");

  // Toast system
  const [toasts, setToasts] = useState([]);
  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Exit guard state
  const [showExitModal, setShowExitModal] = useState(false);
  const [savingDraftForExit, setSavingDraftForExit] = useState(false);

  const isDirty = content.trim().length > 0 || files.length > 0;
  const normPlatform = (p) => ({ facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn" }[(p ?? "").toLowerCase()] ?? p);
  const currentType = POST_TYPES.find(t => t.key === mode);

  const loadAccounts = useCallback(async () => {
    if (!activeBrand?.slug) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get(`/brands/${activeBrand.slug}/accounts`);
      const raw = res.data.accounts ?? [];
      setAccounts(raw.map(a => ({
        platform:          normPlatform(a.platform),
        pageIdentifier:    a.pageIdentifier,
        displayName:       a.displayName,
        profilePictureUrl: a.profilePictureUrl,
        isActive:          a.isActive,
      })));
    } catch { setAccounts([]); }
    finally { setLoading(false); }
  }, [activeBrand?.slug]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { setFiles([]); }, [mode]);

  // Fetch best posting times when scheduling is enabled
  useEffect(() => {
    if (!scheduleEnabled || bestTimes) return;
    let cancelled = false;
    setBestTimesLoading(true);
    getBestPostingTimes(30)
      .then(data => { if (!cancelled) setBestTimes(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setBestTimesLoading(false); });
    return () => { cancelled = true; };
  }, [scheduleEnabled]);

  // beforeunload — catch browser close / F5
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // popstate — catch browser back button
  useEffect(() => {
    if (!isDirty) return;
    window.history.pushState(null, "", window.location.href);
    const handler = () => {
      window.history.pushState(null, "", window.location.href);
      setShowExitModal(true);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [isDirty]);

  const byPlatform = accounts.reduce((acc, a) => {
    (acc[a.platform] = acc[a.platform] || []).push(a);
    return acc;
  }, {});

  const toggle = (pid) =>
    setSelected(prev => { const s = new Set(prev); s.has(pid) ? s.delete(pid) : s.add(pid); return s; });
  const togglePlatform = (pAccounts, check) =>
    setSelected(prev => {
      const s = new Set(prev);
      pAccounts.forEach(a => check ? s.add(a.pageIdentifier) : s.delete(a.pageIdentifier));
      return s;
    });

  const selectedAccounts = accounts.filter(a => selected.has(a.pageIdentifier));

  const handleFileChange = (e) =>
    setFiles(currentType?.multi ? Array.from(e.target.files) : e.target.files[0] ? [e.target.files[0]] : []);

  const buildFormData = () => {
    const platforms = [...new Set(selectedAccounts.map(a => a.platform))];
    const form = new FormData();
    platforms.forEach(p => form.append("Platforms", p));
    selectedAccounts.forEach(a => form.append("TargetAccountIds", a.pageIdentifier));
    form.append("Type", mode);
    form.append("Content", content || "");
    files.forEach(f => form.append("MediaFiles", f));
    if (documentTitle) form.append("DocumentTitle", documentTitle);
    return form;
  };

  const submit = async () => {
    if (!selected.size)                               { setError("Select at least one account"); return; }
    if (currentType?.needsMedia && !files.length)     { setError(`Select a file for ${mode} post`); return; }
    if (mode === "Document" && !documentTitle.trim()) { setError("Enter a document title"); return; }
    if (scheduleEnabled && !scheduledAt)              { setError("Pick a scheduled date/time"); return; }

    setPosting(true); setError("");
    const form = buildFormData();
    if (scheduleEnabled && scheduledAt) form.append("ScheduledAt", new Date(scheduledAt).toISOString());

    try {
      const res = await api.post("/post", form, {
        headers: { "Content-Type": "multipart/form-data", "X-Brand-Id": activeBrand?.slug }
      });
      const data = res.data;

      if (data?.scheduled) {
        addToast({
          type: "info", icon: "📅",
          title: "Post Scheduled!",
          message: data.message || `Scheduled for ${new Date(scheduledAt).toLocaleString()}`,
        });
        setScheduleEnabled(false); setScheduledAt("");
      } else {
        const results = Array.isArray(data) ? data : [];
        const successes = results.filter(r => r.success);
        const failures  = results.filter(r => !r.success);
        if (successes.length > 0) {
          addToast({
            type: "success", icon: "✅",
            title: `Published to ${successes.length} account${successes.length !== 1 ? "s" : ""}`,
            details: successes.map(r => r.targetAccountName || r.targetAccountId),
          });
        }
        if (failures.length > 0) {
          addToast({
            type: "error", icon: "❌",
            title: `Failed on ${failures.length} account${failures.length !== 1 ? "s" : ""}`,
            details: failures.map(r => `${r.targetAccountName || r.targetAccountId}: ${r.message || "error"}`),
          });
        }
      }
      // Clear form on any post attempt
      setContent(""); setFiles([]); setSelected(new Set()); setDocumentTitle("");
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const doSaveDraft = async () => {
    if (!content.trim() && !files.length) return;
    const form = buildFormData();
    await apiSaveDraft(form);
  };

  const handleSaveDraftAndLeave = async () => {
    setSavingDraftForExit(true);
    try {
      await doSaveDraft();
    } catch { /* silent — leave anyway */ }
    finally {
      setSavingDraftForExit(false);
      setShowExitModal(false);
      navigate(-1);
    }
  };

  const minDateTime = (() => {
    const d = new Date(Date.now() + 2 * 60000);
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  if (!activeBrand) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <p className="text-gray-400 text-sm">No active brand — please select or create a brand first.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {showExitModal && (
        <ExitModal
          saving={savingDraftForExit}
          onSaveDraft={handleSaveDraftAndLeave}
          onLeave={() => { setShowExitModal(false); navigate(-1); }}
          onStay={() => setShowExitModal(false)}
        />
      )}

      <div className="max-w-3xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Post</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Posting as <span className="font-semibold text-gray-700">{activeBrand.name}</span>
              <span className="ml-2 inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />Active
              </span>
            </p>
          </div>
        </div>

        {/* Composer */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">

          {/* ── Post to: platform dropdowns ── */}
          <div className="border-b border-gray-100 px-4 pt-4 pb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Post to</p>
            {loading ? (
              <div className="text-sm text-gray-400 animate-pulse">Loading accounts…</div>
            ) : accounts.length === 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-400">No accounts connected.</span>
                <button onClick={() => connectPlatform("facebook")} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium">+ Facebook / Instagram</button>
                <button onClick={() => connectPlatform("linkedin")} className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium">+ LinkedIn</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(byPlatform).map(([platform, accs]) => (
                  <PlatformDropdown
                    key={platform} platform={platform} accounts={accs}
                    selected={selected} onToggle={toggle} onToggleAll={togglePlatform}
                  />
                ))}
                {selected.size > 0 && (
                  <span className="text-xs text-gray-400 ml-1">
                    {selected.size} account{selected.size !== 1 ? "s" : ""} selected
                  </span>
                )}
                <div className="ml-auto flex gap-1.5">
                  <button onClick={() => connectPlatform("facebook")} className="text-xs px-2 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100">+ FB/IG</button>
                  <button onClick={() => connectPlatform("linkedin")} className="text-xs px-2 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100">+ LI</button>
                </div>
              </div>
            )}
          </div>

          {/* ── Post type ── */}
          <div className="border-b border-gray-100 px-4 pt-3 pb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Post Type</p>
            <div className="flex flex-wrap gap-1.5">
              {POST_TYPES.map(t => (
                <button key={t.key} onClick={() => setMode(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border-2 ${
                    mode === t.key
                      ? "bg-blue-50 text-blue-600 border-blue-500"
                      : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
            {currentType?.platforms && (
              <p className="mt-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md inline-block">
                ⚠️ Only available on: {currentType.platforms.join(", ")}
              </p>
            )}
          </div>

          {/* ── Content ── */}
          <div className="p-4 space-y-3">
            <textarea
              rows={6}
              placeholder="What would you like to share?"
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full text-gray-900 text-base resize-none border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400"
            />

            {mode === "Document" && (
              <input
                type="text"
                placeholder="Document title (required)"
                value={documentTitle}
                onChange={e => setDocumentTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            )}

            {currentType?.needsMedia && (
              <label className="block cursor-pointer">
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${files.length > 0 ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"}`}>
                  {files.length > 0 ? (
                    <div>
                      <p className="text-green-600 font-medium">✓ {files.length === 1 ? files[0].name : `${files.length} files selected`}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-1">{mode === "Document" ? "📄" : (mode === "Reel" || mode === "Video") ? "🎥" : "🖼️"}</div>
                      <p className="text-sm text-gray-500">{mode === "Carousel" ? "Select multiple images" : `Select ${mode.toLowerCase()} file`}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{currentType.accept}</p>
                    </div>
                  )}
                </div>
                <input type="file" accept={currentType.accept} multiple={currentType.multi} onChange={handleFileChange} className="hidden" />
              </label>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-lg text-sm">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* ── Schedule + Footer ── */}
          <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50 rounded-b-2xl">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => { setScheduleEnabled(v => !v); if (scheduleEnabled) setScheduledAt(""); }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${scheduleEnabled ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${scheduleEnabled ? "translate-x-4.5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Schedule for later</span>
              </label>
              {scheduleEnabled && (
                <input
                  type="datetime-local"
                  min={minDateTime}
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
              )}
            </div>

            {/* Best time suggestions */}
            {scheduleEnabled && (
              <div className="bg-white border border-blue-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Suggested times (based on your engagement data)
                </p>
                {bestTimesLoading ? (
                  <p className="text-xs text-gray-400 animate-pulse">Analyzing your best posting times...</p>
                ) : bestTimes?.slots?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {bestTimes.slots.slice(0, 6).map((slot, i) => {
                      const applySlot = () => {
                        const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
                        const now = new Date();
                        const targetDay = dayMap[slot.day] ?? 0;
                        const diff = (targetDay - now.getDay() + 7) % 7 || 7;
                        const target = new Date(now);
                        target.setDate(now.getDate() + diff);
                        target.setHours(slot.hour, 0, 0, 0);
                        if (target <= now) target.setDate(target.getDate() + 7);
                        const pad = n => String(n).padStart(2, "0");
                        setScheduledAt(`${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`);
                      };
                      return (
                        <button key={i} type="button" onClick={applySlot}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors group">
                          <span className="text-[10px] font-bold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded group-hover:bg-blue-200">
                            {Math.round(slot.score)}
                          </span>
                          <span className="text-xs font-medium text-blue-800">
                            {slot.day.slice(0, 3)} {slot.hour.toString().padStart(2, "0")}:00
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No engagement data yet. Post a few times and check back!</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-gray-400">
                {selected.size > 0
                  ? `${selected.size} account${selected.size !== 1 ? "s" : ""} selected`
                  : "No accounts selected"}
              </p>
              <button
                onClick={submit}
                disabled={posting || !selected.size}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm shadow-sm"
              >
                {posting ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>{scheduleEnabled ? "Scheduling…" : "Posting…"}</>
                ) : scheduleEnabled ? "📅 Schedule Post" : "🚀 Post Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
