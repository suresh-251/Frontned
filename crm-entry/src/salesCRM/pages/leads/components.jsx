import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart2,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit2,
  Filter,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Plus,
  Search,
  Settings,
  TrendingUp,
  Upload,
  User,
  X,
} from "lucide-react";
import DatePicker from "react-datepicker";
import {
  ALL_COLUMNS,
  AVATAR_COLORS,
  CLEARED_FILTERS,
  LEAD_FIELDS,
  LEAD_TYPES,
  RESPONSE_TYPES,
  SOURCE_META,
  STATUS_LIST,
  STATUS_META,
} from "./constants";
import {
  formatStatus,
  getFollowUpLabel,
  getInitials,
  getScoreTier,
  guessField,
  offsetDay,
  parseCSV,
  todayStr,
} from "./utils";

const Icon = ({ id: IconComp, size = 18, color = "currentColor", sw = 1.8 }) => (
  <IconComp size={size} color={color} strokeWidth={sw} aria-hidden="true" />
);

const mkI = (Comp) => ({ s = 14, c = "currentColor", sw = 1.7, ...rest }) => (
  <Comp size={s} color={c} strokeWidth={sw} aria-hidden="true" {...rest} />
);

export const ISearch = mkI(Search);
export const IChevD = mkI(ChevronDown);
export const IChevU = mkI(ChevronUp);
export const IChevR = mkI(ChevronRight);
export const IChevL = mkI(ChevronLeft);
export const IX = mkI(X);
export const ICal = mkI(Calendar);
export const IPlus = ({ s = 14, c = "currentColor", sw = 2.2, ...rest }) => (
  <Plus size={s} color={c} strokeWidth={sw} aria-hidden="true" {...rest} />
);
export const IEdit = mkI(Edit2);
export const IPhone = mkI(Phone);
export const IMail = mkI(Mail);
export const ISettings = mkI(Settings);
export const ICheck = ({ s = 14, c = "currentColor", sw = 2.5, ...rest }) => (
  <Check size={s} color={c} strokeWidth={sw} aria-hidden="true" {...rest} />
);
export const IFilter = mkI(Filter);
export const IRows = mkI(List);
export const IUpload = mkI(Upload);
export const IKanban = mkI(LayoutGrid);

function useClickOutside(ref, cb) {
  useEffect(() => {
    const handleMouseDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) cb();
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [ref, cb]);
}

export const StatCard = memo(({ label, value, change, icon, alert, c, delay }) => (
  <div className="stat-card" style={{ "--sc-delay": delay, "--sc-card": c.card, "--sc-icon": c.icon, "--sc-ink": c.ink }}>
    <div className="stat-header">
      <div className="stat-icon-wrap"><Icon id={icon} size={18} color="var(--sc-ink)" /></div>
      <span className="stat-label">{label}</span>
      <div className="stat-alert"><Icon id={alert} size={14} color="var(--sc-ink)" sw={2} /></div>
    </div>
    <div className="stat-body">
      <div className="stat-value">{value}</div>
      <div className="stat-change"><TrendingUp size={12} color="var(--sc-ink)" strokeWidth={2.5} aria-hidden="true" /><span>5 due today</span></div>
    </div>
  </div>
));

