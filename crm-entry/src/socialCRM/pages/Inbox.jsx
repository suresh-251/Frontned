// src/socialCRM/pages/Inbox.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import { useBrand } from "../context/BrandContext";
import { appCache } from "../utils/cache";

const inboxCacheKey = (slug) => `ph_inbox_${slug ?? "none"}`;
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  updateConversationStatus,
  syncInbox,
} from "../api/inbox.api";
import { useInboxHub } from "../hooks/useInboxHub";
import {
  FaPaperPlane, FaPaperclip, FaSearch, FaChevronDown, FaCheck,
  FaEllipsisV, FaArchive, FaTimes, FaRedo, FaSpinner, FaInbox,
  FaFacebook, FaInstagram, FaLinkedin, FaSmile, FaReply,
} from "react-icons/fa";

// ── Platform config ───────────────────────────────────────────────────────
const PSTYLE = {
  Facebook:  { bg: "bg-blue-100",  text: "text-blue-700",  borderL: "border-l-blue-500",  borderB: "border-b-blue-400",  ring: "ring-blue-200",  Icon: FaFacebook  },
  Instagram: { bg: "bg-pink-100",  text: "text-pink-600",  borderL: "border-l-pink-500",  borderB: "border-b-pink-400",  ring: "ring-pink-200",  Icon: FaInstagram },
  LinkedIn:  { bg: "bg-sky-100",   text: "text-sky-700",   borderL: "border-l-sky-500",   borderB: "border-b-sky-400",   ring: "ring-sky-200",   Icon: FaLinkedin  },
};
const ps = (platform) => PSTYLE[platform] ?? PSTYLE.Facebook;

const PLATFORM_FILTERS = ["All", "Facebook", "Instagram", "LinkedIn"];
const STATUS_FILTERS   = ["All", "Active", "Closed", "Archived"];

// ── Emoji categories ──────────────────────────────────────────────────────
const EMOJI_CATS = {
  "😊 Smileys":  ["😀","😂","😊","🥰","😍","😘","🤗","😎","🤩","😇","😉","😜","🤔","😏","😌","🥺","😢","😭","😤","🤯","🥳","😴","🤮","🤢","😈","🤡","💀","👻","👽","🤖"],
  "👍 Gestures": ["👍","👎","👏","🙌","🤝","✌️","🤞","🫶","❤️","🔥","💯","⭐","🎉","🎊","💪","🙏","💐","🌹","🌟","✨","💕","💖","💝","💗","💓","💞","💘","💌","❣️","♥️"],
  "🎯 Objects":  ["📱","💻","📸","🎯","🏆","🎁","📦","📢","📌","📎","🔗","⏰","🗓️","📊","📈","💡","🛒","🏷️","🎨","🎬","🎶","☀️","🌙","⚡","🌈","🍕","☕","🍰","🎂","🍀"],
};

function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);
  const [cat, setCat] = useState(Object.keys(EMOJI_CATS)[0]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute bottom-12 left-0 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
      <div className="flex gap-1 px-2 py-1.5 border-b border-gray-100 overflow-x-auto">
        {Object.keys(EMOJI_CATS).map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`text-xs px-2 py-1 rounded-lg whitespace-nowrap transition ${cat === c ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-500 hover:bg-gray-100"}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-10 gap-0.5 p-2 max-h-36 overflow-y-auto">
        {EMOJI_CATS[cat].map((e) => (
          <button key={e} onClick={() => onSelect(e)}
            className="w-7 h-7 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition">{e}</button>
        ))}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtFull(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── Sub-components ────────────────────────────────────────────────────────
function SentimentBadge({ sentiment }) {
  if (!sentiment) return null;
  const map = { positive: "bg-green-100 text-green-700", neutral: "bg-gray-100 text-gray-500", negative: "bg-red-100 text-red-600" };
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${map[sentiment] ?? map.neutral}`}>{sentiment}</span>;
}

