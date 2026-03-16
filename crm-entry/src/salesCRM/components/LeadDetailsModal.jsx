import { forwardRef, useEffect, useMemo, useState } from "react";
import { Activity, Calendar, FileText, Mail, MapPin, Paperclip, Phone, RefreshCw, Trash2, UploadCloud, UserCheck, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import leadsAPI from "../api/leads.api";
import activitiesAPI from "../api/activities.api";
import meetingsAPI from "../api/meetings.api";
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
  { id: "intro", name: "Warm Introduction", subject: "A quick introduction for {{name}}", body: "Hi {{name}},\n\nI hope you're doing well. I wanted to personally reach out and introduce myself. Based on your interest, I believe we can help you move faster and with more clarity.\n\nIf you're open to it, I would be happy to understand your current requirement and suggest the most suitable next step.\n\nPlease let me know a convenient time to connect.\n\nBest regards," },
  { id: "followup", name: "Professional Follow-Up", subject: "Following up on our discussion, {{name}}", body: "Hi {{name}},\n\nI wanted to follow up regarding our previous conversation. I understand priorities can shift, so I just wanted to check whether this is still something you would like to explore.\n\nIf it helps, I can share a concise overview, answer any questions, or schedule a quick call at your convenience.\n\nLooking forward to your response.\n\nBest regards," },
];

const WHATSAPP_TEMPLATES = [
  { id: "intro", name: "Warm Introduction", message: "Hi {{name}}, this is a quick introduction from our team. I wanted to personally connect and understand your requirement better. If you're available, I would be happy to guide you with the next best step." },
  { id: "followup", name: "Polite Follow-Up", message: "Hi {{name}}, just following up on our earlier discussion. I understand you may be busy, so I wanted to check whether you would like to continue the conversation. Happy to help whenever convenient for you." },
  { id: "proposal", name: "Value Pitch", message: "Hi {{name}}, based on what we discussed, I believe we can offer a solution that saves time and gives you a smoother process overall. If you'd like, I can share a quick summary and walk you through the best option." },
];

const CONTACT_SHORTCUTS = [
  { id: "calls", label: "Call", icon: Phone },
  { id: "whatsapp", label: "WhatsApp", icon: FaWhatsapp },
  { id: "emails", label: "Email", icon: Mail },
];
const CALL_PURPOSE_OPTIONS = [
  "Follow-up",
  "Introduction",
  "Qualification",
  "Demo",
  "Negotiation",
  "Support",
  "Closing",
];
const DEAL_STAGE_OPTIONS = [
  "New",
  "Prospect",
  "Qualification",
  "Qualified",
  "Proposal",
  "ProposalSent",
  "Negotiation",
  "ClosedWon",
  "ClosedLost",
];
const CONTACT_ROLE_OPTIONS = [
  "Developer/Evaluator",
  "Decision Maker",
  "Purchasing",
  "Executive Sponsor",
  "Engineering Lead",
  "Economic Decision Maker",
  "Product Management",
];

