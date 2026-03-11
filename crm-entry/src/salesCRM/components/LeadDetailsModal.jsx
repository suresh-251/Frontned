import { useState, useEffect, useCallback } from "react";
import {
  X, Phone, Mail, Calendar, MessageSquare, Plus,
  Clock, FileText, Activity,
  MapPin, Briefcase, TrendingUp, AlertTriangle, RefreshCw, UserCheck, Tag,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import leadsAPI from "../api/leads.api";

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

const STATUS_META = {
  FreshLead: { color: "#1e40af", bg: "#dbeafe" },
  Contacted: { color: "#065f46", bg: "#d1fae5" },
  FollowUp: { color: "#92400e", bg: "#fef3c7" },
  Interested: { color: "#5b21b6", bg: "#ede9fe" },
  Qualified: { color: "#1d4ed8", bg: "#bfdbfe" },
  Negotiation: { color: "#c2410c", bg: "#ffedd5" },
  Converted: { color: "#166534", bg: "#bbf7d0" },
  Lost: { color: "#991b1b", bg: "#fee2e2" },
  NotInterested: { color: "#374151", bg: "#f3f4f6" },
  UnableToContact: { color: "#78350f", bg: "#fef9c3" },
  JunkLead: { color: "#6b7280", bg: "#e5e7eb" },
  "Need Review": { color: "#6d28d9", bg: "#ede9fe" },
  New: { color: "#1e40af", bg: "#dbeafe" },
};

const TIMELINE_CFG = {
  "Lead Assigned": { icon: UserCheck, color: "#4f46e5", bg: "#eef2ff", border: "#c7d2fe" },
  "Lead Created": { icon: Plus, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  "Status Changed": { icon: Activity, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  "Note Added": { icon: FileText, color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  "Call Made": { icon: Phone, color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
  "Email Sent": { icon: Mail, color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  Meeting: { icon: Calendar, color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe" },
  default: { icon: Clock, color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
};

const ACT_TYPE_MAP = {
  email: { Ic: Mail, color: "#3b82f6", bg: "#eff6ff" },
  call: { Ic: Phone, color: "#10b981", bg: "#ecfdf5" },
  message: { Ic: MessageSquare, color: "#8b5cf6", bg: "#f5f3ff" },
  meeting: { Ic: Calendar, color: "#f59e0b", bg: "#fffbeb" },
  created: { Ic: Plus, color: "#6b7280", bg: "#f3f4f6" },
  "score-change": { Ic: TrendingUp, color: "#ec4899", bg: "#fdf2f8" },
  note: { Ic: FileText, color: "#0891b2", bg: "#ecfeff" },
  whatsapp: { Ic: FaWhatsapp, color: "#16a34a", bg: "#dcfce7" },
};

const ACTIVITY_TABS = [
  { k: "Activity", icon: Activity },
  { k: "Notes", icon: FileText },
  { k: "Emails", icon: Mail },
  { k: "Calls", icon: Phone },
  { k: "WhatsApp", icon: FaWhatsapp },
  { k: "Meetings", icon: Calendar },
];

const TAB_COMPOSE_CFG = {
  Activity: { placeholder: "Log a note, call, email...", type: "note" },
  Notes: { placeholder: "Write a note...", type: "note" },
  Emails: { placeholder: "Compose an email...", type: "email" },
  Calls: { placeholder: "Log call notes...", type: "call" },
  WhatsApp: { placeholder: "Compose a WhatsApp message...", type: "whatsapp" },
  Meetings: { placeholder: "Add meeting notes...", type: "meeting" },
};

const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.FreshLead;
const getInitials = (name) => name?.split(" ").map((part) => part[0]).join("").slice(0, 2) || "?";
const formatStatus = (status) => status?.replace(/([A-Z])/g, " $1").trim();

const mapCommunications = (data) => data.map((item, index) => ({
  id: index,
  type: item.type.toLowerCase(),
  notes: item.description,
  date: item.date,
  time: new Date(item.date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }),
}));

function getCommunicationPayload(activeTab, notes, lead) {
  if (activeTab === "Emails") {
    return {
      leadId: lead.id,
      type: "Email",
      subject: "Email",
      body: notes,
      toEmail: lead.email,
    };
  }

  if (activeTab === "Calls") {
    return {
      leadId: lead.id,
      type: "Call",
      subject: "Call",
      callType: "Outgoing",
      callResult: "Completed",
    };
  }

  if (activeTab === "Meetings") {
    return {
      leadId: lead.id,
      type: "Meeting",
      subject: "Meeting",
      meetingDate: new Date().toISOString(),
      location: "Online",
    };

  if (activeTab === "WhatsApp") {
    return {
      leadId: lead.id,
      type: "WhatsApp",
      subject: "WhatsApp Message",
      body: notes,
      toPhone: lead.phone,
    };
  }
  }

  return {
    leadId: lead.id,
    type: "Note",
    message: notes,
  };
}

function filterActivitiesByTab(activities, activeTab) {
  if (activeTab === "Activity") return activities;
  if (activeTab === "Notes") return activities.filter((activity) => activity.type === "note");
  if (activeTab === "Emails") return activities.filter((activity) => activity.type === "email");
  if (activeTab === "Calls") return activities.filter((activity) => activity.type === "call");
  if (activeTab === "WhatsApp") return activities.filter((activity) => activity.type === "whatsapp");
  if (activeTab === "Meetings") return activities.filter((activity) => activity.type === "meeting");
  return activities;
}

function buildLeadFields(lead) {
  return [
    { icon: Mail, label: "Email", value: lead.email, href: `mailto:${lead.email}` },
    { icon: Phone, label: "Phone", value: lead.phone, href: `tel:${lead.phone}` },
    { icon: Briefcase, label: "Company", value: lead.company },
    { icon: Tag, label: "Source", value: lead.source },
    { icon: UserCheck, label: "Owner", value: lead.assignee },
    { icon: Calendar, label: "Follow-Up", value: lead.followUpDate ? fmtDate(`${lead.followUpDate}T00:00:00`) : "Not set" },
    { icon: Clock, label: "Created", value: fmtDate(lead.createdDate) },
    { icon: MapPin, label: "Address", value: lead.address || "—" },
  ];
}

function TimelineIcon({ type }) {
  const cfg = TIMELINE_CFG[type] || TIMELINE_CFG.default;
  const Ic = cfg.icon;
  return (
    <div style={{ width: 32, height: 32, borderRadius: "50%", background: cfg.bg, border: `2px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", zIndex: 1 }}>
      <Ic size={14} color={cfg.color} strokeWidth={2} />
    </div>
  );
}

function ActivityTabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: "10px 16px", border: "none", borderBottom: active ? "2px solid #4f46e5" : "none", background: "none", color: active ? "#4f46e5" : "#6b7280", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function ActivityItem({ activity }) {
  const { Ic, color, bg } = ACT_TYPE_MAP[activity.type] ?? ACT_TYPE_MAP.created;
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Ic size={14} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{activity.notes}</div>
        <div style={{ fontSize: 11, color: "#9ca3af" }}>{fmtDate(activity.date)} · {activity.time}</div>
      </div>
    </div>
  );
}

function QuickActionLink({ href, title, children, target, rel }) {
  return (
    <a href={href} title={title} target={target} rel={rel} style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e5e7eb" }}>
      {children}
    </a>
  );
}

function DetailField({ icon: Icon, label, value, href }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ width: 24, height: 24, borderRadius: 7, background: "#f3f4f6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={12} color="#6b7280" strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 1 }}>{label}</div>
        {href && value
          ? <a href={href} style={{ fontSize: 12.5, color: "#4f46e5", fontWeight: 500, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</a>
          : <div style={{ fontSize: 12, color: "#111827", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "—"}</div>}
      </div>
    </div>
  );
}

function TimelineEvent({ event, index, isLast }) {
  const cfg = TIMELINE_CFG[event.type] || TIMELINE_CFG.default;
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: isLast ? 0 : 16, position: "relative", animation: "fadeSlideIn 0.3s ease both", animationDelay: `${index * 0.05}s` }}>
      <TimelineIcon type={event.type} />
      <div
        style={{ flex: 1, minWidth: 0, background: "white", border: "1.5px solid #f3f4f6", borderRadius: 8, padding: "9px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "border-color 0.15s, box-shadow 0.15s" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = cfg.border; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#f3f4f6"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "2px 7px", borderRadius: 12, letterSpacing: "0.02em" }}>{event.type}</span>
        </div>
        {event.description && <div style={{ fontSize: 12.5, color: "#374151", fontWeight: 500, lineHeight: 1.4, marginBottom: 5 }}>{event.description}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={10} color="#9ca3af" strokeWidth={2} />
          <span style={{ fontSize: 11, color: "#9ca3af" }}>{fmtDateTime(event.date)}</span>
        </div>
      </div>
    </div>
  );
}

function MiddlePanel({ lead }) {
  const [activeTab, setActiveTab] = useState("Activity");
  const [notes, setNotes] = useState("");
  const [focused, setFocused] = useState(false);
  const [activities, setActivities] = useState([]);

  const loadCommunications = useCallback(async () => {
    if (!lead?.id) return;
    try {
      const data = await leadsAPI.getCommunications(lead.id);
      setActivities(mapCommunications(data));
    } catch (err) {
      console.error("Failed to load communications", err);
    }
  }, [lead]);

  useEffect(() => {
    loadCommunications();
  }, [loadCommunications]);

  const filtered = filterActivitiesByTab(activities, activeTab);
  const composePlaceholder = TAB_COMPOSE_CFG[activeTab]?.placeholder || "Write a note...";

  const handleSave = async () => {
    if (!notes.trim()) return;
    try {
      await leadsAPI.addCommunication(getCommunicationPayload(activeTab, notes, lead));
      setNotes("");
      setFocused(false);
      loadCommunications();
    } catch (err) {
      console.error("Failed to add communication", err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
        {ACTIVITY_TABS.map(({ k, icon }) => <ActivityTabButton key={k} active={activeTab === k} icon={icon} label={k} onClick={() => setActiveTab(k)} />)}
      </div>

      <div style={{ padding: 16 }}>
        <textarea
          value={notes}
          placeholder={composePlaceholder}
          onChange={(e) => setNotes(e.target.value)}
          onFocus={() => setFocused(true)}
          rows={focused ? 4 : 2}
          style={{ width: "100%", padding: 12, border: "1.5px solid #e5e7eb", borderRadius: 8, resize: "none" }}
        />

        {focused && (
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={() => { setFocused(false); setNotes(""); }} style={{ padding: "6px 14px", border: "1px solid #e5e7eb", borderRadius: 6 }}>Cancel</button>
            <button onClick={handleSave} style={{ padding: "6px 14px", border: "none", background: "#4f46e5", color: "white", borderRadius: 6 }}>Save</button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
        {filtered.length === 0 && <div style={{ color: "#9ca3af", fontSize: 13 }}>No activity yet</div>}
        {filtered.map((activity) => <ActivityItem key={activity.id} activity={activity} />)}
      </div>
    </div>
  );
}

function LeftPanel({ lead }) {
  const initials = getInitials(lead.name);
  const meta = getStatusMeta(lead.status);
  const fields = buildLeadFields(lead);

  return (
    <div style={{ overflowY: "auto", height: "100%", padding: "0 0 20px" }}>
      <div style={{ background: "linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)", padding: "16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 50, height: 50, borderRadius: "50%", background: lead.avatarBg || "#4f46e5", color: "white", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{lead.name}</div>
          {lead.company && <div style={{ fontSize: 12, color: "#6b7280" }}>{lead.company}</div>}
          <span style={{ marginTop: 4, display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, background: meta.bg, color: meta.color }}>{formatStatus(lead.status)}</span>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <QuickActionLink href={`tel:${lead.phone}`} title="Call"><Phone size={14} /></QuickActionLink>
            <QuickActionLink href={`mailto:${lead.email}`} title="Email"><Mail size={14} /></QuickActionLink>
            <QuickActionLink href={`https://wa.me/${lead.phone?.replace(/\D/g, "")}`} title="WhatsApp" target="_blank" rel="noreferrer"><FaWhatsapp size={14} /></QuickActionLink>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Contact Info</div>
        {fields.map((field) => <DetailField key={field.label} {...field} />)}
      </div>
    </div>
  );
}

function RightPanel({ leadId }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}><Activity size={14} color="#4f46e5" strokeWidth={2} /></div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Timeline</div>
            {!loading && !error && <div style={{ fontSize: 11, color: "#9ca3af" }}>{timeline.length} event{timeline.length !== 1 ? "s" : ""}</div>}
          </div>
        </div>
        <button
          onClick={fetchTimeline}
          title="Refresh timeline"
          style={{ background: "none", border: "1.5px solid #e5e7eb", borderRadius: 6, padding: "4px 7px", cursor: "pointer", display: "flex", alignItems: "center", transition: "border-color 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4f46e5"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; }}
        >
          <RefreshCw size={12} color="#6b7280" strokeWidth={2} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px" }}>
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#9ca3af" }}>
            <div style={{ width: 28, height: 28, border: "3px solid #e5e7eb", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 10 }} />
            <span style={{ fontSize: 12 }}>Loading timeline...</span>
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: 14, background: "#fff5f5", border: "1.5px solid #fecaca", borderRadius: 8, textAlign: "center" }}>
            <AlertTriangle size={20} color="#ef4444" style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>Failed to load timeline</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{error}</div>
            <button onClick={fetchTimeline} style={{ marginTop: 10, padding: "5px 12px", border: "none", borderRadius: 6, background: "#4f46e5", color: "white", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Retry</button>
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
            <div style={{ position: "absolute", left: 15, top: 16, bottom: 16, width: 2, background: "linear-gradient(to bottom, #e5e7eb 0%, #e5e7eb 95%, transparent 100%)", borderRadius: 2 }} />
            {timeline.map((event, index) => <TimelineEvent key={index} event={event} index={index} isLast={index === timeline.length - 1} />)}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export function LeadDetailsModal({ lead, onClose, activityLog, onUpdateLead, onAdjustScore }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)", zIndex: 500, opacity: animated ? 1 : 0, transition: "opacity 0.2s ease" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 501, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", pointerEvents: "none" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ pointerEvents: "all", width: "min(1200px, 96vw)", height: "min(780px, 92vh)", background: "white", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", overflow: "hidden", transform: animated ? "scale(1) translateY(0)" : "scale(0.95) translateY(20px)", opacity: animated ? 1 : 0, transition: "transform 0.3s cubic-bezier(0.34,1.2,0.64,1), opacity 0.25s ease" }}>
          <div style={{ padding: "13px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, flexShrink: 0, background: "#fafafa" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
              <button onClick={onClose} style={{ background: "none", border: "1.5px solid #e5e7eb", borderRadius: 6, padding: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <X size={15} color="#6b7280" strokeWidth={2} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr 280px", overflow: "hidden", minHeight: 0 }}>
            <div style={{ borderRight: "1px solid #e5e7eb", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <LeftPanel lead={lead} onUpdateLead={onUpdateLead} onAdjustScore={onAdjustScore} />
            </div>
            <div style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <MiddlePanel lead={lead} />
            </div>
            <div style={{ borderLeft: "1px solid #e5e7eb", background: "#fafbfc", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <RightPanel leadId={lead.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default LeadDetailsModal;