function TagBadge({ tag }) {
  if (!tag) return null;
  const map = { inquiry: "bg-blue-100 text-blue-700", complaint: "bg-red-100 text-red-600", support: "bg-yellow-100 text-yellow-700", sale: "bg-purple-100 text-purple-700" };
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${map[tag] ?? "bg-gray-100 text-gray-500"}`}>{tag}</span>;
}

function ConvoMenu({ convo, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition">
        <FaEllipsisV size={10} />
      </button>
      {open && (
        <div className="absolute right-0 top-7 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5 w-36 text-xs overflow-hidden">
          <button onClick={() => { onStatusChange(convo.id, "Active"); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 transition">
            <FaRedo size={10} className="text-green-500" /> Reopen
          </button>
          <button onClick={() => { onStatusChange(convo.id, "Closed"); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 transition">
            <FaTimes size={10} className="text-gray-400" /> Mark Closed
          </button>
          <button onClick={() => { onStatusChange(convo.id, "Archived"); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 transition">
            <FaArchive size={10} className="text-gray-400" /> Archive
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function Inbox() {
  const { activeBrand } = useBrand();

  const [convos, setConvos]           = useState([]);
  const [dataSlug, setDataSlug]       = useState(activeBrand?.slug ?? null);
  const [messages, setMessages]       = useState({});
  // msgMeta tracks { page, hasMore, loading } per conversation id
  const [msgMeta, setMsgMeta]         = useState({});
  const [active, setActive]           = useState(null);
  const [reply, setReply]             = useState("");
  const [sending, setSending]         = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [hubStatus, setHubStatus]     = useState("offline");
  const [syncing, setSyncing]         = useState(false);
  const [syncResult, setSyncResult]   = useState(null); // { message, errors }

  const [platFilter, setPlatFilter]   = useState("All");
  const [statFilter, setStatFilter]   = useState("All");
  const [search, setSearch]           = useState("");
  const [filterOpen, setFilterOpen]   = useState(false);

  // Emoji, file upload, reply-to
  const [emojiOpen, setEmojiOpen]     = useState(false);
  const [replyTo, setReplyTo]         = useState(null); // { id, senderName, messageText }
  const [attachment, setAttachment]   = useState(null);  // File object
  const [attachPreview, setAttachPreview] = useState(null); // data URL for images

  const filterRef   = useRef(null);
  const bottomRef   = useRef(null);
  const topRef      = useRef(null);
  const textareaRef = useRef(null);
  const fileRef     = useRef(null);

  // Helper: fetch + store messages for a conversation
  const fetchMessages = useCallback(async (convoId, page = 1, prepend = false) => {
    const PAGE_SIZE = 50;
    try {
      const msgs = await getMessages(convoId, { page, pageSize: PAGE_SIZE });
      const arr = Array.isArray(msgs) ? msgs : (msgs?.items ?? []);
      setMessages((prev) => ({
        ...prev,
        [convoId]: prepend
          ? [...arr, ...(prev[convoId] ?? [])]
          : arr,
      }));
      setMsgMeta((prev) => ({
        ...prev,
        [convoId]: { page, hasMore: arr.length === PAGE_SIZE },
      }));
      return arr;
    } catch {
      setMessages((prev) => ({ ...prev, [convoId]: prev[convoId] ?? [] }));
      setMsgMeta((prev) => ({ ...prev, [convoId]: { page: 1, hasMore: false } }));
      return [];
    }
  }, []);

  // ── Reload conversations list ─────────────────────────────────────────
  const reloadConvos = useCallback(async () => {
    setLoadingConvos(true);
    try {
      const data = await getConversations();
      const items = data?.items ?? data;
      if (Array.isArray(items) && items.length > 0) {
        setConvos(items);
        const slug = activeBrand?.slug;
        if (slug) { appCache.set(inboxCacheKey(slug), items); setDataSlug(slug); }
        if (!active) {
          // Auto-select first conversation if none active
          const first = items[0];
          setActive(first);
          setLoadingMsgs(true);
          await fetchMessages(first.id, 1);
          setLoadingMsgs(false);
          try { await markConversationRead(first.id); } catch { /* offline */ }
        } else {
          // Refresh messages for the currently active conversation
          const stillExists = items.find((i) => i.id === active.id);
          if (stillExists) {
            setLoadingMsgs(true);
            await fetchMessages(active.id, 1);
            setLoadingMsgs(false);
          }
        }
      } else {
        setConvos([]);
      }
    } catch {
      setConvos([]);
    } finally {
      setLoadingConvos(false);
    }
  }, [active, fetchMessages, activeBrand?.slug]);

  // ── Sync from Facebook/Instagram ──────────────────────────────────────
  const runSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncInbox();
      setSyncResult({ message: result.message, errors: result.errors ?? [] });
      // Clear stale message cache so reloadConvos fetches fresh data
      setMessages({});
      setMsgMeta({});
      await reloadConvos();
    } catch (err) {
      setSyncResult({
        message: null,
        errors: [err?.response?.data?.message ?? "Sync failed. Check that Facebook/Instagram accounts are connected."],
      });
    } finally {
      setSyncing(false);
    }
  }, [syncing, reloadConvos]);

  // Load conversations: instant cache restore on brand switch, then background refresh
  useEffect(() => {
    const slug = activeBrand?.slug;
    let cancelled = false;

    // 1. Clear per-conversation state so old brand's messages don't bleed through
    setActive(null);
    setMessages({});
    setMsgMeta({});

    // 2. Instant restore from cache
    const cached = slug ? appCache.getStale(inboxCacheKey(slug)) : null;
    if (cached) {
      setConvos(cached.data);
      setDataSlug(slug);
      setLoadingConvos(false);
    } else {
      setConvos([]);
      setDataSlug(null);
      setLoadingConvos(true);
    }

    if (!slug) return;

    // Always fetch fresh data (cache shown above while this loads)
    setLoadingConvos(!cached);
    getConversations()
      .then(async (data) => {
        if (cancelled) return;
        const items = data?.items ?? data;
        const convList = Array.isArray(items) ? items : [];
        setConvos(convList);
        setDataSlug(slug);
        if (slug) appCache.set(inboxCacheKey(slug), convList);
        if (convList.length > 0) {
          const first = convList[0];
          setActive(first);
          setLoadingMsgs(true);
          await fetchMessages(first.id, 1);
          if (!cancelled) setLoadingMsgs(false);
          try { await markConversationRead(first.id); } catch { /* offline */ }
        }
      })
      .catch(() => { if (!cancelled) { setConvos([]); setDataSlug(slug); } })
      .finally(() => { if (!cancelled) setLoadingConvos(false); });

    return () => { cancelled = true; };
  }, [activeBrand?.slug, fetchMessages]);

  // Close filter dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages[active?.id]?.length]);

  // ── SignalR real-time ─────────────────────────────────────────────────
  const handleNewMessage = useCallback((msg) => {
    setMessages((prev) => ({
      ...prev,
      [msg.conversationId]: [...(prev[msg.conversationId] ?? []), msg],
    }));
    setConvos((prev) =>
      prev.map((c) =>
        c.id === msg.conversationId
          ? {
              ...c,
              lastMessage: msg.messageText,
              lastMessageTime: msg.timestamp,
              unreadCount: msg.direction === "Incoming" ? c.unreadCount + 1 : c.unreadCount,
            }
          : c
      )
    );
  }, []);

  const handleConversationUpdated = useCallback((conv) => {
    setConvos((prev) => {
      const exists = prev.some((c) => c.id === conv.id);
      return exists ? prev.map((c) => (c.id === conv.id ? { ...c, ...conv } : c)) : [conv, ...prev];
    });
  }, []);

  const handleMessageRead = useCallback((conversationId) => {
    setConvos((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
  }, []);

  const { joinConversation, leaveConversation } = useInboxHub({
    brandId: activeBrand?.id,
    onNewMessage: handleNewMessage,
    onConversationUpdated: handleConversationUpdated,
    onMessageRead: handleMessageRead,
    onConnected: setHubStatus,
  });

  // ── Open conversation ─────────────────────────────────────────────────
  const openConvo = async (c) => {
    if (active?.id === c.id) return;
    if (active) await leaveConversation(active.id);
    await joinConversation(c.id);

    setActive(c);
    setConvos((prev) => prev.map((x) => (x.id === c.id ? { ...x, unreadCount: 0 } : x)));

    // Load messages — always fetch fresh when switching conversations
    if (messages[c.id] === undefined || messages[c.id].length === 0) {
      setLoadingMsgs(true);
      await fetchMessages(c.id, 1);
      setLoadingMsgs(false);
    } else {
      // Silently refresh in background so newly synced messages appear
      fetchMessages(c.id, 1);
    }
    try { await markConversationRead(c.id); } catch { /* offline */ }
  };

  // ── Load older messages (paginate backwards) ──────────────────────────
  const loadOlderMessages = async () => {
    if (!active || loadingOlder) return;
    const meta = msgMeta[active.id] ?? { page: 1, hasMore: false };
    if (!meta.hasMore) return;
    setLoadingOlder(true);
    const prevScrollHeight = topRef.current?.parentElement?.scrollHeight ?? 0;
    await fetchMessages(active.id, meta.page + 1, true);
    setLoadingOlder(false);
    // Keep scroll position so user doesn't jump to top
    requestAnimationFrame(() => {
      const el = topRef.current?.parentElement;
      if (el) el.scrollTop = el.scrollHeight - prevScrollHeight;
    });
  };

  // ── Send reply ────────────────────────────────────────────────────────
  const send = async () => {
    if ((!reply.trim() && !attachment) || !active || sending) return;
    const text = reply.trim();
    const quotedText = replyTo ? `↩ ${replyTo.senderName}: "${replyTo.messageText?.slice(0, 80)}"\n\n${text}` : text;
    setReply("");
    setReplyTo(null);
    setSending(true);

    // If there's an attachment, upload first
    let attachmentUrl = null;
    if (attachment) {
      // For now, convert to base64 data URL for inline sending (or you could upload to server)
      attachmentUrl = attachPreview;
      setAttachment(null);
      setAttachPreview(null);
    }

    const optimistic = {
      id: Date.now(),
      conversationId: active.id,
      senderName: "You",
      messageText: quotedText,
      direction: "Outgoing",
      status: "Sent",
      isRead: true,
      timestamp: new Date().toISOString(),
      attachments: attachmentUrl ? [{ id: Date.now(), fileType: "image", fileUrl: attachmentUrl }] : [],
    };
    setMessages((prev) => ({ ...prev, [active.id]: [...(prev[active.id] ?? []), optimistic] }));
    setConvos((prev) => prev.map((c) => (c.id === active.id ? { ...c, lastMessage: text } : c)));

    try {
      const saved = await sendMessage(active.id, { messageText: quotedText, attachmentUrl });
      setMessages((prev) => ({
        ...prev,
        [active.id]: (prev[active.id] ?? []).map((m) => (m.id === optimistic.id ? saved : m)),
      }));
    } catch { /* keep optimistic */ }
    finally { setSending(false); }
  };

  // ── File selection handler ──────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachment(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setAttachPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setAttachPreview(null);
    }
    textareaRef.current?.focus();
  };

  // ── Emoji insertion ─────────────────────────────────────────────────
  const insertEmoji = (emoji) => {
    const ta = textareaRef.current;
    if (!ta) { setReply((r) => r + emoji); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newVal = reply.slice(0, start) + emoji + reply.slice(end);
    setReply(newVal);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + emoji.length;
      ta.focus();
    });
  };

  const handleStatusChange = async (id, status) => {
    setConvos((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    try { await updateConversationStatus(id, status); } catch { /* offline */ }
  };

  // ── Filter ────────────────────────────────────────────────────────────
  // Guard: don't show stale convos from a previous brand during transition
  const _convos = dataSlug === activeBrand?.slug ? convos : [];

  const filteredConvos = _convos.filter(
    (c) =>
      (platFilter === "All" || c.platform === platFilter) &&
      (statFilter === "All" || c.status   === statFilter) &&
      (!search ||
        c.userName?.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMessage?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalUnread = _convos.reduce((s, c) => s + (c.unreadCount ?? 0), 0);
  const activeMsgs  = messages[active?.id] ?? [];
  const pStyle = ps(active?.platform);
  const PIcon  = pStyle.Icon;

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 120px)" }}>

      {/* ── Left Panel ──────────────────────────────────────────────── */}
      <div className="w-[420px] bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-sm shrink-0">

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">Inbox</h2>
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {totalUnread}
                </span>
              )}
              {/* Hub status dot */}
              <span
                title={`Realtime: ${hubStatus}`}
                className={`w-2 h-2 rounded-full ${hubStatus === "connected" ? "bg-green-500" : "bg-gray-300"}`}
              />
            </div>

            <div className="flex items-center gap-1.5">
              {/* Sync button */}
              <button
                onClick={runSync}
                disabled={syncing}
                title="Sync conversations from Facebook & Instagram"
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg transition disabled:opacity-50"
              >
                {syncing ? <FaSpinner size={9} className="animate-spin" /> : "↓"}
                {syncing ? "Syncing" : "Sync"}
              </button>

              {/* Filter dropdown */}
              <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen((o) => !o)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition"
              >
                {platFilter !== "All" ? platFilter : statFilter !== "All" ? statFilter : "Filter"}
                <FaChevronDown size={9} />
              </button>
              {filterOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden">
                  <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Platform</p>
                  {PLATFORM_FILTERS.map((pf) => {
                    const s = pf !== "All" ? ps(pf) : null;
                    return (
                      <button key={pf} onClick={() => setPlatFilter(pf)}
                        className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition">
                        <span className="flex items-center gap-2">
                          {s && <s.Icon size={11} className={s.text} />}
                          {pf}
                        </span>
                        {platFilter === pf && <FaCheck size={10} className="text-blue-600" />}
                      </button>
                    );
                  })}
                  <div className="border-t border-gray-100 mt-1">
                    <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</p>
                    {STATUS_FILTERS.map((sf) => (
                      <button key={sf} onClick={() => setStatFilter(sf)}
                        className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition">
                        {sf}
                        {statFilter === sf && <FaCheck size={10} className="text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>{/* end flex items-center gap-1.5 */}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50">
            <FaSearch size={11} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="flex-1 text-xs outline-none bg-transparent text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {/* Sync result banner */}
          {syncResult && (
            <div className={`mx-3 mt-2 mb-1 px-3 py-2 rounded-lg text-[11px] font-medium border ${
              syncResult.errors?.length > 0
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-green-50 border-green-200 text-green-700"
            }`}>
              {syncResult.message && <p>{syncResult.message}</p>}
              {syncResult.errors?.map((e, i) => <p key={i} className="text-red-600">{e}</p>)}
            </div>
          )}
          {loadingConvos && (
            <div className="flex justify-center py-10">
              <FaSpinner size={20} className="text-blue-500 animate-spin" />
            </div>
          )}
          {!loadingConvos && filteredConvos.map((c) => {
            const s = ps(c.platform);
            const CIcon = s.Icon;
            const isActive = active?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => openConvo(c)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-blue-50/40 transition-all border-l-[3px]
                  ${s.borderL} ${isActive ? `${s.bg}/40` : "border-opacity-50"}`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Avatar with platform-colored ring */}
                  <div className={`w-9 h-9 rounded-full ${s.bg} flex items-center justify-center shrink-0 mt-0.5 ring-2 ${s.ring}`}>
                    {c.userAvatar ? (
                      <img src={c.userAvatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <CIcon size={14} className={s.text} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-900 truncate">{c.userName}</span>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {c.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {c.unreadCount}
                          </span>
                        )}
                        <ConvoMenu convo={c} onStatusChange={handleStatusChange} />
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{c.lastMessage}</p>

                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                        {c.platform}
                      </span>
                      <TagBadge tag={c.tag} />
                      <SentimentBadge sentiment={c.sentiment} />
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      {c.assignedToUserName && (
                        <span className="text-[10px] text-gray-400">→ {c.assignedToUserName}</span>
                      )}
                      <span className="text-[10px] text-gray-300 ml-auto">{fmtTime(c.lastMessageTime)}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {!loadingConvos && filteredConvos.length === 0 && (
            <div className="py-10 flex flex-col items-center gap-3 px-4 text-center">
              <FaInbox size={28} className="text-gray-300" />
              {_convos.length === 0 ? (
                <>
                  <p className="text-xs font-medium text-gray-500">No conversations yet</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Pull your existing chats from Facebook and Instagram using the sync button below.
                  </p>
                  <button
                    onClick={runSync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-xl transition"
                  >
                    {syncing ? <><FaSpinner size={11} className="animate-spin" />Syncing…</> : "↓ Sync from Facebook / Instagram"}
                  </button>
                  {syncResult?.errors?.length > 0 && (
                    <p className="text-[11px] text-red-500 mt-1">{syncResult.errors[0]}</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400">No conversations match the filter.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel ──────────────────────────────────────────────── */}
      {active ? (
        <div className={`flex-1 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-sm min-w-0 ring-1 ${pStyle.ring}`}>

          {/* Conversation header */}
          <div className={`px-5 py-3 border-b-2 ${pStyle.borderB} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${pStyle.bg} flex items-center justify-center shrink-0`}>
                {active.userAvatar ? (
                  <img src={active.userAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <PIcon size={16} className={pStyle.text} />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{active.userName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${pStyle.bg} ${pStyle.text}`}>
                    {active.platform}
                  </span>
                  <TagBadge tag={active.tag} />
                  <SentimentBadge sentiment={active.sentiment} />
                  {active.status !== "Active" && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 font-medium px-1.5 py-0.5 rounded-full">
                      {active.status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {active.assignedToUserName && (
              <span className="text-xs text-gray-400 flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
                <span className="w-5 h-5 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                  {active.assignedToUserName[0]}
                </span>
                {active.assignedToUserName}
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50/30">
            {/* Load older messages button */}
            <div ref={topRef} className="flex justify-center pb-2">
              {msgMeta[active?.id]?.hasMore && (
                <button
                  onClick={loadOlderMessages}
                  disabled={loadingOlder}
                  className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-full transition"
                >
                  {loadingOlder
                    ? <><FaSpinner size={11} className="animate-spin" /> Loading older messages…</>
                    : "↑ Load older messages"}
                </button>
              )}
            </div>

            {loadingMsgs && (
              <div className="flex justify-center py-8">
                <FaSpinner size={20} className="text-blue-500 animate-spin" />
              </div>
            )}

            {activeMsgs.map((msg, i) => {
              const isMe = msg.direction === "Outgoing";
              const prevMsg = activeMsgs[i - 1];
              const showName = !isMe && msg.senderName !== prevMsg?.senderName;
              return (
                <div key={msg.id} className={`group flex ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <div className={`w-7 h-7 rounded-full ${pStyle.bg} flex items-center justify-center shrink-0 mr-2 mt-auto mb-0.5 text-[10px] font-bold ${pStyle.text}`}>
                      {msg.senderName?.[0] ?? "?"}
                    </div>
                  )}
                  <div className="max-w-sm space-y-0.5 relative">
                    {showName && (
                      <p className="text-[10px] text-gray-400 pl-1">{msg.senderName}</p>
                    )}

                    {/* Attachments */}
                    {msg.attachments?.map((att, ai) => (
                      <div key={ai} className="mb-1">
                        {att.fileType === "image" ? (
                          <img src={att.fileUrl} alt="attachment" className="max-w-[200px] rounded-xl border border-gray-200" />
                        ) : (
                          <a href={att.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            📎 Attachment
                          </a>
                        )}
                      </div>
                    ))}

                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-sm"
                        : `bg-white text-gray-800 rounded-bl-sm border shadow-sm ${
                            active?.platform === "Instagram" ? "border-pink-200" :
                            active?.platform === "LinkedIn"  ? "border-sky-200"  :
                            "border-blue-200"
                          }`
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.messageText}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200 text-right" : "text-gray-400"}`}>
                        {fmtFull(msg.timestamp)}
                        {isMe && msg.status === "Read"      && " ✓✓"}
                        {isMe && msg.status === "Delivered" && " ✓"}
                      </p>
                    </div>

                    {/* Reply button — appears on hover */}
                    <button
                      onClick={() => {
                        setReplyTo({ id: msg.id, senderName: msg.senderName ?? "User", messageText: msg.messageText });
                        textareaRef.current?.focus();
                      }}
                      className={`absolute ${isMe ? "-left-8" : "-right-8"} top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-blue-600 hover:border-blue-300 opacity-0 group-hover:opacity-100 transition-all`}
                      title="Reply"
                    >
                      <FaReply size={10} />
                    </button>
                  </div>
                </div>
              );
            })}

            {activeMsgs.length === 0 && !loadingMsgs && (
              <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
                <FaInbox size={28} className="text-gray-300" />
                <p className="text-sm">No messages yet. Send the first reply!</p>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Reply box */}
          <div className="px-5 py-3.5 border-t border-gray-100 bg-white">
            {/* Reply-to quote */}
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <FaReply size={10} className="text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-blue-700">{replyTo.senderName}</p>
                  <p className="text-[11px] text-gray-600 truncate">{replyTo.messageText}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600">
                  <FaTimes size={10} />
                </button>
              </div>
            )}

            {/* Attachment preview */}
            {attachment && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                {attachPreview ? (
                  <img src={attachPreview} alt="preview" className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500">
                    📎
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{attachment.name}</p>
                  <p className="text-[10px] text-gray-400">{(attachment.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={() => { setAttachment(null); setAttachPreview(null); }} className="text-gray-400 hover:text-red-500">
                  <FaTimes size={12} />
                </button>
              </div>
            )}

            <div className="flex gap-2 items-end">
              {/* Emoji button */}
              <div className="relative">
                <button onClick={() => setEmojiOpen((o) => !o)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-yellow-500 hover:bg-gray-100 rounded-xl border border-gray-200 transition shrink-0 mb-0.5">
                  <FaSmile size={14} />
                </button>
                {emojiOpen && <EmojiPicker onSelect={(e) => insertEmoji(e)} onClose={() => setEmojiOpen(false)} />}
              </div>

              {/* Paperclip / file upload */}
              <button onClick={() => fileRef.current?.click()}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition shrink-0 mb-0.5">
                <FaPaperclip size={13} />
              </button>
              <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileSelect} />

              <textarea
                ref={textareaRef}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder={`Reply on ${active.platform}… (Enter to send, Shift+Enter for new line)`}
                rows={2}
                className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none
                  focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-800 placeholder-gray-400
                  bg-gray-50 focus:bg-white transition"
              />
              <button
                onClick={send}
                disabled={(!reply.trim() && !attachment) || sending}
                className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
                  disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400
                  transition rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm mb-0.5"
              >
                {sending ? <FaSpinner size={13} className="animate-spin" /> : <FaPaperPlane size={13} />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 pl-10">
              Replying as your {active.platform} page
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm">
          <div className="text-center text-gray-400">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FaInbox size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}
