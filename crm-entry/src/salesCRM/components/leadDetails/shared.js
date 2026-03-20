import { useEffect, useState } from "react";
import { Activity, Calendar, FileText, Mail, Paperclip, Phone, UserCheck } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { BASE_URL } from "../../api/apiClient";
import { formatLeadSource, formatStatus } from "../../pages/leads/utils";

export const TABS = [
  ["activity", "Activity", Activity],
  ["tasks", "Tasks", UserCheck],
  ["notes", "Notes", FileText],
  ["emails", "Emails", Mail],
  ["calls", "Calls", Phone],
  ["whatsapp", "WhatsApp", FaWhatsapp],
  ["meetings", "Meetings", Calendar],
  ["attachments", "Attachments", Paperclip],
];

export const EMAIL_TEMPLATES = [
  { id: "intro", name: "Warm Introduction", subject: "A quick introduction for {{name}}", body: "Hi {{name}},\n\nI hope you're doing well. I wanted to personally reach out and introduce myself. Based on your interest, I believe we can help you move faster and with more clarity.\n\nIf you're open to it, I would be happy to understand your current requirement and suggest the most suitable next step.\n\nPlease let me know a convenient time to connect.\n\nBest regards," },
  { id: "followup", name: "Professional Follow-Up", subject: "Following up on our discussion, {{name}}", body: "Hi {{name}},\n\nI wanted to follow up regarding our previous conversation. I understand priorities can shift, so I just wanted to check whether this is still something you would like to explore.\n\nIf it helps, I can share a concise overview, answer any questions, or schedule a quick call at your convenience.\n\nLooking forward to your response.\n\nBest regards," },
];

export const WHATSAPP_TEMPLATES = [
  { id: "intro", name: "Warm Introduction", message: "Hi {{name}}, this is a quick introduction from our team. I wanted to personally connect and understand your requirement better. If you're available, I would be happy to guide you with the next best step." },
  { id: "followup", name: "Polite Follow-Up", message: "Hi {{name}}, just following up on our earlier discussion. I understand you may be busy, so I wanted to check whether you would like to continue the conversation. Happy to help whenever convenient for you." },
  { id: "proposal", name: "Value Pitch", message: "Hi {{name}}, based on what we discussed, I believe we can offer a solution that saves time and gives you a smoother process overall. If you'd like, I can share a quick summary and walk you through the best option." },
];

export const CONTACT_SHORTCUTS = [
  { id: "calls", label: "Call", icon: Phone },
  { id: "whatsapp", label: "WhatsApp", icon: FaWhatsapp },
  { id: "emails", label: "Email", icon: Mail },
];
export const CALL_PURPOSE_OPTIONS = [
  "Follow-up",
  "Introduction",
  "Qualification",
  "Demo",
  "Negotiation",
  "Support",
  "Closing",
];
export const CALL_STATUS_OPTIONS = [
  "Pending",
  "Incomplete",
  "Completed",
  "Cancelled",
];
export const TASK_STATUS_OPTIONS = [
  "Pending",
  "Incomplete",
  "Completed",
  "Cancelled",
];
export const TASK_PRIORITY_OPTIONS = ["Low", "Medium", "High"];
export const DEAL_STAGE_OPTIONS = [
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
export const CONTACT_ROLE_OPTIONS = [
  "Developer/Evaluator",
  "Decision Maker",
  "Purchasing",
  "Executive Sponsor",
  "Engineering Lead",
  "Economic Decision Maker",
  "Product Management",
];

export const card = { border: "1px solid #b8c7da", borderRadius: 14, background: "#fff", boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.28), 0 1px 2px rgba(15, 23, 42, 0.03)" };
export const input = { width: "100%", minHeight: 36, padding: "8px 11px", border: "1px solid #b8c7da", borderRadius: 12, outline: "none", fontSize: 12, color: "#334155", background: "#fff", boxSizing: "border-box", boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.22), 0 1px 2px rgba(15, 23, 42, 0.02)" };
export const floatingWrap = { position: "relative", width: "100%", paddingTop: 10 };
export const floatingInput = { ...input, minHeight: 44, padding: "12px 11px 7px" };
export const floatingLabel = { position: "absolute", top: -7, left: 12, padding: "0 5px 0 0", fontSize: 9.5, fontWeight: 700, color: "#475569", background: "#ffffff", pointerEvents: "none", letterSpacing: "0.01em", lineHeight: 1.1 };
export const floatingErrorText = { marginTop: 6, marginLeft: 4, fontSize: 10.5, color: "#dc2626", lineHeight: 1.3 };
export const datePickerInputBase = { ...floatingInput, width: "100%", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
export const selectFieldStyle = {
  appearance: "none",
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  backgroundSize: "14px 14px",
  paddingRight: 36,
  cursor: "pointer",
};

export const useViewportWidth = () => {
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === "undefined" ? 1440 : window.innerWidth));

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return viewportWidth;
};