const card = { border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", boxShadow: "none" };
const input = { width: "100%", minHeight: 38, padding: "10px 12px", border: "1px solid #dbe4f0", borderRadius: 12, outline: "none", fontSize: 13, color: "#334155", background: "#fff", boxSizing: "border-box" };
const floatingWrap = { position: "relative", width: "100%", paddingTop: 10 };
const floatingInput = { ...input, minHeight: 48, padding: "14px 12px 8px" };
const floatingLabel = { position: "absolute", top: -7, left: 12, padding: "0 5px 0 0", fontSize: 10.5, fontWeight: 700, color: "#475569", background: "#ffffff", pointerEvents: "none", letterSpacing: "0.01em", lineHeight: 1.1 };
const floatingErrorText = { marginTop: 6, marginLeft: 4, fontSize: 11.5, color: "#dc2626", lineHeight: 1.3 };
const datePickerInputBase = { ...floatingInput, width: "100%", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

const hasValue = (v) => !(v === null || v === undefined || (typeof v !== "boolean" && String(v).trim() === ""));
const leadName = (lead) => [lead?.firstName, lead?.lastName].filter(Boolean).join(" ").trim() || lead?.name || "Lead";
const assignee = (lead) => lead?.assignee || lead?.assignedToUserName || lead?.assignedUserName || (lead?.assignedToUserId ? `User ${lead.assignedToUserId}` : "");
const sanitizePhoneNumber = (value = "") => String(value).replace(/[^\d+]/g, "");
const formatDisplayText = (value = "") => String(value)
  .replace(/([a-z])([A-Z])/g, "$1 $2")
  .replace(/_/g, " ")
  .replace(/\s+/g, " ")
  .trim();
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
const mapActivity = (x) => ({
  id: x?.id,
  title: x?.title || x?.subject || x?.eventType || x?.type || "Activity",
  type: x?.type || x?.eventType || "Activity",
  description: x?.description || "",
  date: x?.callStartTime || x?.activityDate || x?.dueDate || x?.createdAt,
  dueDate: x?.dueDate || x?.activityDate || x?.callStartTime || x?.createdAt,
  status: x?.status || x?.callStatus || "",
  priority: x?.priority || ""
});
const mapComm = (x) => ({
  id: x?.id || `${x?.eventType || x?.type}-${x?.date || x?.description}`,
  kind: commKind(x?.type || x?.eventType),
  title: formatDisplayText(x?.eventType || x?.type || "Update"),
  description: x?.description || "",
  date: x?.date || x?.createdAt
});
const mapMeetingRecord = (x) => ({
  id: x?.id || `meeting-${x?.subject || x?.startTime}`,
  kind: "meetings",
  title: x?.subject || "Meeting",
  description: x?.description || "",
  date: x?.startTime,
  provider: x?.provider || x?.location || "",
  location: x?.location || "",
  joinUrl: x?.joinUrl || "",
  durationMinutes: x?.durationMinutes ?? 0,
});
const meetingMetaValue = (item) => {
  const provider = formatDisplayText(item?.provider || "");
  const location = String(item?.location || "").trim();
  if (provider && location && provider.toLowerCase() !== location.toLowerCase()) {
    return `${provider} / ${location}`;
  }
  return provider || location || "";
};
const compactMeetingDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};
const toIsoString = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
};
const buildCallSummary = (x) => {
  const parts = [
    x?.callStatus ? `Status: ${x.callStatus}` : "",
    x?.callResult ? `Result: ${x.callResult}` : "",
    hasValue(x?.durationMinutes) ? `Duration: ${x.durationMinutes} min` : "",
    x?.callPurpose ? `Purpose: ${x.callPurpose}` : "",
    x?.reminder ? `Reminder: ${x.reminder}` : "",
    x?.voiceRecordingUrl ? `Recording: ${x.voiceRecordingUrl}` : "",
    x?.description || "",
  ].filter(Boolean);
  return parts.join(" | ");
};
const mapCallActivity = (x) => ({
  id: x?.id || `call-${x?.subject || x?.callStartTime || x?.createdAt}`,
  kind: "calls",
  title: x?.subject || x?.title || "Call",
  description: buildCallSummary(x),
  date: x?.callStartTime || x?.activityDate || x?.dueDate || x?.createdAt,
  status: x?.callStatus || x?.status || "",
});

