import "../styles/Leads.css";
import "react-datepicker/dist/react-datepicker.css";
import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import { Pencil, Plus, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import dealsAPI from "../api/deals.api";
import DealDetailsModal from "../components/DealDetailsModal.jsx";
import Toast from "../utils/toast";
import { IFilter, IKanban, IRows, ISearch, IX } from "./leads/shared";
import { getInitials } from "./leads/utils";

const STAGE_ORDER = [
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

const STAGE_META = {
  New: { color: "#2563eb", bg: "#dbeafe" },
  Prospect: { color: "#0284c7", bg: "#e0f2fe" },
  Qualification: { color: "#7c3aed", bg: "#ede9fe" },
  Qualified: { color: "#0f766e", bg: "#ccfbf1" },
  Proposal: { color: "#b45309", bg: "#fef3c7" },
  ProposalSent: { color: "#c2410c", bg: "#ffedd5" },
  Negotiation: { color: "#ea580c", bg: "#fed7aa" },
  ClosedWon: { color: "#166534", bg: "#dcfce7" },
  ClosedLost: { color: "#b91c1c", bg: "#fee2e2" },
};

const fmtCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Rs. 0.00";
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB");
};
const fmtDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB");
};

const normalizeStage = (deal) => {
  const raw = deal?.stage || deal?.dealStage || deal?.status || "New";
  return STAGE_ORDER.includes(raw) ? raw : "New";
};
const normalizeAmount = (deal) => Number(deal?.amount ?? deal?.dealValue ?? deal?.value ?? 0) || 0;
const normalizeClosingDate = (deal) => deal?.closingDate || deal?.expectedCloseDate || deal?.closeDate || null;
const getDealTitle = (deal) => deal?.dealName || deal?.title || deal?.subject || deal?.name || `Deal #${deal?.dealId ?? deal?.id ?? ""}`;
const getDealId = (deal) => Number(deal?.dealId ?? deal?.id ?? 0);
const getDealType = (deal) => deal?.type || deal?.dealType || "-";
const formatStageLabel = (value = "") => String(value).replace(/([a-z])([A-Z])/g, "$1 $2").trim();
const getAccountName = (deal) => deal?.accountName || deal?.account?.accountName || "-";
const getContactName = (deal) => deal?.contactName || deal?.contact?.contactName || "-";
const getCreatedTime = (deal) => deal?.createdTime || deal?.createdAt || null;
const getStageSelectStyle = (stage) => {
  const meta = STAGE_META[stage] || { color: "#475569", bg: "#e2e8f0" };
  return {
    minWidth: 140,
    padding: "8px 36px 8px 12px",
    border: `1.5px solid ${meta.color}`,
    borderRadius: 999,
    background: `${meta.bg} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='${encodeURIComponent(meta.color)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 8l4 4 4-4'/%3E%3C/svg%3E") no-repeat right 12px center / 14px 14px`,
    color: meta.color,
    fontWeight: 700,
    outline: "none",
    appearance: "none",
    cursor: "pointer",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.24)",
  };
};

const SEARCH_FIELD_OPTIONS = [
  { value: "all", label: "All Details" },
  { value: "dealName", label: "Deal Name" },
  { value: "accountName", label: "Account" },
  { value: "contactName", label: "Contact" },
  { value: "dealOwner", label: "Owner" },
  { value: "stage", label: "Stage" },
  { value: "nextStep", label: "Next Step" },
  { value: "nextActivity", label: "Next Activity" },
  { value: "leadSource", label: "Lead Source" },
  { value: "campaignSource", label: "Campaign Source" },
  { value: "tags", label: "Tags" },
];

const DEFAULT_DEAL_FILTERS = {
  stage: "All",
  owner: "",
  priority: "All",
  leadSource: "",
  campaignSource: "",
  minAmount: "",
  maxAmount: "",
  minExpectedRevenue: "",
  maxExpectedRevenue: "",
  closingDateFrom: "",
  closingDateTo: "",
};

const RANGE_FILTER_SECTIONS = [
  {
    minKey: "minAmount",
    maxKey: "maxAmount",
    title: "Deal value",
    helper: "Total value of the opportunity",
    minPlaceholder: "Min amount",
    maxPlaceholder: "Max amount",
  },
  {
    minKey: "minExpectedRevenue",
    maxKey: "maxExpectedRevenue",
    title: "Expected revenue",
    helper: "Forecasted earnings",
    minPlaceholder: "Min expected revenue",
    maxPlaceholder: "Max expected revenue",
  },
];

const normalizeFilterText = (value) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

