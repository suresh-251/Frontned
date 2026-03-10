import { useState, useEffect, useCallback } from "react";
import {
  X, Phone, Mail, Calendar, MessageSquare, Plus,
  Clock, CheckSquare, FileText, Activity,
  MapPin, Briefcase, TrendingUp, AlertTriangle, RefreshCw, UserCheck, Tag,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import leadsAPI from "../api/leads.api";

/* ── tiny helpers (already exist in Leads.jsx, re-declared here for portability) ── */
const fmtDate = (d) => {
  if (!d) return "—";
  const parsed = new Date(d);
  return isNaN(parsed)
    ? "—"
    : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const fmtDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const todayStr = () => new Date().toISOString().split("T")[0];

const STATUS_META = {
  FreshLead:       { color: "#1e40af", bg: "#dbeafe" },
  Contacted:       { color: "#065f46", bg: "#d1fae5" },
  FollowUp:        { color: "#92400e", bg: "#fef3c7" },
  Interested:      { color: "#5b21b6", bg: "#ede9fe" },
  Qualified:       { color: "#1d4ed8", bg: "#bfdbfe" },
  Negotiation:     { color: "#c2410c", bg: "#ffedd5" },
  Converted:       { color: "#166534", bg: "#bbf7d0" },
  Lost:            { color: "#991b1b", bg: "#fee2e2" },
  NotInterested:   { color: "#374151", bg: "#f3f4f6" },
  UnableToContact: { color: "#78350f", bg: "#fef9c3" },
  JunkLead:        { color: "#6b7280", bg: "#e5e7eb" },
  "Need Review":   { color: "#6d28d9", bg: "#ede9fe" },
  New:             { color: "#1e40af", bg: "#dbeafe" },
};

/* ────────────────────────────────────────────
   TIMELINE EVENT ICON
──────────────────────────────────────────── */
const TIMELINE_CFG = {
  "Lead Assigned":  { icon: UserCheck, color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
  "Lead Created":   { icon: Plus,      color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  "Status Changed": { icon: Activity,  color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "Note Added":     { icon: FileText,  color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  "Call Made":      { icon: Phone,     color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  "Email Sent":     { icon: Mail,      color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  "Meeting":        { icon: Calendar,  color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  default:          { icon: Clock,     color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
};

function TimelineIcon({ type }) {
  const cfg = TIMELINE_CFG[type] || TIMELINE_CFG.default;
  const Ic = cfg.icon;
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%",
      background: cfg.bg, border: `2px solid ${cfg.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, position: "relative", zIndex: 1,
    }}>
      <Ic size={14} color={cfg.color} strokeWidth={2} />
    </div>
  );
}

const ACT_VERB = { email: "Sent", call: "Made", meeting: "Scheduled" };

const getActLabel = (act) => {
  if (act.type === "created") return "Lead Created";
  if (act.type === "score-change") return act.notes;
  const verb = ACT_VERB[act.type] ?? "Sent";
  return `${act.type.charAt(0).toUpperCase() + act.type.slice(1)} ${verb}`;
};

const ACT_TYPE_MAP = {
  email:          { Ic: Mail,          color: "#3b82f6", bg: "#eff6ff" },
  call:           { Ic: Phone,         color: "#10b981", bg: "#ecfdf5" },
  message:        { Ic: MessageSquare, color: "#8b5cf6", bg: "#f5f3ff" },
  meeting:        { Ic: Calendar,      color: "#f59e0b", bg: "#fffbeb" },
  created:        { Ic: Plus,          color: "#6b7280", bg: "#f3f4f6" },
  "score-change": { Ic: TrendingUp,    color: "#ec4899", bg: "#fdf2f8" },
};


/* ────────────────────────────────────────────
   ACTIVITY TABS  (middle panel)
──────────────────────────────────────────── */
const ACTIVITY_TABS = [
  { k: "Activity",  icon: Activity },
  { k: "Notes",     icon: FileText },
  { k: "Emails",    icon: Mail },
  { k: "Calls",     icon: Phone },
  { k: "Tasks",     icon: CheckSquare },
  { k: "Meetings",  icon: Calendar },
];

/* Tab → compose config: placeholder text + which type to log */
const TAB_COMPOSE_CFG = {
  Activity: { placeholder: "Log a note, call, email…", type: "note"    },
  Notes:    { placeholder: "Write a note…",            type: "note"    },
  Emails:   { placeholder: "Compose an email…",        type: "email"   },
  Calls:    { placeholder: "Log call notes…",          type: "call"    },
  Tasks:    { placeholder: "Describe the task…",       type: "task"    },
  Meetings: { placeholder: "Add meeting notes…",       type: "meeting" },
};

function MiddlePanel({ lead, activityLog, onAdjustScore }) {
  const [activeTab, setActiveTab]   = useState("Activity");
  const [focused,   setFocused]     = useState(false);
  const [notes,     setNotes]       = useState("");
  const activities = activityLog[lead?.id] || [];

  const composeCfg = TAB_COMPOSE_CFG[activeTab] ?? TAB_COMPOSE_CFG.Activity;

  const filtered = activeTab === "Activity"
    ? activities
    : activities.filter(a => a.type === activeTab.toLowerCase().replace(/s$/, ""));

  const handleSave = () => {
    if (!notes.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    onAdjustScore(lead.id, 0, {
      type: composeCfg.type,
      date: todayStr(),
      time: timeStr,
      notes,
    });
    setNotes("");
    setFocused(false);
  };

  const handleCancel = () => { setNotes(""); setFocused(false); };

  /* Reset compose when tab changes */
  const handleTabChange = (k) => { setActiveTab(k); setNotes(""); setFocused(false); };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "#f8fafc" }}>

      {/* ── Tabs ── */}
      <div style={{
        display: "flex", padding: "0 20px",
        background: "white", borderBottom: "1px solid #e5e7eb",
        overflowX: "auto", gap: 0, flexShrink: 0,
      }}>
        {ACTIVITY_TABS.map(({ k, icon: Ic }) => {
          const isActive = activeTab === k;
          return (
            <button
              key={k}
              onClick={() => handleTabChange(k)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "11px 15px",
                border: "none",
                borderBottom: `2px solid ${isActive ? "#4f46e5" : "transparent"}`,
                background: "none",
                fontSize: 12, fontWeight: isActive ? 700 : 500,
                color: isActive ? "#4f46e5" : "#9ca3af",
                cursor: "pointer", whiteSpace: "nowrap",
                transition: "color 0.15s", letterSpacing: "0.01em",
              }}
            >
              <Ic size={11} strokeWidth={isActive ? 2.5 : 2} />
              {k}
            </button>
          );
        })}
      </div>

      {/* ── Scrollable body: compose box + history ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Inline compose box (always visible, HubSpot-style) ── */}
        <div style={{
          background: "white",
          border: `1.5px solid ${focused ? "#4f46e5" : "#e5e7eb"}`,
          borderRadius: 10,
          boxShadow: focused ? "0 0 0 3px rgba(79,70,229,0.08)" : "0 1px 3px rgba(0,0,0,0.05)",
          overflow: "hidden",
          transition: "border-color 0.15s, box-shadow 0.15s",
          flexShrink: 0,
        }}>
          <textarea
            placeholder={composeCfg.placeholder}
            value={notes}
            rows={focused ? 4 : 2}
            onChange={e => setNotes(e.target.value)}
            onFocus={() => setFocused(true)}
            style={{
              width: "100%", padding: "12px 14px",
              border: "none", outline: "none", resize: "none",
              fontSize: 13, color: "#111827", lineHeight: 1.55,
              fontFamily: "inherit", background: "transparent",
              boxSizing: "border-box",
              transition: "height 0.15s",
            }}
          />

          {/* Toolbar — only when focused */}
          {focused && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 12px",
              borderTop: "1px solid #f3f4f6",
              background: "#fafafa",
              animation: "fadeSlideIn 0.15s ease both",
            }}>
              {/* Type pills */}
              <div style={{ display: "flex", gap: 5 }}>
                {(activeTab === "Activity"
                  ? ["note", "call", "email", "meeting"]
                  : [composeCfg.type]
                ).map(t => {
                  const cfg = ACT_TYPE_MAP[t] ?? ACT_TYPE_MAP.created;
                  const sel = composeCfg.type === t;
                  return (
                    <span
                      key={t}
                      style={{
                        padding: "3px 9px",
                        borderRadius: 20,
                        border: `1px solid ${sel ? cfg.color + "88" : "#e5e7eb"}`,
                        background: sel ? cfg.bg : "transparent",
                        color: sel ? cfg.color : "#9ca3af",
                        fontSize: 11, fontWeight: 600,
                        textTransform: "capitalize",
                        letterSpacing: "0.01em",
                      }}
                    >{t}</span>
                  );
                })}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 7 }}>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: "5px 13px", border: "1px solid #e5e7eb",
                    borderRadius: 6, background: "white",
                    fontSize: 12, fontWeight: 500, color: "#6b7280", cursor: "pointer",
                  }}
                >Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={!notes.trim()}
                  style={{
                    padding: "5px 16px", border: "none",
                    borderRadius: 6,
                    background: notes.trim() ? "#4f46e5" : "#e5e7eb",
                    color: notes.trim() ? "white" : "#9ca3af",
                    fontSize: 12, fontWeight: 600, cursor: notes.trim() ? "pointer" : "default",
                    boxShadow: notes.trim() ? "0 1px 4px rgba(79,70,229,0.25)" : "none",
                    transition: "all 0.15s",
                  }}
                >Save</button>
              </div>
            </div>
          )}
        </div>

        {/* ── History label ── */}
        {filtered.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {filtered.length} {activeTab === "Activity" ? "activities" : activeTab.toLowerCase()}
            </span>
            <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          </div>
        )}

        {/* ── Activity feed ── */}
        {filtered.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "40px 0", color: "#9ca3af",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "#f3f4f6",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 10,
            }}>
              <MessageSquare size={20} color="#d1d5db" strokeWidth={1.5} />
            </div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#6b7280" }}>No {activeTab.toLowerCase()} yet</p>
            <span style={{ fontSize: 12, marginTop: 4 }}>Use the box above to log one.</span>
          </div>
        ) : (
          <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Timeline connector line */}
            {filtered.length > 1 && (
              <div style={{
                position: "absolute", left: 17, top: 34, bottom: 10,
                width: 1, background: "linear-gradient(to bottom, #e2e8f0 80%, transparent)",
              }} />
            )}

            {filtered.map((act, idx) => {
              const { Ic, color, bg } = ACT_TYPE_MAP[act.type] ?? ACT_TYPE_MAP.created;
              return (
                <div
                  key={act.id}
                  style={{
                    display: "flex", gap: 12, position: "relative",
                    animation: "fadeSlideIn 0.2s ease both",
                    animationDelay: `${idx * 0.04}s`,
                  }}
                >
                  {/* Circle icon */}
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: bg, border: `1.5px solid ${color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, zIndex: 1,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}>
                    <Ic size={14} color={color} strokeWidth={2} />
                  </div>

                  {/* Card */}
                  <div style={{
                    flex: 1, minWidth: 0,
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "9px 13px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                        {getActLabel(act)}
                      </span>
                      <span style={{
                        fontSize: 10.5, fontWeight: 600,
                        color: color, background: bg,
                        padding: "2px 7px", borderRadius: 10,
                        letterSpacing: "0.02em", flexShrink: 0, marginLeft: 8,
                      }}>
                        {act.type.replace("-", " ")}
                      </span>
                    </div>

                    {!["created", "score-change"].includes(act.type) && act.notes && (
                      <div style={{ fontSize: 12, color: "#4b5563", marginTop: 3, lineHeight: 1.45 }}>
                        {act.notes}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                      <Clock size={10} color="#9ca3af" strokeWidth={2} />
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>
                        {fmtDate(act.date)} · {act.time}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   LEFT PANEL — Profile + Details
──────────────────────────────────────────── */
function LeftPanel({ lead, onUpdateLead, onAdjustScore }) {
  const initials = lead.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?";
  const scoreTier = lead.score >= 80 ? "high" : lead.score >= 60 ? "mid" : "low";
  const scoreColor = { high: "#059669", mid: "#d97706", low: "#dc2626" }[scoreTier];
  const scoreBg    = { high: "#f0fdf4", mid: "#fffbeb", low: "#fff5f5" }[scoreTier];
  const meta = STATUS_META[lead.status] || STATUS_META.FreshLead;

  const fields = [
    { icon: Mail,     label: "Email",      value: lead.email,    href: `mailto:${lead.email}` },
    { icon: Phone,    label: "Phone",      value: lead.phone,    href: `tel:${lead.phone}` },
    { icon: Briefcase,label: "Company",    value: lead.company },
    { icon: Tag,      label: "Source",     value: lead.source },
    { icon: UserCheck,label: "Owner",      value: lead.assignee },
    { icon: Calendar, label: "Follow-Up",  value: lead.followUpDate ? fmtDate(lead.followUpDate + "T00:00:00") : "Not set" },
    { icon: Clock,    label: "Created",    value: fmtDate(lead.createdDate) },
    { icon: MapPin,   label: "Address",    value: lead.address || "—" },
  ];

  return (
    <div style={{ overflowY: "auto", height: "100%", padding: "0 0 20px" }}>
      {/* Profile hero */}
{/* Profile Header */}
<div
  style={{
    background: "linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)",
    padding: "16px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    gap: 12,
  }}
>
  {/* Avatar */}
  <div
    style={{
      width: 50,
      height: 50,
      borderRadius: "50%",
      background: lead.avatarBg || "#4f46e5",
      color: "white",
      fontSize: 18,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    {initials}
  </div>

  {/* Name + Company */}
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
      {lead.name}
    </div>

    {lead.company && (
      <div style={{ fontSize: 12, color: "#6b7280" }}>
        {lead.company}
      </div>
    )}

    <span
      style={{
        marginTop: 4,
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: 10,
        fontWeight: 700,
        background: meta.bg,
        color: meta.color,
      }}
    >
      {lead.status?.replace(/([A-Z])/g, " $1").trim()}
    </span>

    {/* Quick actions */}
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <a
        href={`tel:${lead.phone}`}
        title="Call"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #e5e7eb",
        }}
      >
        <Phone size={14} />
      </a>

      <a
        href={`mailto:${lead.email}`}
        title="Email"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #e5e7eb",
        }}
      >
        <Mail size={14} />
      </a>

      <a
        href={`https://wa.me/${lead.phone?.replace(/\D/g, "")}`}
        target="_blank"
        rel="noreferrer"
        title="WhatsApp"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #e5e7eb",
        }}
      >
       <FaWhatsapp size={14} />
      </a>
    </div>
  </div>
</div>

      {/* Score widget */}
      {/* <div style={{
        margin: "16px 16px 0",
        padding: "12px 16px",
        background: scoreBg,
        borderRadius: 10,
        border: `1.5px solid ${scoreColor}22`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Lead Score</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{lead.score}</div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[-10, +10].map(d => (
            <button
              key={d}
              onClick={() => onAdjustScore(lead.id, d)}
              style={{
                padding: "4px 10px",
                border: `1.5px solid ${d > 0 ? "#bbf7d0" : "#fecaca"}`,
                borderRadius: 6,
                background: d > 0 ? "#f0fdf4" : "#fff5f5",
                color: d > 0 ? "#059669" : "#dc2626",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >{d > 0 ? `+${d}` : d}</button>
          ))}
        </div>
      </div> */}

      {/* Detail fields */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#9ca3af",
          textTransform: "uppercase", letterSpacing: "0.05em",
          marginBottom: 12,
        }}>Contact Info</div>

        {fields.map(({ icon: Ic, label, value, href }) => (
          <div key={label} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            marginBottom: 8, paddingBottom: 8,
            borderBottom: "1px solid #f3f4f6",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7,
              background: "#f3f4f6", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Ic size={12} color="#6b7280" strokeWidth={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 1 }}>{label}</div>
              {href && value
                ? <a href={href} style={{ fontSize: 12.5, color: "#4f46e5", fontWeight: 500, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</a>
                : <div style={{ fontSize: 12, color: "#111827", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "—"}</div>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   RIGHT PANEL — Timeline
──────────────────────────────────────────── */
function RightPanel({ leadId }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetchTimeline = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await leadsAPI.getTimeline(leadId);
      setTimeline(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Panel header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid #e5e7eb",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={14} color="#4f46e5" strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Timeline</div>
            {!loading && !error && (
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{timeline.length} event{timeline.length !== 1 ? "s" : ""}</div>
            )}
          </div>
        </div>
        <button
          onClick={fetchTimeline}
          title="Refresh timeline"
          style={{
            background: "none", border: "1.5px solid #e5e7eb",
            borderRadius: 6, padding: "4px 7px", cursor: "pointer",
            display: "flex", alignItems: "center",
            transition: "border-color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#4f46e5"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
        >
          <RefreshCw size={12} color="#6b7280" strokeWidth={2} />
        </button>
      </div>

      {/* Timeline body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px" }}>
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af" }}>
            <div style={{
              width: 28, height: 28, border: "3px solid #e5e7eb",
              borderTopColor: "#4f46e5", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", marginBottom: 10,
            }} />
            <span style={{ fontSize: 12 }}>Loading timeline…</span>
          </div>
        )}

        {!loading && error && (
          <div style={{
            padding: 14, background: "#fff5f5", border: "1.5px solid #fecaca",
            borderRadius: 8, textAlign: "center",
          }}>
            <AlertTriangle size={20} color="#ef4444" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>Failed to load timeline</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{error}</div>
            <button
              onClick={fetchTimeline}
              style={{ marginTop: 10, padding: "5px 12px", border: "none", borderRadius: 6, background: "#4f46e5", color: "white", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
            >Retry</button>
          </div>
        )}

        {!loading && !error && timeline.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
            <Clock size={32} color="#d1d5db" />
            <p style={{ marginTop: 8, fontSize: 13 }}>No timeline events</p>
            <span style={{ fontSize: 12 }}>Events will appear here as the lead progresses.</span>
          </div>
        )}

        {!loading && !error && timeline.length > 0 && (
          <div style={{ position: "relative" }}>
            {/* Vertical line */}
            <div style={{
              position: "absolute",
              left: 15, top: 16,
              bottom: 16, width: 2,
              background: "linear-gradient(to bottom, #e5e7eb 0%, #e5e7eb 95%, transparent 100%)",
              borderRadius: 2,
            }} />

            {timeline.map((event, idx) => {
              const cfg = TIMELINE_CFG[event.type] || TIMELINE_CFG.default;
              const isLast = idx === timeline.length - 1;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex", gap: 12,
                    marginBottom: isLast ? 0 : 16,
                    position: "relative",
                    animation: `fadeSlideIn 0.3s ease both`,
                    animationDelay: `${idx * 0.05}s`,
                  }}
                >
                  <TimelineIcon type={event.type} />

                  <div style={{
                    flex: 1, minWidth: 0,
                    background: "white",
                    border: "1.5px solid #f3f4f6",
                    borderRadius: 8,
                    padding: "9px 12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.border; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#f3f4f6"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
                  >
                    {/* Event type badge */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: cfg.color,
                        background: cfg.bg,
                        padding: "2px 7px", borderRadius: 12,
                        letterSpacing: "0.02em",
                      }}>{event.type}</span>
                    </div>

                    {/* Description */}
                    {event.description && (
                      <div style={{ fontSize: 12.5, color: "#374151", fontWeight: 500, lineHeight: 1.4, marginBottom: 5 }}>
                        {event.description}
                      </div>
                    )}

                    {/* Date */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={10} color="#9ca3af" strokeWidth={2} />
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{fmtDateTime(event.date)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT — LeadDetailsModal
   Replace the existing LeadDetailsModal in Leads.jsx with this
════════════════════════════════════════════════════════════ */
export function LeadDetailsModal({ lead, onClose, activityLog, onUpdateLead, onAdjustScore }) {
  const [animated, setAnimated] = useState(false);
  const meta       = STATUS_META[lead.status] || STATUS_META.FreshLead;

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(2px)",
          zIndex: 500,
          opacity: animated ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", inset: 0,
        zIndex: 501,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        pointerEvents: "none",
      }}>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            pointerEvents: "all",
            width: "min(1200px, 96vw)",
            height: "min(780px, 92vh)",
            background: "white",
            borderRadius: 16,
            boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
            transform: animated ? "scale(1) translateY(0)" : "scale(0.95) translateY(20px)",
            opacity: animated ? 1 : 0,
            transition: "transform 0.3s cubic-bezier(0.34,1.2,0.64,1), opacity 0.25s ease",
          }}
        >
          {/* ── Modal Header ── */}
          <div style={{
            padding: "13px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex", alignItems: "center",justifyContent:"flex-end", gap: 12,
            flexShrink: 0, background: "#fafafa",
          }}>

            {/* Header actions */}
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
              <button
                onClick={onClose}
                style={{
                  background: "none", border: "1.5px solid #e5e7eb",
                  borderRadius: 6, padding: "6px", cursor: "pointer",
                  display: "flex", alignItems: "center",
                }}
              >
                <X size={15} color="#6b7280" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* ── 3-panel body ── */}
          <div style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "260px 1fr 280px",
            overflow: "hidden",
            minHeight: 0,
          }}>
            {/* Panel 1 — Profile */}
            <div style={{
              borderRight: "1px solid #e5e7eb",
              overflow: "hidden",
              display: "flex", flexDirection: "column",
            }}>
              <LeftPanel
                lead={lead}
                onUpdateLead={onUpdateLead}
                onAdjustScore={onAdjustScore}
              />
            </div>

            {/* Panel 2 — Activities */}
            <div style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <MiddlePanel
                lead={lead}
                activityLog={activityLog}
                onAdjustScore={onAdjustScore}
              />
            </div>

            {/* Panel 3 — Timeline */}
            <div style={{
              borderLeft: "1px solid #e5e7eb",
              background: "#fafbfc",
              overflow: "hidden",
              display: "flex", flexDirection: "column",
            }}>
              <RightPanel leadId={lead.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default LeadDetailsModal;