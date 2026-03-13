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
const timelineAuthor = (item) => item?.createdByName || item?.userName || item?.performedBy || item?.author || item?.createdBy || "";
const timelineKind = (item) => {
  const raw = String(item?.type || item?.eventType || "").toLowerCase();
  if (raw.includes("call")) return "call";
  if (raw.includes("meeting")) return "meeting";
  if (raw.includes("email")) return "email";
  if (raw.includes("whatsapp")) return "whatsapp";
  if (raw.includes("attach")) return "attachment";
  if (raw.includes("note")) return "note";
  return "activity";
};
const timelineIcon = (item) => {
  const kind = timelineKind(item);
  if (kind === "meeting") return Calendar;
  if (kind === "call") return Phone;
  if (kind === "email") return Mail;
  if (kind === "attachment") return Paperclip;
  if (kind === "note") return FileText;
  return Activity;
};
const getApiErrorMessage = (error, fallback = "Unable to save") => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  if (Array.isArray(data?.errors)) return data.errors.join(", ");
  if (data?.errors && typeof data.errors === "object") {
    const messages = Object.values(data.errors).flat().filter(Boolean);
    if (messages.length) return messages.join(", ");
  }
  if (typeof error?.message === "string" && error.message.trim()) return error.message;
  return fallback;
};
const attachmentUrl = (a) => {
  const raw = a?.fileUrl || a?.url || a?.filePath || a?.path || "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${BASE_URL.replace(/\/api$/, "")}/${String(raw).replace(/^\/+/, "")}`;
};
const commKind = (type = "") => {
  const raw = String(type).toLowerCase();
  if (raw.includes("note")) return "notes";
  if (raw.includes("whatsapp")) return "whatsapp";
  if (raw.includes("email")) return "emails";
  if (raw.includes("call")) return "calls";
  if (raw.includes("meeting")) return "meetings";
  return "other";
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
    <aside style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", borderLeft: "1px solid #e2e8f0", background: "linear-gradient(180deg, #fbfdff 0%, #f4f8fc 100%)" }}>
      <div style={{ borderBottom: "1px solid #e2e8f0", background: "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)", padding: "20px 22px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em" }}>Lead Story</div>
            <div style={{ marginTop: 6, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Timeline</div>
            <div style={{ marginTop: 4, fontSize: 12.5, color: "#64748b", lineHeight: 1.5 }}>A clean view of status changes, communications, and lead updates.</div>
          </div>
          <button className="icon-btn" onClick={onRefresh} title="Refresh timeline" style={{ width: 40, height: 40, border: "1px solid #dbe4f0", borderRadius: 12, background: "#ffffff", boxShadow: "0 8px 20px rgba(148, 163, 184, 0.12)" }}><RefreshCw size={16} /></button>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 14px 22px 0" }}>
        {loading ? <div style={{ color: "#94a3b8", fontSize: 13, padding: "16px 6px" }}>Loading timeline...</div> : null}
        {!loading && !items.length ? (
          <div style={{ marginTop: 8, padding: "20px 18px", border: "1px solid #e2e8f0", borderRadius: 18, background: "rgba(255,255,255,0.92)", boxShadow: "0 18px 36px rgba(148, 163, 184, 0.12)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "#eef6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}><Activity size={18} /></div>
            <div style={{ marginTop: 14, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>No timeline updates yet</div>
            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.6, color: "#64748b" }}>When this lead gets notes, calls, meetings, or status changes, they will appear here in a clean activity stream.</div>
          </div>
        ) : null}
        {!loading && Object.entries(groups).map(([date, group]) => (
          <div key={date} style={{ marginBottom: 18 }}>
            <div style={{ position: "relative", paddingBottom: 12 }}>
              <div style={{ position: "absolute", left: 113, top: "calc(100% - 1px)", width: 1, height: 13, background: "#dbe4f0" }} />
              <div style={{ display: "inline-flex", minWidth: 160, justifyContent: "center", marginLeft: 33, padding: "8px 14px", border: "1px solid #dbe4f0", borderRadius: 6, background: "#ffffff", fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>{date}</div>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 113, top: 0, bottom: 0, width: 1, background: "#dbe4f0" }} />
              {group.map((item, idx) => {
                const EventIcon = timelineIcon(item);
                const author = timelineAuthor(item);
                const eventTitle = item.type || item.eventType || "Update";
                const eventDescription = timelineDescription(item);
                return (
                  <div key={`${timelineDateValue(item)}-${item.type || item.eventType || idx}`} style={{ display: "grid", gridTemplateColumns: "78px 42px minmax(0, 1fr)", gap: 10, alignItems: "start", paddingBottom: 22 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textAlign: "right", paddingTop: 10 }}>{fmtTime(timelineDateValue(item))}</div>
                    <div style={{ width: 42, display: "flex", justifyContent: "center" }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid #dbe4f0", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", position: "relative", zIndex: 1 }}>
                        <EventIcon size={15} />
                      </div>
                    </div>
                    <div style={{ paddingTop: 7, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1e293b", lineHeight: 1.35, wordBreak: "break-word" }}>{eventTitle}</div>
                      {eventDescription ? <div style={{ marginTop: 1, fontSize: 12.5, lineHeight: 1.45, color: "#334155", wordBreak: "break-word" }}>{eventDescription}</div> : null}
                      <div style={{ marginTop: 2, fontSize: 11.5, lineHeight: 1.35, color: "#64748b", wordBreak: "break-word" }}>
                        {author ? `by ${author} ` : ""}
                        {fmtDate(timelineDateValue(item), false)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function Lane({ title, Icon, items }) {
  return (
    <div style={{ minWidth: 0, flex: "1 1 0", display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid #e5e7eb", background: "#ffffff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#ffffff", border: "1px solid #e2e8f0", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={14} /></div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1e293b" }}>{title}</div>
        </div>
        <div style={{ minWidth: 24, height: 24, padding: "0 7px", borderRadius: 999, background: "#ffffff", border: "1px solid #e2e8f0", color: "#475569", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{items.length}</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px" }}>
        {!items.length ? (
          <div style={{ minHeight: 92, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #dbe4f0", borderRadius: 12, background: "#fbfdff", color: "#94a3b8", fontSize: 13, textAlign: "center" }}>No records found</div>
        ) : items.map((item) => (
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
  const hasAnyItems = tasks.length || meetings.length || calls.length;
  return (
    <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, background: "#ffffff", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #e5e7eb", background: "#ffffff" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{title}</div>
      </div>
      <div style={{ display: "flex", gap: 0, height: hasAnyItems ? 260 : "auto", overflowX: "auto", overflowY: "hidden", padding: 0, alignItems: "stretch" }}>
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
        const payload = {
          leadId: lead.id,
          subject: v.callSubject,
          callType: v.callType,
          callResult: v.callResult,
          description: v.callDescription,
          callStartTime: v.callStartTime,
          ...(lead.assignedToUserId ? { assignedToUserId: lead.assignedToUserId } : {}),
        };
        if (v.callMode === "schedule") await activitiesAPI.scheduleCall(payload); else await activitiesAPI.logCall(payload);
      }
      if (tab === "meetings") await activitiesAPI.createMeeting({
        leadId: lead.id,
        title: v.meetingTitle,
        startTime: v.meetingStartTime,
        endTime: v.meetingEndTime,
        ...(lead.assignedToUserId ? { assignedToUserId: lead.assignedToUserId } : {}),
        description: v.meetingProvider === "Offline" ? v.meetingDescription : `${v.meetingProvider} meeting requested${v.meetingDescription ? ` - ${v.meetingDescription}` : ""}`,
        location: v.meetingLocation || v.meetingProvider
      });
      Toast.success("Saved successfully");
      onSaved?.();
    } catch (e) {
      Toast.error(getApiErrorMessage(e, "Unable to save"));
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
  const [tab, setTab] = useState("activity"); const [activityView, setActivityView] = useState("open"); const [loading, setLoading] = useState(false); const [open, setOpen] = useState([]); const [closed, setClosed] = useState([]); const [comms, setComms] = useState([]);
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
  const activityItems = activityView === "open" ? open : closed;
  return (
    <section style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", background: "#ffffff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px 0", overflowX: "auto" }}>
        {TABS.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} style={{ border: "none", borderBottom: tab === id ? "2px solid #4f46e5" : "2px solid transparent", background: "transparent", color: tab === id ? "#4f46e5" : "#64748b", padding: "12px 4px 11px", marginRight: 12, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{id === "whatsapp" ? <FaWhatsapp size={16} /> : <Icon size={16} />}{label}</button>)}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        {loading && <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading details...</div>}
        {tab === "activity" && <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", border: "1.5px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "#ffffff" }}>
            {[
              ["open", `Open Activities (${open.length})`],
              ["closed", `Closed Activities (${closed.length})`],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActivityView(id)}
                style={{
                  border: "none",
                  borderRight: id === "open" ? "1px solid #e5e7eb" : "none",
                  padding: "7px 12px",
                  background: activityView === id ? "#eef2ff" : "transparent",
                  color: activityView === id ? "#4f46e5" : "#6b7280",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {label}
              </button>
            ))}
            </div>
          </div>
          <ActivitySection title={activityView === "open" ? "Open Activities" : "Closed Activities"} bg="#ffffff" items={activityItems} />
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
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(1480px, calc(100vw - 48px))", height: "min(88vh, 860px)", background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 32px 90px rgba(15, 23, 42, 0.22)", position: "relative" }}>
        <button className="icon-btn" onClick={onClose} title="Close" style={{ position: "absolute", top: 14, right: 16, zIndex: 2, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)" }}><X size={18} /></button>
        <div style={{ minHeight: "100%", display: "grid", gridTemplateColumns: "300px minmax(0, 1fr) 360px" }}>
          <LeftPanel lead={lead} />
          <Middle lead={lead} />
          <Timeline items={timeline} loading={timelineLoading} onRefresh={loadTimeline} />
        </div>
      </div>
    </div>
  );
}