export function FilterModal({ onClose, filters, activeFilterCount, onApply }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const assignees = useMemo(() => ["All", "Monica Jones", "James Carter", "Amanda Blake", "Samantha Clark", "Anthony Cruz"], []);
  const updateFilter = (key, value) => setLocalFilters((prev) => ({ ...prev, [key]: value }));
  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };
  const handleClear = () => setLocalFilters(CLEARED_FILTERS);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.35)", zIndex: 500 }} />
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: "340px", background: "white", boxShadow: "4px 0 20px rgba(0,0,0,0.15)", zIndex: 501, display: "flex", flexDirection: "column", animation: "slideIn 0.25s ease-out" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IFilter s={16} c="#4f46e5" />
            <span style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>Filter Leads</span>
            {activeFilterCount > 0 && <span style={{ background: "#4f46e5", color: "white", fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "12px" }}>{activeFilterCount}</span>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", borderRadius: "4px" }}><IX s={16} c="#6b7280" /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", margin: "0 0 12px 0" }}>Lead Filters</h4>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>Status</label>
              <select value={localFilters.status} onChange={(event) => updateFilter("status", event.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", background: "white", cursor: "pointer" }}>
                <option value="All">All Statuses</option>
                {STATUS_LIST.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>Source</label>
              <select value={localFilters.source} onChange={(event) => updateFilter("source", event.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", background: "white", cursor: "pointer" }}>
                <option value="All">All Sources</option>
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
                <option value="Referral">Referral</option>
                <option value="Warm">Warm</option>
              </select>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>Assigned To</label>
              <select value={localFilters.assignee} onChange={(event) => updateFilter("assignee", event.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", background: "white", cursor: "pointer" }}>
                {assignees.map((assignee) => <option key={assignee} value={assignee}>{assignee}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", margin: "0 0 12px 0" }}>Activity</h4>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>Last Contacted (days)</label>
              <input type="number" placeholder="Enter days" min="0" value={localFilters.lastContactedDays} onChange={(event) => updateFilter("lastContactedDays", event.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px" }} />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>Responded To</label>
              <select value={localFilters.respondedTo} onChange={(event) => updateFilter("respondedTo", event.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", background: "white", cursor: "pointer" }}>
                {RESPONSE_TYPES.map((responseType) => <option key={responseType} value={responseType}>{responseType}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", margin: "0 0 12px 0" }}>Dates</h4>
            {[["Created Date From", "createdDateFrom"], ["Created Date To", "createdDateTo"], ["Follow-up From", "followUpDateFrom"], ["Follow-up To", "followUpDateTo"]].map(([label, key]) => (
              <div key={key} style={{ marginBottom: key === "followUpDateTo" ? "0" : "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: 500, color: "#374151", display: "block", marginBottom: "4px" }}>{label}</label>
                <input type="date" value={localFilters[key]} onChange={(event) => updateFilter(key, event.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px" }} />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", margin: "0 0 12px 0" }}>Location</h4>
            <div style={{ marginBottom: "8px" }}>
              <input type="text" placeholder="City" value={localFilters.city} onChange={(event) => updateFilter("city", event.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", marginBottom: "8px" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <input type="text" placeholder="State" value={localFilters.state} onChange={(event) => updateFilter("state", event.target.value)} style={{ padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px" }} />
              <input type="text" placeholder="Zip" value={localFilters.zip} onChange={(event) => updateFilter("zip", event.target.value)} style={{ padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px" }} />
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #e5e7eb", display: "flex", gap: "8px", background: "#fafafa" }}>
          <button onClick={handleClear} style={{ flex: 1, padding: "8px 12px", background: "white", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", fontWeight: 500, color: "#374151", cursor: "pointer" }}>Clear All</button>
          <button onClick={handleApply} style={{ flex: 1, padding: "8px 12px", background: "#4f46e5", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "white", cursor: "pointer" }}>Apply {activeFilterCount > 0 && `(${activeFilterCount})`}</button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}

export function StatusCell({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));
  const meta = STATUS_META[value] || {};

  return (
    <div className="status-cell" ref={ref}>
      <button className="status-pill" style={{ color: meta.color, background: meta.bg }} onClick={() => setOpen((current) => !current)}>
        {formatStatus(value)}<IChevD s={9} c={meta.color} />
      </button>
      {open && (
        <div className="status-menu">
          {STATUS_LIST.map((status) => {
            const currentMeta = STATUS_META[status];
            return (
              <button key={status} className={`status-opt ${value === status ? "status-opt--on" : ""}`} onClick={() => { onChange(status); setOpen(false); }}>
                <span style={{ color: currentMeta.color }}>{formatStatus(status)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function FollowUpCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setEditing(false));
  const info = value ? getFollowUpLabel(value) : null;

  return (
    <div className="followup-cell" ref={ref}>
      <button onClick={() => setEditing((current) => !current)} className={`followup-btn ${!value ? "followup-btn--empty" : ""} ${info ? `followup-btn--${info.type}` : ""}`}>
        {info?.type === "overdue" ? <AlertTriangle size={11} color="#dc2626" strokeWidth={2} aria-hidden="true" /> : <ICal s={11} c="#2563eb" />}
        {info ? <span>{info.label}</span> : <span>No follow-up</span>}
      </button>
      {editing && (
        <div className="followup-picker">
          <div className="followup-quick">
            <button onClick={() => { onChange(todayStr()); setEditing(false); }}>Today</button>
            <button onClick={() => { onChange(offsetDay(1)); setEditing(false); }}>Tomorrow</button>
            <button onClick={() => { onChange(offsetDay(3)); setEditing(false); }}>+3 days</button>
          </div>

          <DatePicker
            selected={value ? new Date(value) : null}
            onChange={(date) => {
              const iso = date.toISOString().split("T")[0];
              onChange(iso);
              setEditing(false);
            }}
            inline
          />
        </div>
      )}
    </div>
  );
}

export function ScoreBar({ score, onAdjust }) {
  const [hover, setHover] = useState(false);
  const tier = getScoreTier(score);

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <div className={`score-badge score-badge--${tier}`}>{score}</div>
      {hover && (
        <div className="score-adj-menu">
          {[-20, -10, +10, +20].map((delta) => (
            <button key={delta} className="score-adj-btn" onClick={(event) => { event.stopPropagation(); onAdjust(delta); }}>{delta > 0 ? `+${delta}` : delta}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AddLeadDropdown({ onSelectType }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="btn-primary" onClick={() => setOpen((current) => !current)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <IPlus s={12} />Add Lead<IChevD s={10} c="white" />
      </button>
      {open && (
        <div className="add-lead-menu">
          <div className="add-lead-section-label">Quick Add</div>
          {LEAD_TYPES.slice(0, 3).map((leadType) => {
            const IconComp = leadType.icon;
            return (
              <button key={leadType.key} className="add-lead-option" onClick={() => { setOpen(false); onSelectType(leadType); }}>
                <span className="add-lead-opt-icon"><IconComp size={13} strokeWidth={1.8} /></span>{leadType.label}
              </button>
            );
          })}
          <div className="add-lead-divider" />
          <div className="add-lead-section-label">More Types</div>
          {LEAD_TYPES.slice(3).map((leadType) => {
            const IconComp = leadType.icon;
            return (
              <button key={leadType.key} className="add-lead-option" onClick={() => { setOpen(false); onSelectType(leadType); }}>
                <span className="add-lead-opt-icon"><IconComp size={13} strokeWidth={1.8} /></span>{leadType.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CreateLeadModal({ leadType, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", address: "", status: "New", source: leadType?.source || "Inbound", assignee: "Monica Jones", score: 50, followUpDate: "", createdDate: todayStr() });
  const handle = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, id: Date.now(), avatarBg: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] });
    onClose();
  };

  const inputStyle = { width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", outline: "none" };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-hdr">
          <div><div className="modal-title">Create {leadType?.label || "New Lead"}</div><div className="modal-sub">Fill in the lead details below</div></div>
          <button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button>
        </div>
        <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {[{ label: "Full Name *", key: "name", span: 2 }, { label: "Company", key: "company" }, { label: "Email", key: "email", type: "email" }, { label: "Phone", key: "phone" }, { label: "Address", key: "address" }].map((field) => (
            <div key={field.key} style={{ gridColumn: field.span === 2 ? "1 / -1" : "auto" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>{field.label}</label>
              <input type={field.type || "text"} value={form[field.key]} onChange={(event) => handle(field.key, event.target.value)} style={inputStyle} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>Status</label>
            <select value={form.status} onChange={(event) => handle("status", event.target.value)} style={{ ...inputStyle, background: "white" }}>{STATUS_LIST.map((status) => <option key={status}>{status}</option>)}</select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>Source</label>
            <select value={form.source} onChange={(event) => handle("source", event.target.value)} style={{ ...inputStyle, background: "white" }}>{Object.keys(SOURCE_META).map((source) => <option key={source}>{source}</option>)}</select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>Follow-Up Date</label>
            <input type="date" value={form.followUpDate} onChange={(event) => handle("followUpDate", event.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>Initial Score ({form.score})</label>
            <input type="range" min={0} max={100} value={form.score} onChange={(event) => handle("score", parseInt(event.target.value, 10))} style={{ width: "100%", accentColor: "#4f46e5" }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={!form.name.trim()}><IPlus s={12} />&ensp;Create Lead</button>
        </div>
      </div>
    </div>
  );
}
