import { useEffect, useMemo, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Calendar,
  Edit3,
  FileText,
  Mail,
  MapPin,
  Paperclip,
  Phone,
  Trash2,
  UploadCloud,
  UserCheck,
  X,
} from "lucide-react";
import leadsAPI from "../../api/leads.api";
import activitiesAPI from "../../api/activities.api";
import meetingsAPI from "../../api/meetings.api";
import Toast from "../../utils/toast";
import { formatLeadSource, formatStatus } from "../../pages/leads/utils";
import { InfoRow } from "./fields";
import DetailTabsRail from "../detailMiddle/DetailTabsRail";
import ActivitySection from "./middle/ActivitySection";
import Composer from "./middle/Composer";
import NotesSection from "./middle/NotesSection";
import TabHistoryTimeline from "./middle/TabHistoryTimeline";
import {
  CONTACT_ROLE_OPTIONS,
  CONTACT_SHORTCUTS,
  DEAL_STAGE_OPTIONS,
  assignee,
  attachmentUrl,
  card,
  compactMeetingDate,
  contactShortcutButtonStyle,
  contactShortcutIconColor,
  contactShortcutKeyframes,
  followUpDisplayValue,
  fmtDate,
  fmtTime,
  getApiErrorMessage,
  handleContactShortcutMouseDown,
  handleContactShortcutMouseEnter,
  handleContactShortcutMouseLeave,
  handleContactShortcutMouseUp,
  hasValue,
  leadName,
  mapActivity,
  mapComm,
  mapMeetingRecord,
  meetingMetaValue,
  runContactShortcutAction,
  sanitizePhoneNumber,
  timelineAuthor,
  timelineDateValue,
  timelineDescription,
  timelineIcon,
} from "./shared";

const LEAD_TABS = [
  ["activity", "Activity", Activity],
  ["tasks", "Tasks", UserCheck],
  ["notes", "Notes", FileText],
  ["emails", "Emails", Mail],
  ["calls", "Calls", Phone],
  ["whatsapp", "WhatsApp", FaWhatsapp],
  ["meetings", "Meetings", Calendar],
  ["attachments", "Attachments", Paperclip],
];

const mapTaskTimelineItem = (item, index) => {
  const rawType = String(item?.type || item?.eventType || "Task").trim();
  const rawDescription = String(item?.description || "").trim();
  const cleanedDescription = rawDescription
    .replace(/^Task\s+(created|updated|deleted)\s*:\s*/i, "")
    .trim();

  return {
    id: item?.id || `task-timeline-${index}-${item?.date || rawType}`,
    kind: "tasks",
    title: cleanedDescription || rawType,
    description: cleanedDescription && cleanedDescription !== rawType ? rawType : "",
    date: item?.date || item?.createdAt || item?.eventDate || item?.updatedAt || null,
    author: item?.createdByName || item?.userName || item?.author || item?.createdBy || "",
    rawDescription,
  };
};

const mapCallTimelineItem = (item, index) => {
  const rawType = String(item?.type || item?.eventType || "Call").trim();
  const rawDescription = String(item?.description || "").trim();
  const cleanedDescription = rawDescription
    .replace(/^Call\s+(completed|logged|scheduled)\s*:\s*/i, "")
    .trim();

  return {
    id: item?.id || `call-timeline-${index}-${item?.date || rawType}`,
    kind: "calls",
    title: cleanedDescription || rawType,
    description: cleanedDescription && cleanedDescription !== rawType ? rawType : rawDescription,
    date: item?.date || item?.createdAt || item?.eventDate || item?.updatedAt || null,
    author: item?.createdByName || item?.userName || item?.author || item?.createdBy || "",
  };
};

