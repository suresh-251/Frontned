import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/apiClient";
import { useBrand } from "../context/BrandContext";
import { connectPlatform } from "../api/auth.api";

const POST_TYPES = [
  { key: "Text",     label: "📝 Text",     needsMedia: false, multi: false },
  { key: "Image",    label: "🖼️ Image",    needsMedia: true,  multi: false, accept: "image/*" },
  { key: "Carousel", label: "�� Carousel", needsMedia: true,  multi: true,  accept: "image/*" },
  { key: "Video",    label: "🎥 Video",    needsMedia: true,  multi: false, accept: "video/*" },
  { key: "Reel",     label: "🎬 Reel",     needsMedia: true,  multi: false, accept: "video/*",        platforms: ["Facebook","Instagram"] },
  { key: "Story",    label: "⚡ Story",    needsMedia: true,  multi: false, accept: "image/*,video/*", platforms: ["Facebook","Instagram"] },
  { key: "Document", label: "📄 Document", needsMedia: true,  multi: false, accept: ".pdf",            platforms: ["LinkedIn"] },
];

const PLATFORM_META = {
  Facebook:  { color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",  badge: "bg-blue-100 text-blue-700",   icon: "FB",  label: "Facebook Pages"      },
  Instagram: { color: "text-pink-600",   bg: "bg-pink-50",   border: "border-pink-200",  badge: "bg-pink-100 text-pink-700",   icon: "IG",  label: "Instagram Accounts"  },
  LinkedIn:  { color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700", icon: "LI", label: "LinkedIn Pages"     },
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

export default function CreatePost() {
  const { activeBrand } = useBrand();

  const [mode, setMode] = useState("Text");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [documentTitle, setDocumentTitle] = useState("");

  const [accounts, setAccounts] = useState([]);   // flat list for active brand
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set()); // Set<pageIdentifier>

  // Scheduling
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  const [posting, setPosting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const normPlatform = (p) => { const m = {"facebook":"Facebook","instagram":"Instagram","linkedin":"LinkedIn"}; return m[(p??"").toLowerCase()] ?? p; };
  const currentType = POST_TYPES.find(t => t.key === mode);

  // Load accounts scoped to the active brand.
  // The brands endpoint already resolves real IG usernames server-side via the Graph API.
  const loadAccounts = useCallback(async () => {
    if (!activeBrand?.slug) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get(`/brands/${activeBrand.slug}/accounts`);
      const raw = res.data.accounts ?? [];
      setAccounts(raw.map(a => ({
        platform:       normPlatform(a.platform),
        pageIdentifier: a.pageIdentifier,
        displayName:    a.displayName,
        isActive:       a.isActive,
        brandId:        a.brandId,
        isSubscribed:   a.isSubscribed,
      })));
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [activeBrand?.slug]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { setFiles([]); }, [mode]);

  // Build a lookup map so post results can show correct account names
  const accountsMap = new Map(accounts.map(a => [a.pageIdentifier, a]));

  // Group accounts by platform
  const byPlatform = accounts.reduce((acc, a) => {
    const p = normPlatform(a.platform);
    (acc[p] = acc[p] || []).push({ ...a, platform: p });
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

  const submit = async () => {
    if (!selected.size) { setError("Select at least one account"); return; }
    if (currentType?.needsMedia && !files.length) { setError(`Select a file for ${mode} post`); return; }
    if (mode === "Document" && !documentTitle.trim()) { setError("Enter a document title"); return; }
    if (scheduleEnabled && !scheduledAt) { setError("Pick a scheduled date/time"); return; }

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
        headers: { "Content-Type": "multipart/form-data", "X-Brand-Id": activeBrand?.slug }
      });
      setResults(res.data);
      if (!scheduleEnabled) { setContent(""); setFiles([]); setSelected(new Set()); }
    } catch (e) {
      setError(e.response?.data?.message || "Failed to post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  // ---- Scheduled time min = now+2min in LOCAL time (datetime-local expects local, not UTC) ----
  const minDateTime = (() => {
    const d = new Date(Date.now() + 2 * 60000);
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Post</h1>
            {activeBrand && (
              <p className="text-sm text-gray-500 mt-0.5">
                Posting as <span className="font-semibold text-gray-700">{activeBrand.name}</span>
                <span className="ml-2 inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>Active
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ========== LEFT: Account selection ========== */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Select Accounts</span>
                {selected.size > 0 && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">{selected.size} selected</span>
                )}
              </div>

              {!activeBrand ? (
                <div className="p-6 text-center text-gray-400 text-sm">No active brand. Activate a brand first.</div>
              ) : loading ? (
                <div className="p-6 text-center text-gray-400 text-sm animate-pulse">Loading accounts...</div>
              ) : accounts.length === 0 ? (
                <div className="p-5 text-center">
                  <p className="text-sm text-gray-500 mb-3">No accounts connected to <strong>{activeBrand.name}</strong></p>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => connectPlatform("facebook")} className="text-sm px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium">Connect Facebook / Instagram</button>
                    <button onClick={() => connectPlatform("linkedin")} className="text-sm px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium">Connect LinkedIn</button>
                  </div>
                </div>
              ) : (
                <div className="p-3 space-y-4">
                  {Object.entries(byPlatform).map(([platform, pAccounts]) => {
                    const meta = PLATFORM_META[platform] ?? PLATFORM_META.Facebook;
                    const allChecked = pAccounts.every(a => selected.has(a.pageIdentifier));
                    const someChecked = pAccounts.some(a => selected.has(a.pageIdentifier));
                    return (
                      <div key={platform}>
                        {/* Platform header */}
                        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${meta.bg}`}>
                          <PlatformSvg p={platform} cls={`w-4 h-4 ${meta.color}`} />
                          <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
                          <button
                            onClick={() => togglePlatform(pAccounts, !allChecked)}
                            className={`ml-auto text-xs font-medium ${meta.color} hover:underline`}
                          >
                            {allChecked ? "Deselect all" : "Select all"}
                          </button>
                        </div>
                        {/* Accounts */}
                        <div className="mt-1 space-y-0.5 pl-1">
                          {pAccounts.map(acc => (
                            <label key={acc.pageIdentifier} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={selected.has(acc.pageIdentifier)}
                                onChange={() => toggle(acc.pageIdentifier)}
                                className="w-4 h-4 rounded accent-blue-600"
                              />
                              <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${meta.badge}`}>{meta.icon}</span>
                              <span className="text-sm text-gray-800 truncate">{acc.displayName || acc.pageIdentifier}</span>
                              {!acc.isActive && <span className="ml-auto text-[10px] text-gray-400">inactive</span>}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Connect more */}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2 px-1">Connect more accounts</p>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      <button onClick={() => connectPlatform("facebook")} className="text-xs px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 font-medium">+ Facebook</button>
                      <button onClick={() => connectPlatform("facebook")} className="text-xs px-2.5 py-1.5 bg-pink-50 text-pink-600 rounded-md hover:bg-pink-100 font-medium">+ Instagram</button>
                      <button onClick={() => connectPlatform("linkedin")} className="text-xs px-2.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 font-medium">+ LinkedIn</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Selected summary */}
            {selectedAccounts.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Will post to</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAccounts.map(a => {
                    const meta = PLATFORM_META[a.platform] ?? PLATFORM_META.Facebook;
                    return (
                      <span key={a.pageIdentifier} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium ${meta.bg} ${meta.color} ${meta.border}`}>
                        <PlatformSvg p={a.platform} cls="w-3 h-3" />
                        {a.displayName?.split(" ").slice(0, 2).join(" ") || a.pageIdentifier}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ========== RIGHT: Composer ========== */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200">

              {/* Post type tabs */}
              <div className="border-b border-gray-200 px-4 pt-4 pb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Post Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {POST_TYPES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setMode(t.key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border-2 ${
                        mode === t.key
                          ? "bg-blue-50 text-blue-600 border-blue-500"
                          : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100"
                      }`}
                    >
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

              {/* Content area */}
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
                          <div className="text-3xl mb-1">{mode === "Document" ? "📄" : mode === "Reel" || mode === "Video" ? "🎥" : "🖼️"}</div>
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

              {/* Scheduling + Footer */}
              <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50 rounded-b-2xl">

                {/* Schedule toggle */}
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

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {selected.size > 0
                      ? `${selected.size} account${selected.size > 1 ? "s" : ""} selected`
                      : "No accounts selected"}
                  </p>
                  <button
                    onClick={submit}
                    disabled={posting || !selected.size}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm shadow-sm"
                  >
                    {posting ? (
                      <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>{scheduleEnabled ? "Scheduling..." : "Posting..."}</>
                    ) : scheduleEnabled ? "📅 Schedule Post" : "🚀 Post Now"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== Results ========== */}
        {results && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Scheduled confirmation */}
            {results.scheduled ? (
              <div className="p-5 flex items-start gap-3 bg-blue-50 border-b border-blue-100">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-semibold text-blue-800">Post Scheduled!</p>
                  <p className="text-sm text-blue-600 mt-0.5">{results.message}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Post Results</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {(Array.isArray(results) ? results : []).map(r => (
                    <div key={r.targetAccountId} className={`flex items-center justify-between px-4 py-3 ${r.success ? "" : "bg-red-50"}`}>
                      <div className="flex items-center gap-3">
                        <span>{r.success ? "✅" : "❌"}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {accountsMap.get(r.targetAccountId)?.displayName || r.targetAccountName || r.targetAccountId}
                          </p>
                          <p className={`text-xs ${r.success ? "text-green-600" : "text-red-600"}`}>{r.message || r.status}</p>
                        </div>
                      </div>
                      {r.success && r.viewPostUrl && (
                        <a href={r.viewPostUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs font-medium hover:underline">View Post →</a>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