function InfoRow({ icon: Icon, label, value }) {
  if (!hasValue(value)) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 10, alignItems: "start", padding: "12px 0", borderBottom: "1px solid #edf2f7" }}>
      <div style={{ width: 28, height: 28, borderRadius: 10, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><Icon size={15} /></div>
      <div><div style={{ fontSize: 11.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div><div style={{ marginTop: 4, fontSize: 13.5, color: "#1e293b", wordBreak: "break-word" }}>{value}</div></div>
    </div>
  );
}

function FloatingInput({ label, as = "input", style, error, ...props }) {
  const fieldStyle = {
    ...floatingInput,
    borderColor: error ? "#f87171" : "#cbd5e1",
    boxShadow: error ? "0 0 0 3px rgba(248, 113, 113, 0.14)" : "none",
    ...style
  };
  if (as === "textarea") {
    return (
      <div style={floatingWrap}>
        <label style={{ ...floatingLabel, zIndex: 2 }}>{label}</label>
        <textarea {...props} style={{ ...fieldStyle, minHeight: 120, resize: "vertical" }} />
        {error ? <div style={floatingErrorText}>{error}</div> : null}
      </div>
    );
  }

  if (as === "select") {
    return (
      <div style={floatingWrap}>
        <label style={{ ...floatingLabel, zIndex: 2 }}>{label}</label>
        <select {...props} style={fieldStyle} />
        {error ? <div style={floatingErrorText}>{error}</div> : null}
      </div>
    );
  }

  return (
    <div style={floatingWrap}>
      <label style={{ ...floatingLabel, zIndex: 2 }}>{label}</label>
      <input {...props} style={fieldStyle} />
      {error ? <div style={floatingErrorText}>{error}</div> : null}
    </div>
  );
}

const DatePickerInput = forwardRef(function DatePickerInput({ value, onClick, style, label }, ref) {
  return (
    <input
      ref={ref}
      value={value}
      onClick={onClick}
      readOnly
      style={{ ...datePickerInputBase, cursor: "pointer", ...style }}
      aria-label={label}
    />
  );
});

function FloatingDateTimePicker({ label, selected, onChange, minDate, error, style, popperPlacement = "bottom-start", popperOffset = [0, 8] }) {
  return (
    <div style={floatingWrap}>
      <label style={{ ...floatingLabel, zIndex: 2 }}>{label}</label>
      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect
        timeIntervals={15}
        dateFormat="MMM d, yyyy h:mm aa"
        minDate={minDate}
        calendarClassName="followup-datepicker"
        popperPlacement={popperPlacement}
        showPopperArrow={false}
        popperClassName="lead-details-datepicker-popper"
        popperModifiers={[
          {
            name: "offset",
            options: {
              offset: popperOffset,
            },
          },
        ]}
        customInput={<DatePickerInput label={label} style={{ borderColor: error ? "#f87171" : "#cbd5e1", boxShadow: error ? "0 0 0 3px rgba(248, 113, 113, 0.14)" : "none", ...style }} />}
      />
      {error ? <div style={floatingErrorText}>{error}</div> : null}
    </div>
  );
}

function LeftPanel({ lead, onConvert, onOpenTab }) {
  const location = [lead?.address, lead?.city, lead?.state, lead?.country, lead?.zipCode || lead?.zip].filter(Boolean).join(", ");
  const initials = (leadName(lead).match(/\b\w/g) || []).join("").slice(0, 2).toUpperCase();
  const canCall = hasValue(lead?.phone) || hasValue(lead?.mobile) || hasValue(lead?.secondaryPhone);
  const canWhatsapp = canCall;
  const canEmail = hasValue(lead?.email) || hasValue(lead?.secondaryEmail);
  const shortcutEnabled = {
    calls: canCall,
    whatsapp: canWhatsapp,
    emails: canEmail,
  };
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 18 }}>
          {CONTACT_SHORTCUTS.map(({ id, label, icon: Icon }) => {
            const enabled = shortcutEnabled[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => enabled && onOpenTab?.(id)}
                disabled={!enabled}
                title={label}
                aria-label={label}
                style={{
                  width: 34,
                  height: 34,
                  border: enabled ? "1px solid #dbe4f0" : "1px solid #e2e8f0",
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
                  event.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "translateY(0) scale(1)";
                  event.currentTarget.style.backgroundColor = "#ffffff";
                  event.currentTarget.style.borderColor = enabled ? "#dbe4f0" : "#e2e8f0";
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
                <Icon size={14} color={enabled ? "#64748b" : "#94a3b8"} />
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
        `}</style>
        <button
          type="button"
          onClick={onConvert}
          style={{
            marginTop: 18,
            display: "block",
            width: 130,
            marginLeft: "auto",
            marginRight: "auto",
            padding: "10px 0",
            border: "1px solid #bbf7d0",
            borderRadius: 12,
            background: "#f0fdf4",
            color: "#166534",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            lineHeight: 1.1,
          }}
        >
          Convert To Deal
        </button>
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

function ConvertToDealModal({ lead, onClose, onConverted }) {
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
  const [errors, setErrors] = useState({});
  const callableNumber = lead?.phone || lead?.mobile || lead?.secondaryPhone || "";
  const whatsappNumber = sanitizePhoneNumber(lead?.mobile || lead?.phone || lead?.secondaryPhone || "");
  const [v, setV] = useState({
    note: "",
    toEmail: lead?.email || "",
    emailSubject: "",
    emailBody: "",
    whatsappMessage: "",
    callType: "Outgoing",
    callStatus: "Completed",
    callResult: "Connected",
    callDescription: "",
    callStartTime: new Date().toISOString().slice(0, 16),
    callDurationMinutes: 0,
    callPurpose: "",
    voiceRecordingUrl: "",
    callMode: "log",
    meetingTitle: "",
    meetingDescription: "",
    meetingStartTime: new Date(),
    meetingEndTime: new Date(Date.now() + 30 * 60 * 1000),
    meetingProvider: "Zoom",
  });
  const setField = (k, val) => {
    setV((p) => ({ ...p, [k]: val }));
    setErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
  };
  const applyTemplate = (id) => {
    setTemplateId(id);
    if (tab === "emails") {
      const t = EMAIL_TEMPLATES.find((x) => x.id === id);
      if (t) setV((p) => ({ ...p, emailSubject: t.subject.replaceAll("{{name}}", leadName(lead)), emailBody: t.body.replaceAll("{{name}}", leadName(lead)) }));
    }
    if (tab === "whatsapp") {
      const t = WHATSAPP_TEMPLATES.find((x) => x.id === id);
      if (t) setV((p) => ({ ...p, whatsappMessage: t.message.replaceAll("{{name}}", leadName(lead)) }));
    }
  };
  const submit = async () => {
    if (!lead?.id) return;
    if (tab === "calls") {
      const nextErrors = {};
      if (!String(v.callPurpose || "").trim()) nextErrors.callPurpose = "Call purpose is required.";
      if (!String(v.callStartTime || "").trim()) nextErrors.callStartTime = "Call start time is required.";
      if (Object.keys(nextErrors).length) {
        setErrors(nextErrors);
        Toast.error("Please fill the required call fields.");
        return;
      }
    }
    setSubmitting(true);
    try {
      if (tab === "notes") await leadsAPI.addCommunication({ leadId: lead.id, type: "Note", message: v.note, createdBy: lead.assignedToUserId || 0 });
      if (tab === "emails") await leadsAPI.addCommunication({ leadId: lead.id, type: "Email", subject: v.emailSubject, body: v.emailBody, toEmail: v.toEmail || lead.email, createdBy: lead.assignedToUserId || 0 });
      if (tab === "whatsapp") {
        if (!whatsappNumber) {
          Toast.error("No WhatsApp number available for this lead");
          return;
        }
        await leadsAPI.addCommunication({ leadId: lead.id, type: "WhatsApp", message: v.whatsappMessage, createdBy: lead.assignedToUserId || 0 });
        const whatsappUrl = `https://wa.me/${encodeURIComponent(whatsappNumber)}?text=${encodeURIComponent(v.whatsappMessage || "")}`;
        const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        if (!popup) window.location.href = whatsappUrl;
      }
      if (tab === "calls") {
        const callStartTime = toIsoString(v.callStartTime);
        const subject = String(v.callPurpose || "").trim();
        const basePayload = {
          leadId: lead.id,
          subject,
          callType: v.callType,
          callStatus: v.callMode === "schedule" ? (v.callStatus || "Scheduled") : (v.callStatus || "Completed"),
          callStartTime,
          ...(lead.assignedToUserId ? { assignedToUserId: Number(lead.assignedToUserId) } : {}),
          ...(hasValue(v.callPurpose) ? { callPurpose: v.callPurpose } : {}),
        };
        if (v.callMode === "schedule") {
          await activitiesAPI.scheduleCall({
            ...basePayload,
          });
        } else {
          await activitiesAPI.logCall({
            ...basePayload,
            ...(hasValue(v.callResult) ? { callResult: v.callResult } : {}),
            ...(hasValue(v.callDescription) ? { description: v.callDescription } : {}),
            ...(hasValue(v.voiceRecordingUrl) ? { voiceRecordingUrl: v.voiceRecordingUrl } : {}),
            ...(Number(v.callDurationMinutes) > 0 ? { durationMinutes: Number(v.callDurationMinutes) } : {}),
          });
        }
      }
      if (tab === "meetings") await meetingsAPI.create({
        leadId: lead.id,
        ...(lead.assignedToUserId ? { assignedToUserId: Number(lead.assignedToUserId) } : {}),
        title: v.meetingTitle,
        meetingVenue: v.meetingProvider,
        startTime: toIsoString(v.meetingStartTime),
        endTime: toIsoString(v.meetingEndTime),
        description: v.meetingDescription,
        provider: v.meetingProvider,
      });
      Toast.success(tab === "whatsapp" ? "WhatsApp chat opened successfully" : "Saved successfully");
      await onSaved?.();
    } catch (e) {
      Toast.error(getApiErrorMessage(e, "Unable to save"));
    } finally {
      setSubmitting(false);
    }
  };
  const handleCallNow = () => {
    if (!callableNumber) {
      Toast.error("No phone number available for this lead");
      return;
    }
    window.location.href = `tel:${String(callableNumber).trim()}`;
  };
  if (tab === "activity" || tab === "attachments") return null;
  return (
    <div style={{ ...card, padding: 16 }}>
      {tab === "notes" && <textarea style={{ ...input, minHeight: 110, resize: "vertical" }} value={v.note} onChange={(e) => setField("note", e.target.value)} placeholder="Add a note for the sales team" />}
      {tab === "emails" && <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 0.9fr) minmax(0, 1.1fr)", gap: 12, alignItems: "start" }}>
        <select style={input} value={templateId} onChange={(e) => applyTemplate(e.target.value)}><option value="">Select template</option>{EMAIL_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <input style={input} value={v.toEmail} onChange={(e) => setField("toEmail", e.target.value)} placeholder="recipient@email.com" />
        <input style={{ ...input, gridColumn: "1 / -1" }} value={v.emailSubject} onChange={(e) => setField("emailSubject", e.target.value)} placeholder="Email subject" />
        <textarea style={{ ...input, minHeight: 140, resize: "vertical", gridColumn: "1 / -1", width: "100%" }} value={v.emailBody} onChange={(e) => setField("emailBody", e.target.value)} placeholder="Compose your email" />
      </div>}
      {tab === "whatsapp" && <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        <select style={input} value={templateId} onChange={(e) => applyTemplate(e.target.value)}><option value="">Select template</option>{WHATSAPP_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <textarea style={{ ...input, minHeight: 110, resize: "vertical", gridColumn: "1 / -1" }} value={v.whatsappMessage} onChange={(e) => setField("whatsappMessage", e.target.value)} placeholder="Write the WhatsApp message" />
      </div>}
      {tab === "calls" && <>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <button
            type="button"
            onClick={handleCallNow}
            disabled={!callableNumber}
            style={{
              minHeight: 40,
              padding: "10px 14px",
              border: "1px solid #bbf7d0",
              borderRadius: 12,
              background: callableNumber ? "#f0fdf4" : "#f8fafc",
              color: callableNumber ? "#166534" : "#94a3b8",
              fontSize: 13,
              fontWeight: 800,
              lineHeight: 1.1,
              opacity: callableNumber ? 1 : 0.7,
              cursor: callableNumber ? "pointer" : "not-allowed",
            }}
          >
            Call Now
          </button>
        </div>
        <div style={{ display: "inline-flex", padding: 4, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 14 }}>
          {[["log", "Log Call"], ["schedule", "Schedule Call"]].map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setField("callMode", mode)}
              style={{
                border: "none",
                borderRadius: 10,
                padding: "9px 14px",
                background: v.callMode === mode ? "#ffffff" : "transparent",
                color: v.callMode === mode ? "#5b7fa6" : "#64748b",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: v.callMode === mode ? "0 6px 16px rgba(191, 219, 254, 0.22)" : "none"
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <FloatingInput as="select" label="Call Type" value={v.callType} onChange={(e) => setField("callType", e.target.value)}>
            <option value="Outgoing">Outgoing</option>
            <option value="Incoming">Incoming</option>
          </FloatingInput>
          <FloatingInput as="select" label="Call Status" value={v.callStatus} onChange={(e) => setField("callStatus", e.target.value)}>
            {v.callMode === "schedule"
              ? ["Scheduled", "Pending", "Rescheduled"].map((status) => <option key={status} value={status}>{status}</option>)
              : ["Completed", "Connected", "No Answer", "Missed", "Cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}
          </FloatingInput>
          <FloatingInput type="datetime-local" label={v.callMode === "schedule" ? "Scheduled Time" : "Call Start Time"} value={v.callStartTime} error={errors.callStartTime} onChange={(e) => setField("callStartTime", e.target.value)} />
          {v.callMode === "log" && <FloatingInput label="Call Result" value={v.callResult} onChange={(e) => setField("callResult", e.target.value)} />}
          {v.callMode === "log" && <FloatingInput type="number" min="0" label="Duration (Minutes)" value={v.callDurationMinutes} onChange={(e) => setField("callDurationMinutes", e.target.value)} />}
          <div style={{ position: "relative" }}>
            <FloatingInput
              label="Call Purpose"
              value={v.callPurpose}
              list="call-purpose-options"
              error={errors.callPurpose}
              onChange={(e) => setField("callPurpose", e.target.value)}
            />
            <datalist id="call-purpose-options">
              {CALL_PURPOSE_OPTIONS.map((option) => <option key={option} value={option} />)}
            </datalist>
          </div>
          {v.callMode === "log" && <FloatingInput label="Voice Recording URL" style={{ gridColumn: "1 / -1" }} value={v.voiceRecordingUrl} onChange={(e) => setField("voiceRecordingUrl", e.target.value)} />}
          {v.callMode === "log" && <FloatingInput as="textarea" label="Call Notes" style={{ gridColumn: "1 / -1" }} value={v.callDescription} onChange={(e) => setField("callDescription", e.target.value)} />}
        </div>
      </>}
      {tab === "meetings" && <div style={{ ...card, padding: 18, borderRadius: 18, background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 180px", gap: 14, alignItems: "start" }}>
            <FloatingInput label="Meeting Title" value={v.meetingTitle} onChange={(e) => setField("meetingTitle", e.target.value)} />
            <FloatingInput as="select" label="Provider" value={v.meetingProvider} onChange={(e) => setField("meetingProvider", e.target.value)}>
              <option value="Zoom">Zoom</option>
              <option value="Teams">Teams</option>
            </FloatingInput>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 320px) minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 14, alignItems: "start" }}>
              <FloatingDateTimePicker label="Start Time" selected={v.meetingStartTime} onChange={(date) => setField("meetingStartTime", date)} popperPlacement="top-start" popperOffset={[0, 12]} />
              <FloatingDateTimePicker label="End Time" selected={v.meetingEndTime} minDate={v.meetingStartTime || undefined} onChange={(date) => setField("meetingEndTime", date)} />
            </div>
            <FloatingInput as="textarea" label="Meeting Notes" style={{ minHeight: 156 }} value={v.meetingDescription} onChange={(e) => setField("meetingDescription", e.target.value)} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ minWidth: 190 }}>
              <button className="btn-primary" onClick={submit} disabled={submitting} style={{ minWidth: 170, minHeight: 44, border: "1px solid #93c5fd", background: "#dbeafe", color: "#315c85", boxShadow: "none" }}>
                {submitting ? "Saving..." : "Schedule Meeting"}
              </button>
            </div>
          </div>
        </div>
      </div>}
      {tab !== "meetings" ? <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}><button className="btn-primary" onClick={submit} disabled={submitting} style={{ border: "1px solid #93c5fd", background: "#dbeafe", color: "#315c85", boxShadow: "none" }}>{submitting ? "Saving..." : tab === "emails" ? "Send Email" : tab === "whatsapp" ? "Open WhatsApp" : tab === "calls" ? "Save Call" : "Save Note"}</button></div> : null}
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
      <div style={{ ...card, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><div><div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Lead Attachments</div><div style={{ marginTop: 4, fontSize: 12.5, color: "#64748b" }}>Upload and review files saved against this lead.</div></div><label className="btn-primary" style={{ cursor: uploading ? "progress" : "pointer", border: "1px solid #93c5fd", background: "#dbeafe", color: "#315c85", boxShadow: "none" }}><UploadCloud size={15} />{uploading ? "Uploading..." : "Add File"}<input type="file" hidden onChange={upload} /></label></div>
      <div style={{ ...card, padding: 16, minHeight: 260 }}>
        {loading ? <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading attachments...</div> : null}
        {!loading && !items.length ? <div style={{ color: "#94a3b8", fontSize: 13 }}>No attachments found.</div> : null}
        {!loading && items.map((a) => <div key={a.id || a.fileName} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid #eef2f7" }}><div><div style={{ fontSize: 13.5, fontWeight: 700, color: "#1e293b", wordBreak: "break-word" }}>{a.fileName || a.name || "Attachment"}</div><div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>{fmtDate(a.uploadedAt || a.createdAt)}</div></div><div style={{ display: "flex", alignItems: "center", gap: 8 }}>{attachmentUrl(a) ? <a href={attachmentUrl(a)} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textDecoration: "none" }}>Open</a> : null}<button className="icon-btn" onClick={() => remove(a.id)} title="Delete attachment"><Trash2 size={16} /></button></div></div>)}
      </div>
    </div>
  );
}

function Middle({ lead, activeTab, onTabChange, onActivitySaved }) {
  const [activityView, setActivityView] = useState("open"); const [meetingView, setMeetingView] = useState("create"); const [loading, setLoading] = useState(false); const [open, setOpen] = useState([]); const [closed, setClosed] = useState([]); const [comms, setComms] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const load = async () => {
    if (!lead?.id) return;
    setLoading(true);
    try {
      const [openData, closedData, commData, meetingData] = await Promise.all([activitiesAPI.getOpen({ leadId: lead.id }), activitiesAPI.getClosed({ leadId: lead.id }), leadsAPI.getCommunications(lead.id), meetingsAPI.getAll()]);
      setOpen((Array.isArray(openData) ? openData : []).map(mapActivity));
      setClosed((Array.isArray(closedData) ? closedData : []).map(mapActivity));
      setComms((Array.isArray(commData) ? commData : []).map(mapComm));
      setMeetings((Array.isArray(meetingData) ? meetingData : []).filter((item) => Number(item?.leadId) === Number(lead.id)).map(mapMeetingRecord));
    } catch (e) {
      Toast.error(e?.response?.data?.message || "Unable to load lead details");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [lead?.id]);
  const callHistory = useMemo(() => [...open, ...closed].filter((x) => String(x.type).toLowerCase().includes("call")).map(mapCallActivity), [open, closed]);
  const filtered = useMemo(() => {
    if (activeTab === "calls") return callHistory;
    if (activeTab === "meetings") return meetings;
    return comms.filter((x) => x.kind === activeTab);
  }, [activeTab, callHistory, comms, meetings]);
  const activityItems = activityView === "open" ? open : closed;
  return (
    <section style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", background: "#ffffff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px 0", overflowX: "auto", flexShrink: 0, background: "#ffffff", borderBottom: "1px solid #eef2f7" }}>
        {TABS.map(([id, label, Icon]) => <button key={id} onClick={() => onTabChange?.(id)} style={{ border: "none", borderBottom: activeTab === id ? "2px solid #93c5fd" : "2px solid transparent", background: "transparent", color: activeTab === id ? "#5b7fa6" : "#64748b", padding: "12px 4px 11px", marginRight: 12, display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{id === "whatsapp" ? <FaWhatsapp size={16} /> : <Icon size={16} />}{label}</button>)}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        {loading && <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading details...</div>}
        {activeTab === "activity" && <>
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
                  background: activityView === id ? "#eff6ff" : "transparent",
                  color: activityView === id ? "#5b7fa6" : "#6b7280",
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
        {activeTab !== "activity" && activeTab !== "attachments" && <>
          {activeTab === "meetings" ? <>
            <div style={{ display: "inline-flex", padding: 4, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", alignSelf: "flex-start" }}>
              {[["create", "Create Meeting"], ["scheduled", "Scheduled Meetings"]].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMeetingView(id)}
                  style={{
                    border: "none",
                    borderRadius: 10,
                    padding: "9px 14px",
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
            {meetingView === "scheduled" ? <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {!meetings.length ? <div style={{ ...card, padding: 26, color: "#94a3b8", fontSize: 13, textAlign: "center" }}>No scheduled meetings available.</div> : meetings.map((item) => (
                <div key={item.id} style={{ ...card, padding: 14, borderRadius: 18, boxShadow: "0 16px 30px rgba(15, 23, 42, 0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0 }}>
                        <Calendar size={16} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                        <div style={{ marginTop: 2, fontSize: 12.5, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{compactMeetingDate(item.date)}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {meetingMetaValue(item) ? <div style={{ display: "inline-flex", alignItems: "center", padding: "7px 10px", borderRadius: 999, background: "#f8fafc", color: "#334155", fontSize: 12, fontWeight: 700, border: "1px solid #e2e8f0" }}>
                        {meetingMetaValue(item)}
                      </div> : null}
                      <div style={{ display: "inline-flex", alignItems: "center", padding: "7px 10px", borderRadius: 999, background: "#f8fafc", color: "#334155", fontSize: 12, fontWeight: 700, border: "1px solid #e2e8f0" }}>
                        {item.durationMinutes || 0} min
                      </div>
                      {item.joinUrl ? <a href={item.joinUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 38, padding: "0 14px", borderRadius: 999, background: "linear-gradient(180deg, #111827 0%, #0f172a 100%)", color: "#ffffff", fontSize: 12.5, fontWeight: 800, textDecoration: "none", boxShadow: "0 10px 22px rgba(15, 23, 42, 0.14)" }}>
                        Join
                      </a> : null}
                    </div>
                  </div>
                  {item.description ? <div style={{ marginTop: 10, paddingLeft: 46, fontSize: 12.5, color: "#475569", lineHeight: 1.55 }}>{item.description}</div> : null}
                </div>
              ))}
            </div> : null}
          </> : <>
            <Composer tab={activeTab} lead={lead} onSaved={async () => {
              await load();
              await onActivitySaved?.();
            }} />
            <div style={{ ...card, padding: 16, minHeight: 220, maxHeight: 420, overflowY: "auto" }}>
              {!filtered.length ? <div style={{ minHeight: 150, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 13 }}>No {activeTab} history available.</div> : filtered.map((item) => <div key={item.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid #eef2f7" }}><div style={{ fontSize: 13.5, fontWeight: 800, color: "#1e293b" }}>{item.title}</div><div style={{ marginTop: 6, fontSize: 13, color: "#475569", lineHeight: 1.55 }}>{item.description || "No description"}</div><div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>{fmtDate(item.date)}</div></div>)}
            </div>
          </>}
        </>}
        {activeTab === "attachments" && <Attachments leadId={lead?.id} />}
      </div>
    </section>
  );
}

export default function LeadDetailsModal({ lead, onClose, onDealConverted }) {
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [activeTab, setActiveTab] = useState("activity");
  const [timeline, setTimeline] = useState([]); const [timelineLoading, setTimelineLoading] = useState(false);
  const loadTimeline = async () => { if (!lead?.id) return; setTimelineLoading(true); try { const data = await leadsAPI.getTimeline(lead.id); setTimeline(Array.isArray(data) ? data : []); } catch (e) { Toast.error(e?.response?.data?.message || "Unable to load timeline"); } finally { setTimelineLoading(false); } };
  useEffect(() => { loadTimeline(); }, [lead?.id]);
  useEffect(() => { setActiveTab("activity"); }, [lead?.id]);
  useEffect(() => { const onKey = (e) => { if (e.key === "Escape") onClose?.(); }; document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey); }, [onClose]);
  return (
    <>
      <div className="overlay" onClick={onClose} style={{ padding: 24, zIndex: 700 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "min(1480px, calc(100vw - 48px))", height: "min(88vh, 860px)", background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 32px 90px rgba(15, 23, 42, 0.22)", position: "relative" }}>
          <button className="icon-btn" onClick={onClose} title="Close" style={{ position: "absolute", top: 14, right: 16, zIndex: 2, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)" }}><X size={18} /></button>
          <div style={{ height: "100%", minHeight: 0, display: "grid", gridTemplateColumns: "300px minmax(0, 1fr) 360px" }}>
            <LeftPanel lead={lead} onConvert={() => setShowConvertModal(true)} onOpenTab={setActiveTab} />
            <Middle lead={lead} activeTab={activeTab} onTabChange={setActiveTab} onActivitySaved={loadTimeline} />
            <Timeline items={timeline} loading={timelineLoading} onRefresh={loadTimeline} />
          </div>
        </div>
      </div>
      {showConvertModal ? <ConvertToDealModal lead={lead} onClose={() => setShowConvertModal(false)} onConverted={onDealConverted} /> : null}
    </>
  );
}