const truncatePreview = (value = "", limit = 110) => {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit).trimEnd()}...`;
};

export function LeftPanel({ lead, onConvert, onOpenTab, stacked = false, mobile = false, hideAvatar = false }) {
  const location = [lead?.address, lead?.city, lead?.state, lead?.country, lead?.zipCode || lead?.zip].filter(Boolean).join(", ");
  const initials = (leadName(lead).match(/\b\w/g) || []).join("").slice(0, 2).toUpperCase();
  const callableNumber = String(lead?.phone || lead?.mobile || lead?.secondaryPhone || "").trim();
  const whatsappNumber = sanitizePhoneNumber(lead?.mobile || lead?.phone || lead?.secondaryPhone || "");
  const emailAddress = String(lead?.email || lead?.secondaryEmail || "").trim();
  const canCall = hasValue(lead?.phone) || hasValue(lead?.mobile) || hasValue(lead?.secondaryPhone);
  const canWhatsapp = canCall;
  const canEmail = hasValue(lead?.email) || hasValue(lead?.secondaryEmail);
  const shortcutEnabled = {
    calls: canCall,
    whatsapp: canWhatsapp,
    emails: canEmail,
  };
  const handleShortcutClick = (id) => runContactShortcutAction({ id, callableNumber, whatsappNumber, emailAddress, onOpenTab });
  return (
    <aside style={{ height: mobile ? "auto" : "100%", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", borderRight: stacked ? "none" : "1px solid #e5e7eb", borderBottom: stacked ? "1px solid #e5e7eb" : "none", background: "#fff" }}>
      <div style={{ padding: hideAvatar ? "16px 18px" : 18, borderBottom: "1px solid #e5e7eb", background: "linear-gradient(180deg, #f8faff 0%, #f3f6ff 100%)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {!hideAvatar ? <div style={{ width: 52, height: 52, borderRadius: "50%", background: lead?.avatarBg || "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 800 }}>{initials}</div> : null}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{leadName(lead)}</div>
            {hasValue(lead?.company) && <div style={{ marginTop: 4, fontSize: 11.5, color: "#64748b" }}>{lead.company}</div>}
            {hasValue(lead?.status) && <div style={{ display: "inline-flex", marginTop: 10, padding: "5px 10px", borderRadius: 999, background: "#eef2ff", color: "#4f46e5", fontSize: 11, fontWeight: 700 }}>{formatStatus(lead.status)}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 18 }}>
          {CONTACT_SHORTCUTS.map(({ id, label, icon: Icon }) => {
            const enabled = shortcutEnabled[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => enabled && handleShortcutClick(id)}
                disabled={!enabled}
                title={label}
                aria-label={label}
                style={contactShortcutButtonStyle(enabled)}
                onMouseEnter={(event) => handleContactShortcutMouseEnter(event, enabled)}
                onMouseLeave={(event) => handleContactShortcutMouseLeave(event, enabled)}
                onMouseDown={(event) => handleContactShortcutMouseDown(event, enabled)}
                onMouseUp={(event) => handleContactShortcutMouseUp(event, enabled)}
              >
                <Icon size={13} color={contactShortcutIconColor(enabled)} />
              </button>
            );
          })}
        </div>
        <style>{`
          ${contactShortcutKeyframes}
          .lead-details-datepicker-popper {
            z-index: 900 !important;
          }

          .lead-details-datepicker-wrapper {
            display: block;
            width: 100%;
          }

          .lead-details-datepicker-wrapper .react-datepicker__input-container {
            display: block;
            width: 100%;
          }
        `}</style>
        <button
          type="button"
          onClick={onConvert}
          style={{
            marginTop: 18,
            display: "block",
            width: 118,
            marginLeft: "auto",
            marginRight: "auto",
            padding: "9px 0",
            border: "1px solid #bbf7d0",
            borderRadius: 12,
            background: "#f0fdf4",
            color: "#166534",
            fontSize: 11.5,
            fontWeight: 800,
            cursor: "pointer",
            lineHeight: 1.1,
          }}
        >
          Convert To Deal
        </button>
      </div>
      <div style={{ flex: mobile ? "0 0 auto" : 1, minHeight: 0, overflowY: mobile ? "visible" : "auto", padding: "0 18px 16px" }}>
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

export function ConvertToDealModal({ lead, onClose, onConverted }) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    amount: "",
    closingDate: "",
    stage: "New",
    contactRole: "Purchasing",
  });

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async () => {
    const nextErrors = {};
    if (!String(form.amount).trim() || Number(form.amount) <= 0) nextErrors.amount = "Enter a valid deal amount.";
    if (!String(form.closingDate).trim()) nextErrors.closingDate = "Closing date is required.";
    if (!String(form.stage).trim()) nextErrors.stage = "Stage is required.";
    if (!String(form.contactRole).trim()) nextErrors.contactRole = "Contact role is required.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      Toast.error("Please complete the deal details.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        amount: Number(form.amount),
        closingDate: new Date(form.closingDate).toISOString(),
        stage: form.stage,
        contactRole: form.contactRole,
      };
      const createdDeal = await leadsAPI.convertToDeal(lead.id, payload);
      Toast.success(createdDeal?.dealId ? `Lead converted to deal #${createdDeal.dealId}` : "Lead converted to deal");
      onConverted?.(createdDeal);
      onClose?.();
      navigate("/crm/sales/deals");
    } catch (error) {
      Toast.error(getApiErrorMessage(error, "Unable to convert lead"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose} style={{ padding: 24, zIndex: 750 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, calc(100vw - 48px))",
          background: "#ffffff",
          borderRadius: 24,
          border: "1px solid #e5e7eb",
          boxShadow: "0 28px 70px rgba(15, 23, 42, 0.18)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #eef2f7", display: "flex", alignItems: "start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Convert Lead To Deal</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
              Create a deal for {leadName(lead)} by adding the amount, closing date, stage, and contact role.
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close"><X size={18} /></button>
        </div>

        <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 }}>
          <FloatingInput type="number" min="0" label="Deal Amount" value={form.amount} error={errors.amount} onChange={(e) => setField("amount", e.target.value)} />
          <FloatingInput type="date" label="Closing Date" value={form.closingDate} error={errors.closingDate} onChange={(e) => setField("closingDate", e.target.value)} />
          <FloatingInput as="select" label="Deal Stage" value={form.stage} error={errors.stage} onChange={(e) => setField("stage", e.target.value)}>
            {DEAL_STAGE_OPTIONS.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
          </FloatingInput>
          <FloatingInput as="select" label="Contact Role" value={form.contactRole} error={errors.contactRole} onChange={(e) => setField("contactRole", e.target.value)}>
            {CONTACT_ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
          </FloatingInput>
        </div>

        <div style={{ padding: "0 24px 24px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "Converting..." : "Create Deal"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Timeline({ items, loading, onRefresh, stacked = false, mobile = false, onClose = null, eyebrow = "Lead Story", description = "A clean view of status changes, communications, and lead updates." }) {
  const groups = useMemo(() => items.reduce((acc, item) => { const key = fmtDate(timelineDateValue(item), false); (acc[key] ||= []).push(item); return acc; }, {}), [items]);
  return (
    <aside style={{ height: mobile ? "auto" : "100%", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", borderLeft: stacked ? "none" : "1px solid #e2e8f0", borderTop: stacked ? "1px solid #e2e8f0" : "none", background: "linear-gradient(180deg, #fbfdff 0%, #f4f8fc 100%)" }}>
      <div style={{ borderBottom: "1px solid #e2e8f0", background: "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)", padding: "16px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em" }}>{eyebrow}</div>
            <div style={{ marginTop: 6, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Timeline</div>
            <div style={{ marginTop: 4, fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{description}</div>
          </div>
          {onClose ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="icon-btn" onClick={onClose} title="Close" style={{ width: 34, height: 34, border: "1.5px solid #9fb3ca", borderRadius: 12, background: "#ffffff", boxShadow: "0 8px 20px rgba(148, 163, 184, 0.12)" }}><X size={14} /></button>
          </div> : null}
        </div>
      </div>
      <div style={{ flex: mobile ? "0 0 auto" : 1, minHeight: 0, overflowY: mobile ? "visible" : "auto", padding: "14px 12px 18px 0" }}>
        {loading ? <div style={{ color: "#94a3b8", fontSize: 11.5, padding: "16px 6px" }}>Loading timeline...</div> : null}
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
                const lowerType = String(item?.type || item?.eventType || "").toLowerCase();
                const shouldTruncateDescription = lowerType.includes("email") || lowerType.includes("whatsapp");
                const previewDescription = shouldTruncateDescription ? truncatePreview(eventDescription) : eventDescription;
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
                      {eventDescription ? <div title={shouldTruncateDescription ? eventDescription : undefined} style={{ marginTop: 1, fontSize: 12.5, lineHeight: 1.45, color: "#334155", wordBreak: "break-word", cursor: shouldTruncateDescription ? "help" : "default" }}>{previewDescription}</div> : null}
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

function Attachments({ leadId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const normalizeAttachment = (item, index) => ({
    id: item?.id ?? `attachment-${index}`,
    fileName: String(item?.fileName || item?.name || "Attachment"),
    url: attachmentUrl(item),
    uploadedAt: item?.uploadedAt || item?.createdAt || item?.date || "",
  });

  const loadAttachments = async () => {
    if (!leadId) {
      setItems([]);
      setErrorMessage("Missing lead ID for attachments.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await leadsAPI.getAttachments(leadId);
      const normalized = (Array.isArray(data) ? data : []).map(normalizeAttachment);
      setItems(normalized);
    } catch (error) {
      setItems([]);
      setErrorMessage(error?.response?.data?.message || "Unable to load attachments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [leadId]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !leadId) return;
    setUploading(true);
    setErrorMessage("");
    try {
      await leadsAPI.uploadAttachment(leadId, file);
      Toast.success("Attachment uploaded");
      await loadAttachments();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Unable to upload attachment");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...card, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Lead Attachments</div>
          <div style={{ marginTop: 4, fontSize: 12.5, color: "#64748b" }}>Upload and open files saved against this lead.</div>
        </div>
        <label className="btn-primary" style={{ cursor: uploading ? "progress" : "pointer", border: "1px solid #93c5fd", background: "#dbeafe", color: "#315c85", boxShadow: "none" }}>
          <UploadCloud size={15} />
          {uploading ? "Uploading..." : "Add File"}
          <input type="file" hidden onChange={handleUpload} />
        </label>
      </div>
      <div style={{ ...card, padding: 16, minHeight: 260, display: "grid", gap: 12 }}>
        {loading ? <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading attachments...</div> : null}
        {!loading && errorMessage ? <div style={{ border: "1px dashed #fecaca", borderRadius: 16, background: "#fff7f7", color: "#b91c1c", fontSize: 13, padding: "14px 16px" }}>{errorMessage}</div> : null}
        {!loading && !errorMessage && !items.length ? <div style={{ border: "1px dashed #dbe4f0", borderRadius: 16, background: "#fbfdff", color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "28px 18px" }}>No attachments found for this lead.</div> : null}
        {!loading && !errorMessage && items.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "14px 16px", border: "1px solid #e5edf5", borderRadius: 16, background: "#ffffff" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1e293b", wordBreak: "break-word" }}>{item.fileName}</div>
              <div style={{ marginTop: 5, fontSize: 12, color: "#94a3b8" }}>{item.uploadedAt ? fmtDate(item.uploadedAt) : "Upload date unavailable"}</div>
            </div>
            {item.url ? (
              <a href={item.url} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textDecoration: "none", flexShrink: 0 }}>
                Open
              </a>
            ) : (
              <span style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>No file URL</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Middle({ lead, activeTab, onTabChange, onActivitySaved, timeline = [], compact = false, mobile = false }) {
  const [activityView, setActivityView] = useState("open");
  const [meetingView, setMeetingView] = useState("create");
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [open, setOpen] = useState([]);
  const [closed, setClosed] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [communications, setCommunications] = useState({ emails: [], whatsapp: [] });
  const load = async () => {
    if (!lead?.id) return;
    setLoading(true);
    try {
      const [openResult, closedResult, meetingResult, emailResult, whatsappResult] = await Promise.allSettled([
        activitiesAPI.getOpen({ leadId: lead.id }),
        activitiesAPI.getClosed({ leadId: lead.id }),
        meetingsAPI.getForLead(lead.id),
        leadsAPI.getCommunications({ leadId: lead.id, type: "Email" }),
        leadsAPI.getCommunications({ leadId: lead.id, type: "WhatsApp" }),
      ]);

      if (openResult.status === "fulfilled") {
        setOpen((Array.isArray(openResult.value) ? openResult.value : []).map(mapActivity));
      } else {
        console.error("Failed to load open activities", openResult.reason);
        setOpen([]);
      }

      if (closedResult.status === "fulfilled") {
        setClosed((Array.isArray(closedResult.value) ? closedResult.value : []).map(mapActivity));
      } else {
        console.error("Failed to load closed activities", closedResult.reason);
        setClosed([]);
      }

      if (meetingResult.status === "fulfilled") {
        setMeetings((Array.isArray(meetingResult.value) ? meetingResult.value : []).map(mapMeetingRecord));
      } else {
        console.error("Failed to load meetings", meetingResult.reason);
        setMeetings([]);
      }

      setCommunications({
        emails: emailResult.status === "fulfilled" ? (Array.isArray(emailResult.value) ? emailResult.value : []).map(mapComm).filter((item) => item.kind === "emails") : [],
        whatsapp: whatsappResult.status === "fulfilled" ? (Array.isArray(whatsappResult.value) ? whatsappResult.value : []).map(mapComm).filter((item) => item.kind === "whatsapp") : [],
      });

      if (
        openResult.status === "rejected" &&
        closedResult.status === "rejected" &&
        meetingResult.status === "rejected" &&
        emailResult.status === "rejected" &&
        whatsappResult.status === "rejected"
      ) {
        Toast.error("Unable to load lead details");
      }
    } catch (e) {
      Toast.error(e?.response?.data?.message || "Unable to load lead details");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [lead?.id]);
  const callHistory = useMemo(() => (
    (Array.isArray(timeline) ? timeline : [])
      .filter((item) => String(item?.type || item?.eventType || "").toLowerCase().includes("call"))
      .map((item, index) => mapCallTimelineItem(item, index))
  ), [timeline]);
  const taskActivities = useMemo(() => [...open, ...closed].filter((x) => String(x.type).toLowerCase().includes("task")), [open, closed]);
  const taskHistory = useMemo(() => (
    (Array.isArray(timeline) ? timeline : [])
      .filter((item) => String(item?.type || item?.eventType || "").toLowerCase().includes("task"))
      .map((item, index) => {
        const mapped = mapTaskTimelineItem(item, index);
        const normalizedTitle = String(mapped.title || "").trim().toLowerCase();
        const matchedActivity = taskActivities.find((activity) => {
          const subject = String(activity?.subject || activity?.title || "").trim().toLowerCase();
          return subject && subject === normalizedTitle;
        });
        return {
          ...mapped,
          activityId: matchedActivity?.id || null,
          subject: matchedActivity?.subject || matchedActivity?.title || mapped.title,
          dueDate: matchedActivity?.dueDate || mapped.date,
          priority: matchedActivity?.priority || "Medium",
          status: matchedActivity?.status || "Pending",
          description: matchedActivity?.description || "",
          reminder: matchedActivity?.reminder || null,
          repeat: matchedActivity?.repeat || "",
        };
      })
  ), [timeline, taskActivities]);

  const handleUpdateTask = async (taskPayload) => {
    const activityId = Number(editingTask?.activityId || 0);
    if (!activityId) {
      Toast.error("No task activity ID available for this entry.");
      return;
    }
    try {
      await activitiesAPI.updateTask(activityId, taskPayload);
      Toast.success("Task updated");
      setEditingTask(null);
      await load();
      await onActivitySaved?.();
    } catch (error) {
      Toast.error(getApiErrorMessage(error, "Unable to update task"));
    }
  };

  const handleDeleteTask = async (item) => {
    const activityId = Number(item?.activityId || 0);
    if (!activityId) {
      Toast.error("No task activity ID available for this entry.");
      return;
    }
    setDeletingTaskId(activityId);
    try {
      await activitiesAPI.delete(activityId);
      Toast.success("Task deleted");
      await load();
      await onActivitySaved?.();
    } catch (error) {
      Toast.error(getApiErrorMessage(error, "Unable to delete task"));
    } finally {
      setDeletingTaskId(null);
    }
  };
  const filtered = useMemo(() => {
    if (activeTab === "tasks") return taskHistory;
    if (activeTab === "calls") return callHistory;
    if (activeTab === "meetings") return meetings;
    if (activeTab === "emails") return communications.emails;
    if (activeTab === "whatsapp") return communications.whatsapp;
    return [];
  }, [activeTab, callHistory, communications.emails, communications.whatsapp, meetings, taskHistory]);
  const activityItems = activityView === "open" ? open : closed;
  return (
    <section style={{ height: mobile ? "auto" : "100%", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", background: "#ffffff" }}>
      <DetailTabsRail tabs={LEAD_TABS} activeTab={activeTab} onTabChange={onTabChange} mobile={mobile} compact={compact} eyebrow="Activity Center" />
      <div style={{ flex: mobile ? "0 0 auto" : 1, minHeight: 0, overflowY: mobile ? "visible" : "auto", overflowX: "hidden", padding: mobile ? 10 : compact ? 14 : 18, display: "flex", flexDirection: "column", gap: mobile ? 10 : 16 }}>
        {loading && <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading details...</div>}
        {activeTab === "activity" && <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: mobile ? 8 : 12, flexWrap: "wrap" }}>
            <div className={mobile ? "salescrm-scroll-hidden" : undefined} style={{ display: "flex", flexWrap: mobile ? "nowrap" : "wrap", gap: mobile ? 6 : 8, width: mobile ? "100%" : "auto", justifyContent: "flex-start", overflowX: mobile ? "auto" : "visible", overflowY: "hidden", WebkitOverflowScrolling: "touch", paddingBottom: mobile ? 1 : 0 }}>
              {[
                ["open", `Open Activities (${open.length})`],
                ["closed", `Closed Activities (${closed.length})`],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActivityView(id)}
                  style={{
                    border: "1px solid #b8c7da",
                    borderRadius: 11,
                    padding: mobile ? "7px 10px" : "8px 12px",
                    background: activityView === id ? "#eff6ff" : "#ffffff",
                    color: activityView === id ? "#5b7fa6" : "#6b7280",
                    fontSize: mobile ? 12 : 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    textAlign: "left",
                    flex: mobile ? "0 0 auto" : "0 0 auto",
                    minWidth: mobile ? "max-content" : undefined,
                    boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.18), 0 1px 2px rgba(15, 23, 42, 0.02)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <ActivitySection items={activityItems} stacked={mobile} mobile={mobile} />
        </div>}
        {activeTab !== "activity" && activeTab !== "attachments" && <>
          {activeTab === "meetings" ? <>
            <div style={{ display: "inline-flex", padding: 3, borderRadius: 10, background: "#f8fafc", border: "1px solid rgba(159, 179, 202, 0.42)", alignSelf: "flex-start" }}>
              {[["create", "Create Meeting"], ["scheduled", "Scheduled Meetings"]].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMeetingView(id)}
                  style={{
                    border: "none",
                    borderRadius: 9,
                    padding: "7px 12px",
                    background: meetingView === id ? "#ffffff" : "transparent",
                    color: meetingView === id ? "#0f172a" : "#64748b",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: meetingView === id ? "0 6px 16px rgba(191, 219, 254, 0.22)" : "none"
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {meetingView === "create" ? <Composer tab={activeTab} lead={lead} onSaved={async () => {
              await load();
              await onActivitySaved?.();
              setMeetingView("scheduled");
            }} /> : null}
            {meetingView === "scheduled" ? <TabHistoryTimeline items={meetings.map((item) => ({
              ...item,
              description: [item.status ? `Status: ${item.status}` : "", meetingMetaValue(item), `${item.durationMinutes || 0} min`].filter(Boolean).join(" | "),
              meta: item.joinUrl || "",
            }))} emptyLabel="meetings" icon={Calendar} /> : null}
          </> : activeTab === "notes" ? <>
            <NotesSection lead={lead} onSaved={async () => {
              await onActivitySaved?.();
            }} />
          </> : <>
            <Composer
              tab={activeTab}
              lead={lead}
              taskDraft={activeTab === "tasks" ? editingTask : null}
              taskSubmitLabel={activeTab === "tasks" && editingTask ? "Update Task" : ""}
              onTaskSubmit={activeTab === "tasks" && editingTask ? handleUpdateTask : null}
              onTaskCancel={activeTab === "tasks" && editingTask ? () => setEditingTask(null) : null}
              onSaved={async () => {
              await load();
              await onActivitySaved?.();
            }}
            />
            <TabHistoryTimeline
              items={filtered}
              emptyLabel={activeTab}
              icon={activeTab === "emails" ? Mail : activeTab === "calls" ? Phone : activeTab === "whatsapp" ? FaWhatsapp : activeTab === "tasks" ? UserCheck : FileText}
              renderItemActions={activeTab === "tasks" ? (item) => (
                item?.activityId ? (
                  <>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setEditingTask(item)}
                      disabled={deletingTaskId === item.activityId}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => handleDeleteTask(item)}
                      disabled={deletingTaskId === item.activityId}
                      style={{ color: "#b91c1c", borderColor: "#fecaca", display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <Trash2 size={14} />
                      {deletingTaskId === item.activityId ? "Deleting..." : "Delete"}
                    </button>
                  </>
                ) : null
              ) : null}
            />
          </>}
        </>}
        {activeTab === "attachments" && <Attachments leadId={lead?.id || lead?.leadId} />}
      </div>
    </section>
  );
}



