import { useEffect, useMemo, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Calendar,
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
import notesAPI from "../../api/notes.api";
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
  TABS,
  assignee,
  attachmentUrl,
  compactMeetingDate,
  followUpDisplayValue,
  fmtDate,
  fmtTime,
  getApiErrorMessage,
  hasValue,
  leadName,
  mapActivity,
  mapCallActivity,
  mapComm,
  mapMeetingRecord,
  meetingMetaValue,
  sanitizePhoneNumber,
  timelineAuthor,
  timelineDateValue,
  timelineDescription,
  timelineIcon,
} from "./shared";

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
  const handleShortcutClick = (id) => {
    if (id === "calls") {
      if (!callableNumber) return;
      window.location.href = `tel:${callableNumber}`;
      return;
    }
    if (id === "whatsapp") {
      if (!whatsappNumber) return;
      const whatsappUrl = `https://wa.me/${encodeURIComponent(whatsappNumber)}`;
      const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      if (!popup) {
        Toast.error("Allow pop-ups to open WhatsApp in a new tab.");
      }
      return;
    }
    if (id === "emails") {
      if (!emailAddress) return;
      window.location.href = `mailto:${encodeURIComponent(emailAddress)}`;
      return;
    }
    onOpenTab?.(id);
  };
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
                style={{
                  width: 30,
                  height: 30,
                  border: enabled ? "1px solid #aebfd4" : "1px solid #c7d4e3",
                  borderRadius: "50%",
                  background: "#ffffff",
                  color: enabled ? "#2563eb" : "#94a3b8",
                  cursor: enabled ? "pointer" : "not-allowed",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  outline: "none",
                  boxShadow: "none",
                  transition: "transform 160ms ease, border-color 160ms ease, background-color 160ms ease, color 160ms ease",
                  animation: enabled ? "leadShortcutPop 320ms ease" : "none",
                }}
                onMouseEnter={(event) => {
                  if (!enabled) return;
                  event.currentTarget.style.transform = "translateY(-1px) scale(1.03)";
                  event.currentTarget.style.backgroundColor = "#f8fafc";
                  event.currentTarget.style.borderColor = "#aebfd4";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "translateY(0) scale(1)";
                  event.currentTarget.style.backgroundColor = "#ffffff";
                  event.currentTarget.style.borderColor = enabled ? "#aebfd4" : "#c7d4e3";
                }}
                onMouseDown={(event) => {
                  if (!enabled) return;
                  event.currentTarget.style.transform = "scale(0.96)";
                }}
                onMouseUp={(event) => {
                  if (!enabled) return;
                  event.currentTarget.style.transform = "translateY(-2px) scale(1.04)";
                }}
              >
                <Icon size={13} color={enabled ? "#64748b" : "#94a3b8"} />
              </button>
            );
          })}
        </div>
        <style>{`
          @keyframes leadShortcutPop {
            0% { transform: scale(0.88); opacity: 0; }
            70% { transform: scale(1.06); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }

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

function Attachments({ leadId }) {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(false); const [uploading, setUploading] = useState(false);
  const load = async () => { if (!leadId) return; setLoading(true); try { const data = await leadsAPI.getAttachments(leadId); setItems(Array.isArray(data) ? data : []); } catch (e) { Toast.error(e?.response?.data?.message || "Unable to load attachments"); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [leadId]);
  const upload = async (e) => { const file = e.target.files?.[0]; if (!file || !leadId) return; setUploading(true); try { await leadsAPI.uploadAttachment(leadId, file); Toast.success("Attachment uploaded"); await load(); } catch (err) { Toast.error(err?.response?.data?.message || "Unable to upload attachment"); } finally { setUploading(false); e.target.value = ""; } };
  const remove = async (id) => { try { await leadsAPI.deleteAttachment(id); Toast.success("Attachment deleted"); await load(); } catch (err) { Toast.error(err?.response?.data?.message || "Unable to delete attachment"); } };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...card, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><div><div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Lead Attachments</div><div style={{ marginTop: 4, fontSize: 12.5, color: "#64748b" }}>Upload and review files saved against this lead.</div></div><label className="btn-primary" style={{ cursor: uploading ? "progress" : "pointer", border: "1px solid #93c5fd", background: "#dbeafe", color: "#315c85", boxShadow: "none" }}><UploadCloud size={15} />{uploading ? "Uploading..." : "Add File"}<input type="file" hidden onChange={upload} /></label></div>
      <div style={{ ...card, padding: 16, minHeight: 260 }}>
        {loading ? <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading attachments...</div> : null}
        {!loading && !items.length ? <div style={{ color: "#94a3b8", fontSize: 13 }}>No attachments found.</div> : null}
        {!loading && items.map((a) => <div key={a.id || a.fileName} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid #eef2f7" }}><div><div style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b", wordBreak: "break-word" }}>{a.fileName || a.name || "Attachment"}</div><div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>{fmtDate(a.uploadedAt || a.createdAt)}</div></div><div style={{ display: "flex", alignItems: "center", gap: 8 }}>{attachmentUrl(a) ? <a href={attachmentUrl(a)} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textDecoration: "none" }}>Open</a> : null}<button className="icon-btn" onClick={() => remove(a.id)} title="Delete attachment"><Trash2 size={16} /></button></div></div>)}
      </div>
    </div>
  );
}

export function Middle({ lead, activeTab, onTabChange, onActivitySaved, timeline = [], compact = false, mobile = false }) {
  const [activityView, setActivityView] = useState("open");
  const [meetingView, setMeetingView] = useState("create");
  const [loading, setLoading] = useState(false);
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
  const callHistory = useMemo(() => [...open, ...closed].filter((x) => String(x.type).toLowerCase().includes("call")).map(mapCallActivity), [open, closed]);
  const taskHistory = useMemo(() => [...open, ...closed].filter((x) => String(x.type).toLowerCase().includes("task")), [open, closed]);
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
      <DetailTabsRail tabs={TABS} activeTab={activeTab} onTabChange={onTabChange} mobile={mobile} compact={compact} eyebrow="Activity Center" />
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
            <Composer tab={activeTab} lead={lead} onSaved={async () => {
              await load();
              await onActivitySaved?.();
            }} />
            <TabHistoryTimeline items={filtered} emptyLabel={activeTab} icon={activeTab === "emails" ? Mail : activeTab === "calls" ? Phone : activeTab === "whatsapp" ? FaWhatsapp : activeTab === "tasks" ? UserCheck : FileText} />
          </>}
        </>}
        {activeTab === "attachments" && <Attachments leadId={lead?.id} />}
      </div>
    </section>
  );
}



