import { useEffect, useMemo, useState } from "react";
import { Activity, Calendar, FileText, Mail, MapPin, Paperclip, Phone, RefreshCw, Trash2, UploadCloud, UserCheck, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import leadsAPI from "../api/leads.api";
import activitiesAPI from "../api/activities.api";
import { BASE_URL } from "../api/apiClient";
import { formatLeadSource, formatStatus } from "../pages/leads/utils";
import Toast from "../utils/toast";

const TABS = [
  ["activity", "Activity", Activity],
  ["notes", "Notes", FileText],
  ["emails", "Emails", Mail],
  ["calls", "Calls", Phone],
  ["whatsapp", "WhatsApp", FaWhatsapp],
  ["meetings", "Meetings", Calendar],
  ["attachments", "Attachments", Paperclip],
];

const EMAIL_TEMPLATES = [
  { id: "intro", name: "Introduction", subject: "Intro from our team", body: "Hi {{name}},\n\nThank you for your interest. I would love to understand your requirements and help you with the next steps.\n\nRegards," },
  { id: "followup", name: "Follow Up", subject: "Following up on our conversation", body: "Hi {{name}},\n\nJust checking in on our pending discussion. Please let me know a suitable time to connect.\n\nRegards," },
];

const WHATSAPP_TEMPLATES = [
  { id: "intro", name: "Greeting", message: "Hi {{name}}, this is a quick introduction from our team. Happy to connect when convenient." },
  { id: "reminder", name: "Reminder", message: "Hi {{name}}, gentle reminder on our pending discussion. Please let me know a suitable time." },
];

const card = { border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", boxShadow: "none" };
const input = { width: "100%", minHeight: 38, padding: "10px 12px", border: "1px solid #dbe4f0", borderRadius: 12, outline: "none", fontSize: 13, color: "#334155", background: "#fff", boxSizing: "border-box" };

const hasValue = (v) => !(v === null || v === undefined || (typeof v !== "boolean" && String(v).trim() === ""));
const leadName = (lead) => [lead?.firstName, lead?.lastName].filter(Boolean).join(" ").trim() || lead?.name || "Lead";
const assignee = (lead) => lead?.assignee || lead?.assignedToUserName || lead?.assignedUserName || (lead?.assignedToUserId ? `User ${lead.assignedToUserId}` : "");
const fmtDate = (v, withTime = true) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("en-US", withTime ? { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric", year: "numeric" });
};
const hasRealDate = (v) => {
  if (!v) return false;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return false;
  return d.getUTCFullYear() > 1900;
};
const followUpDisplayValue = (lead) => {
  if (hasValue(lead?.followUpDate) && hasRealDate(lead.followUpDate)) {
    return fmtDate(lead.followUpDate, false);
  }
  const rawCandidates = [
    lead?.nextFollowUpAt,
    lead?.next_follow_up_at,
    lead?.nextFollowupAt,
  ];
  const rawMatch = rawCandidates.find((value) => hasRealDate(value));
  return rawMatch ? fmtDate(rawMatch, false) : "";
};
const fmtTime = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};
const timelineDateValue = (item) => item?.createdAt || item?.date || item?.eventDate || item?.updatedAt || item?.sentAt || item?.occurredAt || null;
const timelineDescription = (item) => String(item?.description || "").replace(/from\s+([A-Za-z]+)\s+to\s+([A-Za-z]+)/g, (_, from, to) => `from ${formatStatus(from)} to ${formatStatus(to)}`);
const attachmentUrl = (a) => {
  const raw = a?.fileUrl || a?.url || a?.filePath || a?.path || "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${BASE_URL.replace(/\/api$/, "")}/${String(raw).replace(/^\/+/, "")}`;
};
const commKind = (type = "") => {
  const raw = String(type).toLowerCase();
  if (raw.includes("whatsapp")) return "whatsapp";
  if (raw.includes("email")) return "emails";
  if (raw.includes("call")) return "calls";
  if (raw.includes("meeting")) return "meetings";
  return "notes";
};
const mapActivity = (x) => ({ id: x?.id, title: x?.title || x?.subject || x?.type || "Activity", type: x?.type || "Activity", description: x?.description || "", date: x?.activityDate || x?.dueDate || x?.createdAt, dueDate: x?.dueDate || x?.activityDate || x?.createdAt, status: x?.status || "", priority: x?.priority || "" });
const mapComm = (x) => ({ id: x?.id || `${x?.type}-${x?.date || x?.description}`, kind: commKind(x?.type), title: x?.type || "Update", description: x?.description || "", date: x?.date || x?.createdAt });

function InfoRow({ icon: Icon, label, value }) {
  if (!hasValue(value)) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 10, alignItems: "start", padding: "12px 0", borderBottom: "1px solid #edf2f7" }}>
      <div style={{ width: 28, height: 28, borderRadius: 10, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><Icon size={15} /></div>
      <div><div style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div><div style={{ marginTop: 4, fontSize: 13.5, color: "#1e293b", wordBreak: "break-word" }}>{value}</div></div>
    </div>
  );
}

function LeftPanel({ lead }) {
  const location = [lead?.address, lead?.city, lead?.state, lead?.country, lead?.zipCode || lead?.zip].filter(Boolean).join(", ");
  const initials = (leadName(lead).match(/\b\w/g) || []).join("").slice(0, 2).toUpperCase();
  return (
    <aside style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", borderRight: "1px solid #e5e7eb", background: "#fff" }}>
      <div style={{ padding: 22, borderBottom: "1px solid #e5e7eb", background: "linear-gradient(180deg, #f8faff 0%, #f3f6ff 100%)" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 62, height: 62, borderRadius: "50%", background: lead?.avatarBg || "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{leadName(lead)}</div>
            {hasValue(lead?.company) && <div style={{ marginTop: 4, fontSize: 13.5, color: "#64748b" }}>{lead.company}</div>}
            {hasValue(lead?.status) && <div style={{ display: "inline-flex", marginTop: 10, padding: "5px 10px", borderRadius: 999, background: "#eef2ff", color: "#4f46e5", fontSize: 12, fontWeight: 700 }}>{formatStatus(lead.status)}</div>}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 22px 18px" }}>
        <InfoRow icon={Mail} label="Email" value={lead?.email} />
        <InfoRow icon={Mail} label="Secondary Email" value={lead?.secondaryEmail} />
        <InfoRow icon={Phone} label="Phone" value={lead?.phone} />
        <InfoRow icon={Phone} label="Secondary Phone" value={lead?.secondaryPhone || lead?.mobile} />
        <InfoRow icon={UserCheck} label="Assignee" value={assignee(lead)} />
        <InfoRow icon={FileText} label="Position" value={lead?.position} />
        <InfoRow icon={FileText} label="Industry" value={lead?.industry} />
        <InfoRow icon={Paperclip} label="Source" value={lead?.source ? formatLeadSource(lead.source) : ""} />
        <InfoRow icon={Calendar} label="Follow Up" value={followUpDisplayValue(lead)} />
        <InfoRow icon={MapPin} label="Location" value={location} />
        <InfoRow icon={FileText} label="Website" value={lead?.website} />
        <InfoRow icon={FileText} label="Comments" value={lead?.comments} />
        <InfoRow icon={FileText} label="Description" value={lead?.description} />
      </div>
    </aside>
  );
}

function Timeline({ items, loading, onRefresh }) {
  const groups = useMemo(() => items.reduce((acc, item) => { const key = fmtDate(timelineDateValue(item), false); (acc[key] ||= []).push(item); return acc; }, {}), [items]);
  return (
    <aside style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", borderLeft: "1px solid #e2e8f0", background: "#fcfcfd" }}>
      <div style={{ borderBottom: "1px solid #e2e8f0", background: "#fcfcfd" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "0 22px" }}>
          <button style={{ border: "none", background: "transparent", padding: "14px 0 12px", borderBottom: "3px solid #4f46e5", color: "#0f172a", fontSize: 14, fontWeight: 800, cursor: "default" }}>History</button>
          <button style={{ border: "none", background: "transparent", padding: "14px 0 12px", color: "#475569", fontSize: 14, fontWeight: 700, cursor: "default" }}>Interactions</button>
        </div>
        <div style={{ padding: "18px 22px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Timeline History</div>
          <button className="icon-btn" onClick={onRefresh} title="Refresh timeline" style={{ width: 38, height: 38, border: "1px solid #dbe4f0", borderRadius: 10, background: "#fff" }}><RefreshCw size={16} /></button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 20px" }}>
        {loading ? <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading timeline...</div> : null}
        {!loading && !items.length ? <div style={{ color: "#94a3b8", fontSize: 13 }}>No timeline history available.</div> : null}
        {!loading && Object.entries(groups).map(([date, group]) => (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{ display: "inline-flex", minWidth: 132, justifyContent: "center", padding: "8px 12px", border: "1px solid #dbe4f0", borderRadius: 6, background: "#ffffff", fontSize: 12, fontWeight: 700, color: "#475569" }}>{date}</div>
            <div style={{ position: "relative", marginTop: 12, paddingLeft: 16 }}>
              <div style={{ position: "absolute", left: 25, top: 0, bottom: 0, width: 1, background: "#e2e8f0" }} />
              {group.map((item, idx) => (
                <div key={`${timelineDateValue(item)}-${item.type || item.eventType || idx}`} style={{ display: "grid", gridTemplateColumns: "72px 30px 1fr", gap: 12, alignItems: "start", paddingBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textAlign: "right", paddingTop: 3 }}>{fmtTime(timelineDateValue(item))}</div>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid #dbe4f0", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", position: "relative", zIndex: 1 }}><Activity size={14} /></div>
                  <div style={{ paddingTop: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}>{item.type || item.eventType || "Update"}</div>
                    <div style={{ marginTop: 2, fontSize: 12.5, lineHeight: 1.5, color: "#475569" }}>{timelineDescription(item)}</div>
                    <div style={{ marginTop: 2, fontSize: 12, color: "#64748b" }}>{fmtDate(timelineDateValue(item), false)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function Lane({ title, Icon, items }) {
  return (
    <div style={{ minWidth: 248, flex: "0 0 248px", height: 272, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid #e5e7eb", background: "#ffffff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#ffffff", border: "1px solid #e2e8f0", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={14} /></div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1e293b" }}>{title}</div>
        </div>
        <div style={{ minWidth: 24, height: 24, padding: "0 7px", borderRadius: 999, background: "#ffffff", border: "1px solid #e2e8f0", color: "#475569", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{items.length}</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px" }}>
        {!items.length ? <div style={{ minHeight: 110, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13, textAlign: "center" }}>No records found</div> : items.map((item) => (
          <div key={item.id} style={{ padding: "0 0 12px", marginBottom: 12, borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#334155" }}>{item.title}</div>
            {hasValue(item.description) && <div style={{ marginTop: 4, fontSize: 12.5, color: "#64748b", lineHeight: 1.45 }}>{item.description}</div>}
            <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>{fmtDate(item.date)}</div>
            {hasValue(item.status) && <div style={{ marginTop: 4, fontSize: 11.5, color: "#94a3b8" }}>{formatStatus(item.status)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitySection({ title, bg, items }) {
  const tasks = items.filter((x) => String(x.type).toLowerCase().includes("task"));
  const meetings = items.filter((x) => String(x.type).toLowerCase().includes("meeting"));
  const calls = items.filter((x) => String(x.type).toLowerCase().includes("call"));
  return (
    <section style={{ border: "1px solid #e2e8f0", borderRadius: 16, background: "#ffffff", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #e5e7eb", background: "#ffffff" }}>
        <div style={{ fontSize: 15.5, fontWeight: 800, color: "#1e293b" }}>{title}</div>
        <div style={{ padding: "5px 10px", borderRadius: 999, background: "#f8fafc", color: "#64748b", fontSize: 12, fontWeight: 800 }}>{items.length} items</div>
      </div>
      <div style={{ display: "flex", gap: 0, height: 260, overflowX: "auto", overflowY: "hidden", padding: 0 }}>
        <Lane title="Tasks" Icon={FileText} items={tasks} />
        <Lane title="Meetings" Icon={Calendar} items={meetings} />
        <Lane title="Calls" Icon={Phone} items={calls} />
      </div>
    </section>
  );
}

function Composer({ tab, lead, onSaved }) {
  const [templateId, setTemplateId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [v, setV] = useState({ note: "", toEmail: lead?.email || "", emailSubject: "", emailBody: "", whatsappMessage: "", whatsappDirection: "Outgoing", callSubject: "Follow-up call", callType: "Outgoing", callResult: "Connected", callDescription: "", callStartTime: new Date().toISOString().slice(0, 16), callMode: "log", meetingTitle: "Discovery Meeting", meetingDescription: "", meetingStartTime: new Date().toISOString().slice(0, 16), meetingEndTime: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16), meetingProvider: "Offline", meetingLocation: "" });
  const setField = (k, val) => setV((p) => ({ ...p, [k]: val }));
  const applyTemplate = (id) => {
    setTemplateId(id);
    if (tab === "emails") {
      const t = EMAIL_TEMPLATES.find((x) => x.id === id);
      if (t) setV((p) => ({ ...p, emailSubject: t.subject.replace("{{name}}", leadName(lead)), emailBody: t.body.replaceAll("{{name}}", leadName(lead)) }));
    }
    if (tab === "whatsapp") {
      const t = WHATSAPP_TEMPLATES.find((x) => x.id === id);
      if (t) setV((p) => ({ ...p, whatsappMessage: t.message.replaceAll("{{name}}", leadName(lead)) }));
    }
  };
  const submit = async () => {
    if (!lead?.id) return;
    setSubmitting(true);
    try {
      if (tab === "notes") await leadsAPI.addCommunication({ leadId: lead.id, type: "Note", message: v.note, createdBy: lead.assignedToUserId || 0 });
      if (tab === "emails") await leadsAPI.addCommunication({ leadId: lead.id, type: "Email", subject: v.emailSubject, body: v.emailBody, toEmail: v.toEmail || lead.email, createdBy: lead.assignedToUserId || 0 });
      if (tab === "whatsapp") await leadsAPI.addCommunication({ leadId: lead.id, type: "WhatsApp", message: v.whatsappMessage, direction: v.whatsappDirection, createdBy: lead.assignedToUserId || 0 });
      if (tab === "calls") {
        const payload = { leadId: lead.id, subject: v.callSubject, callType: v.callType, callResult: v.callResult, description: v.callDescription, callStartTime: v.callStartTime, assignedToUserId: lead.assignedToUserId || 0 };
        if (v.callMode === "schedule") await activitiesAPI.scheduleCall(payload); else await activitiesAPI.logCall(payload);
      }
      if (tab === "meetings") await activitiesAPI.createMeeting({ leadId: lead.id, title: v.meetingTitle, startTime: v.meetingStartTime, endTime: v.meetingEndTime, assignedToUserId: lead.assignedToUserId || 0, description: v.meetingProvider === "Offline" ? v.meetingDescription : `${v.meetingProvider} meeting requested${v.meetingDescription ? ` - ${v.meetingDescription}` : ""}`, location: v.meetingLocation || v.meetingProvider });
      Toast.success("Saved successfully");
      onSaved?.();
    } catch (e) {
      Toast.error(e?.response?.data?.message || "Unable to save");
    } finally {
      setSubmitting(false);
    }
  };
  if (tab === "activity" || tab === "attachments") return null;
  return (
    <div style={{ ...card, padding: 16 }}>
      {tab === "notes" && <textarea style={{ ...input, minHeight: 110, resize: "vertical" }} value={v.note} onChange={(e) => setField("note", e.target.value)} placeholder="Add a note for the sales team" />}
      {tab === "emails" && <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <select style={input} value={templateId} onChange={(e) => applyTemplate(e.target.value)}><option value="">Select template</option>{EMAIL_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <input style={input} value={v.toEmail} onChange={(e) => setField("toEmail", e.target.value)} placeholder="recipient@email.com" />
        <input style={{ ...input, gridColumn: "1 / -1" }} value={v.emailSubject} onChange={(e) => setField("emailSubject", e.target.value)} placeholder="Email subject" />
        <textarea style={{ ...input, minHeight: 120, resize: "vertical", gridColumn: "1 / -1" }} value={v.emailBody} onChange={(e) => setField("emailBody", e.target.value)} placeholder="Compose your email" />
      </div>}
      {tab === "whatsapp" && <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <select style={input} value={templateId} onChange={(e) => applyTemplate(e.target.value)}><option value="">Select template</option>{WHATSAPP_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <select style={input} value={v.whatsappDirection} onChange={(e) => setField("whatsappDirection", e.target.value)}><option value="Outgoing">Outgoing</option><option value="Incoming">Incoming</option></select>
        <textarea style={{ ...input, minHeight: 110, resize: "vertical", gridColumn: "1 / -1" }} value={v.whatsappMessage} onChange={(e) => setField("whatsappMessage", e.target.value)} placeholder="Write the WhatsApp message" />
      </div>}
      {tab === "calls" && <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <select style={input} value={v.callMode} onChange={(e) => setField("callMode", e.target.value)}><option value="log">Completed Call</option><option value="schedule">Scheduled Call</option></select>
        <select style={input} value={v.callType} onChange={(e) => setField("callType", e.target.value)}><option value="Outgoing">Outgoing</option><option value="Incoming">Incoming</option></select>
        <input style={input} value={v.callSubject} onChange={(e) => setField("callSubject", e.target.value)} placeholder="Call subject" />
        <input style={input} value={v.callResult} onChange={(e) => setField("callResult", e.target.value)} placeholder="Connected / No answer" />
        <input type="datetime-local" style={{ ...input, gridColumn: "1 / -1" }} value={v.callStartTime} onChange={(e) => setField("callStartTime", e.target.value)} />
        <textarea style={{ ...input, minHeight: 96, resize: "vertical", gridColumn: "1 / -1" }} value={v.callDescription} onChange={(e) => setField("callDescription", e.target.value)} placeholder="Call notes" />
      </div>}
      {tab === "meetings" && <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <select style={input} value={v.meetingProvider} onChange={(e) => setField("meetingProvider", e.target.value)}><option value="Offline">Offline</option><option value="Zoom">Zoom</option><option value="Teams">Teams</option></select>
        <input style={input} value={v.meetingTitle} onChange={(e) => setField("meetingTitle", e.target.value)} placeholder="Meeting title" />
        <input type="datetime-local" style={input} value={v.meetingStartTime} onChange={(e) => setField("meetingStartTime", e.target.value)} />
        <input type="datetime-local" style={input} value={v.meetingEndTime} onChange={(e) => setField("meetingEndTime", e.target.value)} />
        <input style={{ ...input, gridColumn: "1 / -1" }} value={v.meetingLocation} onChange={(e) => setField("meetingLocation", e.target.value)} placeholder={v.meetingProvider === "Offline" ? "Office / branch / address" : "Preferred attendees or channel notes"} />
        <textarea style={{ ...input, minHeight: 96, resize: "vertical", gridColumn: "1 / -1" }} value={v.meetingDescription} onChange={(e) => setField("meetingDescription", e.target.value)} placeholder="Meeting agenda or notes" />
        {v.meetingProvider !== "Offline" && <div style={{ gridColumn: "1 / -1", padding: "10px 12px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 12.5, color: "#475569" }}>{v.meetingProvider} integration UI is ready here. Backend still needs dedicated create and reschedule endpoints to return a real join link automatically.</div>}
      </div>}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}><button className="btn-primary" onClick={submit} disabled={submitting}>{submitting ? "Saving..." : tab === "emails" ? "Send Email" : tab === "whatsapp" ? "Send Message" : tab === "calls" ? "Save Call" : tab === "meetings" ? "Schedule Meeting" : "Save Note"}</button></div>
    </div>
  );
}

function Attachments({ leadId }) {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(false); const [uploading, setUploading] = useState(false);
  const load = async () => { if (!leadId) return; setLoading(true); try { const data = await leadsAPI.getAttachments(leadId); setItems(Array.isArray(data) ? data : []); } catch (e) { Toast.error(e?.response?.data?.message || "Unable to load attachments"); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [leadId]);
  const upload = async (e) => { const file = e.target.files?.[0]; if (!file || !leadId) return; setUploading(true); try { await leadsAPI.uploadAttachment(leadId, file); Toast.success("Attachment uploaded"); await load(); } catch (err) { Toast.error(err?.response?.data?.message || "Unable to upload attachment"); } finally { setUploading(false); e.target.value = ""; } };
  const remove = async (id) => { try { await leadsAPI.deleteAttachment(id); Toast.success("Attachment deleted"); await load(); } catch (err) { Toast.error(err?.response?.data?.message || "Unable to delete attachment"); } };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...card, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><div><div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Lead Attachments</div><div style={{ marginTop: 4, fontSize: 12.5, color: "#64748b" }}>Upload and review files saved against this lead.</div></div><label className="btn-primary" style={{ cursor: uploading ? "progress" : "pointer" }}><UploadCloud size={15} />{uploading ? "Uploading..." : "Add File"}<input type="file" hidden onChange={upload} /></label></div>
      <div style={{ ...card, padding: 16, minHeight: 260 }}>
        {loading ? <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading attachments...</div> : null}
        {!loading && !items.length ? <div style={{ color: "#94a3b8", fontSize: 13 }}>No attachments found.</div> : null}
        {!loading && items.map((a) => <div key={a.id || a.fileName} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid #eef2f7" }}><div><div style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b", wordBreak: "break-word" }}>{a.fileName || a.name || "Attachment"}</div><div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>{fmtDate(a.uploadedAt || a.createdAt)}</div></div><div style={{ display: "flex", alignItems: "center", gap: 8 }}>{attachmentUrl(a) ? <a href={attachmentUrl(a)} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textDecoration: "none" }}>Open</a> : null}<button className="icon-btn" onClick={() => remove(a.id)} title="Delete attachment"><Trash2 size={16} /></button></div></div>)}
      </div>
    </div>
  );
}

function Middle({ lead }) {
  const [tab, setTab] = useState("activity"); const [loading, setLoading] = useState(false); const [open, setOpen] = useState([]); const [closed, setClosed] = useState([]); const [comms, setComms] = useState([]);
  const load = async () => {
    if (!lead?.id) return;
    setLoading(true);
    try {
      const [openData, closedData, commData] = await Promise.all([activitiesAPI.getOpen({ leadId: lead.id }), activitiesAPI.getClosed({ leadId: lead.id }), leadsAPI.getCommunications(lead.id)]);
      setOpen((Array.isArray(openData) ? openData : []).map(mapActivity));
      setClosed((Array.isArray(closedData) ? closedData : []).map(mapActivity));
      setComms((Array.isArray(commData) ? commData : []).map(mapComm));
    } catch (e) {
      Toast.error(e?.response?.data?.message || "Unable to load lead details");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [lead?.id]);
  const filtered = useMemo(() => comms.filter((x) => x.kind === tab), [comms, tab]);
  return (
    <section style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", background: "#ffffff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px 0", overflowX: "auto" }}>
        {TABS.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} style={{ border: "none", borderBottom: tab === id ? "2px solid #4f46e5" : "2px solid transparent", background: "transparent", color: tab === id ? "#4f46e5" : "#64748b", padding: "12px 4px 11px", marginRight: 12, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{id === "whatsapp" ? <FaWhatsapp size={16} /> : <Icon size={16} />}{label}</button>)}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        {loading && <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading details...</div>}
        {tab === "activity" && <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
            {[["Total", open.length + closed.length], ["Open", open.length], ["Closed", closed.length], ["Next Due", open[0]?.dueDate ? fmtDate(open[0].dueDate, false) : "Not set"]].map(([label, value]) => <div key={label} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: "12px 14px", background: "#ffffff" }}><div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div><div style={{ marginTop: 8, fontSize: 16, fontWeight: 800, color: "#1e293b" }}>{value}</div></div>)}
          </div>
          <ActivitySection title="Open Activities" bg="#ffffff" items={open} />
          <ActivitySection title="Closed Activities" bg="#ffffff" items={closed} />
        </>}
        {tab !== "activity" && tab !== "attachments" && <>
          <Composer tab={tab} lead={lead} onSaved={load} />
          <div style={{ ...card, padding: 16, minHeight: 220, maxHeight: 420, overflowY: "auto" }}>
            {!filtered.length ? <div style={{ minHeight: 150, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>No {tab} history available.</div> : filtered.map((item) => <div key={item.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid #eef2f7" }}><div style={{ fontSize: 13.5, fontWeight: 800, color: "#1e293b" }}>{item.title}</div><div style={{ marginTop: 6, fontSize: 13, color: "#475569", lineHeight: 1.55 }}>{item.description || "No description"}</div><div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>{fmtDate(item.date)}</div></div>)}
          </div>
        </>}
        {tab === "attachments" && <Attachments leadId={lead?.id} />}
      </div>
    </section>
  );
}

export default function LeadDetailsModal({ lead, onClose }) {
  const [timeline, setTimeline] = useState([]); const [timelineLoading, setTimelineLoading] = useState(false);
  const loadTimeline = async () => { if (!lead?.id) return; setTimelineLoading(true); try { const data = await leadsAPI.getTimeline(lead.id); setTimeline(Array.isArray(data) ? data : []); } catch (e) { Toast.error(e?.response?.data?.message || "Unable to load timeline"); } finally { setTimelineLoading(false); } };
  useEffect(() => { loadTimeline(); }, [lead?.id]);
  useEffect(() => { const onKey = (e) => { if (e.key === "Escape") onClose?.(); }; document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey); }, [onClose]);
  return (
    <div className="overlay" onClick={onClose} style={{ padding: 24, zIndex: 700 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(1480px, calc(100vw - 48px))", height: "min(88vh, 860px)", background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 32px 90px rgba(15, 23, 42, 0.22)", display: "grid", gridTemplateRows: "64px 1fr" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 16px", borderBottom: "1px solid #e5e7eb", background: "#fff" }}><button className="icon-btn" onClick={onClose} title="Close"><X size={18} /></button></div>
        <div style={{ minHeight: 0, display: "grid", gridTemplateColumns: "300px minmax(0, 1fr) 360px" }}>
          <LeftPanel lead={lead} />
          <Middle lead={lead} />
          <Timeline items={timeline} loading={timelineLoading} onRefresh={loadTimeline} />
        </div>
      </div>
    </div>
  );
}