function DealFilterModal({ filters, onApply, onClose, activeFilterCount }) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key, value) => setLocalFilters((prev) => ({ ...prev, [key]: value }));

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => setLocalFilters(DEFAULT_DEAL_FILTERS);
  const panelBg = "var(--bg-card)";
  const panelBorder = "var(--border-color)";
  const primaryText = "var(--text-main)";
  const mutedText = "color-mix(in srgb, var(--text-main) 70%, #94a3b8)";
  const subtleText = "color-mix(in srgb, var(--text-main) 56%, #94a3b8)";
  const fieldStyle = {
    width: "100%",
    padding: "8px 12px",
    border: `1.5px solid ${panelBorder}`,
    borderRadius: "6px",
    fontSize: "13px",
    background: panelBg,
    color: primaryText,
  };
  const pairRow = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 };
  const dateInputs = [
    { key: "closingDateFrom", label: "From", placeholder: "From date" },
    { key: "closingDateTo", label: "To", placeholder: "To date" },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.35)", zIndex: 500 }} />
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: "340px", background: panelBg, boxShadow: "4px 0 20px rgba(0,0,0,0.15)", zIndex: 501, display: "flex", flexDirection: "column", animation: "slideIn 0.25s ease-out", borderRight: `1px solid ${panelBorder}` }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${panelBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IFilter s={16} c="#4f46e5" />
            <span style={{ fontSize: "15px", fontWeight: 600, color: primaryText }}>Filter Deals</span>
            {activeFilterCount > 0 && <span style={{ background: "#4f46e5", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "12px" }}>{activeFilterCount}</span>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 4 }}><IX s={16} c="#6b7280" /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtleText, margin: "0 0 12px 0" }}>Deal Filters</h4>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: mutedText, display: "block", marginBottom: 4 }}>Stage</label>
              <select value={localFilters.stage} onChange={(event) => updateFilter("stage", event.target.value)} style={{ ...fieldStyle, cursor: "pointer" }}>
                <option value="All">All Stages</option>
                {STAGE_ORDER.map((stage) => <option key={stage} value={stage}>{formatStageLabel(stage)}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: mutedText, display: "block", marginBottom: 4 }}>Priority</label>
              <select value={localFilters.priority} onChange={(event) => updateFilter("priority", event.target.value)} style={{ ...fieldStyle, cursor: "pointer" }}>
                <option value="All">All Priorities</option>
                {["Low", "Medium", "High"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: mutedText, display: "block", marginBottom: 4 }}>Owner</label>
              <input type="text" value={localFilters.owner} onChange={(event) => updateFilter("owner", event.target.value)} placeholder="Owner name" style={fieldStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtleText, margin: "0 0 12px 0" }}>Source</h4>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: mutedText, display: "block", marginBottom: 4 }}>Lead Source</label>
              <input type="text" value={localFilters.leadSource} onChange={(event) => updateFilter("leadSource", event.target.value)} placeholder="Lead source" style={fieldStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: mutedText, display: "block", marginBottom: 4 }}>Campaign Source</label>
              <input type="text" value={localFilters.campaignSource} onChange={(event) => updateFilter("campaignSource", event.target.value)} placeholder="Campaign source" style={fieldStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtleText, margin: "0 0 12px 0" }}>Amount Range</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {RANGE_FILTER_SECTIONS.map((section) => (
                <div key={section.minKey} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: primaryText }}>{section.title}</span>
                    <span style={{ fontSize: 11, color: subtleText }}>{section.helper}</span>
                  </div>
                  <div style={pairRow}>
                    <input
                      type="number"
                      value={localFilters[section.minKey]}
                      onChange={(event) => updateFilter(section.minKey, event.target.value)}
                      placeholder={section.minPlaceholder}
                      style={fieldStyle}
                    />
                    <input
                      type="number"
                      value={localFilters[section.maxKey]}
                      onChange={(event) => updateFilter(section.maxKey, event.target.value)}
                      placeholder={section.maxPlaceholder}
                      style={fieldStyle}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtleText, margin: "0 0 12px 0" }}>Closing Date</h4>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={pairRow}>
                {dateInputs.map((input) => (
                  <div key={input.key} style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: subtleText }}>{input.label}</span>
                    <DatePicker
                      selected={localFilters[input.key] ? new Date(localFilters[input.key]) : null}
                      onChange={(date) => updateFilter(input.key, date ? date.toISOString() : "")}
                      dateFormat="MMM d, yyyy"
                      className="deal-datepicker"
                      customInput={<input style={fieldStyle} placeholder={input.placeholder} />}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 20px", borderTop: `1px solid ${panelBorder}`, display: "flex", gap: 8, background: "color-mix(in srgb, var(--bg-card) 78%, var(--bg-body))" }}>
          <button onClick={handleClear} style={{ flex: 1, padding: "8px 12px", background: panelBg, border: `1.5px solid ${panelBorder}`, borderRadius: "6px", fontSize: "13px", fontWeight: 500, color: primaryText, cursor: "pointer" }}>Clear All</button>
          <button onClick={handleApply} style={{ flex: 1, padding: "8px 12px", background: "#4f46e5", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>Apply {activeFilterCount > 0 && `(${activeFilterCount})`}</button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

function DealsKanban({ deals, onOpenDeal, onDeleteDeal }) {
  const grouped = useMemo(() => STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = deals.filter((deal) => normalizeStage(deal) === stage);
    return acc;
  }, {}), [deals]);

  return (
    <>
      <div className="kanban-board">
        {STAGE_ORDER.map((stage) => {
          const items = grouped[stage] || [];
          const totalAmount = items.reduce((sum, deal) => sum + normalizeAmount(deal), 0);
          const meta = STAGE_META[stage] || { color: "#334155", bg: "#e2e8f0" };
          return (
            <div key={stage} className="kanban-column" style={{ "--kanban-accent": meta.color, "--kanban-accent-bg": meta.bg }}>
              <div className="kanban-column__header" style={{ alignItems: "flex-start" }}>
                <div>
                  <div className="kanban-column__label">{formatStageLabel(stage)}</div>
                  <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "color-mix(in srgb, var(--text-main) 84%, #94a3b8)" }}>{fmtCurrency(totalAmount)}</div>
                </div>
                <span className="kanban-column__count">{items.length}</span>
              </div>
              <div className="kanban-column__list">
                {!items.length ? (
                  <div className="kanban-card" style={{ borderStyle: "dashed", color: "color-mix(in srgb, var(--text-main) 60%, #94a3b8)" }}>
                    No deals in this stage
                  </div>
                ) : items.map((deal) => (
                  <div key={deal.dealId || `${getDealTitle(deal)}-${normalizeClosingDate(deal) || "none"}`} className="kanban-card" style={{ position: "relative", paddingRight: 36 }}>
                    <button
                      type="button"
                      aria-label="Delete deal"
                      onClick={(event) => { event.stopPropagation(); onDeleteDeal(deal); }}
                      style={{ position: "absolute", top: 8, right: 8, border: "none", background: "color-mix(in srgb, var(--bg-card) 92%, #ffffff)", color: "#ef4444", cursor: "pointer", padding: 2, borderRadius: 6, boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)" }}
                    >
                      <Trash2 size={15} />
                    </button>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", alignItems: "center", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => onOpenDeal(deal)}
                          style={{ border: "none", background: "transparent", padding: 0, textAlign: "left", cursor: "pointer", minWidth: 0 }}
                        >
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {getDealTitle(deal)}
                          </div>
                        </button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(79,70,229,0.12)", color: "#4f46e5" }}>
                          {formatStageLabel(stage)}
                        </span>
                        {deal.priority ? <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "color-mix(in srgb, var(--bg-card) 78%, #ffffff)", color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}>{deal.priority}</span> : null}
                      </div>

                      <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}><span style={{ color: "color-mix(in srgb, var(--text-main) 56%, #94a3b8)" }}>Account</span> · {deal.accountName || "-"}</div>
                        <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}><span style={{ color: "color-mix(in srgb, var(--text-main) 56%, #94a3b8)" }}>Contact</span> · {deal.contactName || "-"}</div>
                        <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}><span style={{ color: "color-mix(in srgb, var(--text-main) 56%, #94a3b8)" }}>Owner</span> · {deal.dealOwner || "-"}</div>
                      </div>

                      <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}><span style={{ color: "color-mix(in srgb, var(--text-main) 56%, #94a3b8)" }}>Next Step</span> · {deal.nextStep || "-"}</div>
                        <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}><span style={{ color: "color-mix(in srgb, var(--text-main) 56%, #94a3b8)" }}>Next Activity</span> · {deal.nextActivity || "-"}</div>
                      </div>

                      <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontSize: 12, color: "color-mix(in srgb, var(--text-main) 68%, #94a3b8)", whiteSpace: "nowrap" }}>
                          Amount: <strong style={{ color: "var(--text-main)" }}>{fmtCurrency(normalizeAmount(deal))}</strong>
                        </div>
                        <div style={{ fontSize: 12, color: "color-mix(in srgb, var(--text-main) 68%, #94a3b8)", whiteSpace: "nowrap" }}>
                          Expected: <strong style={{ color: "var(--text-main)" }}>{fmtCurrency(deal.expectedRevenue || 0)}</strong>
                        </div>
                        <div style={{ fontSize: 12, color: "#ef4444", whiteSpace: "nowrap" }}>{fmtDate(normalizeClosingDate(deal))}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function DealsKanbanBoard({ deals, onOpenDeal, onDeleteDeal, onStageDrop }) {
  const grouped = useMemo(() => STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = deals.filter((deal) => normalizeStage(deal) === stage);
    return acc;
  }, {}), [deals]);

  return (
    <div className="kanban-board">
      {STAGE_ORDER.map((stage) => {
        const items = grouped[stage] || [];
        const totalExpected = items.reduce((sum, deal) => sum + Number(deal.expectedRevenue || 0), 0);
        const meta = STAGE_META[stage] || { color: "#334155", bg: "#e2e8f0" };

        return (
          <div
            key={stage}
            className="kanban-column"
            style={{ "--kanban-accent": meta.color, "--kanban-accent-bg": meta.bg }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const dealId = Number(event.dataTransfer.getData("text/plain") || 0);
              if (dealId) onStageDrop?.(dealId, stage);
            }}
          >
            <div className="kanban-column__header" style={{ alignItems: "flex-start" }}>
              <div>
                <div className="kanban-column__label">{formatStageLabel(stage)}</div>
                <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "color-mix(in srgb, var(--text-main) 84%, #94a3b8)" }}>{fmtCurrency(totalExpected)}</div>
              </div>
              <span className="kanban-column__count">{items.length}</span>
            </div>
            <div className="kanban-column__list">
              {!items.length ? (
                <div className="kanban-card" style={{ borderStyle: "dashed", color: "color-mix(in srgb, var(--text-main) 60%, #94a3b8)" }}>
                  No deals in this stage
                </div>
              ) : items.map((deal) => (
                <div
                  key={getDealId(deal) || `${getDealTitle(deal)}-${getCreatedTime(deal) || "none"}`}
                  className="kanban-card"
                  style={{ position: "relative", paddingRight: 36 }}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", String(getDealId(deal)));
                    event.dataTransfer.effectAllowed = "move";
                  }}
                >
                  <button
                    type="button"
                    aria-label="Delete deal"
                    onClick={(event) => { event.stopPropagation(); onDeleteDeal(deal); }}
                    style={{ position: "absolute", top: 8, right: 8, border: "none", background: "color-mix(in srgb, var(--bg-card) 92%, #ffffff)", color: "#ef4444", cursor: "pointer", padding: 2, borderRadius: 6, boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)" }}
                  >
                    <Trash2 size={15} />
                  </button>
                  <div style={{ display: "grid", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => onOpenDeal(deal)}
                      style={{ border: "none", background: "transparent", padding: 0, textAlign: "left", cursor: "pointer", minWidth: 0 }}
                    >
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {getDealTitle(deal)}
                      </div>
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(79,70,229,0.12)", color: "#4f46e5" }}>
                        {formatStageLabel(stage)}
                      </span>
                      {getDealType(deal) !== "-" ? <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "color-mix(in srgb, var(--bg-card) 78%, #ffffff)", color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}>{getDealType(deal)}</span> : null}
                    </div>

                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}>Account · {getAccountName(deal)}</div>
                      <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}>Contact · {getContactName(deal)}</div>
                      <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}>Owner · {deal.dealOwner || "-"}</div>
                    </div>

                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}>Next Step · {deal.nextStep || "-"}</div>
                      <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 82%, #94a3b8)" }}>Source · {deal.leadSource || "-"}</div>
                    </div>

                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontSize: 12, color: "color-mix(in srgb, var(--text-main) 68%, #94a3b8)", whiteSpace: "nowrap" }}>
                        Expected: <strong style={{ color: "var(--text-main)" }}>{fmtCurrency(deal.expectedRevenue || 0)}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>Created: {fmtDate(getCreatedTime(deal))}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("kanban");
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_DEAL_FILTERS);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailDeal, setDetailDeal] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkStage, setBulkStage] = useState("New");
  const [createForm, setCreateForm] = useState({
    dealName: "",
    amount: "",
    closingDate: null,
    stage: "New",
    type: "",
    probability: 10,
    nextStep: "",
    leadSource: "",
    campaignSource: "",
    description: "",
  });

  const loadDeals = async () => {
    setLoading(true);
    try {
      const data = await dealsAPI.getAll({
        source: filters.leadSource || undefined,
        owner: filters.owner || undefined,
        dateRangeFrom: filters.closingDateFrom || undefined,
        dateRangeTo: filters.closingDateTo || undefined,
      });
      setDeals(Array.isArray(data) ? data : []);
    } catch (error) {
      Toast.error(error?.response?.data?.message || "Unable to load deals");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, [filters.leadSource, filters.owner, filters.closingDateFrom, filters.closingDateTo]);

  useEffect(() => {
    setSelected((current) => {
      const validIds = new Set(deals.map((deal) => getDealId(deal)).filter(Boolean));
      const next = new Set([...current].filter((id) => validIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [deals]);

  const totalValue = useMemo(() => deals.reduce((sum, deal) => sum + normalizeAmount(deal), 0), [deals]);
  const convertedCount = deals.filter((deal) => normalizeStage(deal) === "ClosedWon").length;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.stage !== "All") count++;
    if (filters.priority !== "All") count++;
    if (filters.owner) count++;
    if (filters.leadSource) count++;
    if (filters.campaignSource) count++;
    if (filters.minAmount) count++;
    if (filters.maxAmount) count++;
    if (filters.minExpectedRevenue) count++;
    if (filters.maxExpectedRevenue) count++;
    if (filters.closingDateFrom) count++;
    if (filters.closingDateTo) count++;
    return count;
  }, [filters]);

  const activeSearchFieldLabel = useMemo(() => SEARCH_FIELD_OPTIONS.find((option) => option.value === searchField)?.label || "All Details", [searchField]);

  const filteredDeals = useMemo(() => deals.filter((deal) => {
    const query = normalizeFilterText(search);
    if (query) {
      const targets = {
        all: normalizeFilterText([
          deal.dealId,
          deal.dealName,
          getAccountName(deal),
          getContactName(deal),
          deal.dealOwner,
          deal.stage,
          getDealType(deal),
          deal.nextStep,
          deal.leadSource,
          deal.campaignSource,
          deal.description,
          deal.connectedTo,
        ].join(" ")),
        dealName: normalizeFilterText(deal.dealName),
        accountName: normalizeFilterText(getAccountName(deal)),
        contactName: normalizeFilterText(getContactName(deal)),
        dealOwner: normalizeFilterText(deal.dealOwner),
        stage: normalizeFilterText(deal.stage),
        nextStep: normalizeFilterText(deal.nextStep),
        nextActivity: normalizeFilterText(deal.activityId),
        leadSource: normalizeFilterText(deal.leadSource),
        campaignSource: normalizeFilterText(deal.campaignSource),
        tags: normalizeFilterText(deal.connectedTo),
      };
      if (!targets[searchField]?.includes(query)) return false;
    }
    if (filters.stage !== "All" && normalizeStage(deal) !== filters.stage) return false;
    if (filters.priority !== "All" && String(deal.priority || "").toLowerCase() !== String(filters.priority || "").toLowerCase()) return false;
    if (filters.owner && !normalizeFilterText(deal.dealOwner).includes(normalizeFilterText(filters.owner))) return false;
    if (filters.leadSource && !normalizeFilterText(deal.leadSource).includes(normalizeFilterText(filters.leadSource))) return false;
    if (filters.campaignSource && !normalizeFilterText(deal.campaignSource).includes(normalizeFilterText(filters.campaignSource))) return false;
    const amount = normalizeAmount(deal);
    const expectedRevenue = Number(deal.expectedRevenue || 0);
    if (filters.minAmount && amount < Number(filters.minAmount)) return false;
    if (filters.maxAmount && amount > Number(filters.maxAmount)) return false;
    if (filters.minExpectedRevenue && expectedRevenue < Number(filters.minExpectedRevenue)) return false;
    if (filters.maxExpectedRevenue && expectedRevenue > Number(filters.maxExpectedRevenue)) return false;
    if (filters.closingDateFrom || filters.closingDateTo) {
      const closingDate = normalizeClosingDate(deal) ? new Date(normalizeClosingDate(deal)) : null;
      if (filters.closingDateFrom && closingDate && closingDate < new Date(filters.closingDateFrom)) return false;
      if (filters.closingDateTo && closingDate && closingDate > new Date(filters.closingDateTo)) return false;
      if ((filters.closingDateFrom || filters.closingDateTo) && !closingDate) return false;
    }
    return true;
  }), [deals, filters, search, searchField]);

  const selectedDeals = useMemo(
    () => filteredDeals.filter((deal) => selected.has(getDealId(deal))),
    [filteredDeals, selected]
  );
  const allFilteredSelected = filteredDeals.length > 0 && filteredDeals.every((deal) => selected.has(getDealId(deal)));

  const toggleAllFiltered = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (allFilteredSelected) {
        filteredDeals.forEach((deal) => next.delete(getDealId(deal)));
      } else {
        filteredDeals.forEach((deal) => {
          const dealId = getDealId(deal);
          if (dealId) next.add(dealId);
        });
      }
      return next;
    });
  };

  const toggleOne = (dealId) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(dealId)) next.delete(dealId);
      else next.add(dealId);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const handleOpenDeal = async (deal) => {
    const dealId = deal?.dealId || deal?.id;
    if (!dealId) return;
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailDeal(null);
    try {
      const data = await dealsAPI.getById(dealId);
      setDetailDeal(data);
    } catch (error) {
      Toast.error(error?.response?.data?.message || "Unable to load deal details");
      setDetailDeal(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStageUpdate = async (dealId, nextStage) => {
    if (!dealId || !STAGE_ORDER.includes(nextStage)) return;
    const currentDeal = deals.find((item) => getDealId(item) === dealId);
    if (currentDeal && normalizeStage(currentDeal) === nextStage) return;
    try {
      await dealsAPI.updateStage(dealId, nextStage);
      setDeals((current) => current.map((deal) => (
        getDealId(deal) === dealId ? { ...deal, stage: nextStage, dealStage: nextStage, status: nextStage } : deal
      )));
      if (detailDeal && getDealId(detailDeal) === dealId) {
        setDetailDeal((current) => current ? { ...current, stage: nextStage, dealStage: nextStage, status: nextStage } : current);
      }
      Toast.success(`Stage updated to ${formatStageLabel(nextStage)}`);
    } catch (error) {
      Toast.error(error?.response?.data?.message || "Unable to update deal stage");
      await loadDeals();
    }
  };

  const handleOpenEdit = async (deal) => {
    const dealId = getDealId(deal);
    if (!dealId) return;
    try {
      const fullDeal = await dealsAPI.getById(dealId);
      setEditForm({
        id: dealId,
        dealName: fullDeal?.dealName || deal?.dealName || "",
        amount: String(fullDeal?.amount ?? deal?.amount ?? ""),
        closingDate: normalizeClosingDate(fullDeal || deal) ? new Date(normalizeClosingDate(fullDeal || deal)) : null,
        stage: normalizeStage(fullDeal || deal),
        type: fullDeal?.type || fullDeal?.dealType || deal?.type || "",
        probability: String(fullDeal?.probability ?? deal?.probability ?? 0),
        nextStep: fullDeal?.nextStep || deal?.nextStep || "",
        leadSource: fullDeal?.leadSource || deal?.leadSource || "",
        campaignSource: fullDeal?.campaignSource || deal?.campaignSource || "",
        description: fullDeal?.description || deal?.description || "",
        reasonForLoss: fullDeal?.reasonForLoss || "",
        connectedTo: fullDeal?.connectedTo || "",
      });
      setEditOpen(true);
    } catch (error) {
      Toast.error(error?.response?.data?.message || "Unable to load deal for editing");
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm?.id) return;
    if (!String(editForm.dealName || "").trim()) {
      Toast.error("Deal name is required");
      return;
    }
    setEditSaving(true);
    try {
      const payload = {
        dealName: editForm.dealName,
        amount: Number(editForm.amount || 0),
        closingDate: editForm.closingDate ? editForm.closingDate.toISOString() : null,
        stage: editForm.stage || "New",
        type: editForm.type || "",
        probability: Number(editForm.probability || 0),
        nextStep: editForm.nextStep || "",
        leadSource: editForm.leadSource || "",
        campaignSource: editForm.campaignSource || "",
        description: editForm.description || "",
        reasonForLoss: editForm.reasonForLoss || "",
        connectedTo: editForm.connectedTo || "",
      };
      await dealsAPI.update(editForm.id, payload);
      Toast.success("Deal updated");
      setEditOpen(false);
      setEditForm(null);
      await loadDeals();
      if (detailOpen && detailDeal && getDealId(detailDeal) === editForm.id) {
        const refreshed = await dealsAPI.getById(editForm.id);
        setDetailDeal(refreshed);
      }
    } catch (error) {
      Toast.error(error?.response?.data?.message || "Unable to update deal");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteDeal = async (deal) => {
    const dealId = getDealId(deal);
    if (!dealId) return;
    const ok = window.confirm("Delete this deal? This cannot be undone.");
    if (!ok) return;
    try {
      await dealsAPI.delete(dealId);
      Toast.success("Deal deleted successfully");
      loadDeals();
    } catch (error) {
      Toast.error(error?.response?.data?.message || "Failed to delete deal");
    }
  };

  const handleExportSelected = () => {
    if (!selectedDeals.length) return;
    const rows = selectedDeals.map((deal) => ({
      "Deal ID": getDealId(deal),
      "Deal Name": getDealTitle(deal),
      Stage: formatStageLabel(normalizeStage(deal)),
      Type: getDealType(deal),
      Probability: deal.probability ?? "",
      "Expected Revenue": Number(deal.expectedRevenue || 0) || 0,
      Account: getAccountName(deal),
      Contact: getContactName(deal),
      Owner: deal.dealOwner || "",
      "Next Step": deal.nextStep || "",
      "Lead Source": deal.leadSource || "",
      "Campaign Source": deal.campaignSource || "",
      "Created Time": getCreatedTime(deal) || "",
      Description: deal.description || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Deals");
    XLSX.writeFile(workbook, "sales-crm-deals.xlsx");
  };

  const handleBulkStageUpdate = async () => {
    const ids = selectedDeals.map((deal) => getDealId(deal)).filter(Boolean);
    if (!ids.length || !bulkStage) return;
    try {
      await Promise.all(ids.map((id) => dealsAPI.updateStage(id, bulkStage)));
      setDeals((current) => current.map((deal) => (
        ids.includes(getDealId(deal)) ? { ...deal, stage: bulkStage, dealStage: bulkStage, status: bulkStage } : deal
      )));
      Toast.success(`Updated stage for ${ids.length} deal${ids.length > 1 ? "s" : ""}`);
      clearSelection();
      await loadDeals();
    } catch (error) {
      Toast.error(error?.response?.data?.message || "Unable to update deal stages");
    }
  };

  const handleBulkDelete = async () => {
    const ids = selectedDeals.map((deal) => getDealId(deal)).filter(Boolean);
    if (!ids.length) return;
    const ok = window.confirm(`Delete ${ids.length} selected deal${ids.length > 1 ? "s" : ""}? This cannot be undone.`);
    if (!ok) return;
    try {
      await Promise.all(ids.map((id) => dealsAPI.delete(id)));
      setDeals((current) => current.filter((deal) => !ids.includes(getDealId(deal))));
      Toast.success(`Deleted ${ids.length} deal${ids.length > 1 ? "s" : ""}`);
      clearSelection();
    } catch (error) {
      Toast.error(error?.response?.data?.message || "Unable to delete selected deals");
      await loadDeals();
    }
  };

  const handleCreateDeal = async () => {
    if (!createForm.dealName) {
      Toast.error("Deal name is required");
      return;
    }
    setCreateSaving(true);
    try {
      await dealsAPI.create({
        dealName: createForm.dealName,
        amount: Number(createForm.amount || 0),
        closingDate: createForm.closingDate ? createForm.closingDate.toISOString() : null,
        stage: createForm.stage || "New",
        type: createForm.type || "",
        probability: Number(createForm.probability || 0),
        nextStep: createForm.nextStep || "",
        leadSource: createForm.leadSource || "",
        campaignSource: createForm.campaignSource || "",
        description: createForm.description || "",
      });
      Toast.success("Deal created");
      setCreateOpen(false);
      setCreateForm({
        dealName: "",
        amount: "",
        closingDate: null,
        stage: "New",
        type: "",
        probability: 10,
        nextStep: "",
        leadSource: "",
        campaignSource: "",
        description: "",
      });
      loadDeals();
    } catch (error) {
      Toast.error(error?.response?.data?.message || "Failed to create deal");
    } finally {
      setCreateSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="toolbar">
        <div className="toolbar-mid">
          <button className={`btn-ghost ${activeFilterCount > 0 ? "btn-ghost--active" : ""}`} onClick={() => setShowFilter(true)}>
            <IFilter s={12} />&ensp;Filter{activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
          <div className="toolbar-divider" />
          <div style={{ display: "flex", border: "1.5px solid var(--cborder)", borderRadius: "8px", overflow: "hidden", background: "var(--cs)", boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)" }}>
            {[{ k: "list", l: "List", I: IRows }, { k: "kanban", l: "Kanban", I: IKanban }].map(({ k, l, I }) => (
              <button key={k} onClick={() => setViewMode(k)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", border: "none", borderRight: k === "list" ? "1px solid var(--cborder)" : "none", background: viewMode === k ? "color-mix(in srgb, var(--ci) 12%, var(--cs))" : "transparent", color: viewMode === k ? "var(--ci)" : "var(--cm)" }}>
                <I s={13} />{l}
              </button>
            ))}
          </div>
          <div className="toolbar-divider" />
          <div className="unified-search">
            <select className="search-field-select" value={searchField} onChange={(event) => setSearchField(event.target.value)}>
              {SEARCH_FIELD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <div className="unified-divider" />
            <div className="search-wrap">
              <span className="search-ico"><ISearch s={14} c="#9ca3af" /></span>
              <input type="text" className="search-inp unified-inp" placeholder={`Search by ${activeSearchFieldLabel.toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
          </div>
          <div className="toolbar-divider" />
          <button className="btn-primary" onClick={() => setCreateOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} />Add Deal
          </button>
        </div>
      </div>

      {viewMode === "list" && selectedDeals.length ? (
        <div className="table-card-shell" style={{ marginBottom: 16 }}>
          <div className="table-card" style={{ padding: "12px 14px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{selectedDeals.length} deal{selectedDeals.length > 1 ? "s" : ""} selected</div>
            <button className="btn-ghost" onClick={handleExportSelected}>Export</button>
            <select value={bulkStage} onChange={(event) => setBulkStage(event.target.value)} style={{ minWidth: 150, padding: "8px 10px", border: "1.5px solid var(--cborder)", borderRadius: 10, background: "var(--cs)", color: "var(--text-main)" }}>
              {STAGE_ORDER.map((stage) => <option key={stage} value={stage}>{formatStageLabel(stage)}</option>)}
            </select>
            <button className="btn-ghost" onClick={handleBulkStageUpdate}>Change stage</button>
            <button className="btn-ghost" onClick={handleBulkDelete} style={{ color: "#dc2626", borderColor: "color-mix(in srgb, #dc2626 18%, var(--cborder))" }}>Delete</button>
            <button className="btn-ghost" onClick={clearSelection}>Clear</button>
          </div>
        </div>
      ) : null}

      {viewMode === "kanban" ? <DealsKanbanBoard deals={filteredDeals} onOpenDeal={handleOpenDeal} onDeleteDeal={handleDeleteDeal} onStageDrop={handleStageUpdate} /> : (
        <div className="table-card-shell sales-deals-table-shell">
          <div className="table-card sales-deals-table-card">
            <div className="table-scroll sales-deals-table-scroll">
              <table className="table sales-deals-table">
                <thead>
                  <tr className="thead-row">
                    <th className="th th-check"><input type="checkbox" className="cb" checked={allFilteredSelected} onChange={toggleAllFiltered} /></th>
                    <th className="th sales-deals-table-head-cell">Deal Name</th>
                    <th className="th sales-deals-table-head-cell">Stage</th>
                    <th className="th sales-deals-table-head-cell">Type</th>
                    <th className="th sales-deals-table-head-cell">Probability</th>
                    <th className="th sales-deals-table-head-cell">Expected Revenue</th>
                    <th className="th sales-deals-table-head-cell">Account</th>
                    <th className="th sales-deals-table-head-cell">Contact</th>
                    <th className="th sales-deals-table-head-cell">Owner</th>
                    <th className="th sales-deals-table-head-cell th-wrap-limit">Next Step</th>
                    <th className="th sales-deals-table-head-cell">Lead Source</th>
                    <th className="th sales-deals-table-head-cell">Campaign Source</th>
                    <th className="th sales-deals-table-head-cell">Created Time</th>
                    <th className="th sales-deals-table-head-cell th-wrap-limit">Description</th>
                    <th className="th th-actions sales-deals-table-head-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <tr><td className="td" colSpan={17}><span className="cell-txt">Loading deals...</span></td></tr> : null}
                  {!loading && !deals.length ? <tr><td className="td" colSpan={17}><span className="cell-txt">No deals available yet. Convert a lead to see it here.</span></td></tr> : null}
                  {!loading && filteredDeals.map((deal) => {
                    const dealStage = normalizeStage(deal);
                    const dealStageMeta = STAGE_META[dealStage] || { color: "#475569", bg: "#e2e8f0" };
                    const dealInitials = getInitials(getDealTitle(deal));
                    const dealId = getDealId(deal);
                    return (
                    <tr key={dealId || `${getDealTitle(deal)}-${normalizeClosingDate(deal) || "none"}`} className="row sales-deals-table-row">
                      <td className="td td-check"><input type="checkbox" className="cb" checked={selected.has(dealId)} onChange={() => toggleOne(dealId)} /></td>
                      <td className="td td-name">
                        <div className="name-cell sales-deals-name-cell">
                          <div className="avatar sales-deals-avatar" style={{ background: dealStageMeta.color }}>{dealInitials}</div>
                          <div className="name-block sales-deals-name-block">
                            <button
                              type="button"
                              onClick={() => handleOpenDeal(deal)}
                              className="name-link sales-deals-name-link"
                              style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
                            >
                              {getDealTitle(deal)}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeal(deal)}
                              className="name-link sales-deals-name-link"
                              style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", marginTop: 4 }}
                              title={`Open ${getDealTitle(deal)} details`}
                              aria-label={`Open ${getDealTitle(deal)} details`}
                            >
                              <span className="sales-leads-name-link__meta">View</span>
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="td td-status">
                        <select
                          value={dealStage}
                          onChange={(event) => handleStageUpdate(dealId, event.target.value)}
                          style={getStageSelectStyle(dealStage)}
                        >
                          {STAGE_ORDER.map((stage) => <option key={stage} value={stage}>{formatStageLabel(stage)}</option>)}
                        </select>
                      </td>
                      <td className="td"><span className="cell-txt">{getDealType(deal)}</span></td>
                      <td className="td"><span className="cell-txt">{deal.probability ?? "-"}</span></td>
                      <td className="td"><span className="cell-txt">{fmtCurrency(deal.expectedRevenue || 0)}</span></td>
                      <td className="td"><span className="cell-txt">{getAccountName(deal)}</span></td>
                      <td className="td"><span className="cell-txt">{getContactName(deal)}</span></td>
                      <td className="td"><span className="cell-txt">{deal.dealOwner || "-"}</span></td>
                      <td className="td td-wrap-limit"><span className="cell-txt">{deal.nextStep || "-"}</span></td>
                      <td className="td"><span className="cell-txt">{deal.leadSource || "-"}</span></td>
                      <td className="td"><span className="cell-txt">{deal.campaignSource || "-"}</span></td>
                      <td className="td"><span className="date-txt">{fmtDateTime(getCreatedTime(deal))}</span></td>
                      <td className="td td-wrap-limit"><span className="cell-txt">{deal.description || "-"}</span></td>
                      <td className="td td-actions">
                        <button
                          type="button"
                          aria-label="Edit deal"
                          onClick={() => handleOpenEdit(deal)}
                          className="act-btn act-btn--edit"
                          style={{ border: "none", background: "transparent", color: "#2563eb", cursor: "pointer", marginRight: 8 }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete deal"
                          onClick={() => handleDeleteDeal(deal)}
                          className="act-btn act-btn--edit sales-deals-delete-button"
                          style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {detailOpen ? <DealDetailsModal deal={detailDeal} loading={detailLoading} onClose={() => setDetailOpen(false)} /> : null}

      {editOpen && editForm ? (
        <div className="overlay" onClick={() => setEditOpen(false)}>
          <div className="modal" style={{ width: 680, maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={(event) => event.stopPropagation()}>
            <div className="modal-hdr">
              <div>
                <div className="modal-title">Edit Deal</div>
              </div>
              <button className="icon-btn modal-close" onClick={() => setEditOpen(false)}><IX s={15} /></button>
            </div>
            <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px", overflowY: "auto" }}>
              {[
                { key: "dealName", label: "Deal Name *" },
                { key: "amount", label: "Amount", type: "number" },
                { key: "type", label: "Type" },
                { key: "probability", label: "Probability", type: "number" },
                { key: "nextStep", label: "Next Step", span: 2 },
                { key: "leadSource", label: "Lead Source" },
                { key: "campaignSource", label: "Campaign Source" },
                { key: "connectedTo", label: "Connected To" },
                { key: "reasonForLoss", label: "Reason For Loss" },
              ].map((field) => (
                <div key={field.key} style={{ gridColumn: field.span === 2 ? "1 / -1" : "auto" }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{field.label}</label>
                  <input
                    type={field.type || "text"}
                    value={editForm[field.key]}
                    onChange={(event) => setEditForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Stage</label>
                <select value={editForm.stage} onChange={(event) => setEditForm((current) => ({ ...current, stage: event.target.value }))} style={{ ...getStageSelectStyle(editForm.stage), width: "100%" }}>
                  {STAGE_ORDER.map((stage) => <option key={stage} value={stage}>{formatStageLabel(stage)}</option>)}
                </select>
              </div>
              <div style={{ minWidth: 0 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Closing Date</label>
                <DatePicker
                  selected={editForm.closingDate}
                  onChange={(date) => setEditForm((current) => ({ ...current, closingDate: date }))}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="MMM d, yyyy h:mm aa"
                  className="deal-datepicker"
                  wrapperClassName="deal-datepicker-wrapper"
                  customInput={<input style={{ width: "100%", minWidth: 0, padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none" }} />}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Description</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none", resize: "vertical" }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setEditOpen(false)} disabled={editSaving}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveEdit} disabled={editSaving}>{editSaving ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <div className="overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal" style={{ width: 620, maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={(event) => event.stopPropagation()}>
            <div className="modal-hdr">
              <div>
                <div className="modal-title">Add Deal</div>
                <div className="modal-sub">Create a new deal using the API fields</div>
              </div>
              <button className="icon-btn modal-close" onClick={() => setCreateOpen(false)}><IX s={15} /></button>
            </div>
            <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px", overflowY: "auto" }}>
              {[
                { key: "dealName", label: "Deal Name *", span: 2 },
                { key: "amount", label: "Amount", type: "number" },
                { key: "type", label: "Type" },
                { key: "probability", label: "Probability", type: "number" },
                { key: "nextStep", label: "Next Step", span: 2 },
                { key: "leadSource", label: "Lead Source" },
                { key: "campaignSource", label: "Campaign Source" },
              ].map((field) => (
                <div key={field.key} style={{ gridColumn: field.span === 2 ? "1 / -1" : "auto" }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{field.label}</label>
                  <input
                    type={field.type || "text"}
                    value={createForm[field.key]}
                    onChange={(event) => setCreateForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Stage</label>
                <select
                  value={createForm.stage}
                  onChange={(event) => setCreateForm((current) => ({ ...current, stage: event.target.value }))}
                  style={{ ...getStageSelectStyle(createForm.stage), width: "100%" }}
                >
                  {STAGE_ORDER.map((stage) => <option key={stage} value={stage}>{formatStageLabel(stage)}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(1, minmax(0, 1fr))", gap: 14, alignItems: "start" }}>
                <div style={{ minWidth: 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Closing Date</label>
                  <DatePicker
                    selected={createForm.closingDate}
                    onChange={(date) => setCreateForm((current) => ({ ...current, closingDate: date }))}
                    showTimeSelect
                    timeIntervals={15}
                    dateFormat="MMM d, yyyy h:mm aa"
                    className="deal-datepicker"
                    wrapperClassName="deal-datepicker-wrapper"
                    customInput={<input style={{ width: "100%", minWidth: 0, padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none" }} />}
                  />
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Description</label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(event) => setCreateForm((current) => ({ ...current, description: event.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none", resize: "vertical" }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setCreateOpen(false)} disabled={createSaving}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateDeal} disabled={createSaving}>{createSaving ? "Saving..." : "Create Deal"}</button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        .deal-datepicker-wrapper,
        .deal-datepicker-wrapper .react-datepicker-wrapper,
        .deal-datepicker-wrapper .react-datepicker__input-container {
          display: block;
          width: 100%;
        }
      `}</style>

      {showFilter && (
        <DealFilterModal
          filters={filters}
          onApply={setFilters}
          onClose={() => setShowFilter(false)}
          activeFilterCount={activeFilterCount}
        />
      )}
    </div>
  );
}
