import { useEffect, useMemo, useState } from "react";
import { flip } from "@floating-ui/react";
import { Activity, FileText, Mail, MapPin, Phone, UserCheck, Wallet, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import activitiesAPI from "../api/activities.api";
import dealsAPI from "../api/deals.api";
import notesAPI from "../api/notes.api";
import Toast from "../utils/toast";
import DetailTabsRail from "./detailMiddle/DetailTabsRail";
import { FloatingDateTimePicker, FloatingInput, InfoRow } from "./leadDetails/fields";
import {
  CALL_PURPOSE_OPTIONS,
  CALL_STATUS_OPTIONS,
  centeredComposerFieldStyle,
  CONTACT_SHORTCUTS,
  EMAIL_TEMPLATES,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  WHATSAPP_TEMPLATES,
  card,
  fmtDate,
  formatDisplayText,
  getApiErrorMessage,
  hasValue,
  input,
  mapActivity,
  mapCallActivity,
  mapComm,
  sanitizePhoneNumber,
  selectFieldStyle,
  timelineIcon,
  toIsoString,
  useViewportWidth,
} from "./leadDetails/shared";
import { Timeline } from "./leadDetails/sections";

const softOuterCardStyle = {
  ...card,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
};

const DEAL_TABS = [
  ["activity", "Activity", Activity],
  ["tasks", "Tasks", UserCheck],
  ["notes", "Notes", FileText],
  ["emails", "Emails", Mail],
  ["calls", "Calls", Phone],
  ["whatsapp", "WhatsApp", FaWhatsapp],
];

const getDealId = (deal) => Number(deal?.dealId ?? deal?.id ?? 0);
const getDealName = (deal) => deal?.dealName || deal?.title || deal?.name || "Deal details";
const getDealOwner = (deal) => deal?.dealOwner || deal?.ownerName || deal?.assignedToUserName || "";
const getDealType = (deal) => deal?.type || deal?.dealType || "";
const getAccountName = (deal) => deal?.accountName || deal?.account?.accountName || "";
const getContactName = (deal) => deal?.contactName || deal?.contact?.contactName || "";
const getContactPhone = (deal) => deal?.contactPhone || deal?.contact?.phone || deal?.contact?.mobile || deal?.phone || "";
const getContactEmail = (deal) => deal?.contactEmail || deal?.contact?.email || deal?.email || "";
const getWhatsappNumber = (deal) => sanitizePhoneNumber(getContactPhone(deal));
const formatStageLabel = (value = "") => String(value).replace(/([a-z])([A-Z])/g, "$1 $2").trim();
const getDealContactSnapshot = (deal) => ({
  callableNumber: String(getContactPhone(deal) || "").trim(),
  whatsappNumber: getWhatsappNumber(deal),
  emailAddress: String(getContactEmail(deal) || "").trim(),
});
const runShortcutAction = ({ id, callableNumber, whatsappNumber, emailAddress, onOpenTab }) => {
  if (id === "calls") {
    if (!callableNumber) return;
    window.location.href = `tel:${callableNumber}`;
    return;
  }
  if (id === "whatsapp") {
    if (!whatsappNumber) return;
    const popup = window.open(`https://wa.me/${encodeURIComponent(whatsappNumber)}`, "_blank", "noopener,noreferrer");
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

function DealInfoPanel({ deal, onOpenTab, stacked = false, mobile = false }) {
  const initials = (getDealName(deal).match(/\b\w/g) || []).join("").slice(0, 2).toUpperCase();
  const amount = Number(deal?.amount || 0);
  const amountLabel = Number.isFinite(amount)
    ? `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "";
  const location = [deal?.account?.billingCity, deal?.account?.billingState, deal?.account?.billingCountry].filter(Boolean).join(", ");
  const { callableNumber, whatsappNumber, emailAddress } = getDealContactSnapshot(deal);
  const shortcutEnabled = {
    calls: hasValue(callableNumber),
    whatsapp: hasValue(whatsappNumber),
    emails: hasValue(emailAddress),
  };

  return (
    <aside style={{ height: mobile ? "auto" : "100%", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", borderRight: stacked ? "none" : "1px solid #e5e7eb", borderBottom: stacked ? "1px solid #e5e7eb" : "none", background: "#fff" }}>
      <div style={{ padding: 18, borderBottom: "1px solid #e5e7eb", background: "linear-gradient(180deg, #f8faff 0%, #f3f6ff 100%)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, fontWeight: 800 }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", wordBreak: "break-word" }}>{getDealName(deal)}</div>
            {hasValue(getAccountName(deal)) ? <div style={{ marginTop: 4, fontSize: 11.5, color: "#64748b" }}>{getAccountName(deal)}</div> : null}
            {hasValue(deal?.stage) ? <div style={{ display: "inline-flex", marginTop: 10, padding: "5px 10px", borderRadius: 999, background: "#eef2ff", color: "#4f46e5", fontSize: 11, fontWeight: 700 }}>{formatStageLabel(deal.stage)}</div> : null}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 18 }}>
          {CONTACT_SHORTCUTS.map(({ id, label, icon: Icon }) => {
            const enabled = shortcutEnabled[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => enabled && runShortcutAction({ id, callableNumber, whatsappNumber, emailAddress, onOpenTab })}
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
        `}</style>
      </div>

      <div style={{ flex: mobile ? "0 0 auto" : 1, minHeight: 0, overflowY: mobile ? "visible" : "auto", padding: "0 18px 16px" }}>
        <InfoRow icon={Wallet} label="Amount" value={amountLabel} />
        <InfoRow icon={Activity} label="Probability" value={hasValue(deal?.probability) ? `${deal.probability}%` : ""} />
        <InfoRow icon={FileText} label="Type" value={getDealType(deal)} />
        <InfoRow icon={UserCheck} label="Owner" value={getDealOwner(deal)} />
        <InfoRow icon={FileText} label="Closing Date" value={fmtDate(deal?.closingDate)} />
        <InfoRow icon={FileText} label="Next Step" value={deal?.nextStep} />
        <InfoRow icon={FileText} label="Account" value={getAccountName(deal)} />
        <InfoRow icon={FileText} label="Contact" value={getContactName(deal)} />
        <InfoRow icon={Mail} label="Contact Email" value={getContactEmail(deal)} />
        <InfoRow icon={Phone} label="Contact Phone" value={getContactPhone(deal)} />
        <InfoRow icon={MapPin} label="Location" value={location} />
        <InfoRow icon={FileText} label="Lead Source" value={deal?.leadSource} />
        <InfoRow icon={FileText} label="Campaign Source" value={deal?.campaignSource} />
        <InfoRow icon={FileText} label="Description" value={deal?.description} />
      </div>
    </aside>
  );
}

function ActivityBoard({ items, title }) {
  const tasks = items.filter((item) => String(item?.type || "").toLowerCase().includes("task"));
  const calls = items.filter((item) => String(item?.type || "").toLowerCase().includes("call"));
  const others = items.filter((item) => !String(item?.type || "").toLowerCase().includes("task") && !String(item?.type || "").toLowerCase().includes("call"));
  const lanes = [
    { key: "tasks", title: "Tasks", items: tasks, Icon: FileText },
    { key: "calls", title: "Calls", items: calls, Icon: Phone },
    { key: "other", title: "Other", items: others, Icon: Activity },
  ];

  return (
    <section style={{ ...card, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5edf5", background: "linear-gradient(180deg, #fbfdff 0%, #ffffff 100%)" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{title}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {lanes.map(({ key, title: laneTitle, items: laneItems, Icon }) => (
          <div key={key} style={{ padding: 16, borderRight: key !== "other" ? "1px solid #edf2f7" : "none", minHeight: 220 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 10, background: "#eef4ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={14} /></div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1e293b" }}>{laneTitle} ({laneItems.length})</div>
            </div>
            {!laneItems.length ? <div style={{ border: "1px dashed #dbe4f0", borderRadius: 14, padding: "18px 14px", fontSize: 12.5, color: "#94a3b8", background: "#fbfdff" }}>No {laneTitle.toLowerCase()} yet.</div> : null}
            <div style={{ display: "grid", gap: 10 }}>
              {laneItems.map((item, index) => (
                <div key={item?.id || `${laneTitle}-${index}`} style={{ border: "1px solid #e5edf5", borderRadius: 14, background: "#ffffff", padding: 12 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1e293b" }}>{item?.title || item?.subject || item?.type || laneTitle}</div>
                  {hasValue(item?.description) ? <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.55, color: "#475569", whiteSpace: "pre-wrap" }}>{item.description}</div> : null}
                  <div style={{ marginTop: 8, fontSize: 11.5, color: "#64748b" }}>
                    {fmtDate(item?.dueDate || item?.date || item?.createdAt)}
                    {hasValue(item?.status) ? ` | ${formatDisplayText(item.status)}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NotesPanel({ deal, onSaved }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadNotes = async () => {
    const dealId = getDealId(deal);
    if (!dealId) return;
    setLoading(true);
    try {
      const data = await notesAPI.getAll();
      const nextNotes = (Array.isArray(data) ? data : [])
        .filter((item) => Number(item?.dealId || item?.deal?.id || 0) === dealId)
        .map((item) => ({
          id: item?.id,
          content: item?.description || item?.message || item?.content || item?.noteText || item?.text || "",
          date: item?.createdAt || item?.updatedAt || item?.date,
          author: item?.createdByName || item?.author || item?.createdBy || "",
        }));
      setNotes(nextNotes);
    } catch (error) {
      Toast.error(getApiErrorMessage(error, "Unable to load notes"));
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [deal?.dealId, deal?.id]);

  const reset = () => {
    setDraft("");
    setEditingId(null);
  };

  const handleSave = async () => {
    const content = draft.trim();
    const dealId = getDealId(deal);
    if (!content || !dealId) {
      Toast.error("Please add note content.");
      return;
    }
    const payload = {
      dealId,
      title: "Note",
      description: content,
      message: content,
      content,
      noteText: content,
      ...(deal?.assignedToUserId ? { createdByUserId: Number(deal.assignedToUserId) } : {}),
    };

    setSaving(true);
    try {
      if (editingId) {
        await notesAPI.update(editingId, { id: editingId, ...payload });
        Toast.success("Note updated");
      } else {
        await notesAPI.create(payload);
        Toast.success("Note added");
      }
      reset();
      await loadNotes();
      await onSaved?.();
    } catch (error) {
      Toast.error(getApiErrorMessage(error, editingId ? "Unable to update note" : "Unable to add note"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    setDeletingId(noteId);
    try {
      await notesAPI.delete(noteId);
      Toast.success("Note deleted");
      if (editingId === noteId) reset();
      await loadNotes();
      await onSaved?.();
    } catch (error) {
      Toast.error(getApiErrorMessage(error, "Unable to delete note"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ ...softOuterCardStyle, padding: 16 }}>
        <textarea style={{ ...input, minHeight: 120, resize: "vertical" }} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Add a note for this deal" />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
          {editingId ? <button type="button" className="btn-ghost" onClick={reset} disabled={saving}>Cancel</button> : null}
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingId ? "Update Note" : "Save Note"}</button>
        </div>
      </div>
      <div style={{ ...softOuterCardStyle, padding: 16, display: "grid", gap: 12 }}>
        {loading ? <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading notes...</div> : null}
        {!loading && !notes.length ? <div style={{ border: "1px dashed #dbe4f0", borderRadius: 16, background: "#fbfdff", color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "28px 18px" }}>No notes saved yet.</div> : null}
        {!loading && notes.map((note) => (
          <div key={note.id} style={{ border: "1px solid #cbd5e1", borderRadius: 16, padding: 14, background: "#ffffff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1e293b" }}>Note</div>
                <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>
                  {fmtDate(note.date)}
                  {note.author ? ` | ${note.author}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn-ghost" onClick={() => { setEditingId(note.id); setDraft(note.content || ""); }} disabled={saving || deletingId === note.id}>Edit</button>
                <button type="button" className="btn-ghost" onClick={() => handleDelete(note.id)} disabled={saving || deletingId === note.id} style={{ color: "#b91c1c", borderColor: "#fecaca" }}>{deletingId === note.id ? "Deleting..." : "Delete"}</button>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6, color: "#334155", whiteSpace: "pre-wrap" }}>{note.content || "-"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTimeline({ items, emptyLabel, icon: Icon }) {
  return (
    <div style={{ ...softOuterCardStyle, padding: 16, display: "grid", gap: 12 }}>
      {!items.length ? <div style={{ border: "1px dashed #dbe4f0", borderRadius: 16, background: "#fbfdff", color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "28px 18px" }}>No {emptyLabel} history yet.</div> : null}
      {items.map((item, index) => {
        const EventIcon = timelineIcon(item) || Icon;
        return (
          <div key={item?.id || `${emptyLabel}-${index}`} style={{ display: "grid", gridTemplateColumns: "38px minmax(0, 1fr)", gap: 12, padding: 14, border: "1px solid #dbe4f0", borderRadius: 16, background: "#ffffff" }}>
            <div style={{ width: 38, height: 38, borderRadius: 14, background: "#eef4ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}><EventIcon size={16} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1e293b" }}>{item?.title || item?.type || "Update"}</div>
              {hasValue(item?.description) ? <div style={{ marginTop: 5, fontSize: 12.5, lineHeight: 1.55, color: "#475569", whiteSpace: "pre-wrap" }}>{item.description}</div> : null}
              {hasValue(item?.preview) ? <div style={{ marginTop: 5, fontSize: 12.5, lineHeight: 1.55, color: "#334155", whiteSpace: "pre-wrap" }}>{item.preview}</div> : null}
              <div style={{ marginTop: 7, fontSize: 11.5, color: "#64748b" }}>
                {fmtDate(item?.date || item?.createdAt)}
                {item?.author ? ` | ${item.author}` : ""}
                {item?.meta ? ` | ${item.meta}` : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Composer({ tab, deal, onSaved }) {
  const [templateId, setTemplateId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCallDetails, setShowCallDetails] = useState(false);
  const dealId = getDealId(deal);
  const callableNumber = getContactPhone(deal);
  const whatsappNumber = getWhatsappNumber(deal);
  const [v, setV] = useState({
    toEmail: getContactEmail(deal),
    emailSubject: "",
    emailBody: "",
    whatsappMessage: "",
    callType: "Outgoing",
    callStatus: "Completed",
    callResult: "Connected",
    callDescription: "",
    callStartTime: new Date(),
    callDurationMinutes: 0,
    callPurpose: "",
    callMode: "log",
    taskSubject: "",
    taskDueDate: new Date(),
    taskPriority: "Medium",
    taskStatus: "Pending",
    taskReminder: null,
    taskRepeat: "",
    taskDescription: "",
  });

  useEffect(() => {
    setV((current) => ({ ...current, toEmail: getContactEmail(deal) }));
  }, [deal?.contact?.email, deal?.email]);

  const setField = (key, value) => {
    setV((current) => ({ ...current, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const applyTemplate = (id) => {
    setTemplateId(id);
    if (tab === "emails") {
      const template = EMAIL_TEMPLATES.find((item) => item.id === id);
      if (template) {
        const name = getContactName(deal) || getDealName(deal);
        setV((current) => ({
          ...current,
          emailSubject: template.subject.replaceAll("{{name}}", name),
          emailBody: template.body.replaceAll("{{name}}", name),
        }));
      }
    }
    if (tab === "whatsapp") {
      const template = WHATSAPP_TEMPLATES.find((item) => item.id === id);
      if (template) {
        const name = getContactName(deal) || getDealName(deal);
        setV((current) => ({
          ...current,
          whatsappMessage: template.message.replaceAll("{{name}}", name),
        }));
      }
    }
  };

  const submit = async () => {
    if (!dealId) return;
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
      if (tab === "emails") {
        await dealsAPI.addCommunication({
          dealId,
          type: "Email",
          subject: v.emailSubject,
          body: v.emailBody,
          toEmail: v.toEmail || getContactEmail(deal),
          createdBy: Number(deal?.assignedToUserId || 0),
        });
      }

      if (tab === "whatsapp") {
        if (!whatsappNumber) {
          Toast.error("No WhatsApp number available for this deal");
          return;
        }

        let communicationSaved = true;
        try {
          await dealsAPI.addCommunication({
            dealId,
            type: "WhatsApp",
            subject: "WhatsApp Message",
            message: v.whatsappMessage,
            body: v.whatsappMessage,
            description: v.whatsappMessage,
            sentAt: new Date().toISOString(),
            direction: "Outgoing",
            createdBy: Number(deal?.assignedToUserId || 0),
          });
        } catch (error) {
          communicationSaved = false;
          console.error("Failed to save WhatsApp communication", error);
        }

        const whatsappUrl = `https://wa.me/${encodeURIComponent(whatsappNumber)}?text=${encodeURIComponent(v.whatsappMessage || "")}`;
        const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        if (!popup) Toast.error("Allow pop-ups to open WhatsApp in a new tab.");
        if (!communicationSaved) {
          Toast.error("WhatsApp opened, but the communication could not be saved.");
          await onSaved?.();
          return;
        }
      }

      if (tab === "calls") {
        const basePayload = {
          dealId,
          subject: String(v.callPurpose || "").trim(),
          callType: v.callType,
          callStatus: v.callMode === "schedule" ? (v.callStatus || "Pending") : (v.callStatus || "Completed"),
          callStartTime: toIsoString(v.callStartTime),
          ...(deal?.assignedToUserId ? { assignedToUserId: Number(deal.assignedToUserId) } : {}),
          ...(hasValue(v.callPurpose) ? { callPurpose: v.callPurpose } : {}),
        };

        if (v.callMode === "schedule") {
          await activitiesAPI.scheduleCall(basePayload);
        } else {
          await activitiesAPI.logCall({
            ...basePayload,
            ...(hasValue(v.callResult) ? { callResult: v.callResult } : {}),
            ...(hasValue(v.callDescription) ? { description: v.callDescription } : {}),
            ...(Number(v.callDurationMinutes) > 0 ? { durationMinutes: Number(v.callDurationMinutes) } : {}),
          });
        }
      }

      if (tab === "tasks") {
        const subject = String(v.taskSubject || "").trim();
        if (!subject) {
          setErrors((prev) => ({ ...prev, taskSubject: "Task title is required." }));
          Toast.error("Task title is required.");
          return;
        }

        await activitiesAPI.createTask({
          dealId,
          subject,
          dueDate: toIsoString(v.taskDueDate),
          priority: v.taskPriority || "Medium",
          status: v.taskStatus || "Pending",
          reminder: toIsoString(v.taskReminder),
          repeat: v.taskRepeat || "",
          description: v.taskDescription || "",
          ...(deal?.assignedToUserId ? { assignedToUserId: Number(deal.assignedToUserId) } : {}),
        });
      }

      Toast.success(tab === "whatsapp" ? "WhatsApp chat opened successfully" : "Saved successfully");
      await onSaved?.();
    } catch (error) {
      Toast.error(getApiErrorMessage(error, "Unable to save"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCallNow = () => {
    if (!callableNumber) {
      Toast.error("No phone number available for this deal");
      return;
    }
    window.location.href = `tel:${String(callableNumber).trim()}`;
  };

  const showCallExtraFields = v.callMode === "log" && showCallDetails;

  if (tab === "activity" || tab === "notes") return null;

  return (
    <div style={{ ...softOuterCardStyle, padding: 16 }}>
      {tab === "tasks" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <FloatingInput label="Task Title" value={v.taskSubject} error={errors.taskSubject} onChange={(event) => setField("taskSubject", event.target.value)} />
          <FloatingDateTimePicker label="Due Date" selected={v.taskDueDate} onChange={(date) => setField("taskDueDate", date)} popperPlacement="bottom-start" popperOffset={8} popperModifiers={[flip({ fallbackPlacements: [] })]} />
          <FloatingInput as="select" label="Priority" value={v.taskPriority} onChange={(event) => setField("taskPriority", event.target.value)} style={selectFieldStyle}>
            {TASK_PRIORITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </FloatingInput>
          <FloatingInput as="select" label="Status" value={v.taskStatus} onChange={(event) => setField("taskStatus", event.target.value)} style={selectFieldStyle}>
            {TASK_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </FloatingInput>
          <FloatingDateTimePicker label="Reminder" selected={v.taskReminder} onChange={(date) => setField("taskReminder", date)} popperPlacement="bottom-start" popperOffset={8} popperModifiers={[flip({ fallbackPlacements: [] })]} />
          <FloatingInput label="Repeat" value={v.taskRepeat} onChange={(event) => setField("taskRepeat", event.target.value)} />
          <FloatingInput as="textarea" autoGrow label="Task Notes" style={{ gridColumn: "1 / -1", width: "100%", minHeight: 84, padding: "10px 12px 6px" }} value={v.taskDescription} onChange={(event) => setField("taskDescription", event.target.value)} />
        </div>
      ) : null}

      {tab === "emails" ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 0.9fr) minmax(0, 1.1fr)", gap: 12, alignItems: "start" }}>
          <select style={input} value={templateId} onChange={(event) => applyTemplate(event.target.value)}><option value="">Select template</option>{EMAIL_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select>
          <input style={input} value={v.toEmail} onChange={(event) => setField("toEmail", event.target.value)} placeholder="recipient@email.com" />
          <input style={{ ...input, ...centeredComposerFieldStyle, gridColumn: "1 / -1" }} value={v.emailSubject} onChange={(event) => setField("emailSubject", event.target.value)} placeholder="Email subject" />
          <textarea style={{ ...input, ...centeredComposerFieldStyle, minHeight: 140, resize: "vertical", gridColumn: "1 / -1" }} value={v.emailBody} onChange={(event) => setField("emailBody", event.target.value)} placeholder="Compose your email" />
        </div>
      ) : null}

      {tab === "whatsapp" ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 12 }}>
          <select style={{ ...input, ...centeredComposerFieldStyle }} value={templateId} onChange={(event) => applyTemplate(event.target.value)}><option value="">Select template</option>{WHATSAPP_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select>
          <textarea style={{ ...input, ...centeredComposerFieldStyle, minHeight: 110, resize: "vertical" }} value={v.whatsappMessage} onChange={(event) => setField("whatsappMessage", event.target.value)} placeholder="Write the WhatsApp message" />
        </div>
      ) : null}

      {tab === "calls" ? (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
            <div style={{ display: "inline-flex", padding: 4, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              {[["log", "Log Call"], ["schedule", "Schedule Call"]].map(([mode, label]) => (
                <button key={mode} type="button" onClick={() => setField("callMode", mode)} style={{ border: "none", borderRadius: 10, padding: "7px 12px", background: v.callMode === mode ? "#ffffff" : "transparent", color: v.callMode === mode ? "#5b7fa6" : "#64748b", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: v.callMode === mode ? "0 6px 16px rgba(191, 219, 254, 0.22)" : "none" }}>{label}</button>
              ))}
            </div>
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
                flexShrink: 0,
              }}
            >
              Call Now
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, alignItems: "start" }}>
            <FloatingInput as="select" label="Call Purpose" value={v.callPurpose} error={errors.callPurpose} onChange={(event) => setField("callPurpose", event.target.value)} style={selectFieldStyle}>
              <option value="">Select purpose</option>
              {CALL_PURPOSE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </FloatingInput>
            <FloatingDateTimePicker label={v.callMode === "schedule" ? "Scheduled Time" : "Call Time"} selected={v.callStartTime} onChange={(date) => setField("callStartTime", date)} error={errors.callStartTime} popperPlacement="bottom-start" popperOffset={8} popperModifiers={[flip({ fallbackPlacements: [] })]} />
            <FloatingInput as="select" label="Call Status" value={v.callStatus} onChange={(event) => setField("callStatus", event.target.value)} style={selectFieldStyle}>
              <option value="">Select status</option>
              {CALL_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </FloatingInput>
            <FloatingInput as="select" label="Call Type" value={v.callType} onChange={(event) => setField("callType", event.target.value)} style={selectFieldStyle}>
              <option value="Outgoing">Outgoing</option>
              <option value="Incoming">Incoming</option>
            </FloatingInput>
            <FloatingInput as="textarea" autoGrow label={v.callMode === "schedule" ? "Call Agenda / Notes" : "Call Notes"} style={{ gridColumn: "1 / -1", width: "100%", minHeight: 74, padding: "10px 12px 6px" }} value={v.callDescription} onChange={(event) => setField("callDescription", event.target.value)} />
            {v.callMode === "log" ? <div style={{ gridColumn: "1 / -1", marginTop: 2 }}>
              <button
                type="button"
                onClick={() => setShowCallDetails((current) => !current)}
                style={{
                  border: "1px solid #dbe4f0",
                  borderRadius: 12,
                  padding: "9px 12px",
                  background: "#f8fbff",
                  color: "#475569",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {showCallExtraFields ? "Hide extra details" : "Add more details"}
              </button>
            </div> : null}
            {showCallExtraFields ? <FloatingInput label="Call Result" value={v.callResult} onChange={(event) => setField("callResult", event.target.value)} /> : null}
            {showCallExtraFields ? <FloatingInput type="number" min="0" label="Duration (Minutes)" value={v.callDurationMinutes} onChange={(event) => setField("callDurationMinutes", event.target.value)} /> : null}
          </div>
        </>
      ) : null}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <button type="button" className="btn-primary" onClick={submit} disabled={submitting} style={{ border: "1px solid #93c5fd", background: "#dbeafe", color: "#315c85", boxShadow: "none" }}>{submitting ? "Saving..." : tab === "emails" ? "Send Email" : tab === "whatsapp" ? "Open WhatsApp" : tab === "calls" ? "Save Call" : "Save Task"}</button>
      </div>
    </div>
  );
}

function DealMiddle({ deal, activeTab, onTabChange, onActivitySaved, compact = false, mobile = false }) {
  const [activityView, setActivityView] = useState("open");
  const [loading, setLoading] = useState(false);
  const [openActivities, setOpenActivities] = useState([]);
  const [closedActivities, setClosedActivities] = useState([]);
  const [communications, setCommunications] = useState({ emails: [], whatsapp: [] });
  const dealId = getDealId(deal);

  const loadData = async () => {
    if (!dealId) return;
    setLoading(true);
    try {
      const [openResult, closedResult, emailResult, whatsappResult] = await Promise.allSettled([
        activitiesAPI.getOpen({ dealId }),
        activitiesAPI.getClosed({ dealId }),
        dealsAPI.getCommunications(dealId, "Email"),
        dealsAPI.getCommunications(dealId, "WhatsApp"),
      ]);

      setOpenActivities(openResult.status === "fulfilled" ? (Array.isArray(openResult.value) ? openResult.value : []).map(mapActivity) : []);
      setClosedActivities(closedResult.status === "fulfilled" ? (Array.isArray(closedResult.value) ? closedResult.value : []).map(mapActivity) : []);
      setCommunications({
        emails: emailResult.status === "fulfilled" ? (Array.isArray(emailResult.value) ? emailResult.value : []).map(mapComm).filter((item) => item.kind === "emails") : [],
        whatsapp: whatsappResult.status === "fulfilled" ? (Array.isArray(whatsappResult.value) ? whatsappResult.value : []).map(mapComm).filter((item) => item.kind === "whatsapp") : [],
      });
    } catch (error) {
      Toast.error(getApiErrorMessage(error, "Unable to load deal details"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dealId]);

  const taskHistory = useMemo(() => [...openActivities, ...closedActivities].filter((item) => String(item?.type || "").toLowerCase().includes("task")), [openActivities, closedActivities]);
  const callHistory = useMemo(() => [...openActivities, ...closedActivities].filter((item) => String(item?.type || "").toLowerCase().includes("call")).map(mapCallActivity), [openActivities, closedActivities]);
  const activityItems = activityView === "open" ? openActivities : closedActivities;

  return (
    <section style={{ height: mobile ? "auto" : "100%", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", background: "#ffffff" }}>
      <DetailTabsRail tabs={DEAL_TABS} activeTab={activeTab} onTabChange={onTabChange} mobile={mobile} compact={compact} eyebrow="Deal Activity" />

      <div style={{ flex: mobile ? "0 0 auto" : 1, minHeight: 0, overflowY: mobile ? "visible" : "auto", overflowX: "hidden", padding: mobile ? 10 : compact ? 14 : 18, display: "flex", flexDirection: "column", gap: mobile ? 10 : 16 }}>
        <style>{`
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
        {loading ? <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading deal workspace...</div> : null}

        {activeTab === "activity" ? (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["open", `Open Activities (${openActivities.length})`], ["closed", `Closed Activities (${closedActivities.length})`]].map(([id, label]) => (
                <button key={id} onClick={() => setActivityView(id)} style={{ border: "1px solid #b8c7da", borderRadius: 11, padding: "8px 12px", background: activityView === id ? "#eff6ff" : "#ffffff", color: activityView === id ? "#5b7fa6" : "#6b7280", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{label}</button>
              ))}
            </div>
            <ActivityBoard items={activityItems} title={activityView === "open" ? "Open Activities" : "Closed Activities"} />
          </>
        ) : null}

        {activeTab === "tasks" ? (
          <>
            <Composer tab="tasks" deal={deal} onSaved={async () => { await loadData(); await onActivitySaved?.(); }} />
            <HistoryTimeline items={taskHistory} emptyLabel="task" icon={UserCheck} />
          </>
        ) : null}

        {activeTab === "notes" ? <NotesPanel deal={deal} onSaved={async () => { await loadData(); await onActivitySaved?.(); }} /> : null}

        {activeTab === "emails" ? (
          <>
            <Composer tab="emails" deal={deal} onSaved={async () => { await loadData(); await onActivitySaved?.(); }} />
            <HistoryTimeline items={communications.emails} emptyLabel="email" icon={Mail} />
          </>
        ) : null}

        {activeTab === "calls" ? (
          <>
            <Composer tab="calls" deal={deal} onSaved={async () => { await loadData(); await onActivitySaved?.(); }} />
            <HistoryTimeline items={callHistory} emptyLabel="call" icon={Phone} />
          </>
        ) : null}

        {activeTab === "whatsapp" ? (
          <>
            <Composer tab="whatsapp" deal={deal} onSaved={async () => { await loadData(); await onActivitySaved?.(); }} />
            <HistoryTimeline items={communications.whatsapp} emptyLabel="WhatsApp message" icon={FaWhatsapp} />
          </>
        ) : null}
      </div>
    </section>
  );
}

export default function DealDetailsModal({ deal, loading = false, onClose }) {
  const [activeTab, setActiveTab] = useState("activity");
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [mobilePanel, setMobilePanel] = useState("activities");
  const viewportWidth = useViewportWidth();
  const isMobileLayout = viewportWidth < 820;
  const isTabletLayout = !isMobileLayout && viewportWidth < 1100;
  const overlayPadding = isMobileLayout ? 0 : isTabletLayout ? 16 : 24;
  const modalWidth = isMobileLayout ? "100vw" : isTabletLayout ? "min(1024px, calc(100vw - 32px))" : "min(1440px, calc(100vw - 48px))";
  const modalHeight = isMobileLayout ? "100dvh" : isTabletLayout ? "min(94vh, 920px)" : "min(88vh, 860px)";
  const shellRadius = isMobileLayout ? 0 : isTabletLayout ? 24 : 28;
  const mobilePanels = [["overview", "Overview"], ["activities", "Activities"], ["timeline", "Timeline"]];

  const loadTimeline = async () => {
    const dealId = getDealId(deal);
    if (!dealId) return;
    setTimelineLoading(true);
    try {
      const data = await dealsAPI.getTimeline(dealId);
      setTimeline(Array.isArray(data) ? data : []);
    } catch (error) {
      Toast.error(getApiErrorMessage(error, "Unable to load deal timeline"));
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [deal?.dealId, deal?.id]);

  useEffect(() => {
    setActiveTab("activity");
    setMobilePanel("activities");
  }, [deal?.dealId, deal?.id]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose} style={{ padding: overlayPadding, zIndex: 700 }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: modalWidth, height: modalHeight, background: isMobileLayout ? "linear-gradient(180deg, #eef4fb 0%, #f8fafc 100%)" : "#f8fafc", borderRadius: shellRadius, overflow: "hidden", boxShadow: "0 32px 90px rgba(15, 23, 42, 0.22)", position: "relative", display: "flex", flexDirection: "column" }}>
        {!isMobileLayout ? <button className="icon-btn" onClick={onClose} title="Close" aria-label="Close deal details modal" style={{ position: "absolute", top: 12, right: 14, zIndex: 8, width: 32, height: 32, borderRadius: 12, border: "1px solid #d8e3ef", background: "rgba(255,255,255,0.96)", boxShadow: "0 6px 14px rgba(148, 163, 184, 0.12)", padding: 0 }}><X size={14} /></button> : null}

        {isMobileLayout ? (
          <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid #dfe7f1", background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.96) 100%)", backdropFilter: "blur(14px)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 8px", borderRadius: 999, background: "#eef4ff", border: "1px solid #d6e4ff", color: "#315c85", fontSize: 10, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>Deal Workspace</div>
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900, color: "#0f172a", lineHeight: 1.05 }}>{getDealName(deal)}</div>
                <div style={{ marginTop: 4, fontSize: 11.5, color: "#64748b", lineHeight: 1.4 }}>{getAccountName(deal) || formatStageLabel(deal?.stage || "") || "Sales deal workspace"}</div>
              </div>
              <button className="icon-btn" onClick={onClose} title="Close" style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 12, border: "1px solid #d7e2ee", background: "rgba(255,255,255,0.94)", boxShadow: "0 6px 14px rgba(148, 163, 184, 0.12)", padding: 0 }}><X size={16} /></button>
            </div>

            <div className="salescrm-scroll-hidden" style={{ display: "flex", gap: 8, justifyContent: "center", overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", marginTop: 10, paddingBottom: 1 }}>
              {mobilePanels.map(([id, label]) => {
                const active = mobilePanel === id;
                return <button key={id} type="button" onClick={() => setMobilePanel(id)} style={{ width: "fit-content", padding: "6px 9px", borderRadius: 14, border: "1.5px solid", borderColor: active ? "#8db6e8" : "#d7e2ee", background: active ? "linear-gradient(180deg, #eff6ff 0%, #e0efff 100%)" : "#ffffff", color: active ? "#1d4ed8" : "#475569", display: "flex", alignItems: "center", textAlign: "left", boxShadow: active ? "0 10px 20px rgba(191, 219, 254, 0.35)" : "0 1px 2px rgba(15, 23, 42, 0.04)", cursor: "pointer", flex: "0 0 auto", whiteSpace: "nowrap" }}><span style={{ fontSize: 12, fontWeight: 800, color: active ? "#0f172a" : "#1e293b" }}>{label}</span></button>;
              })}
            </div>
          </div>
        ) : null}

        {loading && !deal ? <div style={{ padding: 24, color: "#64748b" }}>Loading deal details...</div> : null}
        {!loading && !deal ? <div style={{ padding: 24, color: "#ef4444" }}>Unable to load deal details.</div> : null}

        {deal ? (
          isMobileLayout ? (
            <div className="salescrm-scroll-hidden" style={{ flex: 1, minHeight: 0, height: "100%", overflowY: "auto", overflowX: "hidden", padding: "8px 8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
              {mobilePanel === "overview" ? <div style={{ borderRadius: 20, overflow: "hidden", background: "#ffffff", border: "1px solid #d8e3ef", boxShadow: "0 10px 24px rgba(148, 163, 184, 0.14)" }}><DealInfoPanel deal={deal} onOpenTab={(tab) => { setActiveTab(tab); setMobilePanel("activities"); }} stacked mobile /></div> : null}
              {mobilePanel === "activities" ? <div style={{ borderRadius: 20, overflow: "hidden", background: "#ffffff", border: "1px solid #d8e3ef", boxShadow: "0 10px 24px rgba(148, 163, 184, 0.14)" }}><DealMiddle deal={deal} activeTab={activeTab} onTabChange={setActiveTab} onActivitySaved={loadTimeline} compact mobile /></div> : null}
              {mobilePanel === "timeline" ? <div style={{ borderRadius: 20, overflow: "hidden", background: "#fbfdff", border: "1px solid #d8e3ef", boxShadow: "0 10px 24px rgba(148, 163, 184, 0.14)" }}><Timeline items={timeline} loading={timelineLoading} onRefresh={loadTimeline} stacked mobile eyebrow="Deal Story" description="A clean view of deal updates, tasks, calls, emails, and stage changes." /></div> : null}
            </div>
          ) : isTabletLayout ? (
            <div className="salescrm-scroll-hidden" style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateRows: "minmax(0, 1fr) 320px", overflow: "hidden", background: "#ffffff" }}>
              <div style={{ minHeight: 0, display: "grid", gridTemplateColumns: "220px minmax(0, 1fr)", overflow: "hidden" }}>
                <div style={{ minHeight: 0, overflow: "auto", background: "#ffffff", borderRight: "1px solid #e5e7eb" }}>
                  <DealInfoPanel deal={deal} onOpenTab={setActiveTab} stacked={false} />
                </div>
                <div style={{ minHeight: 0, overflow: "hidden", background: "#ffffff" }}>
                  <DealMiddle deal={deal} activeTab={activeTab} onTabChange={setActiveTab} onActivitySaved={loadTimeline} compact />
                </div>
              </div>
              <div style={{ minHeight: 0, borderTop: "1px solid #e5e7eb", background: "#fbfdff", overflow: "hidden" }}>
                <Timeline items={timeline} loading={timelineLoading} onRefresh={loadTimeline} stacked eyebrow="Deal Story" description="A clean view of deal updates, tasks, calls, emails, and stage changes." />
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "214px minmax(0, 1fr) 300px", overflow: "hidden", background: "#ffffff" }}>
              <div style={{ minHeight: 0, overflow: "hidden", background: "#ffffff" }}>
                <DealInfoPanel deal={deal} onOpenTab={setActiveTab} stacked={false} />
              </div>
              <div style={{ minHeight: 0, overflow: "hidden", background: "#ffffff" }}>
                <DealMiddle deal={deal} activeTab={activeTab} onTabChange={setActiveTab} onActivitySaved={loadTimeline} compact={false} />
              </div>
              <div style={{ minHeight: 0, overflow: "hidden" }}>
                <Timeline items={timeline} loading={timelineLoading} onRefresh={loadTimeline} stacked={false} eyebrow="Deal Story" description="A clean view of deal updates, tasks, calls, emails, and stage changes." />
              </div>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
