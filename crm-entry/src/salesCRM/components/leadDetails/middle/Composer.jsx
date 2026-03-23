import { useState } from "react";
import { flip } from "@floating-ui/react";
import Toast from "../../../utils/toast";
import activitiesAPI from "../../../api/activities.api";
import leadsAPI from "../../../api/leads.api";
import meetingsAPI from "../../../api/meetings.api";
import { FloatingDateTimePicker, FloatingInput } from "../fields";
import {
  CALL_PURPOSE_OPTIONS,
  CALL_STATUS_OPTIONS,
  EMAIL_TEMPLATES,
  WHATSAPP_TEMPLATES,
  card,
  getApiErrorMessage,
  hasValue,
  input,
  leadName,
  sanitizePhoneNumber,
  selectFieldStyle,
  centeredComposerFieldStyle,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  toIsoString,
} from "../shared";

const softOuterCardStyle = {
  ...card,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
};

export default function Composer({ tab, lead, onSaved }) {
  const [templateId, setTemplateId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCallDetails, setShowCallDetails] = useState(false);
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
    callStartTime: new Date(),
    callDurationMinutes: 0,
    callPurpose: "",
    voiceRecordingUrl: "",
    callMode: "log",
    meetingTitle: "",
    meetingDescription: "",
    meetingStartTime: new Date(),
    meetingEndTime: new Date(Date.now() + 30 * 60 * 1000),
    meetingProvider: "Zoom",
    meetingStatus: "Pending",
    taskSubject: "",
    taskDueDate: new Date(),
    taskPriority: "Medium",
    taskStatus: "Pending",
    taskReminder: null,
    taskRepeat: "",
    taskDescription: "",
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
        const whatsappUrl = `https://wa.me/${encodeURIComponent(whatsappNumber)}?text=${encodeURIComponent(v.whatsappMessage || "")}`;
        let communicationSaved = true;

        try {
          await leadsAPI.addCommunication({
            leadId: lead.id,
            type: "WhatsApp",
            subject: "WhatsApp Message",
            message: v.whatsappMessage,
            body: v.whatsappMessage,
            description: v.whatsappMessage,
            sentAt: new Date().toISOString(),
            direction: "Outgoing",
            ...(lead.assignedToUserId ? { createdBy: Number(lead.assignedToUserId) } : {}),
          });
        } catch (error) {
          communicationSaved = false;
          console.error("Failed to save WhatsApp communication", error);
        }

        const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        if (!popup) {
          Toast.error("Allow pop-ups to open WhatsApp in a new tab.");
        }

        if (!communicationSaved) {
          Toast.error("WhatsApp opened, but the communication could not be saved.");
          await onSaved?.();
          return;
        }
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
      if (tab === "tasks") {
        const subject = String(v.taskSubject || "").trim();
        const dueDate = toIsoString(v.taskDueDate);
        if (!subject) {
          setErrors((prev) => ({ ...prev, taskSubject: "Task title is required." }));
          Toast.error("Task title is required.");
          return;
        }
        await activitiesAPI.createTask({
          leadId: lead.id,
          subject,
          dueDate,
          priority: v.taskPriority || "Medium",
          status: v.taskStatus || "Pending",
          reminder: toIsoString(v.taskReminder),
          repeat: v.taskRepeat || "",
          description: v.taskDescription || "",
          ...(lead.assignedToUserId ? { assignedToUserId: Number(lead.assignedToUserId) } : {}),
        });
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
        status: v.meetingStatus || "Pending",
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
  const showCallExtraFields = v.callMode === "log" && showCallDetails;
  if (tab === "activity" || tab === "attachments") return null;
  return (
    <div style={{ ...softOuterCardStyle, padding: 16 }}>
      {tab === "tasks" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <FloatingInput label="Task Title" value={v.taskSubject} error={errors.taskSubject} onChange={(e) => setField("taskSubject", e.target.value)} />
          <FloatingDateTimePicker label="Due Date" selected={v.taskDueDate} onChange={(date) => setField("taskDueDate", date)} popperPlacement="bottom-start" popperOffset={8} popperModifiers={[flip({ fallbackPlacements: [] })]} />
          <FloatingInput as="select" label="Priority" value={v.taskPriority} onChange={(e) => setField("taskPriority", e.target.value)} style={selectFieldStyle}>
            {TASK_PRIORITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </FloatingInput>
          <FloatingInput as="select" label="Status" value={v.taskStatus} onChange={(e) => setField("taskStatus", e.target.value)} style={selectFieldStyle}>
            {TASK_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </FloatingInput>
          <FloatingDateTimePicker label="Reminder" selected={v.taskReminder} onChange={(date) => setField("taskReminder", date)} popperPlacement="bottom-start" popperOffset={8} popperModifiers={[flip({ fallbackPlacements: [] })]} />
          <FloatingInput label="Repeat" value={v.taskRepeat} onChange={(e) => setField("taskRepeat", e.target.value)} />
          <FloatingInput as="textarea" autoGrow label="Task Notes" style={{ gridColumn: "1 / -1", width: "100%", minHeight: 84, padding: "10px 12px 6px" }} value={v.taskDescription} onChange={(e) => setField("taskDescription", e.target.value)} />
        </div>
      ) : null}
      {tab === "notes" ? <textarea style={{ ...input, minHeight: 110, resize: "vertical" }} value={v.note} onChange={(e) => setField("note", e.target.value)} placeholder="Add a note for the sales team" /> : null}
      {tab === "emails" ? <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 0.9fr) minmax(0, 1.1fr)", gap: 12, alignItems: "start" }}>
        <select style={input} value={templateId} onChange={(e) => applyTemplate(e.target.value)}><option value="">Select template</option>{EMAIL_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <input style={input} value={v.toEmail} onChange={(e) => setField("toEmail", e.target.value)} placeholder="recipient@email.com" />
        <input style={{ ...input, ...centeredComposerFieldStyle, gridColumn: "1 / -1" }} value={v.emailSubject} onChange={(e) => setField("emailSubject", e.target.value)} placeholder="Email subject" />
        <textarea style={{ ...input, ...centeredComposerFieldStyle, minHeight: 140, resize: "vertical", gridColumn: "1 / -1" }} value={v.emailBody} onChange={(e) => setField("emailBody", e.target.value)} placeholder="Compose your email" />
      </div> : null}
      {tab === "whatsapp" ? <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 12 }}>
        <select style={{ ...input, ...centeredComposerFieldStyle }} value={templateId} onChange={(e) => applyTemplate(e.target.value)}><option value="">Select template</option>{WHATSAPP_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <textarea style={{ ...input, ...centeredComposerFieldStyle, minHeight: 110, resize: "vertical" }} value={v.whatsappMessage} onChange={(e) => setField("whatsappMessage", e.target.value)} placeholder="Write the WhatsApp message" />
      </div> : null}
      {tab === "calls" ? <>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
          <div style={{ display: "inline-flex", padding: 4, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            {[["log", "Log Call"], ["schedule", "Schedule Call"]].map(([mode, label]) => (
              <button key={mode} type="button" onClick={() => setField("callMode", mode)} style={{ border: "none", borderRadius: 10, padding: "7px 12px", background: v.callMode === mode ? "#ffffff" : "transparent", color: v.callMode === mode ? "#5b7fa6" : "#64748b", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: v.callMode === mode ? "0 6px 16px rgba(191, 219, 254, 0.22)" : "none" }}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" onClick={handleCallNow} disabled={!callableNumber} style={{ minHeight: 40, padding: "10px 14px", border: "1px solid #bbf7d0", borderRadius: 12, background: callableNumber ? "#f0fdf4" : "#f8fafc", color: callableNumber ? "#166534" : "#94a3b8", fontSize: 13, fontWeight: 800, lineHeight: 1.1, opacity: callableNumber ? 1 : 0.7, cursor: callableNumber ? "pointer" : "not-allowed", flexShrink: 0 }}>
            Call Now
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, alignItems: "start" }}>
          <FloatingInput as="select" label="Call Purpose" value={v.callPurpose} error={errors.callPurpose} onChange={(e) => setField("callPurpose", e.target.value)} style={selectFieldStyle}>
            <option value="">Select purpose</option>
            {CALL_PURPOSE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </FloatingInput>
          <FloatingDateTimePicker label={v.callMode === "schedule" ? "Scheduled Time" : "Call Time"} selected={v.callStartTime} error={errors.callStartTime} onChange={(date) => setField("callStartTime", date)} popperPlacement="bottom-start" popperOffset={8} popperModifiers={[flip({ fallbackPlacements: [] })]} />
          <FloatingInput as="select" label="Call Status" value={v.callStatus} onChange={(e) => setField("callStatus", e.target.value)} style={selectFieldStyle}>
            <option value="">Select status</option>
            {CALL_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </FloatingInput>
          <FloatingInput as="select" label="Call Type" value={v.callType} onChange={(e) => setField("callType", e.target.value)} style={selectFieldStyle}>
            <option value="Outgoing">Outgoing</option>
            <option value="Incoming">Incoming</option>
          </FloatingInput>
          <FloatingInput as="textarea" autoGrow label={v.callMode === "schedule" ? "Call Agenda / Notes" : "Call Notes"} style={{ gridColumn: "1 / -1", width: "100%", minHeight: 74, padding: "10px 12px 6px" }} value={v.callDescription} onChange={(e) => setField("callDescription", e.target.value)} />
          {v.callMode === "log" ? <div style={{ gridColumn: "1 / -1", marginTop: 2 }}>
            <button type="button" onClick={() => setShowCallDetails((prev) => !prev)} style={{ border: "1px solid #dbe4f0", borderRadius: 12, padding: "9px 12px", background: "#f8fbff", color: "#475569", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              {showCallExtraFields ? "Hide extra details" : "Add more details"}
            </button>
          </div> : null}
          {showCallExtraFields ? <FloatingInput label="Call Result" value={v.callResult} onChange={(e) => setField("callResult", e.target.value)} /> : null}
          {showCallExtraFields ? <FloatingInput type="number" min="0" label="Duration (Minutes)" value={v.callDurationMinutes} onChange={(e) => setField("callDurationMinutes", e.target.value)} /> : null}
          {showCallExtraFields ? <FloatingInput label="Voice Recording URL" style={{ gridColumn: "1 / -1" }} value={v.voiceRecordingUrl} onChange={(e) => setField("voiceRecordingUrl", e.target.value)} /> : null}
        </div>
      </> : null}
      {tab === "meetings" ? <div style={{ padding: 0, borderRadius: 0, background: "transparent", border: "none", boxShadow: "none" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16 }}>
          {(() => {
            const roomyFieldStyle = { height: 50, minHeight: 50, padding: "14px 14px 8px" };
            return <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, alignItems: "start" }}>
                <FloatingInput label="Meeting Title" style={roomyFieldStyle} value={v.meetingTitle} onChange={(e) => setField("meetingTitle", e.target.value)} />
                <FloatingInput as="select" style={roomyFieldStyle} label="Provider" value={v.meetingProvider} onChange={(e) => setField("meetingProvider", e.target.value)}>
                  <option value="Zoom">Zoom</option>
                  <option value="Teams">Teams</option>
                </FloatingInput>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, alignItems: "start" }}>
                <FloatingDateTimePicker label="Start Time" style={roomyFieldStyle} selected={v.meetingStartTime} onChange={(date) => setField("meetingStartTime", date)} popperPlacement="bottom-start" popperOffset={8} popperModifiers={[flip({ fallbackPlacements: [] })]} />
                <FloatingDateTimePicker label="End Time" style={roomyFieldStyle} selected={v.meetingEndTime} minDate={v.meetingStartTime || undefined} onChange={(date) => setField("meetingEndTime", date)} popperPlacement="bottom-start" popperOffset={8} popperModifiers={[flip({ fallbackPlacements: [] })]} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, alignItems: "start" }}>
                <FloatingInput as="select" style={roomyFieldStyle} label="Status" value={v.meetingStatus} onChange={(e) => setField("meetingStatus", e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="Incomplete">Incomplete</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </FloatingInput>
              </div>
            </>;
          })()}
          <FloatingInput as="textarea" autoGrow label="Meeting Notes" style={{ minHeight: 72, padding: "10px 12px 6px" }} value={v.meetingDescription} onChange={(e) => setField("meetingDescription", e.target.value)} />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ minWidth: 190 }}>
              <button className="btn-primary" onClick={submit} disabled={submitting} style={{ minWidth: 170, minHeight: 44, border: "1px solid #93c5fd", background: "#dbeafe", color: "#315c85", boxShadow: "none" }}>
                {submitting ? "Saving..." : "Schedule Meeting"}
              </button>
            </div>
          </div>
        </div>
      </div> : null}
      {tab !== "meetings" ? <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}><button className="btn-primary" onClick={submit} disabled={submitting} style={{ border: "1px solid #93c5fd", background: "#dbeafe", color: "#315c85", boxShadow: "none" }}>{submitting ? "Saving..." : tab === "emails" ? "Send Email" : tab === "whatsapp" ? "Open WhatsApp" : tab === "calls" ? "Save Call" : tab === "tasks" ? "Save Task" : "Save Note"}</button></div> : null}
    </div>
  );
}
