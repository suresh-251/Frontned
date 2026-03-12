import { useState, useEffect, useCallback, useMemo } from "react";
import { X, Phone, Mail, Calendar, Plus, FileText, Activity, MapPin, Briefcase, TrendingUp, RefreshCw, UserCheck, Tag, CheckCircle, Paperclip, Download, Trash2, UploadCloud } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import leadsAPI from "../api/leads.api";
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
const ICON_MAP = { email: Mail, call: Phone, meeting: Calendar, note: FileText, whatsapp: FaWhatsapp, created: Plus, "score-change": TrendingUp, task: CheckCircle };
const STATUS_META = { FreshLead: { color: "#1e40af", bg: "#dbeafe" }, New: { color: "#1e40af", bg: "#dbeafe" } };
const BUCKET_ORDER = ["task", "meeting", "call", "note"];
const BUCKET_LABELS = { task: "Tasks", meeting: "Meetings", call: "Calls", note: "Notes" };
const BUCKET_ICONS = { task: CheckCircle, meeting: Calendar, call: Phone, note: FileText };

const fmtDate = (d) => !d ? EMPTY_VALUE : new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtDateTime = (d) => !d ? EMPTY_VALUE : new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
const getInitials = (name) => name?.split(" ").map((part) => part[0]).join("").slice(0, 2) || "?";
const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.FreshLead;
const classify = (activity) => {
  const status = String(activity.status || "").toLowerCase();
  if (["closed", "completed", "done"].includes(status) || activity.completedAt || activity.closedAt) return "closed";
  if (!activity.date) return "open";
  return new Date(activity.date).getTime() < Date.now() ? "closed" : "open";
};
const getActivityBucket = (activity) => {
  const type = String(activity.type || "note").toLowerCase();
  if (["meeting"].includes(type)) return "meeting";
  if (["call", "whatsapp", "email"].includes(type)) return "call";
  if (["task", "todo"].includes(type)) return "task";
  return "note";
};
const mapCommunications = (items) => (Array.isArray(items) ? items : []).map((item, index) => ({
  id: item.id || `${item.type || "activity"}-${index}`,
  type: String(item.type || "note").toLowerCase(),
  notes: item.description || item.message || item.subject || "",
  date: item.date || item.meetingDate || item.createdAt || item.completedAt || item.closedAt || null,
  status: item.status || item.activityStatus || "",
  completedAt: item.completedAt,
  closedAt: item.closedAt,
}));
const getPayload = (tab, notes, lead) => tab === "Emails"
  ? { leadId: lead.id, type: "Email", subject: "Email", body: notes, toEmail: lead.email }
  : tab === "Calls"
    ? { leadId: lead.id, type: "Call", subject: "Call", description: notes, callType: "Outgoing", callResult: "Completed" }
    : tab === "Meetings"
      ? { leadId: lead.id, type: "Meeting", subject: "Meeting", description: notes, meetingDate: new Date().toISOString(), location: "Online" }
      : tab === "WhatsApp"
        ? { leadId: lead.id, type: "WhatsApp", subject: "WhatsApp", body: notes, toPhone: lead.phone }
        : { leadId: lead.id, type: "Note", message: notes };
