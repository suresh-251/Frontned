import { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Phone,
  Mail,
  Calendar,
  FileText,
  Activity,
  MapPin,
  Briefcase,
  RefreshCw,
  UserCheck,
  Tag,
  CheckCircle,
  Paperclip,
  Download,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import leadsAPI from "../api/leads.api";
import activitiesAPI from "../api/activities.api";
import { BASE_URL } from "../api/apiClient";
import { formatLeadSource, formatStatus } from "../pages/leads/utils";

const EMPTY_VALUE = "-";
const TABS = [
  { k: "Activity", icon: Activity },
  { k: "Notes", icon: FileText },
  { k: "Emails", icon: Mail },
  { k: "Calls", icon: Phone },
  { k: "WhatsApp", icon: FaWhatsapp },
  { k: "Meetings", icon: Calendar },
  { k: "Attachments", icon: Paperclip },
];
const TYPE_MAP = { Notes: "note", Emails: "email", Calls: "call", WhatsApp: "whatsapp", Meetings: "meeting" };
const SYSTEM_TYPES = new Set(["created", "score-change", "status-change", "lead-created", "lead-updated", "assigned", "reassigned"]);
const STATUS_META = { FreshLead: { color: "#1e40af", bg: "#dbeafe" }, New: { color: "#1e40af", bg: "#dbeafe" } };
const ACTIVITY_ORDER = ["task", "meeting", "call", "note"];
const ACTIVITY_LABELS = { task: "Tasks", meeting: "Meetings", call: "Calls", note: "Notes" };
const ACTIVITY_ICONS = { task: CheckCircle, meeting: Calendar, call: Phone, note: FileText };
const SECTION_THEMES = {
  open: {
    cardBg: "#ffffff",
    panelBg: "#ffffff",
    panelBorder: "#e5e7eb",
    headerBg: "#f8fafc",
    headerColor: "#1f2937",
    laneBg: "#ffffff",
    laneBorder: "#e5e7eb",
    badgeBg: "#eef2ff",
    badgeColor: "#4f46e5",
    iconBg: "#eef2ff",
    iconColor: "#4f46e5",
    emptyBg: "#f8fafc",
    emptyBorder: "#e5e7eb",
  },
  closed: {
    cardBg: "#ffffff",
    panelBg: "#ffffff",
    panelBorder: "#e5e7eb",
    headerBg: "#fafaf9",
    headerColor: "#44403c",
    laneBg: "#ffffff",
    laneBorder: "#e7e5e4",
    badgeBg: "#fef3c7",
    badgeColor: "#a16207",
    iconBg: "#fef3c7",
    iconColor: "#a16207",
    emptyBg: "#fafaf9",
    emptyBorder: "#e7e5e4",
  },
};

const fmtDate = (d) => !d ? EMPTY_VALUE : new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtDateTime = (d) => !d ? EMPTY_VALUE : new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
const getInitials = (name) => name?.split(" ").map((part) => part[0]).join("").slice(0, 2) || "?";
const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.FreshLead;
const normalizeType = (value) => {
  const type = String(value || "note").toLowerCase();
  if (["todo", "task"].includes(type)) return "task";
  if (["meeting"].includes(type)) return "meeting";
  if (["call"].includes(type)) return "call";
  if (["whatsapp"].includes(type)) return "whatsapp";
  if (["email"].includes(type)) return "email";
  if (["note"].includes(type)) return "note";
  return type;
};
const isSystemType = (type) => SYSTEM_TYPES.has(String(type || "").toLowerCase());
const classify = (activity) => {
  const status = String(activity.status || "").toLowerCase();
  if (["closed", "completed", "done"].includes(status) || activity.completedAt || activity.closedAt) return "closed";
  if (!activity.date) return "open";
  return new Date(activity.date).getTime() < Date.now() ? "closed" : "open";
};
const isForLead = (item, leadId) => [item.leadId, item.leadID, item.lead?.id, item.relatedLeadId].some((value) => Number(value || 0) === Number(leadId));
const getActivityBucket = (activity) => {
  if (activity.type === "meeting") return "meeting";
  if (["call", "whatsapp", "email"].includes(activity.type)) return "call";
  if (activity.type === "task") return "task";
  return "note";
};
const isCommunicationActivity = (activity) => ["task", "meeting", "call", "whatsapp", "email", "note"].includes(activity.type);
const mapCommunications = (items) => (Array.isArray(items) ? items : []).map((item, index) => {
  const type = normalizeType(item.type);
  return {
    id: item.id || `${item.type || "activity"}-${index}`,
    type,
    rawType: String(item.type || type).toLowerCase(),
    notes: item.description || item.message || item.subject || "",
    date: item.date || item.meetingDate || item.createdAt || item.completedAt || item.closedAt || null,
    status: item.status || item.activityStatus || "",
    completedAt: item.completedAt,
    closedAt: item.closedAt,
  };
}).filter((item) => !isSystemType(item.rawType));
const getPayload = (tab, notes, lead) => tab === "Emails"
  ? { leadId: lead.id, type: "Email", subject: "Email", body: notes, toEmail: lead.email }
  : tab === "Calls"
    ? { leadId: lead.id, type: "Call", subject: "Call", description: notes, callType: "Outgoing", callResult: "Completed" }
    : tab === "Meetings"
      ? { leadId: lead.id, type: "Meeting", subject: "Meeting", description: notes, meetingDate: new Date().toISOString(), location: "Online" }
      : tab === "WhatsApp"
        ? { leadId: lead.id, type: "WhatsApp", subject: "WhatsApp", body: notes, toPhone: lead.phone }
        : { leadId: lead.id, type: "Note", message: notes };

function AttachmentPanel({ leadId }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leadsAPI.getAttachments(leadId);
      setAttachments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const loadActivitySections = async () => {
      try {
        const [openData, closedData] = await Promise.all([
          activitiesAPI.getOpen(),
          activitiesAPI.getClosed(),
        ]);
        const openList = mapCommunications(Array.isArray(openData) ? openData : []).filter((item) => isForLead(item, lead.id));
        const closedList = mapCommunications(Array.isArray(closedData) ? closedData : []).filter((item) => isForLead(item, lead.id));
        setOpenItems(openList);
        setClosedItems(closedList);
      } catch (error) {
        console.error(error);
        setOpenItems([]);
        setClosedItems([]);
      }
    };

    loadActivitySections();
  }, [lead.id, activities]);

  const onUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await leadsAPI.uploadAttachment(leadId, file);
      await load();
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const onDelete = async (id) => {
    setDeletingId(id);
    try {
      await leadsAPI.deleteAttachment(id);
      setAttachments((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, border: "1px dashed #cbd5e1", background: "#f8fafc", cursor: "pointer", width: "fit-content" }}>
        <UploadCloud size={16} color="#4f46e5" />
        <span>{uploading ? "Uploading..." : "Add Attachment"}</span>
        <input type="file" onChange={onUpload} style={{ display: "none" }} />
      </label>
      {loading ? <div>Loading attachments...</div> : attachments.length === 0 ? <div style={{ color: "#94a3b8" }}>No attachments uploaded yet.</div> : attachments.map((attachment, index) => {
        const href = attachment.url || attachment.fileUrl || attachment.downloadUrl || (attachment.filePath ? `${BASE_URL.replace(/\/api$/, "")}/${String(attachment.filePath).replace(/^\/+/, "")}` : "");
        const name = attachment.fileName || attachment.filename || attachment.name || `Attachment ${index + 1}`;
        return (
          <div key={attachment.id || index} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff" }}>
            <div>
              <div style={{ fontWeight: 700 }}>{name}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>ID: {attachment.id ?? EMPTY_VALUE}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {href && <a href={href} target="_blank" rel="noreferrer" style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #dbe2ea", display: "flex", alignItems: "center", justifyContent: "center" }} title="Open attachment" aria-label="Open attachment"><Download size={14} /></a>}
              <button onClick={() => onDelete(attachment.id)} disabled={deletingId === attachment.id} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #fecaca", color: "#dc2626", background: "#fff5f5" }}><Trash2 size={14} /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivitySummary({ openItems, closedItems }) {
  const total = openItems.length + closedItems.length;
  const nextItem = openItems.filter((item) => item.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  const cards = [
    { label: "Total", value: total, tone: "#312e81", bg: "#f8fafc" },
    { label: "Open", value: openItems.length, tone: "#1d4ed8", bg: "#f8fafc" },
    { label: "Closed", value: closedItems.length, tone: "#92400e", bg: "#f8fafc" },
    { label: "Next Due", value: nextItem ? fmtDate(nextItem.date) : "Not set", tone: "#0f766e", bg: "#f8fafc" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
      {cards.map((card) => (
        <div key={card.label} style={{ padding: "10px 12px", borderRadius: 12, background: card.bg, border: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{card.label}</div>
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: card.tone }}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}

function ActivityItem({ item, section }) {
  const statusText = item.status ? String(item.status) : section === "open" ? "Open" : "Closed";
  const owner = item.ownerName || item.assignedToUserName || item.assigneeName || item.userName || item.createdByName || "";

  return (
    <div style={{ padding: "14px 14px 12px", borderBottom: "1px solid #edf1f6", display: "grid", gap: 4, background: "#fff" }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#4f46e5", lineHeight: 1.35 }}>{item.notes || "Untitled"}</div>
      <div style={{ fontSize: 11.5, color: "#334155", lineHeight: 1.45 }}>{fmtDateTime(item.date)}</div>
      {owner && <div style={{ fontSize: 11.5, color: "#475569", lineHeight: 1.4 }}>{owner}</div>}
      <div style={{ marginTop: 2, fontSize: 10.5, fontWeight: 700, color: section === "open" ? "#475569" : "#92400e", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {statusText}
      </div>
    </div>
  );
}

function ActivityLane({ section, bucket, items }) {
  const Icon = ACTIVITY_ICONS[bucket];
  const sectionLabel = section === "open" ? "Open" : "Closed";
  const headerLabel = `${sectionLabel} ${ACTIVITY_LABELS[bucket]}`;

  return (
    <div style={{ minWidth: 260, flex: "0 0 260px", borderRight: "1px solid #edf1f6", background: "#fff" }}>
      <div style={{ height: 50, padding: "0 12px", borderBottom: "1px solid #dfe6ef", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "#fbfcfe" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, color: "#1f2937" }}>
          <Icon size={14} />
          <div style={{ fontSize: 12.5, fontWeight: 800 }}>{headerLabel}</div>
        </div>
        <span style={{ minWidth: 22, height: 22, borderRadius: 8, background: "#f1f5f9", color: "#334155", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{items.length}</span>
      </div>
      <div style={{ minHeight: 142, maxHeight: 240, overflowY: "auto", background: "#fff" }}>
        {items.length === 0 ? (
          <div style={{ minHeight: 110, color: "#8da0bf", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 16 }}>
            No records found
          </div>
        ) : items.map((item) => <ActivityItem key={item.id} item={item} section={section} />)}
      </div>
    </div>
  );
}

function ActivitySection({ title, section, items }) {
  return (
    <div style={{ borderRadius: 12, border: "1px solid #dfe6ef", background: "#fff", overflow: "hidden", boxShadow: "0 1px 2px rgba(15,23,42,0.03)" }}>
      <div style={{ height: 56, padding: "0 14px", borderBottom: "1px solid #dfe6ef", background: "#fbfcfe", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#1f2937" }}>{title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {section === "open" && (
            <button type="button" style={{ height: 30, padding: "0 12px", borderRadius: 6, border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4f46e5", fontSize: 12, fontWeight: 700 }}>
              Add New
            </button>
          )}
          <button type="button" style={{ height: 30, padding: "0 12px", borderRadius: 6, border: "1px solid #d7dee8", background: "#fff", color: "#475569", fontSize: 12, fontWeight: 600 }}>
            Column View
          </button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "flex", minWidth: "max-content" }}>
          {ACTIVITY_ORDER.map((bucket) => (
            <ActivityLane key={bucket} section={section} bucket={bucket} items={items.filter((item) => getActivityBucket(item) === bucket)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityTab({ openItems, closedItems }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <ActivitySection title="Open Activities" section="open" items={openItems} />
      <ActivitySection title="Closed Activities" section="closed" items={closedItems} />
    </div>
  );
}

function CommunicationList({ items }) {
  const grouped = items.reduce((acc, item) => {
    const key = item.date ? new Date(item.date).toDateString() : "Unknown";
    acc[key] ||= [];
    acc[key].push(item);
    return acc;
  }, {});

  return Object.entries(grouped).map(([day, dayItems]) => (
    <div key={day} style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 700, color: "#475569" }}>{day === "Unknown" ? "Unknown date" : fmtDate(new Date(day).toISOString())}</div>
      {dayItems.map((activity) => {
        const Icon = ACTIVITY_ICONS[getActivityBucket(activity)] || FileText;
        return (
          <div key={activity.id} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid #dbe2ea", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}><Icon size={14} /></div>
            <div style={{ padding: "10px 14px", borderRadius: 14, border: "1px solid #e6eaf2", background: "#fff", flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{activity.notes || "Untitled"}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{fmtDateTime(activity.date)}</div>
            </div>
          </div>
        );
      })}
    </div>
  ));
}

function MiddlePanel({ lead }) {
  const [activeTab, setActiveTab] = useState("Activity");
  const [notes, setNotes] = useState("");
  const [activities, setActivities] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await leadsAPI.getCommunications(lead.id);
      setActivities(mapCommunications(data));
    } catch (error) {
      console.error(error);
    }
  }, [lead.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const loadActivitySections = async () => {
      try {
        const [openData, closedData] = await Promise.all([
          activitiesAPI.getOpen(),
          activitiesAPI.getClosed(),
        ]);
        const openList = mapCommunications(Array.isArray(openData) ? openData : []).filter((item) => isForLead(item, lead.id));
        const closedList = mapCommunications(Array.isArray(closedData) ? closedData : []).filter((item) => isForLead(item, lead.id));
        setOpenItems(openList);
        setClosedItems(closedList);
      } catch (error) {
        console.error(error);
        setOpenItems([]);
        setClosedItems([]);
      }
    };

    loadActivitySections();
  }, [lead.id, activities]);

  const [openItems, setOpenItems] = useState([]);
  const [closedItems, setClosedItems] = useState([]);
  const communicationItems = useMemo(() => activities.filter(isCommunicationActivity), [activities]);
  const tabItems = useMemo(() => {
    if (activeTab === "Activity") return communicationItems;
    if (activeTab === "Attachments") return [];
    const type = TYPE_MAP[activeTab];
    return communicationItems.filter((item) => item.type === type);
  }, [activeTab, communicationItems]);

  const save = async () => {
    if (!notes.trim() || activeTab === "Attachments" || activeTab === "Activity") return;
    try {
      await leadsAPI.addCommunication(getPayload(activeTab, notes, lead));
      setNotes("");
      load();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", overflowX: "auto", background: "#fff" }}>
        {TABS.map(({ k, icon: Icon }) => (
          <button key={k} onClick={() => setActiveTab(k)} style={{ padding: "10px 16px", border: "none", borderBottom: activeTab === k ? "2px solid #4f46e5" : "2px solid transparent", background: "none", color: activeTab === k ? "#4f46e5" : "#6b7280", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <Icon size={14} />{k}
          </button>
        ))}
      </div>

      {activeTab !== "Attachments" && activeTab !== "Activity" && (
        <div style={{ padding: 16, borderBottom: "1px solid #eef2f7", background: "#fcfcff" }}>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder={`Add ${activeTab.toLowerCase()} details...`} style={{ width: "100%", padding: 12, border: "1.5px solid #e5e7eb", borderRadius: 8, resize: "none", background: "#fff" }} />
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={() => setNotes("")} style={{ padding: "6px 14px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff" }}>Cancel</button>
            <button onClick={save} style={{ padding: "6px 14px", border: "none", background: "#4f46e5", color: "white", borderRadius: 6 }}>Save</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: activeTab === "Attachments" ? 0 : 16, background: activeTab === "Activity" ? "#f8fafc" : "#fff" }}>
        {activeTab === "Attachments" ? <AttachmentPanel leadId={lead.id} /> : activeTab === "Activity" ? <ActivityTab openItems={openItems} closedItems={closedItems} /> : <CommunicationList items={tabItems} />}
      </div>
    </div>
  );
}

function DetailRow({ Icon, label, value, href }) {
  return <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}><div style={{ width: 24, height: 24, borderRadius: 7, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={12} color="#6b7280" /></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{label}</div>{href && value ? <a href={href} style={{ fontSize: 12.5, color: "#4f46e5", fontWeight: 500 }}>{value}</a> : <div style={{ fontSize: 12, color: "#111827", fontWeight: 500 }}>{value || EMPTY_VALUE}</div>}</div></div>;
}

function LeftPanel({ lead }) {
  const meta = getStatusMeta(lead.status);
  const fullAddress = lead.address || [lead.city, lead.state, lead.zipCode || lead.zip, lead.country].filter(Boolean).join(", ");

  return <div style={{ overflowY: "auto", height: "100%", minHeight: 0 }}><div style={{ background: "linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)", padding: 16, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 50, height: 50, borderRadius: "50%", background: lead.avatarBg || "#4f46e5", color: "white", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{getInitials(lead.name)}</div><div><div style={{ fontSize: 15, fontWeight: 700 }}>{lead.name}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{lead.company}</div><span style={{ marginTop: 4, display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, background: meta.bg, color: meta.color }}>{formatStatus(lead.status)}</span></div></div><div style={{ padding: 16 }}><DetailRow Icon={Mail} label="Primary Email" value={lead.email} href={lead.email ? `mailto:${lead.email}` : undefined} /><DetailRow Icon={Mail} label="Secondary Email" value={lead.secondaryEmail} href={lead.secondaryEmail ? `mailto:${lead.secondaryEmail}` : undefined} /><DetailRow Icon={Phone} label="Phone" value={lead.phone} href={lead.phone ? `tel:${lead.phone}` : undefined} /><DetailRow Icon={Phone} label="Mobile" value={lead.mobile} href={lead.mobile ? `tel:${lead.mobile}` : undefined} /><DetailRow Icon={Briefcase} label="Company" value={lead.company} /><DetailRow Icon={Briefcase} label="Title / Position" value={[lead.title, lead.position].filter(Boolean).join(" • ")} /><DetailRow Icon={Tag} label="Industry" value={lead.industry} /><DetailRow Icon={Tag} label="Source" value={formatLeadSource(lead.source)} /><DetailRow Icon={UserCheck} label="Assignee" value={lead.assignee} /><DetailRow Icon={Calendar} label="Follow-Up" value={lead.followUpDate ? fmtDate(lead.followUpDate) : "Not set"} /><DetailRow Icon={MapPin} label="Address" value={fullAddress} /><DetailRow Icon={Tag} label="Tags" value={lead.tags} /><DetailRow Icon={FileText} label="Comments" value={lead.comments} /></div></div>;
}

function RightPanel({ leadId }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const data = await leadsAPI.getTimeline(leadId);
      setTimeline(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const groupedTimeline = useMemo(() => timeline.reduce((acc, event, index) => {
    const key = event.date ? new Date(event.date).toDateString() : "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push({ ...event, _key: `${key}-${index}` });
    return acc;
  }, {}), [timeline]);

  const orderedDays = Object.keys(groupedTimeline).sort((a, b) => {
    if (a === "Unknown") return 1;
    if (b === "Unknown") return -1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden", background: "#fcfcff" }}><div style={{ padding: "14px 18px 10px", borderBottom: "1px solid #e7e7f3", display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ fontSize: 13, fontWeight: 800, color: "#1f2a44" }}>Timeline History</div><button onClick={fetchTimeline} style={{ background: "#fff", border: "1px solid #d9deeb", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}><RefreshCw size={13} /></button></div><div style={{ flex: 1, overflowY: "auto", padding: "14px 18px 18px" }}>{loading ? <div>Loading timeline...</div> : orderedDays.length === 0 ? <div style={{ color: "#94a3b8" }}>No timeline history yet.</div> : orderedDays.map((day) => <div key={day} style={{ marginBottom: 18 }}><div style={{ display: "inline-flex", alignItems: "center", minHeight: 34, padding: "0 14px", borderRadius: 8, border: "1px solid #d7dbeb", background: "#f9faff", color: "#334155", fontSize: 12, fontWeight: 700 }}>{day === "Unknown" ? "Unknown date" : fmtDate(new Date(day).toISOString())}</div><div style={{ marginTop: 10 }}>{groupedTimeline[day].map((event, index) => <div key={event._key} style={{ display: "grid", gridTemplateColumns: "80px 28px 1fr", gap: 12, alignItems: "start", position: "relative", paddingBottom: index === groupedTimeline[day].length - 1 ? 6 : 18 }}><div style={{ fontSize: 12, color: "#334155", fontWeight: 500, paddingTop: 4 }}>{event.date ? new Date(event.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "--"}</div><div style={{ position: "relative", display: "flex", justifyContent: "center" }}>{index !== groupedTimeline[day].length - 1 && <span style={{ position: "absolute", top: 28, bottom: -18, width: 1, background: "#d7dbeb" }} />}<div style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #cfd6ea", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", boxShadow: "0 1px 2px rgba(15,23,42,0.06)" }}><Activity size={14} /></div></div><div style={{ paddingTop: 1 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: "#1f2a44" }}>{event.type || "Update"}</div><div style={{ marginTop: 2, fontSize: 12.5, color: "#334155", lineHeight: 1.45 }}>{event.description || EMPTY_VALUE}</div>{event.date && <div style={{ marginTop: 2, fontSize: 12, color: "#64748b" }}>{fmtDate(event.date)}</div>}</div></div>)}</div></div>)}</div></div>;
}

export default function LeadDetailsModal({ lead, onClose }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return <><div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 500, opacity: animated ? 1 : 0 }} /><div style={{ position: "fixed", inset: 0, zIndex: 501, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, pointerEvents: "none" }}><div onClick={(event) => event.stopPropagation()} style={{ pointerEvents: "all", width: "min(1280px, 96vw)", height: "min(780px, 92vh)", background: "white", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", overflow: "hidden", transform: animated ? "scale(1)" : "scale(0.95)", opacity: animated ? 1 : 0, transition: "all .2s ease" }}><div style={{ padding: "13px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", background: "#fafafa" }}><button onClick={onClose} style={{ background: "none", border: "1.5px solid #e5e7eb", borderRadius: 6, padding: 6 }}><X size={15} color="#6b7280" /></button></div><div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "250px minmax(0, 1fr) 360px", overflow: "hidden" }}><div style={{ borderRight: "1px solid #e5e7eb", minHeight: 0, overflow: "hidden" }}><LeftPanel lead={lead} /></div><div style={{ minHeight: 0, overflow: "hidden" }}><MiddlePanel lead={lead} /></div><div style={{ borderLeft: "1px solid #e5e7eb", background: "#fafbfc", minHeight: 0, overflow: "hidden" }}><RightPanel leadId={lead.id} /></div></div></div></div></>;
}




