import { useEffect, useMemo, useRef, useState } from "react";
import { flip, offset } from "@floating-ui/react";
import { FaWhatsapp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
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
import { FloatingDateTimePicker, FloatingInput, InfoRow } from "./fields";
import {
  CALL_PURPOSE_OPTIONS,
  CALL_STATUS_OPTIONS,
  CONTACT_ROLE_OPTIONS,
  CONTACT_SHORTCUTS,
  DEAL_STAGE_OPTIONS,
  EMAIL_TEMPLATES,
  TABS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  WHATSAPP_TEMPLATES,
  assignee,
  attachmentUrl,
  card,
  compactMeetingDate,
  followUpDisplayValue,
  formatDisplayText,
  fmtDate,
  fmtTime,
  getApiErrorMessage,
  hasValue,
  input,
  leadName,
  mapActivity,
  mapCallActivity,
  mapComm,
  mapMeetingRecord,
  meetingMetaValue,
  sanitizePhoneNumber,
  selectFieldStyle,
  timelineAuthor,
  timelineDateValue,
  timelineDescription,
  timelineIcon,
  toIsoString,
} from "./shared";

export function LeftPanel({ lead, onConvert, onOpenTab, stacked = false, mobile = false, hideAvatar = false }) {
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
                onClick={() => enabled && onOpenTab?.(id)}
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

export function Timeline({ items, loading, onRefresh, stacked = false, mobile = false, onClose = null }) {
  const groups = useMemo(() => items.reduce((acc, item) => { const key = fmtDate(timelineDateValue(item), false); (acc[key] ||= []).push(item); return acc; }, {}), [items]);
  return (
    <aside style={{ height: mobile ? "auto" : "100%", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", borderLeft: stacked ? "none" : "1px solid #e2e8f0", borderTop: stacked ? "1px solid #e2e8f0" : "none", background: "linear-gradient(180deg, #fbfdff 0%, #f4f8fc 100%)" }}>
      <div style={{ borderBottom: "1px solid #e2e8f0", background: "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)", padding: "16px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em" }}>Lead Story</div>
            <div style={{ marginTop: 6, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Timeline</div>
            <div style={{ marginTop: 4, fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>A clean view of status changes, communications, and lead updates.</div>
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

function HistoryTooltip({ item }) {
  const lines = [item?.meta, item?.preview].filter(Boolean).join("\n\n").trim();
  const isCall = item?.kind === "calls";
  const duration = Number(item?.durationMinutes || 0);
  const hasDuration = isCall && Number.isFinite(duration) && duration > 0;
  const normalized = hasDuration ? Math.min(1, duration / 60) : 0;
  const graphBars = [0.25, 0.4, 0.55, 0.7, 0.85].map((factor) => Math.max(0.15, factor * normalized));
  if (!lines && !hasDuration) return null;
  return (
    <div style={{
      position: "absolute",
      left: "calc(100% + 14px)",
      top: 0,
      width: 280,
      padding: "12px 14px",
      borderRadius: 16,
      border: "1px solid #dbe4f0",
      background: "rgba(255,255,255,0.98)",
      boxShadow: "0 24px 50px rgba(15, 23, 42, 0.14)",
      color: "#334155",
      fontSize: 12.5,
      lineHeight: 1.6,
      whiteSpace: "pre-wrap",
      zIndex: 8,
      pointerEvents: "none",
    }}>
      {lines ? <div>{lines}</div> : null}
      {hasDuration ? (
        <div style={{ marginTop: lines ? 12 : 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>Call duration</div>
          <div style={{ marginTop: 6, display: "flex", alignItems: "flex-end", gap: 4, height: 32 }}>
            {graphBars.map((height, idx) => (
              <div
                key={idx}
                style={{
                  width: 10,
                  height: Math.max(6, Math.round(height * 32)),
                  borderRadius: 6,
                  background: "#bfdbfe",
                }}
              />
            ))}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>{duration} min</div>
        </div>
      ) : null}
    </div>
  );
}

function TabHistoryTimeline({ items, emptyLabel, icon: Icon }) {
  const [hoveredId, setHoveredId] = useState(null);
  const groups = useMemo(() => {
    const sortedItems = [...items].sort((a, b) => {
      const aTime = a?.date ? new Date(a.date).getTime() : 0;
      const bTime = b?.date ? new Date(b.date).getTime() : 0;
      return bTime - aTime;
    });

    return sortedItems.reduce((acc, item) => {
      const date = item?.date ? new Date(item.date) : null;
      const key = date && !Number.isNaN(date.getTime()) ? fmtDate(date, false) : "Unknown date";
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
  }, [items]);

  if (!items.length) {
    return (
      <div style={{ border: "1px dashed #dbe4f0", borderRadius: 18, background: "#fbfdff", color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "32px 18px" }}>
        No {emptyLabel} history available.
      </div>
    );
  }

  return (
    <div style={{ border: "1.5px solid #9fb3ca", borderRadius: 22, background: "#ffffff", padding: "18px 16px 10px", overflow: "visible", boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: "#eef4ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={17} />
        </div>
      </div>
      {Object.entries(groups).map(([date, group]) => (
        <div key={date} style={{ marginBottom: 18 }}>
          <div style={{ position: "relative", paddingBottom: 12 }}>
            <div style={{ position: "absolute", left: 117, top: "calc(100% - 1px)", width: 1, height: 13, background: "#dbe4f0" }} />
            <div style={{ display: "inline-flex", minWidth: 132, justifyContent: "center", marginLeft: 38, padding: "8px 14px", border: "1px solid #dbe4f0", borderRadius: 8, background: "#f8fbff", fontSize: 12, fontWeight: 700, color: "#475569" }}>{date}</div>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 117, top: 0, bottom: 0, width: 1, background: "#dbe4f0" }} />
            {group.map((item, idx) => {
              const active = hoveredId === item.id;
              return (
                <div
                  key={`${item.id}-${idx}`}
                  style={{ display: "grid", gridTemplateColumns: "82px 44px minmax(0, 1fr)", gap: 12, alignItems: "start", paddingBottom: 20 }}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textAlign: "right", paddingTop: 10 }}>{fmtTime(item?.date)}</div>
                  <div style={{ width: 44, display: "flex", justifyContent: "center" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid #dbe4f0", background: active ? "#eef4ff" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", position: "relative", zIndex: 1 }}>
                      <Icon size={15} />
                    </div>
                  </div>
                  <div style={{ position: "relative", paddingTop: 7, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1e293b", lineHeight: 1.4, wordBreak: "break-word" }}>{item.title}</div>
                    {item.description ? <div style={{ marginTop: 2, fontSize: 13, lineHeight: 1.5, color: "#334155", wordBreak: "break-word" }}>{item.description}</div> : null}
                    {item.author ? <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.4, color: "#64748b", wordBreak: "break-word" }}>{`by ${item.author}`}</div> : null}
                    {active ? <HistoryTooltip item={item} /> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Lane({ title, Icon, items, stacked = false, mobile = false }) {
  const sortedItems = useMemo(() => [...items].sort((a, b) => {
    const aTime = a?.date ? new Date(a.date).getTime() : 0;
    const bTime = b?.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  }), [items]);
  const showRightDivider = stacked ? true : title !== "Calls";

  return (
    <div style={{ minWidth: 0, flex: stacked ? "0 0 auto" : "1 1 0", minHeight: stacked && !mobile ? 188 : 0, maxHeight: stacked && !mobile ? 240 : "none", display: "flex", flexDirection: "column", overflow: "hidden", border: stacked ? "1.5px solid #cfddeb" : "none", borderRight: stacked ? "1.5px solid #cfddeb" : showRightDivider ? "1px solid #dde7f1" : "none", borderBottom: stacked ? "1.5px solid #cfddeb" : "none", borderRadius: stacked ? 18 : 0, background: "#ffffff", boxShadow: stacked ? "0 0 0 1px rgba(207, 221, 235, 0.34), 0 10px 24px rgba(148, 163, 184, 0.08)" : "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: stacked ? "16px 16px 14px" : "12px 14px", borderBottom: "1px solid #edf3f9", background: "#fbfdff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: stacked ? 36 : 28, height: stacked ? 36 : 28, borderRadius: stacked ? 10 : 8, background: "#ffffff", border: "1.5px solid #c9d9ea", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={stacked ? 16 : 14} /></div>
          <div style={{ fontSize: stacked ? 15 : 13.5, fontWeight: 800, color: "#1e293b" }}>{title}</div>
        </div>
        <div style={{ minWidth: stacked ? 30 : 24, height: stacked ? 30 : 24, padding: stacked ? "0 9px" : "0 7px", borderRadius: 999, background: "#ffffff", border: "1.5px solid #c9d9ea", color: "#475569", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: stacked ? 12.5 : 12, fontWeight: 800 }}>{items.length}</div>
      </div>
      <div style={{ flex: stacked && !mobile ? 1 : "0 0 auto", minHeight: stacked && !mobile ? 126 : 0, overflowY: stacked && !mobile ? "auto" : "visible", padding: stacked ? "16px" : "12px" }}>
        {!items.length ? (
          <div style={{ minHeight: stacked ? 84 : 92, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px dashed #b4c7dc", borderRadius: 12, background: "#fbfdff", color: "#94a3b8", fontSize: 13, textAlign: "center", padding: stacked ? "16px 12px" : 0 }}>No records found</div>
        ) : sortedItems.map((item) => (
          <div key={item.id} style={{ padding: stacked ? "0 0 14px" : "0 0 12px", marginBottom: stacked ? 14 : 12, borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: stacked ? 14 : 13.5, fontWeight: 800, color: "#334155" }}>{item.title}</div>
            {hasValue(item.description) && <div style={{ marginTop: 5, fontSize: stacked ? 13 : 12.5, color: "#64748b", lineHeight: 1.5 }}>{item.description}</div>}
            <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>{fmtDate(item.date)}</div>
            {hasValue(item.status) && <div style={{ marginTop: 5, fontSize: 11.5, color: "#94a3b8" }}>{formatStatus(item.status)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitySection({ title, bg, items, stacked = false, mobile = false }) {
  const tasks = items.filter((x) => String(x.type).toLowerCase().includes("task"));
  const meetings = items.filter((x) => String(x.type).toLowerCase().includes("meeting"));
  const calls = items.filter((x) => String(x.type).toLowerCase().includes("call"));
  const hasAnyItems = tasks.length || meetings.length || calls.length;

  return (
    <section style={{ flex: hasAnyItems && !mobile ? "1 1 auto" : "0 0 auto", minHeight: hasAnyItems ? 0 : "auto", border: stacked ? "none" : "1px solid #d9e4ef", borderRadius: 18, background: "#ffffff", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: stacked ? "none" : "0 6px 18px rgba(148, 163, 184, 0.08)" }}>
      <div style={{ flex: hasAnyItems && !mobile ? "1 1 auto" : "0 0 auto", display: "flex", flexDirection: stacked ? "column" : "row", gap: stacked ? 12 : 0, height: hasAnyItems && !mobile ? "100%" : "auto", overflowX: stacked ? "hidden" : "auto", overflowY: stacked ? "visible" : "hidden", padding: stacked ? "0" : 0, alignItems: "stretch", minHeight: 0 }}>
        <Lane title="Tasks" Icon={FileText} items={tasks} stacked={stacked} mobile={mobile} />
        <Lane title="Meetings" Icon={Calendar} items={meetings} stacked={stacked} mobile={mobile} />
        <Lane title="Calls" Icon={Phone} items={calls} stacked={stacked} mobile={mobile} />
      </div>
    </section>
  );
}

function Composer({ tab, lead, onSaved }) {
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
    <div style={{ ...card, padding: 16 }}>
      {tab === "tasks" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <FloatingInput
            label="Task Title"
            value={v.taskSubject}
            error={errors.taskSubject}
            onChange={(e) => setField("taskSubject", e.target.value)}
          />
          <FloatingDateTimePicker
            label="Due Date"
            selected={v.taskDueDate}
            onChange={(date) => setField("taskDueDate", date)}
            popperPlacement="bottom-start"
            popperOffset={8}
            popperModifiers={[flip({ fallbackPlacements: [] })]}
          />
          <FloatingInput
            as="select"
            label="Priority"
            value={v.taskPriority}
            onChange={(e) => setField("taskPriority", e.target.value)}
            style={selectFieldStyle}
          >
            {TASK_PRIORITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </FloatingInput>
          <FloatingInput
            as="select"
            label="Status"
            value={v.taskStatus}
            onChange={(e) => setField("taskStatus", e.target.value)}
            style={selectFieldStyle}
          >
            {TASK_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </FloatingInput>
          <FloatingDateTimePicker
            label="Reminder"
            selected={v.taskReminder}
            onChange={(date) => setField("taskReminder", date)}
            popperPlacement="bottom-start"
            popperOffset={8}
            popperModifiers={[flip({ fallbackPlacements: [] })]}
          />
          <FloatingInput label="Repeat" value={v.taskRepeat} onChange={(e) => setField("taskRepeat", e.target.value)} />
          <FloatingInput
            as="textarea"
            autoGrow
            label="Task Notes"
            style={{ gridColumn: "1 / -1", width: "100%", minHeight: 84, padding: "10px 12px 6px" }}
            value={v.taskDescription}
            onChange={(e) => setField("taskDescription", e.target.value)}
          />
        </div>
      )}
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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
          <div style={{ display: "inline-flex", padding: 4, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
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
          <FloatingInput
            as="select"
            label="Call Purpose"
            value={v.callPurpose}
            error={errors.callPurpose}
            onChange={(e) => setField("callPurpose", e.target.value)}
            style={selectFieldStyle}
          >
            <option value="">Select purpose</option>
            {CALL_PURPOSE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </FloatingInput>
          <FloatingDateTimePicker
            label={v.callMode === "schedule" ? "Scheduled Time" : "Call Time"}
            selected={v.callStartTime}
            error={errors.callStartTime}
            onChange={(date) => setField("callStartTime", date)}
            popperPlacement="bottom-start"
            popperOffset={8}
            popperModifiers={[flip({ fallbackPlacements: [] })]}
          />
          <FloatingInput
            as="select"
            label="Call Status"
            value={v.callStatus}
            onChange={(e) => setField("callStatus", e.target.value)}
            style={selectFieldStyle}
          >
            <option value="">Select status</option>
            {CALL_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </FloatingInput>
          <FloatingInput as="select" label="Call Type" value={v.callType} onChange={(e) => setField("callType", e.target.value)} style={selectFieldStyle}>
            <option value="Outgoing">Outgoing</option>
            <option value="Incoming">Incoming</option>
          </FloatingInput>
          <FloatingInput as="textarea" autoGrow label={v.callMode === "schedule" ? "Call Agenda / Notes" : "Call Notes"} style={{ gridColumn: "1 / -1", width: "100%", minHeight: 74, padding: "10px 12px 6px" }} value={v.callDescription} onChange={(e) => setField("callDescription", e.target.value)} />
          {v.callMode === "log" ? <div style={{ gridColumn: "1 / -1", marginTop: 2 }}>
            <button
              type="button"
              onClick={() => setShowCallDetails((prev) => !prev)}
              style={{
                border: "1px solid #dbe4f0",
                borderRadius: 12,
                padding: "9px 12px",
                background: "#f8fbff",
                color: "#475569",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {showCallExtraFields ? "Hide extra details" : "Add more details"}
            </button>
          </div> : null}
          {showCallExtraFields ? <FloatingInput label="Call Result" value={v.callResult} onChange={(e) => setField("callResult", e.target.value)} /> : null}
          {showCallExtraFields ? <FloatingInput type="number" min="0" label="Duration (Minutes)" value={v.callDurationMinutes} onChange={(e) => setField("callDurationMinutes", e.target.value)} /> : null}
          {showCallExtraFields ? <FloatingInput label="Voice Recording URL" style={{ gridColumn: "1 / -1" }} value={v.voiceRecordingUrl} onChange={(e) => setField("voiceRecordingUrl", e.target.value)} /> : null}
        </div>
      </>}
      {tab === "meetings" && <div style={{ padding: 0, borderRadius: 0, background: "transparent", border: "none", boxShadow: "none" }}>
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
      </div>}
      {tab !== "meetings" ? <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}><button className="btn-primary" onClick={submit} disabled={submitting} style={{ border: "1px solid #93c5fd", background: "#dbeafe", color: "#315c85", boxShadow: "none" }}>{submitting ? "Saving..." : tab === "emails" ? "Send Email" : tab === "whatsapp" ? "Open WhatsApp" : tab === "calls" ? "Save Call" : tab === "tasks" ? "Save Task" : "Save Note"}</button></div> : null}
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

function NotesSection({ lead, onSaved }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const normalizedNotes = useMemo(() => [...notes].sort((left, right) => {
    const leftTime = new Date(left.date || left.createdAt || 0).getTime() || 0;
    const rightTime = new Date(right.date || right.createdAt || 0).getTime() || 0;
    return rightTime - leftTime;
  }), [notes]);

  const loadNotes = async () => {
    if (!lead?.id) return;
    setLoading(true);
    try {
      const data = await notesAPI.getAll();
      const allNotes = Array.isArray(data) ? data : [];
      const nextNotes = allNotes
        .filter((item) => Number(item?.leadId || item?.leadID || item?.lead?.id || 0) === Number(lead.id))
        .map((item) => ({
          id: item?.id,
          title: item?.title || "Note",
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
  }, [lead?.id]);

  const resetEditor = () => {
    setDraft("");
    setEditingId(null);
  };

  const handleSave = async () => {
    const content = draft.trim();
    if (!content || !lead?.id) {
      Toast.error("Please add note content.");
      return;
    }

    const payload = {
      leadId: Number(lead.id),
      title: "Note",
      description: content,
      message: content,
      content,
      noteText: content,
      ...(lead.assignedToUserId ? { createdBy: Number(lead.assignedToUserId), assignedToUserId: Number(lead.assignedToUserId) } : {}),
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
      resetEditor();
      await loadNotes();
      await onSaved?.();
    } catch (error) {
      Toast.error(getApiErrorMessage(error, editingId ? "Unable to update note" : "Unable to add note"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (note) => {
    setEditingId(note.id);
    setDraft(note.content || "");
  };

  const handleDelete = async (noteId) => {
    setDeletingId(noteId);
    try {
      await notesAPI.delete(noteId);
      Toast.success("Note deleted");
      if (editingId === noteId) resetEditor();
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
      <div style={{ ...card, padding: 16 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <textarea
            style={{ ...input, minHeight: 120, resize: "vertical" }}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a note for the sales team"
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {editingId ? (
              <button type="button" className="btn-ghost" onClick={resetEditor} disabled={saving}>
                Cancel
              </button>
            ) : null}
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving} style={{ border: "1px solid #93c5fd", background: "#dbeafe", color: "#315c85", boxShadow: "none" }}>
              {saving ? "Saving..." : editingId ? "Update Note" : "Save Note"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...card, padding: 16, display: "grid", gap: 12 }}>
        {loading ? <div style={{ color: "#94a3b8", fontSize: 13 }}>Loading notes...</div> : null}
        {!loading && !normalizedNotes.length ? (
          <div style={{ border: "1px dashed #dbe4f0", borderRadius: 16, background: "#fbfdff", color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "28px 18px" }}>
            No notes saved yet.
          </div>
        ) : null}
        {!loading && normalizedNotes.map((note) => (
          <div key={note.id} style={{ border: "1px solid #cbd5e1", borderRadius: 16, padding: 14, background: "#ffffff", boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1e293b" }}>{note.title || "Note"}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>
                  {fmtDate(note.date)}
                  {note.author ? ` • ${note.author}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button type="button" className="btn-ghost" onClick={() => handleEdit(note)} disabled={saving || deletingId === note.id}>
                  Edit
                </button>
                <button type="button" className="btn-ghost" onClick={() => handleDelete(note.id)} disabled={deletingId === note.id || saving} style={{ color: "#b91c1c", borderColor: "#fecaca" }}>
                  {deletingId === note.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.6, color: "#334155", whiteSpace: "pre-wrap" }}>
              {note.content || "-"}
            </div>
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
  const [open, setOpen] = useState([]);
  const [closed, setClosed] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const mobileTabsRailRef = useRef(null);
  const load = async () => {
    if (!lead?.id) return;
    setLoading(true);
    try {
      const [openResult, closedResult, meetingResult] = await Promise.allSettled([
        activitiesAPI.getOpen({ leadId: lead.id }),
        activitiesAPI.getClosed({ leadId: lead.id }),
        meetingsAPI.getForLead(lead.id),
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

      if (
        openResult.status === "rejected" &&
        closedResult.status === "rejected" &&
        meetingResult.status === "rejected"
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
  const comms = useMemo(() => (Array.isArray(timeline) ? timeline : []).map(mapComm).filter((item) => item.kind !== "other"), [timeline]);
  const callHistory = useMemo(() => [...open, ...closed].filter((x) => String(x.type).toLowerCase().includes("call")).map(mapCallActivity), [open, closed]);
  const taskHistory = useMemo(() => [...open, ...closed].filter((x) => String(x.type).toLowerCase().includes("task")), [open, closed]);
  const filtered = useMemo(() => {
    if (activeTab === "tasks") return taskHistory;
    if (activeTab === "calls") return callHistory;
    if (activeTab === "meetings") return meetings;
    return comms.filter((x) => x.kind === activeTab);
  }, [activeTab, callHistory, comms, meetings, taskHistory]);
  const activityItems = activityView === "open" ? open : closed;
  const scrollMobileTabs = (direction) => {
    if (!mobileTabsRailRef.current) return;
    mobileTabsRailRef.current.scrollBy({
      left: direction * 140,
      behavior: "smooth",
    });
  };
  return (
    <section style={{ height: mobile ? "auto" : "100%", display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", background: "#ffffff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: mobile ? "flex-start" : "center", gap: compact ? 4 : 6, rowGap: 0, padding: mobile ? "10px 10px 8px" : "10px 0 0", overflowX: "visible", flexWrap: "wrap", flexShrink: 0, background: mobile ? "linear-gradient(180deg, #fbfdff 0%, #ffffff 100%)" : "#ffffff", borderBottom: "1px solid #eef2f7", position: "relative" }}>
        {mobile ? (
          <>
            <div style={{ width: "100%", minWidth: 0 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Activity Center</div>
              <div style={{ marginTop: 3, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                {TABS.find(([id]) => id === activeTab)?.[1] || "Activity"}
              </div>
              <div style={{ position: "relative", marginTop: 8, padding: "0 28px" }}>
                <button
                  type="button"
                  onClick={() => scrollMobileTabs(-1)}
                  aria-label="Scroll tabs left"
                  style={{ position: "absolute", left: 0, top: 0, bottom: 1, width: 24, border: "1px solid #d7e2ee", borderRadius: 10, background: "#ffffff", color: "#94a3b8", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)" }}
                >
                  <ChevronLeft size={13} />
                </button>
                <div
                  ref={mobileTabsRailRef}
                  className="salescrm-scroll-hidden"
                  style={{ display: "flex", gap: 6, overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", paddingBottom: 1 }}
                >
                  {TABS.map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onTabChange?.(id)}
                      style={{
                        border: "1.5px solid",
                        borderColor: activeTab === id ? "#8db6e8" : "#d7e2ee",
                        borderRadius: 12,
                        background: activeTab === id ? "linear-gradient(180deg, #eff6ff 0%, #e0efff 100%)" : "#ffffff",
                        color: activeTab === id ? "#1d4ed8" : "#475569",
                        padding: "7px 10px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 11.5,
                        fontWeight: 800,
                        cursor: "pointer",
                        textAlign: "left",
                        flex: "0 0 auto",
                        minWidth: "max-content",
                        boxShadow: activeTab === id ? "0 8px 18px rgba(191, 219, 254, 0.32)" : "0 1px 2px rgba(15, 23, 42, 0.04)",
                      }}
                    >
                      {id === "whatsapp" ? <FaWhatsapp size={15} /> : <Icon size={15} />}
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => scrollMobileTabs(1)}
                  aria-label="Scroll tabs right"
                  style={{ position: "absolute", right: 0, top: 0, bottom: 1, width: 24, border: "1px solid #d7e2ee", borderRadius: 10, background: "#ffffff", color: "#94a3b8", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)" }}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </>
        ) : TABS.map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => onTabChange?.(id)}
            style={{
              border: "none",
              borderBottom: activeTab === id ? "2px solid #93c5fd" : "2px solid transparent",
              background: "transparent",
              color: activeTab === id ? "#5b7fa6" : "#64748b",
              padding: compact ? "10px 2px 9px" : "10px 4px 9px",
              display: "inline-flex",
              alignItems: "center",
              gap: compact ? 5 : 6,
              fontSize: compact ? 12.5 : 13,
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {id === "whatsapp" ? <FaWhatsapp size={15} /> : <Icon size={15} />}
            {label}
          </button>
        ))}
      </div>
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
          <ActivitySection title={activityView === "open" ? "Open Activities" : "Closed Activities"} bg="#ffffff" items={activityItems} stacked={mobile} mobile={mobile} />
        </div>}
        {activeTab !== "activity" && activeTab !== "attachments" && <>
          {activeTab === "meetings" ? <>
            <div style={{ display: "inline-flex", padding: 4, borderRadius: 12, background: "#f8fafc", border: "1.5px solid #9fb3ca", alignSelf: "flex-start" }}>
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