const buildBuckets = (items) => BUCKET_ORDER.map((bucket) => ({
  key: bucket,
  label: BUCKET_LABELS[bucket],
  icon: BUCKET_ICONS[bucket],
  items: items.filter((item) => getActivityBucket(item) === bucket),
}));

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

  return <div style={{ padding: 16, display: "grid", gap: 12 }}><label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, border: "1px dashed #cbd5e1", background: "#f8fafc", cursor: "pointer", width: "fit-content" }}><UploadCloud size={16} color="#4f46e5" /><span>{uploading ? "Uploading..." : "Add Attachment"}</span><input type="file" onChange={onUpload} style={{ display: "none" }} /></label>{loading ? <div>Loading attachments...</div> : attachments.length === 0 ? <div style={{ color: "#94a3b8" }}>No attachments uploaded yet.</div> : attachments.map((attachment, index) => { const href = attachment.url || attachment.fileUrl || attachment.downloadUrl; const name = attachment.fileName || attachment.name || `Attachment ${index + 1}`; return <div key={attachment.id || index} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 14px", borderRadius: 14, border: "1px solid #e5e7eb" }}><div><div style={{ fontWeight: 700 }}>{name}</div><div style={{ fontSize: 12, color: "#64748b" }}>ID: {attachment.id ?? EMPTY_VALUE}</div></div><div style={{ display: "flex", gap: 8 }}>{href && <a href={href} target="_blank" rel="noreferrer" style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #dbe2ea", display: "flex", alignItems: "center", justifyContent: "center" }}><Download size={14} /></a>}<button onClick={() => onDelete(attachment.id)} disabled={deletingId === attachment.id} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #fecaca", color: "#dc2626", background: "#fff5f5" }}><Trash2 size={14} /></button></div></div>; })}</div>;
}

function ActivityCard({ item, tone }) {
  const Icon = ICON_MAP[item.type] || FileText;

  return <div style={{ padding: 12, borderRadius: 12, background: "#fff", border: `1px solid ${tone.border}`, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><div style={{ width: 28, height: 28, borderRadius: 9, background: tone.iconBg, color: tone.iconColor, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={14} /></div><div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{item.notes || "Untitled"}</div></div><div style={{ fontSize: 12, color: "#64748b" }}>{fmtDateTime(item.date)}</div><div style={{ marginTop: 6, fontSize: 11.5, color: tone.iconColor, fontWeight: 700, textTransform: "capitalize" }}>{item.status || classify(item)}</div></div>;
}

function ActivityBucketColumn({ sectionTitle, title, icon: Icon, items, tone, isLast }) {
  return <div style={{ minWidth: 280, flex: "0 0 280px", paddingRight: 16, borderRight: isLast ? "none" : `1px solid ${tone.divider}` }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontWeight: 800, color: "#1f2937" }}><Icon size={15} color={tone.iconColor} /><span>{sectionTitle} {title}</span><span style={{ minWidth: 22, height: 22, borderRadius: 999, background: tone.countBg, color: tone.iconColor, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{items.length}</span></div><div style={{ maxHeight: 230, overflowY: "auto", paddingRight: 4, display: "grid", gap: 10 }}>{items.length === 0 ? <div style={{ padding: 18, borderRadius: 12, border: `1px dashed ${tone.border}`, background: tone.emptyBg, color: "#94a3b8", fontSize: 12, textAlign: "center" }}>No records found</div> : items.map((item) => <ActivityCard key={item.id} item={item} tone={tone} />)}</div></div>;
}

function ActivitySection({ title, items, tone }) {
  const sectionLabel = title.replace(" Activities", "");
  const buckets = buildBuckets(items);

  return <div style={{ border: `1px solid ${tone.border}`, borderRadius: 18, overflow: "hidden", background: "#fff" }}><div style={{ padding: "14px 16px", borderBottom: `1px solid ${tone.border}`, background: tone.headerBg, fontWeight: 800, color: tone.headerColor }}>{title}</div><div style={{ padding: 16, overflowX: "auto" }}><div style={{ display: "flex", gap: 0, minWidth: "max-content" }}>{buckets.map((bucket, index) => <ActivityBucketColumn key={bucket.key} sectionTitle={sectionLabel} title={bucket.label} icon={bucket.icon} items={bucket.items} tone={tone} isLast={index === buckets.length - 1} />)}</div></div></div>;
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

  const filtered = useMemo(() => activeTab === "Activity" ? activities : activities.filter((item) => item.type === TYPE_MAP[activeTab]), [activities, activeTab]);
  const grouped = useMemo(() => filtered.reduce((acc, item) => {
    const key = item.date ? new Date(item.date).toDateString() : "Unknown";
    acc[key] ||= [];
    acc[key].push(item);
    return acc;
  }, {}), [filtered]);
  const openItems = useMemo(() => activities.filter((item) => classify(item) === "open"), [activities]);
  const closedItems = useMemo(() => activities.filter((item) => classify(item) === "closed"), [activities]);

  const save = async () => {
    if (!notes.trim() || activeTab === "Attachments") return;
    try {
      await leadsAPI.addCommunication(getPayload(activeTab, notes, lead));
      setNotes("");
      load();
    } catch (error) {
      console.error(error);
    }
  };

  return <div style={{ display: "flex", flexDirection: "column", height: "100%" }}><div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", overflowX: "auto" }}>{TABS.map(({ k, icon: Icon }) => <button key={k} onClick={() => setActiveTab(k)} style={{ padding: "10px 16px", border: "none", borderBottom: activeTab === k ? "2px solid #4f46e5" : "none", background: "none", color: activeTab === k ? "#4f46e5" : "#6b7280", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><Icon size={14} />{k}</button>)}</div>{activeTab !== "Attachments" && <div style={{ padding: 16 }}><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder={`Add ${activeTab.toLowerCase()} details...`} style={{ width: "100%", padding: 12, border: "1.5px solid #e5e7eb", borderRadius: 8, resize: "none" }} /><div style={{ marginTop: 8, display: "flex", gap: 8 }}><button onClick={() => setNotes("")} style={{ padding: "6px 14px", border: "1px solid #e5e7eb", borderRadius: 6 }}>Cancel</button><button onClick={save} style={{ padding: "6px 14px", border: "none", background: "#4f46e5", color: "white", borderRadius: 6 }}>Save</button></div></div>}<div style={{ flex: 1, overflowY: "auto", padding: activeTab === "Attachments" ? 0 : "0 16px 16px" }}>{activeTab === "Attachments" ? <AttachmentPanel leadId={lead.id} /> : activeTab === "Activity" ? <div style={{ display: "grid", gap: 16 }}><ActivitySection title="Open Activities" items={openItems} tone={{ border: "#dbeafe", divider: "#e2e8f0", headerBg: "#eff6ff", headerColor: "#1d4ed8", iconColor: "#1d4ed8", iconBg: "#dbeafe", countBg: "#dbeafe", emptyBg: "#f8fbff" }} /><ActivitySection title="Closed Activities" items={closedItems} tone={{ border: "#fde7c7", divider: "#f3e3c1", headerBg: "#fffbeb", headerColor: "#b45309", iconColor: "#b45309", iconBg: "#fef3c7", countBg: "#fef3c7", emptyBg: "#fffdfa" }} /></div> : Object.entries(grouped).map(([day, items]) => <div key={day} style={{ marginBottom: 20 }}><div style={{ marginBottom: 10, fontSize: 13, fontWeight: 700, color: "#475569" }}>{fmtDate(day)}</div>{items.map((activity) => { const Icon = ICON_MAP[activity.type] || FileText; return <div key={activity.id} style={{ display: "flex", gap: 12, marginBottom: 12 }}><div style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid #dbe2ea", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={14} /></div><div style={{ padding: "10px 14px", borderRadius: 14, border: "1px solid #e6eaf2", background: "#fff", flex: 1 }}><div style={{ fontWeight: 700 }}>{activity.notes || "Untitled"}</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{classify(activity)} · {fmtDateTime(activity.date)}</div></div></div>; })}</div>)}</div></div>;
}

function DetailRow({ Icon, label, value, href }) {
  return <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #f3f4f6" }}><div style={{ width: 24, height: 24, borderRadius: 7, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={12} color="#6b7280" /></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{label}</div>{href && value ? <a href={href} style={{ fontSize: 12.5, color: "#4f46e5", fontWeight: 500 }}>{value}</a> : <div style={{ fontSize: 12, color: "#111827", fontWeight: 500 }}>{value || EMPTY_VALUE}</div>}</div></div>;
}

function LeftPanel({ lead }) {
  const meta = getStatusMeta(lead.status);

  return <div style={{ overflowY: "auto", height: "100%" }}><div style={{ background: "linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)", padding: 16, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 50, height: 50, borderRadius: "50%", background: lead.avatarBg || "#4f46e5", color: "white", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{getInitials(lead.name)}</div><div><div style={{ fontSize: 15, fontWeight: 700 }}>{lead.name}</div><div style={{ fontSize: 12, color: "#6b7280" }}>{lead.company}</div><span style={{ marginTop: 4, display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, background: meta.bg, color: meta.color }}>{formatStatus(lead.status)}</span></div></div><div style={{ padding: 16 }}><DetailRow Icon={Mail} label="Email" value={lead.email} href={`mailto:${lead.email}`} /><DetailRow Icon={Phone} label="Phone" value={lead.phone} href={`tel:${lead.phone}`} /><DetailRow Icon={Briefcase} label="Company" value={lead.company} /><DetailRow Icon={Tag} label="Source" value={formatLeadSource(lead.source)} /><DetailRow Icon={UserCheck} label="Owner" value={lead.assignee} /><DetailRow Icon={Calendar} label="Follow-Up" value={lead.followUpDate ? fmtDate(lead.followUpDate) : "Not set"} /><DetailRow Icon={MapPin} label="Address" value={lead.address || [lead.city, lead.state, lead.zip, lead.country].filter(Boolean).join(", ")} /></div></div>;
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

  return <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}><div style={{ padding: "16px 18px 14px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ fontSize: 13, fontWeight: 800 }}>Timeline History</div><button onClick={fetchTimeline} style={{ background: "#fff", border: "1px solid #d9deeb", borderRadius: 10, width: 34, height: 34 }}><RefreshCw size={13} /></button></div><div style={{ flex: 1, overflowY: "auto", padding: 18 }}>{loading ? <div>Loading timeline...</div> : timeline.map((event, index) => <div key={index} style={{ marginBottom: 16, padding: 12, borderRadius: 14, border: "1px solid #e6eaf2", background: "#fff" }}><div style={{ fontSize: 12, fontWeight: 800, color: "#4f46e5" }}>{event.type}</div><div style={{ marginTop: 4, fontSize: 12.5, color: "#334155" }}>{event.description || EMPTY_VALUE}</div><div style={{ marginTop: 6, fontSize: 11.5, color: "#94a3b8" }}>{fmtDateTime(event.date)}</div></div>)}</div></div>;
}

export default function LeadDetailsModal({ lead, onClose }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return <><div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 500, opacity: animated ? 1 : 0 }} /><div style={{ position: "fixed", inset: 0, zIndex: 501, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, pointerEvents: "none" }}><div onClick={(event) => event.stopPropagation()} style={{ pointerEvents: "all", width: "min(1280px, 96vw)", height: "min(780px, 92vh)", background: "white", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", overflow: "hidden", transform: animated ? "scale(1)" : "scale(0.95)", opacity: animated ? 1 : 0, transition: "all .2s ease" }}><div style={{ padding: "13px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", background: "#fafafa" }}><button onClick={onClose} style={{ background: "none", border: "1.5px solid #e5e7eb", borderRadius: 6, padding: 6 }}><X size={15} color="#6b7280" /></button></div><div style={{ flex: 1, display: "grid", gridTemplateColumns: "250px 1fr 360px", overflow: "hidden" }}><div style={{ borderRight: "1px solid #e5e7eb" }}><LeftPanel lead={lead} /></div><div style={{ overflow: "hidden" }}><MiddlePanel lead={lead} /></div><div style={{ borderLeft: "1px solid #e5e7eb", background: "#fafbfc" }}><RightPanel leadId={lead.id} /></div></div></div></div></>;
}
