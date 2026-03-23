import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBrand } from "../context/BrandContext";
import { getBrandLogoSrc } from "../api/brand.api";
import { getUnreadCount, createInboxHubConnection } from "../api/inbox.api";
import { createLeadsHubConnection } from "../api/facebook.leads.api";
import { getAccountHealth } from "../api/auth.api";
import { useAuth } from "../../auth/AuthContext";
import toast from "react-hot-toast";

// ── Brand Switcher + Create Brand button ─────────────────────────────────────
function TopbarBrandSwitcher() {
  const { brands, activeBrand, switchBrand, addBrand } = useBrand();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [creating, setCreating] = useState(false);
  const ref = useRef(null);
  const createRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      if (createRef.current && !createRef.current.contains(e.target)) setShowCreate(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSwitch = async (slug) => {
    if (activeBrand?.slug === slug) { setOpen(false); return; }
    try { await switchBrand(slug); toast.success("Brand switched!"); } catch { toast.error("Failed to switch brand"); }
    setOpen(false);
  };

  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setCreating(true);
    try {
      await addBrand({ name: newBrandName.trim() });
      toast.success(`Brand "${newBrandName}" created!`);
      setNewBrandName("");
      setShowCreate(false);
    } catch {
      toast.error("Failed to create brand");
    } finally {
      setCreating(false);
    }
  };

  const initials = (name) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const needsBrandScroll = brands.length > 3;

  return (
    <div className="flex items-center gap-1 relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
        style={{ background: "var(--primary-light)", border: "1px solid var(--border-color)" }}>
        {activeBrand ? (
          <>
            <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-md"
              style={{ background: `linear-gradient(135deg, var(--logo-gradient-from), var(--logo-gradient-to))` }}>
              {getBrandLogoSrc(activeBrand)
                ? <img src={getBrandLogoSrc(activeBrand)} alt={activeBrand.name} className="w-5 h-5 object-cover" />
                : <span className="text-white text-[9px] font-bold">{initials(activeBrand.name)}</span>}
            </div>
            <span className="max-w-27.5 truncate text-sm font-semibold" style={{ color: "var(--primary-text)" }}>{activeBrand.name}</span>
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          </>
        ) : (
          <span className="text-sm font-medium text-yellow-700">No Brand</span>
        )}
        <svg className={`w-3.5 h-3.5 transition-transform duration-300 ease-out ${open ? "rotate-180" : ""}`} style={{ color: "var(--primary-text)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Create Brand button + dropdown */}
      <div className="relative" ref={createRef}>
        <button onClick={() => setShowCreate(!showCreate)}
          title="Create Brand"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed transition-all"
          style={{ borderColor: "var(--primary)", color: "var(--primary-text)" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {showCreate && (
          <div className="absolute top-full right-0 mt-2 w-72 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-hover)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Create Brand</p>
            </div>
            <form onSubmit={handleCreateBrand} className="p-4 flex flex-col gap-3">
              <input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Brand name"
                autoFocus
                className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-1"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-main)" }}
              />
              <button
                type="submit"
                disabled={creating || !newBrandName.trim()}
                className="w-full py-2 text-sm font-semibold rounded-lg transition-colors"
                style={{
                  background: creating || !newBrandName.trim() ? "#94a3b8" : "#4f46e5",
                  color: "#fff",
                  border: "none",
                  cursor: creating || !newBrandName.trim() ? "not-allowed" : "pointer",
                  opacity: creating || !newBrandName.trim() ? 0.6 : 1,
                }}
              >
                {creating ? "Creating..." : "Create Brand"}
              </button>
            </form>
          </div>
        )}
      </div>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-hover)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Your Brands</p>
            <button onClick={() => { setOpen(false); navigate("/crm/socialmedia/brands"); }} className="text-xs font-medium" style={{ color: "var(--primary-text)" }}>Manage</button>
          </div>
          <div
            className={needsBrandScroll
              ? "max-h-35 overflow-y-scroll overscroll-contain pr-1"
              : "overflow-visible"
            }
            style={needsBrandScroll ? { scrollbarWidth: "thin", scrollbarGutter: "stable both-edges" } : undefined}
          >
            {brands.length === 0 && <p className="px-4 py-3 text-sm text-center" style={{ color: "var(--text-secondary)" }}>No brands yet</p>}
            {brands.map(b => (
              <button key={b.slug} onClick={() => handleSwitch(b.slug)}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left"
                style={{ background: b.isActive ? "var(--primary-light)" : "transparent" }}
                onMouseEnter={(e) => { if (!b.isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { if (!b.isActive) e.currentTarget.style.background = "transparent"; }}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                  style={{ background: `linear-gradient(135deg, var(--logo-gradient-from), var(--logo-gradient-to))` }}>
                  {getBrandLogoSrc(b) ? <img src={getBrandLogoSrc(b)} alt={b.name} className="w-7 h-7 object-cover" /> : <span className="text-white text-[10px] font-bold">{initials(b.name)}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-main)" }}>{b.name}</p>
                  {b.description && <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{b.description}</p>}
                </div>
                {b.isActive && <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Active</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── User profile dropdown ────────────────────────────────────────────────────
function UserMenu() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const userName = auth?.user?.name || auth?.user?.unique_name || auth?.user?.email || "User";
  const initials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex h-10 items-center gap-2 rounded-xl p-1.5 transition"
        style={{ color: "var(--text-main)" }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: `linear-gradient(135deg, var(--logo-gradient-from), var(--logo-gradient-to))` }}>
          <span className="text-white text-sm font-bold">{initials}</span>
        </div>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <div className="px-4 py-3" style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--border-color)" }}>
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-main)" }}>{userName}</p>
            {auth?.user?.email && <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{auth.user.email}</p>}
          </div>
          <div className="py-1">
            <button onClick={() => { setOpen(false); navigate("/crm/socialmedia/settings"); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{ color: "var(--text-main)" }}>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button onClick={() => { auth?.logout?.(); navigate("/login"); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Topbar({ onToggleSidebar, showSidebarToggle = false }) {
  const navigate = useNavigate();
  const { activeBrand, refresh: refreshBrands, invalidateAllBrandCaches } = useBrand();
  const [unread, setUnread] = useState(0);
  const [newLeads, setNewLeads] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const hubRef = useRef(null);
  const leadsHubRef = useRef(null);
  const notifRef = useRef(null);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch unread count on mount and brand change
  useEffect(() => {
    if (!activeBrand?.id) return;
    getUnreadCount().then((d) => setUnread(d.unreadCount ?? 0)).catch(() => {});
  }, [activeBrand?.id]);

   // Listen for real-time new messages via SignalR
  useEffect(() => {
    if (!activeBrand?.id) return;
    const conn = createInboxHubConnection();
    hubRef.current = conn;
    conn.on("NewMessage", (msg) => {
      if (msg.direction === "Incoming") {
        setUnread((prev) => prev + 1);
        const senderName = msg.senderName || "Someone";
        const preview = msg.messageText
          ? msg.messageText.length > 60 ? msg.messageText.slice(0, 60) + "…" : msg.messageText
          : "";
        const platformLabel = msg.platform ? ` on ${msg.platform}` : "";
        setNotifications((prev) => [
          {
            id: Date.now(),
            type: "message",
            message: `${senderName}${platformLabel}: ${preview}` || "New message received",
            time: new Date(msg.timestamp || Date.now()),
            platform: msg.platform,
            conversationId: msg.conversationId,
          },
          ...prev,
        ].slice(0, 50));
        toast(`📩 ${senderName}: ${preview || "New message"}`, { duration: 4000, position: "top-right" });
      }
    });
    conn.on("ConversationUpdated", (conv) => {
      if (conv && conv.userName) {
        const statusLabel = conv.status ? ` — ${conv.status}` : "";
        setNotifications((prev) => [
          {
            id: Date.now() + 1,
            type: "conversation",
            message: `${conv.userName}${statusLabel}: ${conv.lastMessage || "Conversation updated"}`,
            time: new Date(conv.lastMessageTime || Date.now()),
            platform: conv.platform,
          },
          ...prev,
        ].slice(0, 50));
      }
    });
    conn.on("ConversationAssigned", (conversationId, assignedTo) => {
      setNotifications((prev) => [
        {
          id: Date.now() + 2,
          type: "assignment",
          message: `Conversation #${conversationId} assigned to ${assignedTo}`,
          time: new Date(),
        },
        ...prev,
      ].slice(0, 50));
    });
    conn.on("FeedEventReceived", (evt) => {
      const sender = evt.senderName || "Someone";
      const platform = evt.platform || "";
      let notifMessage = "";
      let emoji = "🔔";
      switch (evt.item) {
        case "like":
          emoji = "❤️";
          notifMessage = `${sender} liked your post${platform ? ` on ${platform}` : ""}`;
          break;
        case "reaction":
          emoji = "😍";
          notifMessage = `${sender} reacted ${evt.reactionType || ""} to your post${platform ? ` on ${platform}` : ""}`;
          break;
        case "comment":
          emoji = "💬";
          notifMessage = `${sender} commented${platform ? ` on ${platform}` : ""}: ${evt.message ? (evt.message.length > 50 ? evt.message.slice(0, 50) + "…" : evt.message) : ""}`;
          break;
        case "share":
          emoji = "🔄";
          notifMessage = `${sender} shared your post${platform ? ` on ${platform}` : ""}`;
          break;
        default:
          notifMessage = `${sender}: ${evt.item || "New activity"}${platform ? ` on ${platform}` : ""}`;
      }
      setNotifications((prev) => [
        {
          id: Date.now() + 3,
          type: "feed",
          feedItem: evt.item,
          message: notifMessage,
          time: new Date(evt.timestamp || Date.now()),
          platform: evt.platform,
        },
        ...prev,
      ].slice(0, 50));
      toast(`${emoji} ${notifMessage}`, { duration: 4000, position: "top-right" });
    });
    conn.on("MessageRead", () => {
      getUnreadCount().then((d) => setUnread(d.unreadCount ?? 0)).catch(() => {});
    });
    conn.on("BrandSwitched", () => {
      invalidateAllBrandCaches();
      refreshBrands();
    });
    conn.on("TokenAlert", (alert) => {
      const statusEmoji = alert.status === "expired" ? "\u26a0\ufe0f" : "\u23f3";
      setNotifications((prev) => [
        {
          id: Date.now() + 4,
          type: "token",
          message: alert.message,
          time: new Date(),
          platform: alert.platform,
        },
        ...prev,
      ].slice(0, 50));
      toast(`${statusEmoji} ${alert.message}`, { duration: 6000, position: "top-right" });
    });
    conn.start().then(async () => {
      await conn.invoke("JoinBrand", String(activeBrand.id)).catch(() => {});
    }).catch(() => {});
    return () => { conn.stop(); };
  }, [activeBrand?.id]);

  // Listen for real-time lead notifications via SignalR
  useEffect(() => {
    if (!activeBrand?.id) return;
    const conn = createLeadsHubConnection();
    leadsHubRef.current = conn;
    conn.on("LeadUpdated", (data) => {
      setNewLeads((prev) => prev + 1);
      const leadName = data?.name || "Unknown";
      const platformLabel = data?.platform ? ` from ${data.platform}` : "";
      const details = data?.email ? ` (${data.email})` : "";
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "lead",
          message: `New lead: ${leadName}${details}${platformLabel}`,
          time: new Date(),
          platform: data?.platform,
        },
        ...prev,
      ].slice(0, 50));
      toast(`🟢 New lead: ${leadName}${platformLabel}`, { duration: 4000, position: "top-right" });
    });
    conn.start().then(async () => {
      await conn.invoke("JoinBrand", String(activeBrand.id)).catch(() => {});
    }).catch(() => {});
    return () => { conn.stop(); };
  }, [activeBrand?.id]);

  // Periodic token health check (every 30 min)
  useEffect(() => {
    if (!activeBrand?.id) return;
    const checkHealth = () => {
      getAccountHealth().then((accounts) => {
        if (!Array.isArray(accounts)) return;
        accounts.forEach((acc) => {
          if (acc.status === "Expired" || acc.daysUntilExpiry <= 3) {
            const statusEmoji = acc.status === "Expired" ? "\u26a0\ufe0f" : "\u23f3";
            const msg = acc.status === "Expired"
              ? `Your ${acc.platform} token has expired. Please reconnect in Settings.`
              : `Your ${acc.platform} token expires in ${acc.daysUntilExpiry} day(s).`;
            setNotifications((prev) => {
              if (prev.some(n => n.type === "token" && n.platform === acc.platform)) return prev;
              return [{
                id: Date.now(),
                type: "token",
                message: msg,
                time: new Date(),
                platform: acc.platform,
              }, ...prev].slice(0, 50);
            });
            toast(`${statusEmoji} ${msg}`, { duration: 6000, position: "top-right" });
          }
        });
      }).catch(() => {});
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeBrand?.id]);

  const totalNotifCount = unread + newLeads + notifications.filter(n => n.type === "feed" || n.type === "token").length;

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getNotifIcon = (n) => {
    switch (n.type) {
      case "lead": return "🟢";
      case "message": return "📩";
      case "conversation": return "💬";
      case "assignment": return "👤";
      case "token": return "⚠️";
      case "feed":
        switch (n.feedItem) {
          case "like": return "❤️";
          case "reaction": return "😍";
          case "comment": return "💬";
          case "share": return "🔄";
          default: return "🔔";
        }
      default: return "🔔";
    }
  };

  const getNotifBg = (n) => {
    switch (n.type) {
      case "lead": return "rgba(34,197,94,0.12)";
      case "message": return "rgba(59,130,246,0.12)";
      case "feed": return "rgba(239,68,68,0.12)";
      case "assignment": return "rgba(168,85,247,0.12)";
      case "conversation": return "rgba(245,158,11,0.12)";
      case "token": return "rgba(234,179,8,0.15)";
      default: return "rgba(107,114,128,0.12)";
    }
  };

  const getNotifRoute = (n) => {
    switch (n.type) {
      case "lead": return "/crm/socialmedia/leads";
      case "message":
      case "conversation":
      case "assignment":
        return "/crm/socialmedia/inbox";
      case "token": return "/crm/socialmedia/settings";
      default: return "/crm/socialmedia/dashboard";
    }
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setUnread(0);
    setNewLeads(0);
  };

  return (
    <div className="px-5 shadow-sm shrink-0 z-30 h-[57px] flex items-center" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)" }}>
      <div className="flex items-center justify-between gap-4 w-full">

        {/* Left: mobile toggle + search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          {showSidebarToggle && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
              className="socialcrm-topbar__toggle-btn"
            >
              <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-1"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border-color)", color: "var(--text-main)" }} />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <TopbarBrandSwitcher />

          {/* Notifications dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              title="Notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-xl transition"
              style={{ color: "var(--text-secondary)", background: "transparent", border: "none", padding: 0 }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {totalNotifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white px-1">
                  {totalNotifCount > 99 ? "99+" : totalNotifCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
                <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-hover)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Notifications</p>
                  {notifications.length > 0 && (
                    <button onClick={handleClearNotifications}
                      className="text-xs font-medium"
                      style={{ color: "var(--primary-text)", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer"
                        style={{ borderBottom: "1px solid var(--border-color)" }}
                        onClick={() => {
                          setNotifOpen(false);
                          navigate(getNotifRoute(n));
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                          style={{ background: getNotifBg(n) }}>
                          {getNotifIcon(n)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-main)" }}>{n.message}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {n.platform && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}>
                                {n.platform}
                              </span>
                            )}
                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{formatTimeAgo(n.time)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <UserMenu />
        </div>
      </div>
    </div>
  );
}