export const hasValue = (v) => !(v === null || v === undefined || (typeof v !== "boolean" && String(v).trim() === ""));
export const leadName = (lead) => [lead?.firstName, lead?.lastName].filter(Boolean).join(" ").trim() || lead?.name || "Lead";
export const assignee = (lead) => lead?.assignee || lead?.assignedToUserName || lead?.assignedUserName || (lead?.assignedToUserId ? `User ${lead.assignedToUserId}` : "");
export const sanitizePhoneNumber = (value = "") => String(value).replace(/[^\d+]/g, "");
export const formatDisplayText = (value = "") => String(value)
  .replace(/([a-z])([A-Z])/g, "$1 $2")
  .replace(/_/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .replace(/\bWhats App\b/g, "WhatsApp");
export const fmtDate = (v, withTime = true) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("en-US", withTime ? { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric", year: "numeric" });
};
export const hasRealDate = (v) => {
  if (!v) return false;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return false;
  return d.getUTCFullYear() > 1900;
};
export const followUpDisplayValue = (lead) => {
  if (hasValue(lead?.followUpDate) && hasRealDate(lead.followUpDate)) {
    return fmtDate(lead.followUpDate, true);
  }
  const rawCandidates = [
    lead?.nextFollowUpAt,
    lead?.next_follow_up_at,
    lead?.nextFollowupAt,
  ];
  const rawMatch = rawCandidates.find((value) => hasRealDate(value));
  return rawMatch ? fmtDate(rawMatch, true) : "";
};
export const fmtTime = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};
export const timelineDateValue = (item) => item?.createdAt || item?.date || item?.eventDate || item?.updatedAt || item?.sentAt || item?.occurredAt || null;
export const timelineDescription = (item) => String(item?.description || "").replace(/from\s+([A-Za-z]+)\s+to\s+([A-Za-z]+)/g, (_, from, to) => `from ${formatStatus(from)} to ${formatStatus(to)}`);
export const timelineAuthor = (item) => item?.createdByName || item?.userName || item?.performedBy || item?.author || item?.createdBy || "";
export const timelineKind = (item) => {
  const raw = String(item?.type || item?.eventType || "").toLowerCase();
  if (raw.includes("call")) return "call";
  if (raw.includes("meeting")) return "meeting";
  if (raw.includes("email")) return "email";
  if (raw.includes("whatsapp")) return "whatsapp";
  if (raw.includes("attach")) return "attachment";
  if (raw.includes("note")) return "note";
  return "activity";
};
export const timelineIcon = (item) => {
  const kind = timelineKind(item);
  if (kind === "meeting") return Calendar;
  if (kind === "call") return Phone;
  if (kind === "email") return Mail;
  if (kind === "attachment") return Paperclip;
  if (kind === "note") return FileText;
  return Activity;
};
export const getApiErrorMessage = (error, fallback = "Unable to save") => {
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
export const attachmentUrl = (a) => {
  const raw = a?.fileUrl || a?.url || a?.filePath || a?.path || "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${BASE_URL.replace(/\/api$/, "")}/${String(raw).replace(/^\/+/, "")}`;
};
export const commKind = (type = "") => {
  const raw = String(type).toLowerCase();
  if (raw.includes("note")) return "notes";
  if (raw.includes("whatsapp")) return "whatsapp";
  if (raw.includes("email")) return "emails";
  if (raw.includes("call")) return "calls";
  if (raw.includes("meeting")) return "meetings";
  return "other";
};
export const mapActivity = (x) => ({
  id: x?.id,
  title: x?.title || x?.subject || x?.eventType || x?.type || "Activity",
  type: x?.type || x?.eventType || "Activity",
  description: x?.description || "",
  date: x?.callStartTime || x?.activityDate || x?.dueDate || x?.createdAt,
  dueDate: x?.dueDate || x?.activityDate || x?.callStartTime || x?.createdAt,
  status: x?.status || x?.callStatus || "",
  priority: x?.priority || ""
});
export const mapComm = (x) => ({
  id: x?.id || `${x?.eventType || x?.type}-${x?.date || x?.description}`,
  kind: commKind(x?.type || x?.eventType),
  title: formatDisplayText(x?.eventType || x?.type || "Update"),
  description: x?.description || "",
  preview: x?.body || x?.message || x?.description || x?.subject || "",
  date: x?.date || x?.createdAt,
  author: x?.createdByName || x?.userName || x?.author || x?.createdBy || "",
  meta: x?.subject || x?.toEmail || x?.phoneNumber || "",
});
export const mapMeetingRecord = (x) => ({
  id: x?.id || `meeting-${x?.subject || x?.startTime}`,
  kind: "meetings",
  title: x?.subject || "Meeting",
  description: x?.description || "",
  preview: [x?.description, x?.joinUrl, x?.location].filter(Boolean).join("\n"),
  date: x?.startTime,
  provider: x?.provider || x?.location || "",
  location: x?.location || "",
  joinUrl: x?.joinUrl || "",
  durationMinutes: x?.durationMinutes ?? 0,
  status: x?.status || "Pending",
  author: x?.createdByName || x?.organizerName || x?.createdBy || "",
});
export const meetingMetaValue = (item) => {
  const provider = formatDisplayText(item?.provider || "");
  const location = String(item?.location || "").trim();
  if (provider && location && provider.toLowerCase() !== location.toLowerCase()) {
    return `${provider} / ${location}`;
  }
  return provider || location || "";
};
export const compactMeetingDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};
export const toIsoString = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
};
export const buildCallSummary = (x) => {
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
export const mapCallActivity = (x) => ({
  id: x?.id || `call-${x?.subject || x?.callStartTime || x?.createdAt}`,
  kind: "calls",
  title: x?.subject || x?.title || "Call",
  description: buildCallSummary(x),
  preview: buildCallSummary(x),
  date: x?.callStartTime || x?.activityDate || x?.dueDate || x?.createdAt,
  status: x?.callStatus || x?.status || "",
  durationMinutes: x?.durationMinutes ?? x?.callDurationMinutes ?? null,
  author: x?.createdByName || x?.userName || x?.createdBy || "",
});

