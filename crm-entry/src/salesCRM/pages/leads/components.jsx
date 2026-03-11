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

export const StatCard = memo(({ label, value, detailValue = 0, detailLabel = "due today", helper, icon, alert, c, delay }) => (
  <div className="stat-card" style={{ "--sc-delay": delay, "--sc-card": c.card, "--sc-icon": c.icon, "--sc-ink": c.ink }}>
    <div className="stat-header">
      <div className="stat-icon-wrap"><Icon id={icon} size={18} color="var(--sc-ink)" /></div>
      <span className="stat-label">{label}</span>
      <div className="stat-alert">
        <Icon id={alert} size={14} color="var(--sc-ink)" sw={2} />
      </div>
    </div>
    <div className="stat-body">
      <div className="stat-value-row">
        <div className="stat-value">{value}</div>
        <div className="stat-change">
          <TrendingUp size={12} color="var(--sc-ink)" strokeWidth={2.5} aria-hidden="true" />
          <span>{detailValue} {detailLabel}</span>
        </div>
      </div>
    </div>
  </div>
));

export function FilterModal({ onClose, filters, activeFilterCount, onApply }) {
  const inferDateMode = (from, to) => {
    const today = todayStr();
    const tomorrow = offsetDay(1);
    if (!from && !to) return "range";
    if (from === today && to === today) return "today";
    if (from === tomorrow && to === tomorrow) return "tomorrow";
    if (from && to && from !== to) return "range";
    return "custom";
  };

  const [localFilters, setLocalFilters] = useState(filters);
  const [dateModes, setDateModes] = useState({
    created: inferDateMode(filters.createdDateFrom, filters.createdDateTo),
    followUp: inferDateMode(filters.followUpDateFrom, filters.followUpDateTo),
  });
  useEffect(() => {
    setLocalFilters(filters);
    setDateModes({
      created: inferDateMode(filters.createdDateFrom, filters.createdDateTo),
      followUp: inferDateMode(filters.followUpDateFrom, filters.followUpDateTo),
    });
  }, [filters]);
  const assignees = useMemo(() => ["All", "Monica Jones", "James Carter", "Amanda Blake", "Samantha Clark", "Anthony Cruz"], []);
  const updateFilter = (key, value) => setLocalFilters((prev) => ({ ...prev, [key]: value }));
  const handleApply = () => onApply(localFilters);
  const handleClear = () => {
    setLocalFilters(CLEARED_FILTERS);
    setDateModes({ created: "range", followUp: "range" });
  };

  const applyDateMode = (prefix, mode, customValue = "") => {
    const modeKey = prefix === "createdDate" ? "created" : "followUp";
    setDateModes((prev) => ({ ...prev, [modeKey]: mode }));

    if (mode === "range") return;

    if (mode === "custom" && !customValue) {
      const existingDate = localFilters[`${prefix}From`] || localFilters[`${prefix}To`] || todayStr();
      setLocalFilters((prev) => ({ ...prev, [`${prefix}From`]: existingDate, [`${prefix}To`]: existingDate }));
      return;
    }

    const targetDate = mode === "today" ? todayStr() : mode === "tomorrow" ? offsetDay(1) : customValue || todayStr();
    setLocalFilters((prev) => ({
      ...prev,
      [`${prefix}From`]: targetDate,
      [`${prefix}To`]: targetDate,
    }));
  };

  const updateDateRange = (prefix, edge, value) => {
    setDateModes((prev) => ({ ...prev, [prefix === "createdDate" ? "created" : "followUp"]: "range" }));
    setLocalFilters((prev) => ({ ...prev, [`${prefix}${edge}`]: value }));
  };

  const createdMode = dateModes.created;
  const followUpMode = dateModes.followUp;

  return (
    <div className="filter-drawer-overlay" onClick={onClose}>
      <div className="filter-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="filter-drawer__header">
          <div className="filter-drawer__header-main">
            <div className="filter-drawer__icon"><IFilter s={16} c="#4f46e5" /></div>
            <div>
              <div className="filter-drawer__eyebrow">Lead workspace</div>
              <div className="filter-drawer__title-row">
                <span className="filter-drawer__title">Filter Leads</span>
                {activeFilterCount > 0 && <span className="filter-drawer__badge">{activeFilterCount} active</span>}
              </div>
              <p className="filter-drawer__subtitle">Refine the list by ownership, activity, timeline, and location.</p>
            </div>
          </div>
          <button className="icon-btn filter-drawer__close" onClick={onClose}><IX s={16} /></button>
        </div>

        <div className="filter-drawer__body">
          <section className="filter-panel-section">
            <div className="filter-panel-section__header">
              <h4 className="filter-panel-section__title">Lead details</h4>
              <span className="filter-panel-section__tag">Core</span>
            </div>
            <div className="filter-field">
              <label className="filter-field__label">Status</label>
              <select className="filter-field__control" value={localFilters.status} onChange={(event) => updateFilter("status", event.target.value)}>
                <option value="All">All Statuses</option>
                {STATUS_LIST.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label className="filter-field__label">Source</label>
              <select className="filter-field__control" value={localFilters.source} onChange={(event) => updateFilter("source", event.target.value)}>
                <option value="All">All Sources</option>
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
                <option value="Referral">Referral</option>
                <option value="Warm">Warm</option>
              </select>
            </div>
            <div className="filter-field">
              <label className="filter-field__label">Assigned To</label>
              <select className="filter-field__control" value={localFilters.assignee} onChange={(event) => updateFilter("assignee", event.target.value)}>
                {assignees.map((assignee) => <option key={assignee} value={assignee}>{assignee}</option>)}
              </select>
            </div>
          </section>

          <section className="filter-panel-section">
            <div className="filter-panel-section__header">
              <h4 className="filter-panel-section__title">Activity</h4>
              <span className="filter-panel-section__tag">Engagement</span>
            </div>
            <div className="filter-field">
              <label className="filter-field__label">Last Contacted (days)</label>
              <input className="filter-field__control" type="number" placeholder="Enter days" min="0" value={localFilters.lastContactedDays} onChange={(event) => updateFilter("lastContactedDays", event.target.value)} />
            </div>
            <div className="filter-field">
              <label className="filter-field__label">Responded To</label>
              <select className="filter-field__control" value={localFilters.respondedTo} onChange={(event) => updateFilter("respondedTo", event.target.value)}>
                {RESPONSE_TYPES.map((responseType) => <option key={responseType} value={responseType}>{responseType}</option>)}
              </select>
            </div>
          </section>

          <section className="filter-panel-section filter-panel-section--dates">
            <div className="filter-panel-section__header">
              <h4 className="filter-panel-section__title">Dates</h4>
              <span className="filter-panel-section__tag">Realtime</span>
            </div>
            <div className="filter-date-stack">
              <div className="filter-date-card">
                <div className="filter-date-card__head">
                  <div>
                    <div className="filter-date-card__title">Created date</div>
                    <div className="filter-date-card__subtitle">Filter by a date range or jump straight to the most relevant day.</div>
                  </div>
                  <div className="filter-date-pills">
                    {[["range", "Time range"], ["today", "Today"], ["tomorrow", "Tomorrow"], ["custom", "Custom"]].map(([value, label]) => (
                      <button key={value} type="button" className={`filter-date-pill ${createdMode === value ? "filter-date-pill--active" : ""}`} onClick={() => applyDateMode("createdDate", value)}>{label}</button>
                    ))}
                  </div>
                </div>
                {createdMode === "range" && (
                  <div className="filter-date-card__range">
                    <div className="filter-field">
                      <label className="filter-field__label">From</label>
                      <input className="filter-field__control" type="date" value={localFilters.createdDateFrom} onChange={(event) => updateDateRange("createdDate", "From", event.target.value)} />
                    </div>
                    <div className="filter-field">
                      <label className="filter-field__label">To</label>
                      <input className="filter-field__control" type="date" value={localFilters.createdDateTo} onChange={(event) => updateDateRange("createdDate", "To", event.target.value)} />
                    </div>
                  </div>
                )}
                {createdMode === "custom" && (
                  <div className="filter-date-card__custom">
                    <label className="filter-field__label">Pick day</label>
                    <input className="filter-field__control" type="date" value={localFilters.createdDateFrom || localFilters.createdDateTo || todayStr()} onChange={(event) => applyDateMode("createdDate", "custom", event.target.value)} />
                  </div>
                )}
                <div className="filter-date-card__current">Filtering: {createdMode === "range" ? (localFilters.createdDateFrom || localFilters.createdDateTo ? `${localFilters.createdDateFrom || "Any"} to ${localFilters.createdDateTo || "Any"}` : "Any time range") : localFilters.createdDateFrom || "Custom day"}</div>
              </div>

              <div className="filter-date-card">
                <div className="filter-date-card__head">
                  <div>
                    <div className="filter-date-card__title">Follow-up date</div>
                    <div className="filter-date-card__subtitle">Narrow the table to upcoming work based on a range or a specific day.</div>
                  </div>
                  <div className="filter-date-pills">
                    {[["range", "Time range"], ["today", "Today"], ["tomorrow", "Tomorrow"], ["custom", "Custom"]].map(([value, label]) => (
                      <button key={value} type="button" className={`filter-date-pill ${followUpMode === value ? "filter-date-pill--active" : ""}`} onClick={() => applyDateMode("followUpDate", value)}>{label}</button>
                    ))}
                  </div>
                </div>
                {followUpMode === "range" && (
                  <div className="filter-date-card__range">
                    <div className="filter-field">
                      <label className="filter-field__label">From</label>
                      <input className="filter-field__control" type="date" value={localFilters.followUpDateFrom} onChange={(event) => updateDateRange("followUpDate", "From", event.target.value)} />
                    </div>
                    <div className="filter-field">
                      <label className="filter-field__label">To</label>
                      <input className="filter-field__control" type="date" value={localFilters.followUpDateTo} onChange={(event) => updateDateRange("followUpDate", "To", event.target.value)} />
                    </div>
                  </div>
                )}
                {followUpMode === "custom" && (
                  <div className="filter-date-card__custom">
                    <label className="filter-field__label">Pick day</label>
                    <input className="filter-field__control" type="date" value={localFilters.followUpDateFrom || localFilters.followUpDateTo || todayStr()} onChange={(event) => applyDateMode("followUpDate", "custom", event.target.value)} />
                  </div>
                )}
                <div className="filter-date-card__current">Filtering: {followUpMode === "range" ? (localFilters.followUpDateFrom || localFilters.followUpDateTo ? `${localFilters.followUpDateFrom || "Any"} to ${localFilters.followUpDateTo || "Any"}` : "Any time range") : localFilters.followUpDateFrom || "Custom day"}</div>
              </div>
            </div>
          </section>

          <section className="filter-panel-section">
            <div className="filter-panel-section__header">
              <h4 className="filter-panel-section__title">Location</h4>
              <span className="filter-panel-section__tag">Geo</span>
            </div>
            <div className="filter-field">
              <label className="filter-field__label">City</label>
              <input className="filter-field__control" type="text" placeholder="City" value={localFilters.city} onChange={(event) => updateFilter("city", event.target.value)} />
            </div>
            <div className="filter-field-grid">
              <div className="filter-field">
                <label className="filter-field__label">State</label>
                <input className="filter-field__control" type="text" placeholder="State" value={localFilters.state} onChange={(event) => updateFilter("state", event.target.value)} />
              </div>
              <div className="filter-field">
                <label className="filter-field__label">Zip</label>
                <input className="filter-field__control" type="text" placeholder="Zip" value={localFilters.zip} onChange={(event) => updateFilter("zip", event.target.value)} />
              </div>
            </div>
          </section>
        </div>

        <div className="filter-drawer__footer">
          <button className="btn-ghost filter-drawer__footer-btn" onClick={handleClear}>Clear All</button>
          <button className="btn-primary filter-drawer__footer-btn" onClick={handleApply}>Apply Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}</button>
        </div>
      </div>
    </div>
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
        <span className="status-dot" style={{ background: meta.color }} />
        <span className="status-pill-label">{formatStatus(value)}</span>
        <span className="status-pill-caret"><IChevD s={9} c={meta.color} /></span>
      </button>
      {open && (
        <div className="status-menu">
          {STATUS_LIST.map((status) => {
            const currentMeta = STATUS_META[status];
            return (
              <button key={status} className={`status-opt ${value === status ? "status-opt--on" : ""}`} onClick={() => { onChange(status); setOpen(false); }}>
                <span className="status-opt-dot" style={{ background: currentMeta.color }} />
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
  const [showMore, setShowMore] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => {
    setOpen(false);
    setShowMore(false);
  });

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
              <button key={leadType.key} className="add-lead-option" onClick={() => { setOpen(false); setShowMore(false); onSelectType(leadType); }}>
                <span className="add-lead-opt-icon"><IconComp size={13} strokeWidth={1.8} /></span>{leadType.label}
              </button>
            );
          })}
          <div className="add-lead-divider" />
          <button type="button" className={`add-lead-more-toggle ${showMore ? "add-lead-more-toggle--open" : ""}`} onClick={() => setShowMore((current) => !current)}>
            <span>More Types</span>
            <IChevD s={11} />
          </button>
          {showMore && LEAD_TYPES.slice(3).map((leadType) => {
            const IconComp = leadType.icon;
            return (
              <button key={leadType.key} className="add-lead-option" onClick={() => { setOpen(false); setShowMore(false); onSelectType(leadType); }}>
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

export function ImportModal({ onClose, onImport }) {
  const [step, setStep] = useState("upload");
  const [parsed, setParsed] = useState({ headers: [], rows: [] });
  const [mapping, setMapping] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.name.endsWith(".csv")) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = parseCSV(event.target.result);
      setParsed(result);
      const autoMap = {};
      result.headers.forEach((header) => {
        const guessedField = guessField(header);
        if (guessedField) autoMap[header] = guessedField;
      });
      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(file);
  };

  const doImport = () => {
    const newLeads = parsed.rows.map((row, index) => {
      const lead = { id: Date.now() + index, avatarBg: AVATAR_COLORS[index % AVATAR_COLORS.length] };
      parsed.headers.forEach((header) => {
        const field = mapping[header];
        if (field) lead[field] = field === "score" ? parseInt(row[header], 10) || 0 : row[header];
      });
      if (!lead.name) lead.name = "Unknown Lead";
      if (!lead.status || !STATUS_LIST.includes(lead.status)) lead.status = "New";
      if (!lead.source) lead.source = "Inbound";
      if (!lead.createdDate) lead.createdDate = todayStr();
      return lead;
    });
    onImport(newLeads);
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="import-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-hdr">
          <div className="import-hdr-icon"><IUpload s={16} c="#4f46e5" /></div>
          <div><div className="modal-title">Import Leads via CSV</div><div className="modal-sub">{step === "upload" ? "Upload a CSV file to get started" : step === "map" ? "Map your CSV columns to lead fields" : "Preview & confirm import"}</div></div>
          <button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button>
        </div>
        <div className="import-steps">
          {["upload", "map", "preview"].map((currentStep, index) => (
            <div key={currentStep} className={`import-step ${step === currentStep ? "import-step--on" : ""} ${["upload", "map", "preview"].indexOf(step) > index ? "import-step--done" : ""}`}>
              <span className="import-step-num">{["upload", "map", "preview"].indexOf(step) > index ? "?" : index + 1}</span>
              <span className="import-step-lbl">{currentStep === "upload" ? "Upload" : currentStep === "map" ? "Map Fields" : "Preview"}</span>
            </div>
          ))}
        </div>
        <div className="modal-body">
          {step === "upload" && (
            <div className={`drop-zone ${dragOver ? "drop-zone--over" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(event) => { event.preventDefault(); setDragOver(false); handleFile(event.dataTransfer.files[0]); }} onClick={() => fileRef.current.click()}>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(event) => handleFile(event.target.files[0])} />
              <div className="drop-icon"><IUpload s={32} c="#a5b4fc" /></div>
              <div className="drop-title">Drop your CSV here</div>
              <div className="drop-sub">or click to browse � supports standard CRM exports</div>
              <div className="drop-hint">name, email, phone, company, status, source, score, owner�</div>
            </div>
          )}
          {step === "map" && parsed && (
            <div className="map-grid">
              <div className="map-header"><span>CSV Column</span><span>Sample Data</span><span>Maps to Field</span></div>
              {parsed.headers.map((header) => (
                <div key={header} className="map-row">
                  <span className="map-col">{header}</span>
                  <span className="map-sample">{parsed.rows[0]?.[header] || "�"}</span>
                  <select className="map-select" value={mapping[header] || ""} onChange={(event) => setMapping((current) => ({ ...current, [header]: event.target.value }))}>
                    <option value="">� skip �</option>
                    {LEAD_FIELDS.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
          {step === "preview" && (
            <div className="preview-wrap">
              <div className="preview-info"><span className="preview-count">{parsed.rows.length} leads</span> ready to import{parsed.rows.length > 5 && <span className="preview-more"> � showing first 5</span>}</div>
              <div className="preview-scroll">
                <table className="preview-table">
                  <thead><tr>{Object.values(mapping).filter(Boolean).map((field) => <th key={field}>{LEAD_FIELDS.find((item) => item.key === field)?.label || field}</th>)}</tr></thead>
                  <tbody>{parsed.rows.slice(0, 5).map((row, index) => <tr key={index}>{parsed.headers.filter((header) => mapping[header]).map((header) => <td key={header}>{row[header] || "�"}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {step !== "upload" && <button className="btn-ghost" onClick={() => setStep(step === "preview" ? "map" : "upload")}>? Back</button>}
          <button className="btn-ghost" onClick={onClose} style={{ marginLeft: step === "upload" ? "auto" : "0" }}>Cancel</button>
          {step === "map" && <button className="btn-primary" onClick={() => setStep("preview")} disabled={!Object.values(mapping).some(Boolean)}>Preview ?</button>}
          {step === "preview" && <button className="btn-primary" onClick={doImport}><IUpload s={12} />&ensp;Import {parsed.rows.length} Leads</button>}
        </div>
      </div>
    </div>
  );
}

export function ManageColumnsPanel({ visibleCols, setVisibleCols, rowsPerPage, setRowsPerPage, wrapText, setWrapText, onClose }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose);
  const toggle = (key) => setVisibleCols((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="mcp" ref={ref} onClick={(event) => event.stopPropagation()}>
        <div className="mcp-hdr"><div className="mcp-hdr-left"><ISettings s={15} /><span>Manage Columns</span></div><button className="icon-btn" onClick={onClose}><IX s={14} /></button></div>
        <div className="mcp-section">
          <div className="mcp-sec-lbl">Show / Hide Columns</div>
          {ALL_COLUMNS.map((column) => (
            <label key={column.key} className={`mcp-row ${column.always ? "mcp-row--locked" : ""}`}>
              <span className="toggle"><input type="checkbox" checked={column.always || visibleCols.includes(column.key)} disabled={column.always} onChange={() => !column.always && toggle(column.key)} /><span className="toggle-track"><span className="toggle-thumb" /></span></span>
              <span className="mcp-col-name">{column.label}</span>
              {column.always && <span className="required-tag">Required</span>}
            </label>
          ))}
        </div>
        <div className="mcp-divider" />
        <div className="mcp-section">
          <div className="mcp-sec-lbl"><IRows s={13} /> Records Per Page</div>
          <div className="rpp-row">{[10, 25, 30, 50, 100].map((count) => <button key={count} className={`rpp-btn ${rowsPerPage === count ? "rpp-btn--on" : ""}`} onClick={() => setRowsPerPage(count)}>{count}</button>)}</div>
        </div>
        <div className="mcp-divider" />
        <div className="mcp-section">
          <label className="mcp-row" style={{ cursor: "pointer" }}>
            <span className="toggle"><input type="checkbox" checked={wrapText} onChange={(event) => setWrapText(event.target.checked)} /><span className="toggle-track"><span className="toggle-thumb" /></span></span>
            <span className="mcp-col-name">Wrap text in cells</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export function LeadsPerformanceChart({ onClose, leads }) {
  const [animated, setAnimated] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [activeRange, setActiveRange] = useState("30");
  const [customRange, setCustomRange] = useState({ from: offsetDay(29), to: todayStr() });

  useEffect(() => {
    const timeoutId = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(timeoutId);
  }, []);

  const rangeInfo = useMemo(() => {
    if (activeRange === "custom") {
      const from = customRange.from ? new Date(`${customRange.from}T00:00:00`) : null;
      const to = customRange.to ? new Date(`${customRange.to}T00:00:00`) : null;
      if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
        return { days: 0, startDate: null, label: "Choose a valid range" };
      }
      const days = Math.max(1, Math.floor((to - from) / 86400000) + 1);
      return { days, startDate: from, label: `${customRange.from} to ${customRange.to}` };
    }

    const days = { 7: 7, 30: 30, 90: 90 }[activeRange];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    return { days, startDate, label: `${days} day window` };
  }, [activeRange, customRange]);

  const data = useMemo(() => {
    if (!rangeInfo.startDate || rangeInfo.days <= 0) return [];
    return Array.from({ length: rangeInfo.days }, (_, index) => {
      const date = new Date(rangeInfo.startDate);
      date.setDate(rangeInfo.startDate.getDate() + index);
      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const base = 10 + Math.sin(index * 0.4) * 8 + Math.random() * 18;
      const value = Math.round(Math.max(3, base));
      return { label, value, date };
    });
  }, [rangeInfo]);

  const safeData = data.length > 0 ? data : [{ label: "N/A", value: 0, date: new Date() }];
  const max = Math.max(...safeData.map((item) => item.value), 1);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const avg = data.length > 0 ? Math.round(total / data.length) : 0;
  const peak = data.length > 0 ? data.reduce((best, current) => (best.value > current.value ? best : current)) : { value: 0, label: "N/A" };
  const W = 720;
  const H = 220;
  const PAD = { t: 20, r: 20, b: 40, l: 48 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  const points = safeData.map((item, index) => ({
    x: PAD.l + (safeData.length === 1 ? 0.5 : index / (safeData.length - 1)) * chartW,
    y: PAD.t + chartH - (item.value / (max * 1.15 || 1)) * chartH,
    ...item,
  }));

  const pathD = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previousPoint = points[index - 1];
    const controlX = (previousPoint.x + point.x) / 2;
    return `${acc} C ${controlX} ${previousPoint.y} ${controlX} ${point.y} ${point.x} ${point.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${PAD.t + chartH} L ${points[0].x} ${PAD.t + chartH} Z`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({ y: PAD.t + chartH - fraction * chartH, val: Math.round(fraction * max * 1.15) }));
  const xStep = Math.max(1, Math.ceil(points.length / 6));

  return (
    <>
      <div className="chart-overlay" onClick={onClose} />
      <div className="chart-stage">
        <div className={`chart-modal ${animated ? "chart-modal--open" : ""}`} onClick={(event) => event.stopPropagation()}>
          <div className="chart-modal__header">
            <div className="chart-modal__header-main">
              <div className="chart-modal__icon"><BarChart2 size={17} color="#4f46e5" strokeWidth={2} /></div>
              <div>
                <div className="chart-modal__title">Leads Performance</div>
                <div className="chart-modal__subtitle">New leads over time</div>
              </div>
            </div>
            <div className="chart-modal__header-actions">
              <div className="chart-range-tabs">
                {[ ["7", "7 days"], ["30", "30 days"], ["90", "90 days"], ["custom", "Custom"] ].map(([value, label]) => (
                  <button key={value} className={`chart-range-tab ${activeRange === value ? "chart-range-tab--active" : ""}`} onClick={() => setActiveRange(value)}>{label}</button>
                ))}
              </div>
              <button className="chart-modal__close" onClick={onClose}><X size={16} strokeWidth={2} /></button>
            </div>
          </div>

          {activeRange === "custom" && (
            <div className="chart-custom-range">
              <div className="chart-custom-range__field">
                <label>From</label>
                <input type="date" value={customRange.from} onChange={(event) => setCustomRange((current) => ({ ...current, from: event.target.value }))} />
              </div>
              <div className="chart-custom-range__field">
                <label>To</label>
                <input type="date" value={customRange.to} onChange={(event) => setCustomRange((current) => ({ ...current, to: event.target.value }))} />
              </div>
              <div className="chart-custom-range__summary">{rangeInfo.label}</div>
            </div>
          )}

          <div className="chart-summary-grid">
            {[
              { label: "Total New Leads", val: total, color: "#4f46e5" },
              { label: "Daily Average", val: avg, color: "#10b981" },
              { label: "Peak Day", val: peak.value, sub: peak.label, color: "#f59e0b" },
            ].map((stat, index) => (
              <div key={index} className="chart-summary-card">
                <div className="chart-summary-label">{stat.label} {stat.sub && <span className="chart-summary-sub">({stat.sub})</span>}</div>
                <div className="chart-summary-value" style={{ color: stat.color }}>{stat.val}</div>
              </div>
            ))}
          </div>

          <div className="chart-canvas-wrap" onMouseLeave={() => setTooltip(null)}>
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="chart-svg">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" /><stop offset="100%" stopColor="#4f46e5" stopOpacity="0.02" /></linearGradient>
                <clipPath id="chartClip"><rect x={PAD.l} y={PAD.t} width={chartW} height={chartH} /></clipPath>
                <filter id="lineShadow" x="-5%" y="-20%" width="110%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#4f46e5" floodOpacity="0.18" /></filter>
              </defs>
              {yTicks.map((tick, index) => <g key={index}><line x1={PAD.l} x2={W - PAD.r} y1={tick.y} y2={tick.y} stroke="#e8edf6" strokeWidth="1" /><text x={PAD.l - 8} y={tick.y + 4} textAnchor="end" fill="#94a3b8" fontFamily="Inter,sans-serif">{tick.val}</text></g>)}
              {points.filter((_, index) => index % xStep === 0 || index === points.length - 1).map((point, index) => <text key={index} x={point.x} y={H - 8} textAnchor="middle" fill="#94a3b8" fontFamily="Inter,sans-serif">{point.label}</text>)}
              {data.length > 0 && <g clipPath="url(#chartClip)"><path d={areaD} fill="url(#areaGrad)" style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 0.2s" }} /><path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" filter="url(#lineShadow)" style={{ strokeDasharray: 2000, strokeDashoffset: animated ? 0 : 2000, transition: "stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1) 0.1s" }} /></g>}
              {points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="14" fill="transparent" style={{ cursor: data.length > 0 ? "crosshair" : "default" }} onMouseEnter={() => data.length > 0 && setTooltip({ ...point, idx: index })} />)}
              {tooltip && data.length > 0 && <g><line x1={tooltip.x} x2={tooltip.x} y1={PAD.t} y2={PAD.t + chartH} stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" /><circle cx={tooltip.x} cy={tooltip.y} r="5" fill="#4f46e5" stroke="white" strokeWidth="2.5" /></g>}
            </svg>

            {tooltip && data.length > 0 && <div className="chart-tooltip" style={{ left: `calc(${(tooltip.x / W) * 100}% - 70px)`, top: `${((tooltip.y - PAD.t) / H) * 100}%` }}><div className="chart-tooltip__label">{tooltip.label}</div><div className="chart-tooltip__value">{tooltip.value}</div><div className="chart-tooltip__meta"><TrendingUp size={10} strokeWidth={2.5} /> New Leads</div></div>}
            {data.length === 0 && <div className="chart-empty-state">Choose a valid custom date range to render the chart.</div>}
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </>
  );
}
export function EditModal({ lead, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-hdr"><div><div className="modal-title">Edit Lead</div><div className="modal-sub">{lead.name}</div></div><button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button></div>
        <div className="modal-body modal-placeholder"><IEdit s={40} c="#d1d5db" /><p>Edit Form</p><span>Fields for name, email, phone, status and source will appear here.</span></div>
        <div className="modal-footer"><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={onClose}>Save Changes</button></div>
      </div>
    </div>
  );
}

export function KanbanBoard({ leads, groupBy, onUpdateLead, onOpenDetails, onAdjustScore }) {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const grouped = useMemo(() => {
    const map = {};
    leads.forEach((lead) => {
      let key = lead[groupBy];
      if (groupBy === "followUpDate") {
        if (!key) key = "No Follow Up";
        else key = getFollowUpLabel(key)?.label || "Unknown";
      }
      if (!key) key = "Unknown";
      if (!map[key]) map[key] = [];
      map[key].push(lead);
    });
    return map;
  }, [groupBy, leads]);

  return (
    <div className="kanban-board">
      {Object.keys(grouped).map((columnKey) => {
        const meta = groupBy === "status" ? STATUS_META[columnKey] || { color: "#374151", bg: "#f3f4f6" } : { color: "#374151", bg: "#f3f4f6" };
        const colLeads = grouped[columnKey] || [];
        const isOver = dragOverCol === columnKey;

        return (
          <div
            key={columnKey}
            className={`kanban-column ${isOver ? "kanban-column--over" : ""}`}
            style={{ "--kanban-accent": meta.color, "--kanban-accent-bg": meta.bg }}
            onDragOver={(event) => { event.preventDefault(); setDragOverCol(columnKey); }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(event) => {
              event.preventDefault();
              if (draggedId) onUpdateLead(draggedId, groupBy, columnKey);
              setDraggedId(null);
              setDragOverCol(null);
            }}
          >
            <div className="kanban-column__header">
              <div>
                <div className="kanban-column__label">{groupBy === "status" ? formatStatus(columnKey) : columnKey}</div>
                <div className="kanban-column__sub">Drag and drop leads into this lane</div>
              </div>
              <span className="kanban-column__count">{colLeads.length}</span>
            </div>

            <div className="kanban-column__list">
              {colLeads.map((lead) => {
                const initials = getInitials(lead.name);
                const tier = getScoreTier(lead.score);
                const scoreColors = { high: "#059669", mid: "#d97706", low: "#dc2626" };
                const scoreBackgrounds = { high: "#d1fae5", mid: "#fef3c7", low: "#fee2e2" };

                return (
                  <div
                    key={lead.id}
                    className={`kanban-card ${draggedId === lead.id ? "kanban-card--dragging" : ""}`}
                    draggable
                    onDragStart={(event) => { setDraggedId(lead.id); event.dataTransfer.effectAllowed = "move"; }}
                    onClick={() => onOpenDetails(lead.id)}
                  >
                    <div className="kanban-card__top">
                      <div className="kanban-card__identity">
                        <div className="kanban-card__avatar" style={{ background: lead.avatarBg }}>{initials}</div>
                        <div className="kanban-card__identity-text">
                          <div className="kanban-card__name">{lead.name}</div>
                          <div className="kanban-card__company">{lead.company}</div>
                        </div>
                      </div>
                      <div className="kanban-card__score" style={{ background: scoreBackgrounds[tier], color: scoreColors[tier] }}>{lead.score}</div>
                    </div>

                    <div className="kanban-card__meta"><User size={10} /><span>{lead.assignee}</span></div>
                    {lead.followUpDate && (() => {
                      const info = getFollowUpLabel(lead.followUpDate);
                      const color = info.type === "overdue" ? "#dc2626" : info.type === "today" ? "#d97706" : info.type === "tomorrow" ? "#0284c7" : "#6b7280";
                      return <div className="kanban-card__followup" style={{ color }}><Calendar size={10} />{info.label}</div>;
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}








