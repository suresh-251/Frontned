import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import DatePicker from "react-datepicker";
import { LEAD_SOURCE_OPTIONS, STATUS_LIST, STATUS_META } from "./constants";
import { formatLeadSource, formatStatus, getFollowUpLabel, getScoreTier, offsetDay, todayStr } from "./utils";
import { ICal, IChevD, parseDateTimeValue, toDateTimeValue, useClickOutside } from "./shared";

export function StatusCell({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 188, maxHeight: 260 });
  const meta = STATUS_META[value] || {};

  const getMenuPos = (rect) => {
    const preferredHeight = 260;
    const gap = 8;
    const viewportPadding = 12;
    const minWidth = Math.max(188, rect.width);
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
        <span className="status-dot" style={{ background: meta.color }} />
        <span className="status-pill-label">{formatStatus(value)}</span>
        <span className="status-pill-caret"><IChevD s={9} c={meta.color} /></span>
      </button>
      {open && createPortal(
        <div className="status-menu" ref={menuRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, minWidth: menuPos.width, maxHeight: menuPos.maxHeight, overflowY: "auto", zIndex: 5000, display: "grid", gap: 2, background: "#ffffff", border: "1.5px solid #e5e7eb", borderRadius: 12, boxShadow: "0 18px 30px rgba(15, 23, 42, 0.14)", padding: 6, overscrollBehavior: "contain" }}>
          {STATUS_LIST.map((status) => {
            const currentMeta = STATUS_META[status];
            return (
              <button key={status} className={`status-opt ${value === status ? "status-opt--on" : ""}`} onClick={() => { onChange(status); setOpen(false); }}>
                <span className="status-opt-dot" style={{ background: currentMeta.color }} />
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
      <button className="status-pill" style={{ color: "#475569" }} onClick={() => setOpen((current) => !current)}>
        <span className="status-dot" style={{ background: "#64748b" }} />
        <span className="status-pill-label">{formatLeadSource(value)}</span>
        <span className="status-pill-caret"><IChevD s={9} c="#64748b" /></span>
      </button>
      {open && (
        <div className="status-menu" style={{ maxHeight: 280, overflowY: "auto", minWidth: 240 }}>
          {LEAD_SOURCE_OPTIONS.map((source) => (
            <button key={source} className={`status-opt ${value === source ? "status-opt--on" : ""}`} onClick={() => { onChange(source); setOpen(false); }}>
              <span className="status-opt-dot" style={{ background: "#64748b" }} />
              <span style={{ color: "#334155" }}>{formatLeadSource(source)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FollowUpCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);
  const panelRef = useRef(null);
  const [panelPos, setPanelPos] = useState(null);
  const info = value ? getFollowUpLabel(value) : null;

  const getPanelPos = () => {
    if (!ref.current) return null;
    const rect = ref.current.getBoundingClientRect();
    const panelHeight = 262;
    const panelWidth = 232;
    const viewportPadding = 12;
    const gap = 8;
    const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
    const availableAbove = rect.top - viewportPadding;
    const openBelow = availableBelow >= panelHeight || availableBelow >= availableAbove;
    const top = openBelow ? Math.max(viewportPadding, rect.bottom + gap) : Math.max(viewportPadding, rect.top - Math.min(panelHeight, availableAbove - gap) - gap);
    const left = Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - panelWidth - viewportPadding);
    return { top, left };
  };

  useLayoutEffect(() => {
    if (!editing) return;
    setPanelPos(getPanelPos());
  }, [editing]);

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
  }, [editing]);

  const toggleEditing = () => {
    if (editing) {
      setEditing(false);
      setPanelPos(null);
      return;
    }
    setPanelPos(getPanelPos());
    setEditing(true);
  };

  return (
    <div className="followup-cell" ref={ref}>
      <button onClick={toggleEditing} className={`followup-btn ${!value ? "followup-btn--empty" : ""} ${info ? `followup-btn--${info.type}` : ""}`}>
        {info?.type === "overdue" ? <AlertTriangle size={11} color="#dc2626" strokeWidth={2} aria-hidden="true" /> : <ICal s={11} c="#2563eb" />}
        {info ? <span>{info.label}</span> : <span>No follow-up</span>}
      </button>
      {editing && panelPos && createPortal(
          <div className="followup-picker followup-picker--cute" ref={panelRef} style={{ position: "fixed", top: panelPos.top, left: panelPos.left, zIndex: 5000 }}>
            <div className="followup-quick">
            <button onClick={() => { onChange(toDateTimeValue(new Date())); setEditing(false); setPanelPos(null); }}>Today</button>
            <button onClick={() => { const d = new Date(); d.setDate(d.getDate() + 1); onChange(toDateTimeValue(d)); setEditing(false); setPanelPos(null); }}>Tomorrow</button>
            <button onClick={() => { const d = new Date(); d.setDate(d.getDate() + 3); onChange(toDateTimeValue(d)); setEditing(false); setPanelPos(null); }}>+3 days</button>
          </div>

          <DatePicker
            selected={value ? parseDateTimeValue(value) : null}
            onChange={(date) => {
              onChange(toDateTimeValue(date));
              setEditing(false);
              setPanelPos(null);
            }}
            inline
            showTimeSelect
            timeIntervals={15}
            dateFormat="MMM d, yyyy h:mm aa"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            yearDropdownItemNumber={12}
            calendarClassName="followup-datepicker"
          />
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
