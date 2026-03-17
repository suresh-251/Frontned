import "../styles/Leads.css";
import "react-datepicker/dist/react-datepicker.css";
import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import { Plus, Trash2 } from "lucide-react";
import dealsAPI from "../api/deals.api";
import Toast from "../utils/toast";
import { IFilter, IKanban, IRows, ISearch, IX } from "./leads/shared";

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
  New: { color: "#0f766e", bg: "#ccfbf1" },
  Prospect: { color: "#2563eb", bg: "#dbeafe" },
  Qualification: { color: "#7c3aed", bg: "#ede9fe" },
  Qualified: { color: "#0891b2", bg: "#cffafe" },
  Proposal: { color: "#d97706", bg: "#fef3c7" },
  ProposalSent: { color: "#ea580c", bg: "#ffedd5" },
  Negotiation: { color: "#c2410c", bg: "#fed7aa" },
  ClosedWon: { color: "#15803d", bg: "#dcfce7" },
  ClosedLost: { color: "#dc2626", bg: "#fee2e2" },
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

const normalizeStage = (deal) => deal?.stage || deal?.dealStage || deal?.status || "New";
const normalizeAmount = (deal) => Number(deal?.amount ?? deal?.dealValue ?? deal?.value ?? 0) || 0;
const normalizeClosingDate = (deal) => deal?.closingDate || deal?.expectedCloseDate || deal?.closeDate || null;
const getDealTitle = (deal) => deal?.dealName || deal?.title || deal?.subject || deal?.name || `Deal #${deal?.dealId ?? deal?.id ?? ""}`;
const formatStageLabel = (value = "") => String(value).replace(/([a-z])([A-Z])/g, "$1 $2").trim();

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

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", background: "white", cursor: "pointer" };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-hdr">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IFilter s={16} c="#4f46e5" />
            <span style={{ fontSize: "15px", fontWeight: 600, color: "#111827" }}>Filter Deals</span>
            {activeFilterCount > 0 && <span style={{ background: "#4f46e5", color: "white", fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "12px" }}>{activeFilterCount}</span>}
          </div>
          <button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button>
        </div>
        <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Stage</label>
            <select value={localFilters.stage} onChange={(event) => updateFilter("stage", event.target.value)} style={inputStyle}>
              <option value="All">All Stages</option>
              {STAGE_ORDER.map((stage) => <option key={stage} value={stage}>{formatStageLabel(stage)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Priority</label>
            <select value={localFilters.priority} onChange={(event) => updateFilter("priority", event.target.value)} style={inputStyle}>
              <option value="All">All Priorities</option>
              {["Low", "Medium", "High"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Owner</label>
            <input type="text" value={localFilters.owner} onChange={(event) => updateFilter("owner", event.target.value)} placeholder="Owner name" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Lead Source</label>
            <input type="text" value={localFilters.leadSource} onChange={(event) => updateFilter("leadSource", event.target.value)} placeholder="Lead source" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Campaign Source</label>
            <input type="text" value={localFilters.campaignSource} onChange={(event) => updateFilter("campaignSource", event.target.value)} placeholder="Campaign source" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Min Amount</label>
              <input type="number" value={localFilters.minAmount} onChange={(event) => updateFilter("minAmount", event.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Max Amount</label>
              <input type="number" value={localFilters.maxAmount} onChange={(event) => updateFilter("maxAmount", event.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Min Expected Revenue</label>
              <input type="number" value={localFilters.minExpectedRevenue} onChange={(event) => updateFilter("minExpectedRevenue", event.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Max Expected Revenue</label>
              <input type="number" value={localFilters.maxExpectedRevenue} onChange={(event) => updateFilter("maxExpectedRevenue", event.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Closing Date From</label>
              <DatePicker
                selected={localFilters.closingDateFrom ? new Date(localFilters.closingDateFrom) : null}
                onChange={(date) => updateFilter("closingDateFrom", date ? date.toISOString() : "")}
                dateFormat="MMM d, yyyy"
                className="deal-datepicker"
                customInput={<input style={inputStyle} />}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Closing Date To</label>
              <DatePicker
                selected={localFilters.closingDateTo ? new Date(localFilters.closingDateTo) : null}
                onChange={(date) => updateFilter("closingDateTo", date ? date.toISOString() : "")}
                dateFormat="MMM d, yyyy"
                className="deal-datepicker"
                customInput={<input style={inputStyle} />}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
          <button className="btn-ghost" onClick={handleClear}>Clear</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleApply}>Apply {activeFilterCount > 0 && `(${activeFilterCount})`}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DealsKanban({ deals, onOpenDeal, onDeleteDeal }) {
  const grouped = useMemo(() => STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = deals.filter((deal) => normalizeStage(deal) === stage);
    return acc;
  }, {}), [deals]);

  return (
    <>
      <div className="kanban-toolbar">
        <div className="kanban-toolbar__title-wrap">
          <div className="kanban-toolbar__eyebrow">KANBAN VIEW</div>
          <div className="kanban-toolbar__title-row">
            <div className="kanban-toolbar__label">Deal stages</div>
            <div className="kanban-toolbar__hint">See every stage with its deal count and total annual revenue.</div>
          </div>
        </div>
      </div>
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
                  <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "#334155" }}>{fmtCurrency(totalAmount)}</div>
                </div>
                <span className="kanban-column__count">{items.length}</span>
              </div>
              <div className="kanban-column__list">
                {!items.length ? (
                  <div className="kanban-card" style={{ borderStyle: "dashed", color: "#94a3b8" }}>
                    No deals in this stage
                  </div>
                ) : items.map((deal) => (
                  <div key={deal.dealId || `${getDealTitle(deal)}-${normalizeClosingDate(deal) || "none"}`} className="kanban-card" style={{ position: "relative", paddingRight: 36 }}>
                    <button
                      type="button"
                      aria-label="Delete deal"
                      onClick={(event) => { event.stopPropagation(); onDeleteDeal(deal); }}
                      style={{ position: "absolute", top: 8, right: 8, border: "none", background: "#ffffff", color: "#ef4444", cursor: "pointer", padding: 2, borderRadius: 6, boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)" }}
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
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {getDealTitle(deal)}
                          </div>
                        </button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(79,70,229,0.12)", color: "#4f46e5" }}>
                          {formatStageLabel(stage)}
                        </span>
                        {deal.priority ? <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "#f1f5f9", color: "#475569" }}>{deal.priority}</span> : null}
                      </div>

                      <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontSize: 12.5, color: "#475569" }}><span style={{ color: "#94a3b8" }}>Account</span> · {deal.accountName || "-"}</div>
                        <div style={{ fontSize: 12.5, color: "#475569" }}><span style={{ color: "#94a3b8" }}>Contact</span> · {deal.contactName || "-"}</div>
                        <div style={{ fontSize: 12.5, color: "#475569" }}><span style={{ color: "#94a3b8" }}>Owner</span> · {deal.dealOwner || "-"}</div>
                      </div>

                      <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontSize: 12.5, color: "#475569" }}><span style={{ color: "#94a3b8" }}>Next Step</span> · {deal.nextStep || "-"}</div>
                        <div style={{ fontSize: 12.5, color: "#475569" }}><span style={{ color: "#94a3b8" }}>Next Activity</span> · {deal.nextActivity || "-"}</div>
                      </div>

                      <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                          Amount: <strong style={{ color: "#0f172a" }}>{fmtCurrency(normalizeAmount(deal))}</strong>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                          Expected: <strong style={{ color: "#0f172a" }}>{fmtCurrency(deal.expectedRevenue || 0)}</strong>
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
  const [createOpen, setCreateOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm, setCreateForm] = useState({
    dealName: "",
    amount: "",
    currency: "USD",
    closingDate: null,
    stage: "New",
    probability: 10,
    dealType: "New Business",
    priority: "Medium",
    nextStep: "",
    nextActivityDate: null,
    leadSource: "",
    campaignSource: "",
    tags: "",
    description: "",
  });

  const loadDeals = async () => {
    setLoading(true);
    try {
      const data = await dealsAPI.getAll();
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
  }, []);

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
          deal.accountName,
          deal.contactName,
          deal.dealOwner,
          deal.stage,
          deal.nextStep,
          deal.nextActivity,
          deal.leadSource,
          deal.campaignSource,
          deal.tags,
        ].join(" ")),
        dealName: normalizeFilterText(deal.dealName),
        accountName: normalizeFilterText(deal.accountName),
        contactName: normalizeFilterText(deal.contactName),
        dealOwner: normalizeFilterText(deal.dealOwner),
        stage: normalizeFilterText(deal.stage),
        nextStep: normalizeFilterText(deal.nextStep),
        nextActivity: normalizeFilterText(deal.nextActivity),
        leadSource: normalizeFilterText(deal.leadSource),
        campaignSource: normalizeFilterText(deal.campaignSource),
        tags: normalizeFilterText(deal.tags),
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

  const handleDeleteDeal = async (deal) => {
    const dealId = deal?.dealId || deal?.id;
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
        currency: createForm.currency || "USD",
        closingDate: createForm.closingDate ? createForm.closingDate.toISOString() : null,
        stage: createForm.stage || "New",
        probability: Number(createForm.probability || 0),
        dealType: createForm.dealType || "New Business",
        priority: createForm.priority || "Medium",
        nextStep: createForm.nextStep || "",
        nextActivityDate: createForm.nextActivityDate ? createForm.nextActivityDate.toISOString() : null,
        leadSource: createForm.leadSource || "",
        campaignSource: createForm.campaignSource || "",
        tags: createForm.tags || "",
        description: createForm.description || "",
      });
      Toast.success("Deal created");
      setCreateOpen(false);
      setCreateForm({
        dealName: "",
        amount: "",
        currency: "USD",
        closingDate: null,
        stage: "New",
        probability: 10,
        dealType: "New Business",
        priority: "Medium",
        nextStep: "",
        nextActivityDate: null,
        leadSource: "",
        campaignSource: "",
        tags: "",
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
      <div className="stat-grid">
        <div className="stat-card" style={{ "--sc-card": "#f6fbf7", "--sc-icon": "#e6f6ea", "--sc-ink": "#2e7d32" }}>
          <div className="stat-header"><span className="stat-label">Total Deals</span></div>
          <div className="stat-body"><div className="stat-value-row"><div className="stat-value">{deals.length}</div></div></div>
        </div>
        <div className="stat-card" style={{ "--sc-card": "#f6f9fe", "--sc-icon": "#e3efff", "--sc-ink": "#1565c0" }}>
          <div className="stat-header"><span className="stat-label">Annual Revenue</span></div>
          <div className="stat-body"><div className="stat-value-row"><div className="stat-value" style={{ fontSize: 28 }}>{fmtCurrency(totalValue)}</div></div></div>
        </div>
        <div className="stat-card" style={{ "--sc-card": "#fffdf7", "--sc-icon": "#fff6dc", "--sc-ink": "#e65100" }}>
          <div className="stat-header"><span className="stat-label">Open Pipeline</span></div>
          <div className="stat-body"><div className="stat-value-row"><div className="stat-value">{deals.filter((deal) => !["ClosedWon", "ClosedLost"].includes(normalizeStage(deal))).length}</div></div></div>
        </div>
        <div className="stat-card" style={{ "--sc-card": "#fff6fa", "--sc-icon": "#ffe4ef", "--sc-ink": "#880e4f" }}>
          <div className="stat-header"><span className="stat-label">Closed Won</span></div>
          <div className="stat-body"><div className="stat-value-row"><div className="stat-value">{convertedCount}</div></div></div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-mid">
          <button className={`btn-ghost ${activeFilterCount > 0 ? "btn-ghost--active" : ""}`} onClick={() => setShowFilter(true)}>
            <IFilter s={12} />&ensp;Filter{activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
          <div className="toolbar-divider" />
          <div style={{ display: "flex", border: "1.5px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", background: "white" }}>
            {[{ k: "list", l: "List", I: IRows }, { k: "kanban", l: "Kanban", I: IKanban }].map(({ k, l, I }) => (
              <button key={k} onClick={() => setViewMode(k)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", border: "none", borderRight: k === "list" ? "1px solid #e5e7eb" : "none", background: viewMode === k ? "#eef2ff" : "transparent", color: viewMode === k ? "#4f46e5" : "#6b7280" }}>
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

      {viewMode === "kanban" ? <DealsKanban deals={filteredDeals} onOpenDeal={handleOpenDeal} onDeleteDeal={handleDeleteDeal} /> : (
        <div className="table-card-shell">
          <div className="table-card">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr className="thead-row">
                    <th className="th">Deal ID</th>
                    <th className="th">Deal Name</th>
                    <th className="th">Stage</th>
                    <th className="th">Amount</th>
                    <th className="th">Probability</th>
                    <th className="th">Expected Revenue</th>
                    <th className="th">Account</th>
                    <th className="th">Contact</th>
                    <th className="th">Owner</th>
                    <th className="th">Next Step</th>
                    <th className="th">Next Activity</th>
                    <th className="th">Lead Source</th>
                    <th className="th">Campaign Source</th>
                    <th className="th">Priority</th>
                    <th className="th">Tags</th>
                    <th className="th">Closing Date</th>
                    <th className="th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <tr><td className="td" colSpan={17}><span className="cell-txt">Loading deals...</span></td></tr> : null}
                  {!loading && !deals.length ? <tr><td className="td" colSpan={17}><span className="cell-txt">No deals available yet. Convert a lead to see it here.</span></td></tr> : null}
                  {!loading && filteredDeals.map((deal) => (
                    <tr key={deal.dealId || `${getDealTitle(deal)}-${normalizeClosingDate(deal) || "none"}`} className="row">
                      <td className="td"><span className="cell-txt">{deal.dealId ?? "-"}</span></td>
                      <td className="td">
                        <button
                          type="button"
                          onClick={() => handleOpenDeal(deal)}
                          className="cell-txt"
                          style={{ fontWeight: 800, border: "none", background: "transparent", padding: 0, color: "#111827", cursor: "pointer" }}
                        >
                          {getDealTitle(deal)}
                        </button>
                      </td>
                      <td className="td"><span className="cell-txt">{formatStageLabel(normalizeStage(deal))}</span></td>
                      <td className="td"><span className="cell-txt">{fmtCurrency(normalizeAmount(deal))}</span></td>
                      <td className="td"><span className="cell-txt">{deal.probability ?? "-"}</span></td>
                      <td className="td"><span className="cell-txt">{fmtCurrency(deal.expectedRevenue || 0)}</span></td>
                      <td className="td"><span className="cell-txt">{deal.accountName || "-"}</span></td>
                      <td className="td"><span className="cell-txt">{deal.contactName || "-"}</span></td>
                      <td className="td"><span className="cell-txt">{deal.dealOwner || "-"}</span></td>
                      <td className="td"><span className="cell-txt">{deal.nextStep || "-"}</span></td>
                      <td className="td"><span className="cell-txt">{deal.nextActivity || "-"}</span></td>
                      <td className="td"><span className="cell-txt">{deal.leadSource || "-"}</span></td>
                      <td className="td"><span className="cell-txt">{deal.campaignSource || "-"}</span></td>
                      <td className="td"><span className="cell-txt">{deal.priority || "-"}</span></td>
                      <td className="td"><span className="cell-txt">{deal.tags || "-"}</span></td>
                      <td className="td"><span className="date-txt">{fmtDate(normalizeClosingDate(deal))}</span></td>
                      <td className="td">
                        <button
                          type="button"
                          aria-label="Delete deal"
                          onClick={() => handleDeleteDeal(deal)}
                          style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {detailOpen ? (
        <div className="overlay" onClick={() => setDetailOpen(false)}>
          <div className="modal" style={{ width: 760, maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={(event) => event.stopPropagation()}>
            <div className="modal-hdr">
              <div>
                <div className="modal-title">Deal Details</div>
                <div className="modal-sub">{detailDeal?.dealName || "Loading deal..."}</div>
              </div>
              <button className="icon-btn modal-close" onClick={() => setDetailOpen(false)}><IX s={15} /></button>
            </div>
            <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gap: "16px", overflowY: "auto" }}>
              {detailLoading ? (
                <div style={{ fontSize: 13, color: "#64748b" }}>Loading deal details...</div>
              ) : detailDeal ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "#f8fafc" }}>
                    {[
                      { label: "Deal Name", value: detailDeal.dealName },
                      { label: "Stage", value: detailDeal.stage },
                      { label: "Owner", value: detailDeal.dealOwner },
                      { label: "Priority", value: detailDeal.priority },
                      { label: "Deal Type", value: detailDeal.dealType },
                      { label: "Probability", value: detailDeal.probability },
                      { label: "Amount", value: fmtCurrency(detailDeal.amount) },
                      { label: "Expected Revenue", value: fmtCurrency(detailDeal.expectedRevenue) },
                    ].map((item) => (
                      <div key={item.label} style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>{item.label}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{item.value ?? "-"}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "#ffffff" }}>
                    {[
                      { label: "Account", value: detailDeal.account?.accountName },
                      { label: "Contact", value: detailDeal.contact?.contactName },
                      { label: "Contact Email", value: detailDeal.contact?.email },
                      { label: "Contact Phone", value: detailDeal.contact?.phone },
                    ].map((item) => (
                      <div key={item.label} style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>{item.label}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{item.value ?? "-"}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "#ffffff" }}>
                    {[
                      { label: "Closing Date", value: fmtDate(detailDeal.closingDate) },
                      { label: "Next Activity", value: detailDeal?.activitySummary?.nextActivity },
                      { label: "Next Step", value: detailDeal.nextStep },
                      { label: "Currency", value: detailDeal.currency },
                    ].map((item) => (
                      <div key={item.label} style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>{item.label}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{item.value ?? "-"}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "#ffffff" }}>
                    {[
                      { label: "Lead Source", value: detailDeal.leadSource },
                      { label: "Campaign Source", value: detailDeal.campaignSource },
                      { label: "Tags", value: detailDeal.tags },
                      { label: "Description", value: detailDeal.description },
                    ].map((item) => (
                      <div key={item.label} style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>{item.label}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{item.value ?? "-"}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: "#ef4444" }}>Unable to load deal details.</div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setDetailOpen(false)}>Close</button>
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
            <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", overflowY: "auto" }}>
              {[
                { key: "dealName", label: "Deal Name *", span: 2 },
                { key: "amount", label: "Amount", type: "number" },
                { key: "currency", label: "Currency" },
                { key: "stage", label: "Stage" },
                { key: "probability", label: "Probability", type: "number" },
                { key: "dealType", label: "Deal Type" },
                { key: "priority", label: "Priority" },
                { key: "nextStep", label: "Next Step", span: 2 },
                { key: "leadSource", label: "Lead Source" },
                { key: "campaignSource", label: "Campaign Source" },
                { key: "tags", label: "Tags", span: 2 },
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
              <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Closing Date</label>
                  <DatePicker
                    selected={createForm.closingDate}
                    onChange={(date) => setCreateForm((current) => ({ ...current, closingDate: date }))}
                    showTimeSelect
                    timeIntervals={15}
                    dateFormat="MMM d, yyyy h:mm aa"
                    className="deal-datepicker"
                    customInput={<input style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none" }} />}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Next Activity Date</label>
                  <DatePicker
                    selected={createForm.nextActivityDate}
                    onChange={(date) => setCreateForm((current) => ({ ...current, nextActivityDate: date }))}
                    showTimeSelect
                    timeIntervals={15}
                    dateFormat="MMM d, yyyy h:mm aa"
                    className="deal-datepicker"
                    customInput={<input style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none" }} />}
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
