import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import activitiesAPI from "../../api/activities.api";
import { LEAD_SOURCE_OPTIONS, STATUS_LIST, STATUS_META } from "./constants";
import { formatLeadSource, formatStatus, getScoreTier } from "./utils";
import { ICal, IChevD, useClickOutside } from "./shared";

export function StatusCell({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 260 });
  const meta = STATUS_META[value] || {};

  const getMenuPos = (rect) => {
    const preferredHeight = 260;
    const gap = 8;
    const viewportPadding = 12;
    const minWidth = Math.max(0, rect.width);
    const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
    const availableAbove = rect.top - viewportPadding;
    const openBelow = availableBelow >= 180 || availableBelow >= availableAbove;
    const maxHeight = Math.max(160, Math.min(preferredHeight, openBelow ? availableBelow - gap : availableAbove - gap));
    const top = openBelow ? Math.max(viewportPadding, rect.bottom + gap) : Math.max(viewportPadding, rect.top - maxHeight - gap);
    const left = Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - minWidth - viewportPadding);
    return { top, left, width: minWidth, maxHeight };
  };

  useEffect(() => {
    if (!open || !ref.current) return;
    setMenuPos(getMenuPos(ref.current.getBoundingClientRect()));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (ref.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const reposition = () => {
      if (!ref.current) return;
      setMenuPos(getMenuPos(ref.current.getBoundingClientRect()));
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  return (
    <div className="status-cell" ref={ref}>
      <button className="status-pill" style={{ color: meta.color }} onClick={() => setOpen((current) => !current)}>
        <span className="status-pill-label">{formatStatus(value)}</span>
        <span className="status-pill-caret"><IChevD s={9} c={meta.color} /></span>
      </button>
      {open && createPortal(
        <div className="status-menu" ref={menuRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, maxHeight: menuPos.maxHeight, overflowY: "auto", zIndex: 5000, display: "grid", gap: 2, background: "var(--bg-card)", border: "1.5px solid var(--border-color)", borderRadius: 12, boxShadow: "0 18px 30px rgba(15, 23, 42, 0.14)", padding: 4, overscrollBehavior: "contain" }}>
          {STATUS_LIST.map((status) => {
            const currentMeta = STATUS_META[status];
            return (
              <button key={status} className={`status-opt ${value === status ? "status-opt--on" : ""}`} onClick={() => { onChange(status); setOpen(false); }}>
                <span style={{ color: currentMeta.color }}>{formatStatus(status)}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

export function SourceCell({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="status-cell" ref={ref}>
      <button className="status-pill" style={{ color: "var(--text-main)" }} onClick={() => setOpen((current) => !current)}>
        <span className="status-dot" style={{ background: "color-mix(in srgb, var(--text-main) 55%, #64748b)" }} />
        <span className="status-pill-label">{formatLeadSource(value)}</span>
        <span className="status-pill-caret"><IChevD s={9} c="var(--text-main)" /></span>
      </button>
      {open && (
        <div className="status-menu" style={{ maxHeight: 280, overflowY: "auto", minWidth: 240, background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          {LEAD_SOURCE_OPTIONS.map((source) => (
            <button key={source} className={`status-opt ${value === source ? "status-opt--on" : ""}`} onClick={() => { onChange(source); setOpen(false); }}>
              <span className="status-opt-dot" style={{ background: "color-mix(in srgb, var(--text-main) 55%, #64748b)" }} />
              <span style={{ color: "var(--text-main)" }}>{formatLeadSource(source)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AssigneeCell({ value, options = [], onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="status-cell assignee-cell" ref={ref}>
      <button className="status-pill assignee-pill" style={{ color: "var(--text-main)" }} onClick={() => setOpen((current) => !current)}>
        <span className="assignee-pill__label">{value || "Unassigned"}</span>
        <span className="status-pill-caret assignee-pill-caret"><IChevD s={9} c="var(--text-main)" /></span>
      </button>
      {open && (
        <div className="status-menu assignee-menu" style={{ maxHeight: 280, overflowY: "auto", minWidth: 172, background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
          {options.map((option) => (
            <button
              key={option}
              className={`status-opt assignee-opt ${value === option ? "status-opt--on assignee-opt--on" : ""}`}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              <span>{option}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FollowUpCell({ value, onChange, bucket = "All", leadId }) {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);
  const panelRef = useRef(null);
  const requestIdRef = useRef(0);
  const [panelPos, setPanelPos] = useState(null);
  const [followUpItems, setFollowUpItems] = useState([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpError, setFollowUpError] = useState("");
  const [followUpView, setFollowUpView] = useState("");
  const bucketLower = String(bucket || "").toLowerCase();
  const activeFollowUpOption = followUpView || "all";
  const info = bucketLower === "today"
    ? { label: "Today", type: "today" }
    : bucketLower === "overdue"
      ? { label: "Overdue", type: "overdue" }
      : bucketLower === "tomorrow"
        ? { label: "Tomorrow", type: "tomorrow" }
      : bucketLower === "upcoming"
        ? { label: "Upcoming", type: "normal" }
        : null;
  const viewTitles = {
    overdue: "Overdue follow-ups",
    upcoming: "Upcoming pending follow-ups",
    tomorrow: "Tomorrow's follow-ups",
    today: "Today's follow-ups",
  };
  const emptyStateLabels = {
    overdue: "No overdue follow-ups for this lead.",
    upcoming: "No pending upcoming follow-ups for this lead.",
    tomorrow: "No follow-ups for tomorrow.",
    today: "No follow-ups for today.",
  };

  const getPanelPos = useCallback(() => {
    if (!ref.current) return null;
    const rect = ref.current.getBoundingClientRect();
    const panelHeight = followUpView ? 420 : 220;
    const panelWidth = 520;
    const viewportPadding = 12;
    const gap = 8;
    const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
    const availableAbove = rect.top - viewportPadding;
    const openBelow = availableBelow >= panelHeight || availableBelow >= availableAbove;
    const top = openBelow ? Math.max(viewportPadding, rect.bottom + gap) : Math.max(viewportPadding, rect.top - Math.min(panelHeight, availableAbove - gap) - gap);
    const left = Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - panelWidth - viewportPadding);
    return { top, left };
  }, [followUpView]);

  useLayoutEffect(() => {
    if (!editing) return;
    setPanelPos(getPanelPos());
  }, [editing, getPanelPos]);

  useEffect(() => {
    if (!editing) return;
    const close = (event) => {
      if (ref.current?.contains(event.target) || panelRef.current?.contains(event.target)) return;
      setEditing(false);
      setPanelPos(null);
    };
    const reposition = () => setPanelPos(getPanelPos());
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [editing, getPanelPos]);

  const closePicker = () => {
    setEditing(false);
    setPanelPos(null);
    setFollowUpView("");
    setFollowUpError("");
  };

  const fmtPopupDate = (value) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const fmtPopupLabel = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "-";
    return raw.replace(/([a-z])([A-Z])/g, "$1 $2");
  };

  const normalizeFollowUpItem = (item) => {
    const normalizedType = item?.type || item?.activityType || item?.activityTypeName || "Follow-up";
    const normalizedSubject = item?.subject || item?.title || item?.name || normalizedType;
    return {
      ...item,
      type: normalizedType,
      subject: normalizedSubject,
      title: item?.title || normalizedSubject,
    };
  };

  const loadFollowUpView = async (view) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setFollowUpView(view);
    setFollowUpLoading(true);
    setFollowUpError("");
    try {
      let data = [];
      if (view === "today") {
        data = await activitiesAPI.getFollowUpsToday({ leadId });
      } else if (view === "overdue") {
        data = (await activitiesAPI.getFollowUpsOverdue({ leadId })).map?.(normalizeFollowUpItem) || [];
      } else if (view === "upcoming") {
        const now = new Date();
        data = await activitiesAPI.getFollowUps({
          leadId,
          fromDate: now.toISOString(),
          status: "Pending",
        });
      } else if (view === "tomorrow") {
        const now = new Date();
        const startOfTomorrow = new Date(now);
        startOfTomorrow.setHours(24, 0, 0, 0);
        const endOfTomorrow = new Date(startOfTomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);
        data = await activitiesAPI.getFollowUps({
          leadId,
          fromDate: startOfTomorrow.toISOString(),
          toDate: endOfTomorrow.toISOString(),
          status: "Pending",
        });
      }
      if (requestIdRef.current !== requestId) return;
      setFollowUpItems(Array.isArray(data) ? data : []);
      setPanelPos(getPanelPos());
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      setFollowUpItems([]);
      setFollowUpError(error?.response?.data?.message || "Unable to load follow-ups.");
      setPanelPos(getPanelPos());
    } finally {
      if (requestIdRef.current === requestId) {
        setFollowUpLoading(false);
      }
    }
  };

  const toggleEditing = () => {
    if (editing) {
      closePicker();
      return;
    }
    requestIdRef.current += 1;
    setFollowUpItems([]);
    setFollowUpLoading(false);
    setFollowUpError("");
    setFollowUpView("");
    setPanelPos(getPanelPos());
    setEditing(true);
  };

  return (
    <div className="followup-cell" ref={ref}>
      <button onClick={toggleEditing} className={`followup-btn ${!value ? "followup-btn--empty" : ""} ${info ? `followup-btn--${info.type}` : ""}`}>
        {info?.type === "overdue" ? <AlertTriangle size={11} color="#dc2626" strokeWidth={2} aria-hidden="true" /> : <ICal s={11} c="#2563eb" />}
        {info ? <span>{info.label}</span> : <span>No follow up</span>}
      </button>
      {editing && panelPos && createPortal(
          <div className="followup-picker followup-picker--plain" ref={panelRef} style={{ position: "fixed", top: panelPos.top, left: panelPos.left, zIndex: 5000, width: "fit-content", maxWidth: "min(calc(100vw - 24px), 520px)", maxHeight: 420, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div className="followup-picker__topbar">
            <div className="followup-picker__eyebrow">Follow-Up</div>
          </div>
          {onChange && (
            <div className="followup-picker__header">
              {onChange ? (
                <div className="followup-picker__actions">
                  {["All", "Overdue", "Today", "Tomorrow", "Upcoming"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`followup-picker__action ${activeFollowUpOption === option.toLowerCase() ? "followup-picker__action--active" : ""}`}
                      onClick={() => {
                        if (option === "All") {
                          requestIdRef.current += 1;
                          setFollowUpView("");
                          setFollowUpItems([]);
                          setFollowUpLoading(false);
                          setFollowUpError("");
                          return;
                        }
                        loadFollowUpView(option.toLowerCase());
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
          {followUpView ? (
            <div className="followup-picker__results" style={{ minHeight: 0, maxHeight: 300, overflowY: "auto" }}>
              <div className="followup-picker__results-title">{viewTitles[followUpView] || "Follow-ups"}</div>
              {followUpLoading ? <div className="followup-picker__results-empty">Loading follow-ups...</div> : null}
              {!followUpLoading && followUpError ? <div className="followup-picker__results-empty">{followUpError}</div> : null}
              {!followUpLoading && !followUpError && !followUpItems.length ? <div className="followup-picker__results-empty">{emptyStateLabels[followUpView] || "No follow-ups found."}</div> : null}
              {!followUpLoading && !followUpError && followUpItems.length ? (
                <div className="followup-picker__results-list">
                  {followUpItems.map((item, index) => (
                    <div key={item?.id || `${item?.title || item?.type || "followup"}-${index}`} className="followup-picker__result-item">
                      <div className="followup-picker__result-head">
                        <div className="followup-picker__result-title">{item?.title || item?.name || item?.type || "Follow-up"}</div>
                        <div className="followup-picker__result-type">{fmtPopupLabel(item?.type || item?.activityType || item?.activityTypeName || "Follow-up")}</div>
                      </div>
                      <div className="followup-picker__result-body">
                        {followUpView !== "overdue" ? (
                          <div className="followup-picker__result-meta">
                            <span className="followup-picker__result-label">Subject</span>
                            <span className="followup-picker__result-value">{fmtPopupLabel(item?.subject || item?.title || item?.name || item?.type || "Follow-up")}</span>
                          </div>
                        ) : null}
                        <div className="followup-picker__result-meta followup-picker__result-meta--time">
                          <span className="followup-picker__result-label">When</span>
                          <span className="followup-picker__result-value">{fmtPopupDate(item?.dueDate || item?.activityDate || item?.date || item?.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>,
        document.body
      )}
    </div>
  );
}

export function ScoreBar({ score }) {
  const tier = getScoreTier(score);
  return <div className={`score-badge score-badge--${tier}`}>{score}</div>;
}
