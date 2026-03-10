import '../styles/Leads.css';
import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import {
  Users, Phone, Mail, Calendar, Bell, AlertTriangle, CheckCircle, TrendingUp,
  Search, ChevronDown, ChevronUp, ChevronRight, ChevronLeft, X, Edit2, Check, Filter, List, Settings, Plus, Upload, User, LayoutGrid,
  MessageSquare, Globe, Megaphone, Share2, Star, Handshake, BarChart2, BarChart3, RefreshCw, Briefcase, CheckSquare, Activity, FileText,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import leadsAPI from "../api/leads.api";
import LeadDetailsModal from "../components/LeadDetailsModal.jsx"

/* ─────────────────────────────────────────────
   CONSTANTS & CONFIGURATION
───────────────────────────────────────────── */

const makeInitialActivity = (leads) => {
  const map = {};
  leads.forEach(l => {
    const acts = [{ id: Date.now() + l.id, type: "created", date: l.createdDate, time: "09:00 AM", notes: "Lead created" }];
    if (l.lastContacted) {
      const t = l.respondedTo || "call";
      acts.unshift({ id: Date.now() + l.id + 1, type: t, date: l.lastContacted, time: "10:30 AM", notes: `${t.charAt(0).toUpperCase() + t.slice(1)} made` });
    }
    map[l.id] = acts;
  });
  return map;
};

const INIT_LEADS = []; // will be populated from the backend

const STAT_CARDS = [
  { label: "Total New Leads", key: "totalNewLeads", icon: Users, alert: Bell, c: { card: "#f6fbf7", icon: "#e6f6ea", ink: "#2e7d32" } },
  { label: "Calls to Make", key: "callsToMake", icon: Phone, alert: Bell, c: { card: "#f6f9fe", icon: "#e3efff", ink: "#1565c0" } },
  { label: "Emails to Send", key: "emailsToSend", icon: Mail, alert: AlertTriangle, c: { card: "#fffdf7", icon: "#fff6dc", ink: "#e65100" } },
  { label: "Meetings to Schedule", key: "meetingsToSchedule", icon: Calendar, alert: CheckCircle, c: { card: "#fff6fa", icon: "#ffe4ef", ink: "#880e4f" } },
];

const STATUS_LIST = [
  "FreshLead",
  "Contacted",
  "FollowUp",
  "Interested",
  "Qualified",
  "Negotiation",
  "Converted",
  "Lost",
  "NotInterested",
  "UnableToContact",
  "JunkLead",
  "Need Review",
];

const STATUS_META = {
  FreshLead: {
    color: "#2563eb",
    bg: "#e0ecff"
  },

  Contacted: {
    color: "#0ea5e9",
    bg: "#e0f2fe"
  },

  FollowUp: {
    color: "#7c3aed",
    bg: "#ede9fe"
  },

  Interested: {
    color: "#16a34a",
    bg: "#dcfce7"
  },

  Qualified: {
    color: "#059669",
    bg: "#d1fae5"
  },

  Negotiation: {
    color: "#d97706",
    bg: "#fef3c7"
  },

  Converted: {
    color: "#047857",
    bg: "#d1fae5"
  },

  Lost: {
    color: "#dc2626",
    bg: "#fee2e2"
  },

  NotInterested: {
    color: "#ef4444",
    bg: "#fee2e2"
  },

  UnableToContact: {
    color: "#6b7280",
    bg: "#f3f4f6"
  },

  JunkLead: {
    color: "#374151",
    bg: "#e5e7eb"
  },

  "Need Review": {
    color: "#9333ea",
    bg: "#f3e8ff"
  }
};

const RESPONSE_TYPES = ["All", "Email", "Call", "Message"];

const ALL_COLUMNS = [
  { key: "name", label: "Lead Name", always: true },
  { key: "company", label: "Company", always: false },
  { key: "phone", label: "Phone", always: false },
  { key: "email", label: "Email", always: false },
  { key: "status", label: "Status", always: false },
  { key: "followUp", label: "Follow-Up", always: false },
  { key: "assignee", label: "Owner", always: false },
  { key: "source", label: "Source", always: false },
  { key: "score", label: "Score", always: false },
  { key: "deposits", label: "Deposits", always: false },
  { key: "comments", label: "Comments", always: false },
  { key: "createdDate", label: "Created At", always: false },

];

const LEAD_TYPES = [
  { key: "manual", label: "Manual Lead", icon: User, source: "Inbound" },
  { key: "social", label: "Social Lead", icon: Share2, source: "Referral" },
  { key: "import", label: "Import Leads", icon: Upload, source: null },
  { key: "website", label: "Website Lead", icon: Globe, source: "Website" },
  { key: "campaign", label: "Campaign Lead", icon: Megaphone, source: "Campaign" },
  { key: "referral", label: "Referral Lead", icon: Handshake, source: "Referral" },
  { key: "event", label: "Event Lead", icon: Calendar, source: "Event" },
  { key: "partner", label: "Partner Lead", icon: Star, source: "Partner" },
];

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
const todayStr = () => new Date().toISOString().split("T")[0];
const offsetDay = (n) => new Date(Date.now() + n * 86400000).toISOString().split("T")[0];

function getFollowUpLabel(dateStr) {
  if (!dateStr) return null;

  const today = todayStr();
  const tomorrow = offsetDay(1);

  if (dateStr < today) return { label: fmtDate(dateStr), type: "overdue" };
  if (dateStr === today) return { label: "Today", type: "today" };
  if (dateStr === tomorrow) return { label: "Tomorrow", type: "tomorrow" };

  return { label: fmtDate(dateStr), type: "normal" };
}

function formatStatus(status) {
  return status.replace(/([A-Z])/g, " $1").trim();
}

/* ─────────────────────────────────────────────
   ICONS
───────────────────────────────────────────── */
const Icon = ({ id: IconComp, size = 18, color = "currentColor", sw = 1.8 }) => (
  <IconComp size={size} color={color} strokeWidth={sw} aria-hidden="true" />
);
const mkI = (Comp) => ({ s = 14, c = "currentColor", sw = 1.7, ...rest }) => (
  <Comp size={s} color={c} strokeWidth={sw} aria-hidden="true" {...rest} />
);
const ISearch = mkI(Search);
const IChevD = mkI(ChevronDown);
const IChevU = mkI(ChevronUp);
const IChevR = mkI(ChevronRight);
const IChevL = mkI(ChevronLeft);
const IX = mkI(X);
const ICal = mkI(Calendar);
const IPlus = ({ s = 14, c = "currentColor", sw = 2.2, ...r }) => <Plus size={s} color={c} strokeWidth={sw} aria-hidden="true" {...r} />;
const IEdit = mkI(Edit2);
const IPhone = mkI(Phone);
const IMail = mkI(Mail);
const ISettings = mkI(Settings);
const ICheck = ({ s = 14, c = "currentColor", sw = 2.5, ...r }) => <Check size={s} color={c} strokeWidth={sw} aria-hidden="true" {...r} />;
const IUser = mkI(User);
const IFilter = mkI(Filter);
const IRows = mkI(List);
const IUpload = mkI(Upload);
const IKanban = mkI(LayoutGrid);
const IMsg = mkI(MessageSquare);
const IBarChart = mkI(BarChart2);

function useClickOutside(ref, cb) {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
const StatCard = memo(({ label, value, change, icon, alert, c, delay }) => (
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

/* ─────────────────────────────────────────────
   FILTER SIDEBAR MODAL (Zoho CRM Style)
───────────────────────────────────────────── */
function FilterModal({
  onClose,
  filters,
  setFilters,
  activeFilterCount,
  onApply,
  onClear
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  const assignees = useMemo(() =>
    ["All", "Monica Jones", "James Carter", "Amanda Blake", "Samantha Clark", "Anthony Cruz"],
    []);

  const updateFilter = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    const cleared = {
      status: "All", source: "All", assignee: "All",
      createdDateFrom: "", createdDateTo: "",
      followUpDateFrom: "", followUpDateTo: "",
      lastContactedDays: "", respondedTo: "All",
      city: "", state: "", country: "", zip: ""
    };
    setLocalFilters(cleared);
  };

  return (
    <>
      {/* Backdrop with inline style */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.35)',
          zIndex: 500
        }}
      />

      {/* Sidebar filter modal - fixed on left side */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '340px',
          background: 'white',
          boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
          zIndex: 501,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.25s ease-out'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IFilter s={16} c="#4f46e5" />
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Filter Leads</span>
            {activeFilterCount > 0 && (
              <span style={{
                background: '#4f46e5',
                color: 'white',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '12px'
              }}>{activeFilterCount}</span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              borderRadius: '4px'
            }}
          >
            <IX s={16} c="#6b7280" />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px'
        }}>
          {/* Lead Filters */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              margin: '0 0 12px 0'
            }}>Lead Filters</h4>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Status</label>
              <select
                value={localFilters.status}
                onChange={e => updateFilter('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="All">All Statuses</option>
                {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Source</label>
              <select
                value={localFilters.source}
                onChange={e => updateFilter('source', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="All">All Sources</option>
                <option value="Inbound">Inbound</option>
                <option value="Outbound">Outbound</option>
                <option value="Referral">Referral</option>
                <option value="Warm">Warm</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Assigned To</label>
              <select
                value={localFilters.assignee}
                onChange={e => updateFilter('assignee', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                {assignees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Activity Filters */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              margin: '0 0 12px 0'
            }}>Activity</h4>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Last Contacted (days)</label>
              <input
                type="number"
                placeholder="Enter days"
                min="0"
                value={localFilters.lastContactedDays}
                onChange={e => updateFilter('lastContactedDays', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Responded To</label>
              <select
                value={localFilters.respondedTo}
                onChange={e => updateFilter('respondedTo', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                {RESPONSE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Date Filters */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              margin: '0 0 12px 0'
            }}>Dates</h4>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Created Date From</label>
              <input
                type="date"
                value={localFilters.createdDateFrom}
                onChange={e => updateFilter('createdDateFrom', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Created Date To</label>
              <input
                type="date"
                value={localFilters.createdDateTo}
                onChange={e => updateFilter('createdDateTo', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Follow-up From</label>
              <input
                type="date"
                value={localFilters.followUpDateFrom}
                onChange={e => updateFilter('followUpDateFrom', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Follow-up To</label>
              <input
                type="date"
                value={localFilters.followUpDateTo}
                onChange={e => updateFilter('followUpDateTo', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          {/* Location Filters */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              margin: '0 0 12px 0'
            }}>Location</h4>

            <div style={{ marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="City"
                value={localFilters.city}
                onChange={e => updateFilter('city', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  marginBottom: '8px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="text"
                placeholder="State"
                value={localFilters.state}
                onChange={e => updateFilter('state', e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
              <input
                type="text"
                placeholder="Zip"
                value={localFilters.zip}
                onChange={e => updateFilter('zip', e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer with buttons */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '8px',
          background: '#fafafa'
        }}>
          <button
            onClick={handleClear}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'white',
              border: '1.5px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#4f46e5',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Apply {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>
      </div>

      {/* Animation keyframes as inline style */}
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


/* ─────────────────────────────────────────────
   STATUS CELL
───────────────────────────────────────────── */
function StatusCell({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));
  const meta = STATUS_META[value] || {};
  return (
    <div className="status-cell" ref={ref}>
      <button className="status-pill" style={{ color: meta.color, background: meta.bg }} onClick={() => setOpen(o => !o)}>
        {formatStatus(value)}<IChevD s={9} c={meta.color} />
      </button>
      {open && (
        <div className="status-menu">
          {STATUS_LIST.map(s => {
            const m = STATUS_META[s];
            return (
              <button key={s} className={`status-opt ${value === s ? "status-opt--on" : ""}`} onClick={() => { onChange(s); setOpen(false); }}>
                <span style={{ color: m.color }}>{formatStatus(s)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TASK 1: FOLLOW-UP CELL — Smart labels
───────────────────────────────────────────── */
function FollowUpCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setEditing(false));
  const info = value ? getFollowUpLabel(value) : null;
  return (
    <div className="followup-cell" ref={ref}>
      <button onClick={() => setEditing(e => !e)} className={`followup-btn ${!value ? "followup-btn--empty" : ""} ${info ? `followup-btn--${info.type}` : ""}`}>
        {info?.type === "overdue"
          ? <AlertTriangle size={11} color="#dc2626" strokeWidth={2} aria-hidden="true" />
          : <ICal s={11} c="#2563eb" />
        }
        {info ? <span>{info.label}</span> : <span>No follow-up</span>}
      </button>
      {editing && (
        <div className="followup-picker">

          {/* Quick buttons */}
          <div className="followup-quick">
            <button
              onClick={() => {
                onChange(todayStr());
                setEditing(false);
              }}
            >
              Today
            </button>

            <button
              onClick={() => {
                onChange(offsetDay(1));
                setEditing(false);
              }}
            >
              Tomorrow
            </button>

            <button
              onClick={() => {
                onChange(offsetDay(3));
                setEditing(false);
              }}
            >
              +3 days
            </button>
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

/* ─────────────────────────────────────────────
   TASK 3: SCORE BADGE with hover adjustment
───────────────────────────────────────────── */
function ScoreBar({ score, onAdjust }) {
  const [hover, setHover] = useState(false);
  const tier = score >= 80 ? "high" : score >= 60 ? "mid" : "low";
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <div className={`score-badge score-badge--${tier}`}>{score}</div>
      {hover && (
        <div className="score-adj-menu">
          {[-20, -10, +10, +20].map(d => (
            <button key={d} className="score-adj-btn" onClick={e => { e.stopPropagation(); onAdjust(d); }}>{d > 0 ? `+${d}` : d}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TASK 2: ADD LEAD DROPDOWN
───────────────────────────────────────────── */
function AddLeadDropdown({ onSelectType }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="btn-primary" onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <IPlus s={12} />Add Lead<IChevD s={10} c="white" />
      </button>
      {open && (
        <div className="add-lead-menu">
          <div className="add-lead-section-label">Quick Add</div>
          {LEAD_TYPES.slice(0, 3).map(t => {
            const IconComp = t.icon;
            return (
              <button key={t.key} className="add-lead-option" onClick={() => { setOpen(false); onSelectType(t); }}>
                <span className="add-lead-opt-icon"><IconComp size={13} strokeWidth={1.8} /></span>{t.label}
              </button>
            );
          })}
          <div className="add-lead-divider" />
          <div className="add-lead-section-label">More Types</div>
          {LEAD_TYPES.slice(3).map(t => {
            const IconComp = t.icon;
            return (
              <button key={t.key} className="add-lead-option" onClick={() => { setOpen(false); onSelectType(t); }}>
                <span className="add-lead-opt-icon"><IconComp size={13} strokeWidth={1.8} /></span>{t.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TASK 2: CREATE LEAD FORM MODAL
───────────────────────────────────────────── */
function CreateLeadModal({ leadType, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", address: "", status: "New", source: leadType?.source || "Inbound", assignee: "Monica Jones", score: 50, followUpDate: "", createdDate: todayStr() });
  const avatarColors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9", "#14b8a6", "#8b5cf6", "#f97316"];
  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, id: Date.now(), avatarBg: avatarColors[Math.floor(Math.random() * avatarColors.length)] });
    onClose();
  };
  const inpSt = { width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", outline: "none" };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div><div className="modal-title">Create {leadType?.label || "New Lead"}</div><div className="modal-sub">Fill in the lead details below</div></div>
          <button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button>
        </div>
        <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {[{ label: "Full Name *", key: "name", span: 2 }, { label: "Company", key: "company" }, { label: "Email", key: "email", type: "email" }, { label: "Phone", key: "phone" }, { label: "Address", key: "address" }].map(f => (
            <div key={f.key} style={{ gridColumn: f.span === 2 ? "1 / -1" : "auto" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>{f.label}</label>
              <input type={f.type || "text"} value={form[f.key]} onChange={e => handle(f.key, e.target.value)} style={inpSt} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>Status</label>
            <select value={form.status} onChange={e => handle("status", e.target.value)} style={{ ...inpSt, background: "white" }}>{STATUS_LIST.map(s => <option key={s}>{s}</option>)}</select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>Source</label>
            <select value={form.source} onChange={e => handle("source", e.target.value)} style={{ ...inpSt, background: "white" }}>{Object.keys(SOURCE_META).map(s => <option key={s}>{s}</option>)}</select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>Follow-Up Date</label>
            <input type="date" value={form.followUpDate} onChange={e => handle("followUpDate", e.target.value)} style={inpSt} />
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>Initial Score ({form.score})</label>
            <input type="range" min={0} max={100} value={form.score} onChange={e => handle("score", parseInt(e.target.value))} style={{ width: "100%", accentColor: "#4f46e5" }} />
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

/* ─────────────────────────────────────────────
   CSV IMPORT MODAL
───────────────────────────────────────────── */
const CSV_FIELD_MAP = {
  name: ["name", "lead name", "full name", "contact"],
  company: ["company", "organization", "org", "business"],
  email: ["email", "e-mail", "email address"],
  phone: ["phone", "phone number", "mobile", "tel"],
  address: ["address", "location", "street"],
  status: ["status", "lead status", "stage"],
  source: ["source", "lead source", "channel"],
  score: ["score", "lead score", "rating"],
  assignee: ["assignee", "owner", "assigned to", "rep"],
  createdDate: ["created", "created date", "date created", "created at"],
  followUpDate: ["follow up", "follow-up", "follow up date", "follow-up date", "followup"],
};
function guessField(header) {
  const h = header.toLowerCase().trim();
  for (const [field, patterns] of Object.entries(CSV_FIELD_MAP)) {
    if (patterns.some(p => h.includes(p))) return field;
  }
  return "";
}
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map(line => {
    const cols = []; let cur = ""; let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    cols.push(cur.trim());
    return headers.reduce((obj, h, i) => ({ ...obj, [h]: cols[i] || "" }), {});
  });
  return { headers, rows };
}

function ImportModal({ onClose, onImport }) {
  const [step, setStep] = useState("upload");
  const [parsed, setParsed] = useState({ headers: [], rows: [] });
  const [mapping, setMapping] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const LEAD_FIELDS = [
    { key: "name", label: "Lead Name" }, { key: "company", label: "Company" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" },
    { key: "address", label: "Address" }, { key: "status", label: "Status" }, { key: "source", label: "Source" }, { key: "score", label: "Score" },
    { key: "assignee", label: "Owner" }, { key: "createdDate", label: "Created Date" }, { key: "followUpDate", label: "Follow-Up Date" },
  ];
  const handleFile = (file) => {
    if (!file || !file.name.endsWith(".csv")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = parseCSV(e.target.result);
      setParsed(result);
      const autoMap = {};
      result.headers.forEach(h => { const g = guessField(h); if (g) autoMap[h] = g; });
      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(file);
  };
  const avatarColors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9", "#14b8a6", "#8b5cf6", "#f97316"];
  const doImport = () => {
    const newLeads = parsed.rows.map((row, i) => {
      const lead = { id: Date.now() + i, avatarBg: avatarColors[i % avatarColors.length] };
      parsed.headers.forEach(h => { const field = mapping[h]; if (field) lead[field] = field === "score" ? parseInt(row[h]) || 0 : row[h]; });
      if (!lead.name) lead.name = "Unknown Lead";
      if (!lead.status || !STATUS_LIST.includes(lead.status)) lead.status = "New";
      if (!lead.source) lead.source = "Inbound";
      if (!lead.createdDate) lead.createdDate = todayStr();
      return lead;
    });
    onImport(newLeads); onClose();
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="import-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="import-hdr-icon"><IUpload s={16} c="#4f46e5" /></div>
          <div><div className="modal-title">Import Leads via CSV</div><div className="modal-sub">{step === "upload" ? "Upload a CSV file to get started" : step === "map" ? "Map your CSV columns to lead fields" : "Preview & confirm import"}</div></div>
          <button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button>
        </div>
        <div className="import-steps">
          {["upload", "map", "preview"].map((s, i) => (
            <div key={s} className={`import-step ${step === s ? "import-step--on" : ""} ${["upload", "map", "preview"].indexOf(step) > i ? "import-step--done" : ""}`}>
              <span className="import-step-num">{["upload", "map", "preview"].indexOf(step) > i ? "✓" : i + 1}</span>
              <span className="import-step-lbl">{s === "upload" ? "Upload" : s === "map" ? "Map Fields" : "Preview"}</span>
            </div>
          ))}
        </div>
        <div className="modal-body">
          {step === "upload" && (
            <div className={`drop-zone ${dragOver ? "drop-zone--over" : ""}`} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }} onClick={() => fileRef.current.click()}>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
              <div className="drop-icon"><IUpload s={32} c="#a5b4fc" /></div>
              <div className="drop-title">Drop your CSV here</div>
              <div className="drop-sub">or click to browse — supports standard CRM exports</div>
              <div className="drop-hint">name, email, phone, company, status, source, score, owner…</div>
            </div>
          )}
          {step === "map" && parsed && (
            <div className="map-grid">
              <div className="map-header"><span>CSV Column</span><span>Sample Data</span><span>Maps to Field</span></div>
              {parsed.headers.map(h => (
                <div key={h} className="map-row">
                  <span className="map-col">{h}</span>
                  <span className="map-sample">{parsed.rows[0]?.[h] || "—"}</span>
                  <select className="map-select" value={mapping[h] || ""} onChange={e => setMapping(m => ({ ...m, [h]: e.target.value }))}>
                    <option value="">— skip —</option>
                    {LEAD_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
          {step === "preview" && (
            <div className="preview-wrap">
              <div className="preview-info"><span className="preview-count">{parsed.rows.length} leads</span> ready to import{parsed.rows.length > 5 && <span className="preview-more"> — showing first 5</span>}</div>
              <div className="preview-scroll">
                <table className="preview-table">
                  <thead><tr>{Object.values(mapping).filter(Boolean).map(f => <th key={f}>{LEAD_FIELDS.find(x => x.key === f)?.label || f}</th>)}</tr></thead>
                  <tbody>{parsed.rows.slice(0, 5).map((row, i) => <tr key={i}>{parsed.headers.filter(h => mapping[h]).map(h => <td key={h}>{row[h] || "—"}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {step !== "upload" && <button className="btn-ghost" onClick={() => setStep(step === "preview" ? "map" : "upload")}>← Back</button>}
          <button className="btn-ghost" onClick={onClose} style={{ marginLeft: step === "upload" ? "auto" : "0" }}>Cancel</button>
          {step === "map" && <button className="btn-primary" onClick={() => setStep("preview")} disabled={!Object.values(mapping).some(Boolean)}>Preview →</button>}
          {step === "preview" && <button className="btn-primary" onClick={doImport}><IUpload s={12} />&ensp;Import {parsed.rows.length} Leads</button>}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MANAGE COLUMNS PANEL
───────────────────────────────────────────── */
function ManageColumnsPanel({ visibleCols, setVisibleCols, rowsPerPage, setRowsPerPage, wrapText, setWrapText, onClose }) {
  const ref = useRef(null);
  useClickOutside(ref, onClose);
  const toggle = (k) => setVisibleCols(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="mcp" ref={ref} onClick={e => e.stopPropagation()}>
        <div className="mcp-hdr"><div className="mcp-hdr-left"><ISettings s={15} /><span>Manage Columns</span></div><button className="icon-btn" onClick={onClose}><IX s={14} /></button></div>
        <div className="mcp-section">
          <div className="mcp-sec-lbl">Show / Hide Columns</div>
          {ALL_COLUMNS.map(col => (
            <label key={col.key} className={`mcp-row ${col.always ? "mcp-row--locked" : ""}`}>
              <span className="toggle"><input type="checkbox" checked={col.always || visibleCols.includes(col.key)} disabled={col.always} onChange={() => !col.always && toggle(col.key)} /><span className="toggle-track"><span className="toggle-thumb" /></span></span>
              <span className="mcp-col-name">{col.label}</span>
              {col.always && <span className="required-tag">Required</span>}
            </label>
          ))}
        </div>
        <div className="mcp-divider" />
        <div className="mcp-section">
          <div className="mcp-sec-lbl"><IRows s={13} /> Records Per Page</div>
          <div className="rpp-row">{[10, 25, 30, 50, 100].map(n => <button key={n} className={`rpp-btn ${rowsPerPage === n ? "rpp-btn--on" : ""}`} onClick={() => setRowsPerPage(n)}>{n}</button>)}</div>
        </div>
        <div className="mcp-divider" />
        <div className="mcp-section">
          <label className="mcp-row" style={{ cursor: "pointer" }}>
            <span className="toggle"><input type="checkbox" checked={wrapText} onChange={e => setWrapText(e.target.checked)} /><span className="toggle-track"><span className="toggle-thumb" /></span></span>
            <span className="mcp-col-name">Wrap text in cells</span>
          </label>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TASK 5: ACTIVITY ICON
───────────────────────────────────────────── */
function ActivityIcon({ type }) {
  const cfg = {
    email: { icon: Mail, color: "#3b82f6", bg: "#eff6ff" },
    call: { icon: Phone, color: "#10b981", bg: "#ecfdf5" },
    message: { icon: MessageSquare, color: "#8b5cf6", bg: "#f5f3ff" },
    meeting: { icon: Calendar, color: "#f59e0b", bg: "#fffbeb" },
    created: { icon: Plus, color: "#6b7280", bg: "#f3f4f6" },
    "score-change": { icon: TrendingUp, color: "#ec4899", bg: "#fdf2f8" },
  };
  const { icon: Ic, color, bg } = cfg[type] || cfg.created;
  return (
    <div style={{ width: 30, height: 30, borderRadius: "50%", background: bg, border: `1.5px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Ic size={13} color={color} strokeWidth={2} />
    </div>
  );
}
function LeadsPerformanceChart({ onClose, leads }) {
  const [animated, setAnimated] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [activeRange, setActiveRange] = useState("30");

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(t);
  }, []);

  const data = useMemo(() => {
    const ranges = { "7": 7, "30": 30, "90": 90 };
    const days = ranges[activeRange];
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(Date.now() - (days - 1 - i) * 86400000);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const base = 10 + Math.sin(i * 0.4) * 8 + Math.random() * 18;
      const value = Math.round(Math.max(3, base));
      return { label, value, date: d };
    });
  }, [activeRange]);

  const max = Math.max(...data.map(d => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  const avg = Math.round(total / data.length);
  const peak = data.reduce((a, b) => a.value > b.value ? a : b);

  const W = 720, H = 220, PAD = { t: 20, r: 20, b: 40, l: 48 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  const pts = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * chartW,
    y: PAD.t + chartH - (d.value / (max * 1.15)) * chartH,
    ...d,
  }));

  const pathD = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${PAD.t + chartH} L ${pts[0].x} ${PAD.t + chartH} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: PAD.t + chartH - f * chartH,
    val: Math.round(f * max * 1.15),
  }));

  const xStep = Math.ceil(data.length / 6);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 700, backdropFilter: "blur(3px)", animation: "fadeInBg 0.2s ease" }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 701, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none"
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          pointerEvents: "all",
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
          width: "min(800px, 94vw)",
          overflow: "hidden",
          transform: animated ? "scale(1) translateY(0)" : "scale(0.92) translateY(32px)",
          opacity: animated ? 1 : 0,
          transition: "transform 0.38s cubic-bezier(0.34,1.4,0.64,1), opacity 0.28s ease",
        }}>
          {/* Header */}
          <div style={{ padding: "18px 24px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BarChart2 size={17} color="#4f46e5" strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", letterSpacing: "-0.2px" }}>Leads Performance</div>
                <div style={{ fontSize: 13.5, color: "#9ca3af", marginTop: 1 }}>New leads over time</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Range toggle */}
              <div style={{ display: "flex", border: "1.5px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                {[["7", "7 days"], ["30", "30 days"], ["90", "90 days"]].map(([v, l]) => (
                  <button key={v} onClick={() => setActiveRange(v)} style={{
                    padding: "5px 12px", border: "none", fontSize: 14, fontWeight: activeRange === v ? 700 : 500,
                    background: activeRange === v ? "#eef2ff" : "white", color: activeRange === v ? "#4f46e5" : "#6b7280",
                    cursor: "pointer", borderRight: v !== "90" ? "1px solid #e5e7eb" : "none", transition: "all 0.15s"
                  }}>{l}</button>
                ))}
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 6, borderRadius: 6, color: "#9ca3af" }}>
                <X size={16} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #f0f0f0" }}>
            {[
              { label: "Total New Leads", val: total, color: "#4f46e5" },
              { label: "Daily Average", val: avg, color: "#10b981" },
              { label: "Peak Day", val: peak.value, sub: peak.label, color: "#f59e0b" },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, padding: "8px 12px", textAlign: "center", borderRight: i < 2 ? "1px solid #f0f0f0" : "none" }}>
                <div style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", marginBottom: 4 }}>
                  {s.label} {s.sub && <span style={{ marginLeft: 6, color: "#6b7280", textTransform: "none" }}>({s.sub})</span>}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: "-0.5px", lineHeight: 1 }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ padding: "15px 15px", position: "relative" }} onMouseLeave={() => setTooltip(null)}>
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", display: "block" }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.01" />
                </linearGradient>
                <clipPath id="chartClip">
                  <rect x={PAD.l} y={PAD.t} width={chartW} height={chartH} />
                </clipPath>
                <filter id="lineShadow" x="-5%" y="-20%" width="110%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4f46e5" floodOpacity="0.18" />
                </filter>
              </defs>

              {/* Y grid */}
              {yTicks.map((t, i) => (
                <g key={i}>
                  <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} stroke="#f3f4f6" strokeWidth="1" />
                  <text x={PAD.l - 8} y={t.y + 4} textAnchor="end" fill="#9ca3af" fontFamily="Inter,sans-serif">{t.val}</text>
                </g>
              ))}

              {/* X labels */}
              {pts.filter((_, i) => i % xStep === 0 || i === pts.length - 1).map((p, i) => (
                <text key={i} x={p.x} y={H - 8} textAnchor="middle" fill="#9ca3af" fontFamily="Inter,sans-serif">{p.label}</text>
              ))}

              <g clipPath="url(#chartClip)">
                {/* Area */}
                <path d={areaD} fill="url(#areaGrad)" style={{
                  opacity: animated ? 1 : 0,
                  transition: "opacity 0.5s ease 0.2s"
                }} />
                {/* Line */}
                <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  filter="url(#lineShadow)"
                  style={{
                    strokeDasharray: 2000,
                    strokeDashoffset: animated ? 0 : 2000,
                    transition: "stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1) 0.1s"
                  }} />
              </g>

              {/* Hover dots */}
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="14" fill="transparent" style={{ cursor: "crosshair" }}
                  onMouseEnter={() => setTooltip({ ...p, idx: i })} />
              ))}

              {/* Tooltip dot */}
              {tooltip && (
                <g>
                  <line x1={tooltip.x} x2={tooltip.x} y1={PAD.t} y2={PAD.t + chartH} stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
                  <circle cx={tooltip.x} cy={tooltip.y} r="5" fill="#4f46e5" stroke="white" strokeWidth="2.5" />
                </g>
              )}
            </svg>

            {/* Tooltip box */}
            {tooltip && (
              <div style={{
                position: "absolute",
                left: `calc(${(tooltip.x / W) * 100}% - 70px)`,
                top: `${((tooltip.y - PAD.t) / H) * 100}%`,
                transform: "translateY(-115%)",
                background: "white",
                border: "1.5px solid #e5e7eb",
                borderRadius: 10,
                padding: "8px 13px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                pointerEvents: "none",
                minWidth: 130,
                zIndex: 10,
              }}>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>{tooltip.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{tooltip.value}</div>
                <div style={{ fontSize: 11, color: "#10b981", marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}>
                  <TrendingUp size={10} strokeWidth={2.5} /> New Leads
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}

/* ─────────────────────────────────────────────
   TASKS 4 & 5: LEAD DETAIL DRAWER
───────────────────────────────────────────── */

/* ─────────────────────────────────────────────
   EDIT MODAL
───────────────────────────────────────────── */
function EditModal({ lead, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div><div className="modal-title">Edit Lead</div><div className="modal-sub">{lead.name}</div></div>
          <button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button>
        </div>
        <div className="modal-body modal-placeholder">
          <IEdit s={40} c="#d1d5db" /><p>Edit Form</p><span>Fields for name, email, phone, status and source will appear here.</span>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={onClose}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TASK 6: KANBAN BOARD
───────────────────────────────────────────── */
function KanbanBoard({ leads, onUpdateLead, onOpenDetails, onAdjustScore }) {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const grouped = useMemo(() => STATUS_LIST.reduce((acc, s) => { acc[s] = leads.filter(l => l.status === s); return acc; }, {}), [leads]);

  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        overflowX: "auto",
        overflowY: "hidden",
        paddingBottom: "8px",
        scrollSnapType: "x proximity"
      }}
    >
      {STATUS_LIST.map(status => {
        const meta = STATUS_META[status];
        const colLeads = grouped[status] || [];
        const isOver = dragOverCol === status;
        return (
          <div key={status} onDragOver={e => { e.preventDefault(); setDragOverCol(status); }} onDragLeave={() => setDragOverCol(null)} onDrop={e => { e.preventDefault(); if (draggedId) onUpdateLead(draggedId, "status", status); setDraggedId(null); setDragOverCol(null); }}
            style={{
              background: isOver ? "#f0f3ff" : "#f9fafb",
              border: `2px dashed ${isOver ? "#4f46e5" : "#e5e7eb"}`,
              borderRadius: "12px",
              padding: "12px",
              minHeight: "400px",
              transition: "all 0.15s"
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontWeight: 700, fontSize: "13px", color: meta.color }}>{formatStatus(status)}</span>
              <span style={{ marginLeft: "auto", background: meta.bg, color: meta.color, fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "12px" }}>{colLeads.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {colLeads.map(lead => {
                const initials = lead.name.split(" ").map(n => n[0]).join("").slice(0, 2);
                const tier = lead.score >= 80 ? "high" : lead.score >= 60 ? "mid" : "low";
                const sc = { high: "#059669", mid: "#d97706", low: "#dc2626" };
                const sb = { high: "#d1fae5", mid: "#fef3c7", low: "#fee2e2" };
                return (
                  <div key={lead.id} draggable onDragStart={e => { setDraggedId(lead.id); e.dataTransfer.effectAllowed = "move"; }} onClick={() => onOpenDetails(lead)}
                    style={{ background: "white", borderRadius: "10px", padding: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb", cursor: "grab", transition: "box-shadow 0.15s, transform 0.15s", opacity: draggedId === lead.id ? 0.4 : 1 }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "none"; }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: lead.avatarBg, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.name}</div>
                        <div style={{ fontSize: "11.5px", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lead.company}</div>
                      </div>
                      <div style={{ padding: "2px 7px", borderRadius: "12px", background: sb[tier], color: sc[tier], fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{lead.score}</div>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px" }}>
                      <User size={10} /><span>{lead.assignee}</span>
                    </div>
                    {lead.followUpDate && (() => {
                      const info = getFollowUpLabel(lead.followUpDate);
                      const c = info.type === "overdue" ? "#dc2626" : info.type === "today" ? "#d97706" : info.type === "tomorrow" ? "#0284c7" : "#6b7280";
                      return <div style={{ marginTop: "6px", fontSize: "11px", color: c, fontWeight: info.type !== "normal" ? 700 : 400, display: "flex", alignItems: "center", gap: "3px" }}><Calendar size={10} />{info.label}</div>;
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

/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [activityLog, setActivityLog] = useState({});
  const [stats, setStats] = useState({ totalNewLeads: 0, callsToMake: 0, emailsToSend: 0, meetingsToSchedule: 0 });
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ status: "All", source: "All", assignee: "All", createdDateFrom: "", createdDateTo: "", followUpDateFrom: "", followUpDateTo: "", lastContactedDays: "", respondedTo: "All", city: "", state: "", country: "", zip: "", followUp: "All" });
  const [sortBy, setSortBy] = useState("createdDate");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(new Set());
  const [visibleCols, setVisibleCols] = useState(
    ALL_COLUMNS.map(col => col.key)
  );
  const [rowsPerPage, setRowsPerPage] = useState(30);
  const [page, setPage] = useState(1);
  const [wrapText, setWrapText] = useState(false);
  const [showColPanel, setShowColPanel] = useState(false);
  const [detailsLead, setDetailsLead] = useState(null);

  const fetchLeadDetail = useCallback(async (id) => {
    try {
      const data = await leadsAPI.getById(id);
      const [normalized] = normalizeLeads([data]);
      setDetailsLead(normalized);
    } catch (e) {
      console.error("Failed to load lead details", e);
    }
  }, []);
  const [editLead, setEditLead] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [createLeadType, setCreateLeadType] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [showChart, setShowChart] = useState(false);

  // Normalize API response to component format
  const normalizeLeads = (apiLeads) => {
    return apiLeads.map(lead => ({
      id: lead.id,
      name: lead.firstName || "Unknown Lead",
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      status: lead.status || "New",
      source: lead.source || "Inbound",
      score: lead.score ?? 50,
      deposits: lead.deposits ?? 0,
      whatsappEnabled: !!lead.whatsappEnabled,
      comments: lead.comments || "",
      assignee: "Unassigned",
      avatarBg: ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9", "#14b8a6", "#8b5cf6", "#f97316"][Math.floor(Math.random() * 8)],
      createdDate: lead.createdAt ? lead.createdAt.split("T")[0] : todayStr(),
      followUpDate: lead.nextFollowUpAt ? lead.nextFollowUpAt.split("T")[0] : "",
      lastContacted: lead.lastContactedAt ? lead.lastContactedAt.split("T")[0] : "",
      respondedTo: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    }));
  };

  useEffect(() => {
    localStorage.setItem("crm_visible_columns", JSON.stringify(visibleCols));
  }, [visibleCols]);

  // load leads and dashboard stats from server
  useEffect(() => {
    const loadData = async () => {
      try {
        const leadsData = await leadsAPI.getAll();
        const normalizedLeads = normalizeLeads(leadsData);
        setLeads(normalizedLeads);
        setActivityLog(makeInitialActivity(normalizedLeads));
      } catch (err) {
        console.error("Error fetching leads", err);
      }
      try {
        const statsData = await leadsAPI.getDashboard();
        setStats(statsData);
      } catch (err) {
        console.error("Error fetching dashboard stats", err);
      }
    };
    loadData();
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "All") count++;
    if (filters.source !== "All") count++;
    if (filters.assignee !== "All") count++;
    if (filters.createdDateFrom || filters.createdDateTo) count++;
    if (filters.followUpDateFrom || filters.followUpDateTo) count++;
    if (filters.lastContactedDays) count++;
    if (filters.respondedTo !== "All") count++;
    if (filters.city) count++;
    if (filters.state) count++;
    if (filters.country) count++;
    if (filters.zip) count++;
    return count;
  }, [filters]);

  const activeCols = ALL_COLUMNS.filter(c => c.always || visibleCols.includes(c.key));

  const updateLead = useCallback(async (id, field, val) => {
    setLeads(p => p.map(l => l.id === id ? { ...l, [field]: val } : l));
    setDetailsLead(prev => prev && prev.id === id ? { ...prev, [field]: val } : prev);
    try {
      if (field === "status") {
        await leadsAPI.updateStatus(id, val);
      } else {
        await leadsAPI.update(id, { [field]: val });
      }
    } catch (e) {
      console.error("Failed to update lead", e);
    }
  }, []);

  const adjustScore = useCallback((id, delta, customActivity = null) => {
    // compute new score before state update
    const lead = leads.find(l => l.id === id);
    const newScore = lead ? Math.max(0, Math.min(100, lead.score + delta)) : null;
    setLeads(prev => prev.map(l => l.id !== id ? l : { ...l, score: newScore }));
    setDetailsLead(prev => {
      if (!prev || prev.id !== id) return prev;
      return { ...prev, score: newScore };
    });
    const now = new Date();
    const act = customActivity || { type: "score-change", date: todayStr(), time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), notes: `Score ${delta > 0 ? "increased" : "decreased"} ${delta > 0 ? "+" : ""}${delta}` };
    if (delta !== 0 || customActivity) {
      setActivityLog(prev => ({ ...prev, [id]: [{ id: Date.now(), ...act }, ...(prev[id] || [])] }));
    }
    if (newScore !== null) {
      leadsAPI.update(id, { score: newScore }).catch(e => console.error("Failed to sync score", e));
    }
  }, [leads]);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const q = search.trim().toLowerCase();
      if (q) {
        const targets = { all: [l.name, l.company, l.email, l.phone, l.address || "", l.assignee].join(" ").toLowerCase(), name: l.name.toLowerCase(), email: l.email.toLowerCase(), phone: l.phone.toLowerCase(), address: (l.address || "").toLowerCase(), score: String(l.score) };
        if (!targets[searchField]?.includes(q)) return false;
      }
      if (filters.status !== "All" && l.status !== filters.status) return false;
      if (filters.source !== "All" && l.source !== filters.source) return false;
      if (filters.assignee !== "All" && l.assignee !== filters.assignee) return false;
      if (filters.createdDateFrom && l.createdDate < filters.createdDateFrom) return false;
      if (filters.createdDateTo && l.createdDate > filters.createdDateTo) return false;
      if (filters.followUpDateFrom && (!l.followUpDate || l.followUpDate < filters.followUpDateFrom)) return false;
      const today = todayStr();

      if (filters.followUp === "today" && l.followUpDate !== today) return false;

      if (filters.followUp === "overdue" && l.followUpDate >= today) return false;

      if (filters.followUp === "upcoming" && l.followUpDate <= today) return false;
      if (filters.followUpDateTo && (!l.followUpDate || l.followUpDate > filters.followUpDateTo)) return false;
      if (filters.lastContactedDays && l.lastContacted) {
        const daysSince = Math.floor((new Date() - new Date(l.lastContacted)) / (1000 * 60 * 60 * 24));
        if (daysSince > parseInt(filters.lastContactedDays)) return false;
      }
      if (filters.respondedTo !== "All" && l.respondedTo !== filters.respondedTo.toLowerCase()) return false;
      if (filters.city && !l.city?.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.state && !l.state?.toLowerCase().includes(filters.state.toLowerCase())) return false;
      if (filters.zip && !l.zip?.toLowerCase().includes(filters.zip.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      let av = a[sortBy] ?? "", bv = b[sortBy] ?? "";
      if (sortBy === "score") { av = a.score; bv = b.score; }
      const cmp = typeof av === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [leads, search, searchField, filters, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  useEffect(() => setPage(1), [search, filters, rowsPerPage]);

  const allOnPageSel = paginated.length > 0 && paginated.every(l => selected.has(l.id));
  const toggleAll = () => {
    if (allOnPageSel) setSelected(p => { const s = new Set(p); paginated.forEach(l => s.delete(l.id)); return s; });
    else setSelected(p => { const s = new Set(p); paginated.forEach(l => s.add(l.id)); return s; });
  };
  const toggleOne = (id) => setSelected(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const SortIco = ({ col }) => (
    <span className="sort-ico">
      {sortBy === col ? (sortDir === "asc" ? <IChevU s={9} /> : <IChevD s={9} />) : <span className="sort-both"><IChevU s={8} /><IChevD s={8} /></span>}
    </span>
  );

  const handleApplyFilters = (f) => setFilters(f);
  const handleClearFilters = () => setFilters({ status: "All", source: "All", assignee: "All", createdDateFrom: "", createdDateTo: "", followUpDateFrom: "", followUpDateTo: "", lastContactedDays: "", respondedTo: "All", city: "", state: "", country: "", zip: "" });
  const hasActiveFilters = search || activeFilterCount > 0;

  const handleAddLeadType = (t) => t.key === "import" ? setShowImport(true) : setCreateLeadType(t);
  const handleCreateLead = async (newLead) => {
    try {
      const created = await leadsAPI.create(newLead);
      setLeads(p => [created, ...p]);
      setActivityLog(prev => ({ ...prev, [created.id]: [{ id: Date.now(), type: "created", date: todayStr(), time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), notes: "Lead created" }] }));
    } catch (e) {
      console.error("Failed to create lead", e);
    }
  };

  return (
    <div className="page">
      <div className="stat-grid">
        {STAT_CARDS.map(({ label, key, icon, alert, c }, i) => (
          <StatCard
            key={label}
            label={label}
            value={stats[key] ?? 0}
            change=""
            icon={icon}
            alert={alert}
            c={c}
            delay={`${i * 0.07}s`}
          />
        ))}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="toolbar">
        <div className="toolbar-mid">

          {/* Filter */}
          <button
            className={`btn-ghost ${activeFilterCount > 0 ? 'btn-ghost--active' : ''}`}
            onClick={() => setShowFilter(true)}
          >
            <IFilter s={12} />&ensp;Filter
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>

          <div className="toolbar-divider" />

          {/* Add Lead */}
          <AddLeadDropdown onSelectType={handleAddLeadType} />

          <div className="toolbar-divider" />

          {/* View Toggle */}
          <div style={{ display: "flex", border: "1.5px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", background: "white" }}>
            {[{ k: "list", l: "List", I: IRows }, { k: "kanban", l: "Kanban", I: IKanban }].map(({ k, l, I }) => (
              <button
                key={k}
                onClick={() => setViewMode(k)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "7px 12px",
                  border: "none",
                  borderRight: k === "list" ? "1px solid #e5e7eb" : "none",
                  background: viewMode === k ? "#eef2ff" : "transparent",
                  color: viewMode === k ? "#4f46e5" : "#6b7280",
                  fontSize: "13.5px",
                  fontWeight: viewMode === k ? 700 : 500,
                  cursor: "pointer"
                }}
              >
                <I s={13} />{l}
              </button>
            ))}
          </div>

          <div className="toolbar-divider" />

          {/* Search */}
          <div className="unified-search">
            <div className="search-wrap">
              <span className="search-ico"><ISearch s={14} c="#9ca3af" /></span>
              <input
                type="text"
                className="search-inp unified-inp"
                placeholder="Search leads…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="toolbar-divider" />

          {/* Chart */}
          <button
            className={`icon-btn-outline ${showChart ? "icon-btn-outline--on" : ""}`}
            onClick={() => setShowChart(!showChart)}
            title="View Performance Chart"
          >
            <BarChart3 size={14} />
          </button>

        </div>
      </div>

      {/* ── FILTER CHIPS ── */}
      {hasActiveFilters && (
        <div className="chips-bar">
          {search && <span className="chip">Search: &ldquo;{search}&rdquo;<button className="chip-x" onClick={() => setSearch("")}><IX s={9} c="#4f46e5" /></button></span>}
          {filters.status !== "All" && <span className="chip"><span className="chip-dot" style={{ background: STATUS_META[filters.status]?.dot }} />Status: {filters.status}<button className="chip-x" onClick={() => setFilters({ ...filters, status: "All" })}><IX s={9} c="#4f46e5" /></button></span>}
          {filters.source !== "All" && <span className="chip">Source: {filters.source}<button className="chip-x" onClick={() => setFilters({ ...filters, source: "All" })}><IX s={9} c="#4f46e5" /></button></span>}
          {filters.assignee !== "All" && <span className="chip">Owner: {filters.assignee}<button className="chip-x" onClick={() => setFilters({ ...filters, assignee: "All" })}><IX s={9} c="#4f46e5" /></button></span>}
          <button className="chip-clearall" onClick={() => { setSearch(""); handleClearFilters(); }}>Clear all</button>
        </div>
      )}

      {/* ── BULK BAR ── */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-cnt">{selected.size} selected</span>
          <button className="bulk-btn">Assign Owner</button>
          <button className="bulk-btn">Change Status</button>
          <button className="bulk-btn bulk-btn--danger">Delete</button>
          <button className="bulk-close" onClick={() => setSelected(new Set())}><IX s={12} c="#6b7280" /></button>
        </div>
      )}

      {/* ── KANBAN VIEW ── */}
      {viewMode === "kanban" && (
        <>
          <div className="kanban-filter-bar">

            <select
              value={filters.assignee}
              onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
            >
              <option value="All">All Owners</option>
              <option>Monica Jones</option>
              <option>James Carter</option>
              <option>Amanda Blake</option>
              <option>Samantha Clark</option>
            </select>

            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            >
              <option value="All">All Sources</option>
              <option value="Inbound">Inbound</option>
              <option value="Referral">Referral</option>
              <option value="Website">Website</option>
              <option value="Campaign">Campaign</option>
            </select>

            <select
              value={filters.followUp}
              onChange={(e) => setFilters({ ...filters, followUp: e.target.value })}
            >
              <option value="All">All Followups</option>
              <option value="today">Today</option>
              <option value="overdue">Overdue</option>
              <option value="upcoming">Upcoming</option>
            </select>

          </div>

          <KanbanBoard
            leads={filtered}
            onUpdateLead={updateLead}
            onOpenDetails={fetchLeadDetail}
            onAdjustScore={adjustScore}
          />
        </>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === "list" && (
        <div className="table-card">
          <div className="table-scroll">
            <table className={`table ${wrapText ? "table--wrap" : ""}`}>
              <thead>
                <tr className="thead-row">
                  <th className="th th-check"><input type="checkbox" className="cb" checked={allOnPageSel} onChange={toggleAll} /></th>
                  {activeCols.map(col => (
                    <th key={col.key} className={`th th-${col.key} ${sortBy === col.key ? "th--sorted" : ""}`} onClick={() => handleSort(col.key)}>
                      <span className="th-inner">{col.label}<SortIco col={col.key} /></span>
                    </th>
                  ))}
                  <th className="th th-actions" style={{ textAlign: "right", paddingRight: "10px" }}>
                    <button className={`icon-btn-outline ${showColPanel ? "icon-btn-outline--on" : ""}`} onClick={() => setShowColPanel(true)} title="Manage Columns" style={{ padding: "4px 6px", marginLeft: "45px" }}>
                      <ISettings s={13} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={activeCols.length + 2}>
                    <div className="empty-state"><ISearch s={32} c="#d1d5db" /><p>No leads match your filters</p><span>Try adjusting your search or clearing active filters</span></div>
                  </td></tr>
                ) : paginated.map((lead, i) => {
                  const initials = lead.name.split(" ").map(n => n[0]).join("").slice(0, 2);
                  const isSel = selected.has(lead.id);
                  return (
                    <tr key={lead.id} className={`row ${isSel ? "row--sel" : ""}`} style={{ animationDelay: `${i * 0.02}s` }}>
                      <td className="td td-check"><input type="checkbox" className="cb" checked={isSel} onChange={() => toggleOne(lead.id)} /></td>
                      {activeCols.map(col => {
                        switch (col.key) {
                          case "name": return (
                            <td key="name" className="td td-name">
                              <div className="name-cell">
                                <div className="avatar" style={{ background: lead.avatarBg }}>{initials}</div>
                                <div className="name-block">
                                  <button className="name-link" onClick={() => fetchLeadDetail(lead.id)}>{lead.name}</button>

                                </div>
                              </div>
                            </td>
                          );
                          case "status": return <td key="status" className="td td-status"><StatusCell value={lead.status} onChange={v => updateLead(lead.id, "status", v)} /></td>;
                          case "followUp": return <td key="followUp" className="td td-followup"><FollowUpCell value={lead.followUpDate} onChange={v => updateLead(lead.id, "followUpDate", v)} /></td>;
                          case "phone": return <td key="phone" className="td"><a href={`tel:${lead.phone}`} className="link-cell">{lead.phone}</a></td>;
                          case "email": return <td key="email" className="td"><a href={`mailto:${lead.email}`} className="link-cell">{lead.email}</a></td>;
                          case "company": return <td key="company" className="td"><span className="cell-txt">{lead.company}</span></td>;
                          case "source": return <td key="source" className="td"><span className="pill" >{lead.source}</span></td>;
                          case "score": return <td key="score" className="td td-score"><ScoreBar score={lead.score} onAdjust={d => adjustScore(lead.id, d)} /></td>;
                          case "assignee": return <td key="assignee" className="td"><div className="owner-cell"><div className="owner-av" style={{ background: lead.avatarBg }}>{lead.assignee.split(" ").map(n => n[0]).join("").slice(0, 2)}</div><span className="cell-txt">{lead.assignee}</span></div></td>;
                          case "createdDate": return <td key="createdDate" className="td"><span className="date-txt">{fmtDate(lead.createdDate)}</span></td>;
                          case "deposits": return <td key="deposits" className="td"><span className="cell-txt">{lead.deposits}</span></td>;
                          case "assignedToUserId": return <td key="assignedToUserId" className="td"><span className="cell-txt">{lead.assignedToUserId}</span></td>;
                          case "comments": return <td key="comments" className="td"><span className="cell-txt">{lead.comments}</span></td>;
                          case "whatsappEnabled": return <td key="whatsappEnabled" className="td"><span className="cell-txt">{lead.whatsappEnabled ? "Yes" : "No"}</span></td>;
                          default: return null;
                        }
                      })}
                      <td className="td td-actions">
                        <div className="row-acts">
                          <button className="act-btn" title="Call"><IPhone s={12} /></button>
                          <button className="act-btn" title="Email"><IMail s={12} /></button>
                          <button className="act-btn act-btn--edit" title="Edit" onClick={() => setEditLead(lead)}><IEdit s={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span className="pg-info">{filtered.length === 0 ? "No records" : `${(page - 1) * rowsPerPage + 1}–${Math.min(page * rowsPerPage, filtered.length)} of ${filtered.length} records`}</span>
            <div className="pg-btns">
              <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><IChevL s={12} />Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages).reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push(<span key={"e" + p} className="pg-ellipsis">…</span>);
                acc.push(<button key={p} className={`pg-btn pg-num ${page === p ? "pg-num--on" : ""}`} onClick={() => setPage(p)}>{p}</button>);
                return acc;
              }, [])}
              <button className="pg-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next<IChevR s={12} /></button>
            </div>
          </div>
        </div>
      )}

      {/* ── OVERLAYS ── */}
      {showColPanel && <ManageColumnsPanel visibleCols={visibleCols} setVisibleCols={setVisibleCols} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} wrapText={wrapText} setWrapText={setWrapText} onClose={() => setShowColPanel(false)} />}
      {detailsLead && <LeadDetailsModal lead={detailsLead} onClose={() => setDetailsLead(null)} activityLog={activityLog} onUpdateLead={updateLead} onAdjustScore={adjustScore} />}
      {editLead && <EditModal lead={editLead} onClose={() => setEditLead(null)} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={newLeads => setLeads(p => [...p, ...newLeads])} />}
      {showFilter && <FilterModal onClose={() => setShowFilter(false)} filters={filters} setFilters={setFilters} activeFilterCount={activeFilterCount} onApply={handleApplyFilters} onClear={handleClearFilters} />}
      {createLeadType && <CreateLeadModal leadType={createLeadType} onClose={() => setCreateLeadType(null)} onSave={handleCreateLead} />}
      {showChart && <LeadsPerformanceChart onClose={() => setShowChart(false)} leads={leads} />}
    </div>
  );
}