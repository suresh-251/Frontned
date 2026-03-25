import "../styles/Leads.css";
import "react-datepicker/dist/react-datepicker.css";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { Pencil, Plus, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import dealsAPI from "../api/deals.api";
import DealDetailsModal from "../components/DealDetailsModal.jsx";
import DealFilterModal from "./deals/DealFilterModal";
import { DealsKanban, DealsKanbanBoard } from "./deals/DealsKanbanViews";
import {
  DEFAULT_DEAL_FILTERS,
  fmtCurrency,
  fmtDate,
  fmtDateTime,
  formatStageLabel,
  GET_ALL_DEALS_CLOSING_DATE,
  getAccountName,
  getContactName,
  getCreatedTime,
  getDealId,
  getDealTitle,
  getDealType,
  normalizeAmount,
  normalizeClosingDate,
  normalizeFilterText,
  normalizeStage,
  SEARCH_FIELD_OPTIONS,
  STAGE_META,
  STAGE_ORDER,
} from "./deals/shared";
import Toast from "../utils/toast";
import { IChevR, IFilter, IKanban, IRows, ISearch, ISettings, IUpload, IX } from "./leads/shared";
import { getInitials, parseCSV } from "./leads/utils";

const VISIBLE_DEAL_COLUMNS_STORAGE_KEY = "crm_visible_deal_columns";
const DEAL_TABLE_COLUMNS = [
  { key: "dealName", label: "Deal Name", always: true },
  { key: "stage", label: "Stage", always: true },
  { key: "type", label: "Type" },
  { key: "probability", label: "Probability" },
  { key: "expectedRevenue", label: "Expected Revenue" },
  { key: "account", label: "Account" },
  { key: "contact", label: "Contact" },
  { key: "owner", label: "Owner" },
  { key: "nextStep", label: "Next Step" },
  { key: "leadSource", label: "Lead Source" },
  { key: "campaignSource", label: "Campaign Source" },
  { key: "closingDate", label: "Closing Date" },
  { key: "createdTime", label: "Created Time" },
  { key: "description", label: "Description" },
];
const EMPTY_DEAL_FORM = {
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
};

const guessDealImportField = (header = "") => {
  const normalized = String(header).toLowerCase().trim();
  if (!normalized) return "";
  if (normalized.includes("deal") && normalized.includes("name")) return "dealName";
  if (normalized === "name" || normalized.includes("title")) return "dealName";
  if (normalized.includes("amount") || normalized.includes("value")) return "amount";
  if (normalized.includes("closing")) return "closingDate";
  if (normalized.includes("close date")) return "closingDate";
  if (normalized.includes("stage") || normalized.includes("status")) return "stage";
  if (normalized.includes("type")) return "type";
  if (normalized.includes("probability")) return "probability";
  if (normalized.includes("next step")) return "nextStep";
  if (normalized.includes("lead source")) return "leadSource";
  if (normalized.includes("campaign source") || normalized.includes("campaign")) return "campaignSource";
  if (normalized.includes("description") || normalized.includes("notes")) return "description";
  return "";
};

const normalizeImportedStage = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  const match = STAGE_ORDER.find((stage) => stage.toLowerCase() === normalized);
  return match || "New";
};

const parseImportedDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

function StageCell({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 260 });
  const meta = STAGE_META[value] || { color: "#475569", bg: "#e2e8f0" };

  const getMenuPos = (rect) => {
    const preferredHeight = 260;
    const gap = 8;
    const viewportPadding = 12;
    const minWidth = Math.max(132, rect.width);
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
    <div className="status-cell" ref={ref} style={{ "--sales-stage-color": meta.color, "--sales-stage-bg": meta.bg }}>
      <button className="status-pill sales-deals-stage-trigger" style={{ color: meta.color }} onClick={() => setOpen((current) => !current)}>
        <span className="status-pill-label">{formatStageLabel(value)}</span>
        <span className="status-pill-caret">
          <svg width="10" height="10" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M6 8L10 12L14 8" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && createPortal(
        <div className="status-menu" ref={menuRef} style={{ position: "fixed", top: menuPos.top, left: menuPos.left, minWidth: menuPos.width, maxHeight: menuPos.maxHeight, overflowY: "auto", zIndex: 5000, display: "grid", gap: 2, background: "var(--bg-card)", border: "1.5px solid var(--border-color)", borderRadius: 12, boxShadow: "0 18px 30px rgba(15, 23, 42, 0.14)", padding: 4, overscrollBehavior: "contain" }}>
          {STAGE_ORDER.map((stage) => {
            const optionMeta = STAGE_META[stage] || meta;
            return (
              <button key={stage} className={`status-opt ${value === stage ? "status-opt--on" : ""}`} onClick={() => { onChange(stage); setOpen(false); }}>
                <span style={{ color: optionMeta.color }}>{formatStageLabel(stage)}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

function DealManageColumnsPanel({ visibleCols, setVisibleCols, rowsPerPage, setRowsPerPage, wrapText, setWrapText, onClose }) {
  const toggleColumn = (key, always) => {
    if (always) return;
    setVisibleCols((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 420 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-hdr">
          <div>
            <div className="modal-title">Manage Columns</div>
            <div className="modal-sub">Choose what appears in the deals table</div>
          </div>
          <button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button>
        </div>
        <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gap: 10 }}>
            {DEAL_TABLE_COLUMNS.map((column) => (
              <label key={column.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#374151" }}>
                <input type="checkbox" checked={column.always || visibleCols.includes(column.key)} disabled={column.always} onChange={() => toggleColumn(column.key, column.always)} />
                {column.label}
              </label>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Rows Per Page</label>
              <select value={rowsPerPage} onChange={(event) => setRowsPerPage(Number(event.target.value))} style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, background: "white" }}>
                {[10, 20, 30, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", marginTop: 24 }}>
              <input type="checkbox" checked={wrapText} onChange={(event) => setWrapText(event.target.checked)} />
              Wrap table text
            </label>
          </div>
        </div>
        <div className="modal-footer"><button className="btn-primary" onClick={onClose}>Done</button></div>
      </div>
    </div>
  );
}

function DealImportModal({ onClose, onImport }) {
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError("");
    try {
      setImporting(true);
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      const dataRows = rows.filter((row) => Object.values(row || {}).some(Boolean));
      const imported = dataRows.map((row) => {
        const mapped = { ...EMPTY_DEAL_FORM };
        headers.forEach((header) => {
          const field = guessDealImportField(header);
          if (!field) return;
          mapped[field] = row[header] || "";
        });
        return {
          ...mapped,
          stage: normalizeImportedStage(mapped.stage),
          probability: Number(mapped.probability || 0) || 0,
          amount: Number(mapped.amount || 0) || 0,
          closingDate: parseImportedDate(mapped.closingDate),
        };
      }).filter((item) => String(item.dealName || "").trim());

      if (!imported.length) {
        throw new Error("No valid deals found in the CSV.");
      }

      await onImport(imported);
      onClose();
    } catch (importError) {
      setError(importError.message || "Failed to import file");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-hdr">
          <div>
            <div className="modal-title">Import Deals</div>
            <div className="modal-sub">Upload a CSV file to add deals in bulk</div>
          </div>
          <button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button>
        </div>
        <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 10, padding: 18, border: "1.5px dashed #cbd5e1", borderRadius: 12, background: "#f8fafc", cursor: "pointer", textAlign: "center" }}>
            <IUpload s={16} c="#4f46e5" />
            <span>{fileName || "Choose CSV file"}</span>
            <span className="drop-hint">deal name, amount, closing date, stage, type, probability, next step, lead source, campaign source</span>
            <input type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }} disabled={importing} />
          </label>
          {importing && <div style={{ fontSize: 12, color: "#475569" }}>Importing deals...</div>}
          {error && <div style={{ fontSize: 12, color: "#dc2626" }}>{error}</div>}
        </div>
        <div className="modal-footer"><button className="btn-ghost" onClick={onClose} disabled={importing}>Cancel</button></div>
      </div>
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
  const [showImport, setShowImport] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkStage, setBulkStage] = useState("New");
  const [showBulkStagePicker, setShowBulkStagePicker] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_DEAL_FORM);
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const raw = localStorage.getItem(VISIBLE_DEAL_COLUMNS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const allowed = new Set(DEAL_TABLE_COLUMNS.map((column) => column.key));
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.filter((key) => allowed.has(key));
      }
    } catch {
      return DEAL_TABLE_COLUMNS.filter((column) => !column.always || column.key).map((column) => column.key);
    }
    return DEAL_TABLE_COLUMNS.map((column) => column.key);
  });
  const [rowsPerPage, setRowsPerPage] = useState(30);
  const [page, setPage] = useState(1);
  const [wrapText, setWrapText] = useState(false);
  const [showColPanel, setShowColPanel] = useState(false);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dealsAPI.getAll({
        source: filters.leadSource || undefined,
        owner: filters.owner || undefined,
        dateRangeFrom: filters.closingDateFrom || undefined,
        dateRangeTo: filters.closingDateTo || undefined,
        closingDate: GET_ALL_DEALS_CLOSING_DATE,
      });
      setDeals(Array.isArray(data) ? data : []);
    } catch (error) {
      Toast.error(error?.response?.data?.message || "Unable to load deals");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [filters.closingDateFrom, filters.closingDateTo, filters.leadSource, filters.owner]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  useEffect(() => {
    setSelected((current) => {
      const validIds = new Set(deals.map((deal) => getDealId(deal)).filter(Boolean));
      const next = new Set([...current].filter((id) => validIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [deals]);

  useEffect(() => {
    localStorage.setItem(VISIBLE_DEAL_COLUMNS_STORAGE_KEY, JSON.stringify(visibleCols));
  }, [visibleCols]);

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
  const activeCols = useMemo(
    () => DEAL_TABLE_COLUMNS.filter((column) => column.always || visibleCols.includes(column.key)),
    [visibleCols]
  );
  const paginatedDeals = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredDeals.slice(start, start + rowsPerPage);
  }, [filteredDeals, page, rowsPerPage]);
  const allFilteredSelected = filteredDeals.length > 0 && filteredDeals.every((deal) => selected.has(getDealId(deal)));

  useEffect(() => {
    setPage(1);
  }, [search, searchField, filters, rowsPerPage, viewMode]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredDeals.length / rowsPerPage));
    if (page > maxPage) setPage(maxPage);
  }, [filteredDeals.length, rowsPerPage, page]);

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

  const clearSelection = () => {
    setSelected(new Set());
    setShowBulkStagePicker(false);
  };

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
      await dealsAPI.bulkUpdateStage(ids, bulkStage);
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
      await dealsAPI.bulkDelete(ids);
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
      setCreateForm(EMPTY_DEAL_FORM);
      loadDeals();
    } catch (error) {
      Toast.error(error?.response?.data?.message || "Failed to create deal");
    } finally {
      setCreateSaving(false);
    }
  };

  const handleImportDeals = async (importedDeals) => {
    const results = await Promise.allSettled(importedDeals.map((deal) => dealsAPI.create({
      dealName: deal.dealName,
      amount: Number(deal.amount || 0),
      closingDate: deal.closingDate ? deal.closingDate.toISOString() : null,
      stage: deal.stage || "New",
      type: deal.type || "",
      probability: Number(deal.probability || 0),
      nextStep: deal.nextStep || "",
      leadSource: deal.leadSource || "",
      campaignSource: deal.campaignSource || "",
      description: deal.description || "",
    })));

    const succeeded = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.length - succeeded;

    if (succeeded) {
      Toast.success(`Imported ${succeeded} deal${succeeded > 1 ? "s" : ""}`);
      await loadDeals();
    }
    if (failed) {
      Toast.error(`${failed} deal${failed > 1 ? "s" : ""} failed to import`);
    }
    if (!succeeded && failed) {
      throw new Error("No deals were imported.");
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
            {[{ k: "list", l: "List", I: IRows }, { k: "kanban", l: "Kanban", I: IKanban }].map((item) => {
              const ViewIcon = item.I;
              return (
                <button key={item.k} onClick={() => setViewMode(item.k)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", border: "none", borderRight: item.k === "list" ? "1px solid var(--cborder)" : "none", background: viewMode === item.k ? "color-mix(in srgb, var(--ci) 12%, var(--cs))" : "transparent", color: viewMode === item.k ? "var(--ci)" : "var(--cm)" }}>
                  <ViewIcon s={13} />{item.l}
                </button>
              );
            })}
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
          {viewMode === "list" ? <button className={`icon-btn-outline ${showColPanel ? "icon-btn-outline--on" : ""}`} onClick={() => setShowColPanel(true)}><ISettings s={13} /></button> : null}
          {viewMode === "list" ? <div className="toolbar-divider" /> : null}
          <button className="btn-ghost" onClick={() => setShowImport(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <IUpload s={12} />Import
          </button>
          <div className="toolbar-divider" />
          <button className="btn-primary" onClick={() => setCreateOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} />Add Deal
          </button>
        </div>
      </div>

      {viewMode === "list" && selectedDeals.length ? (
        <div className="table-card-shell" style={{ marginBottom: 16 }}>
          <div className="table-card" style={{ padding: "12px 14px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <div className="bulk-cnt sales-leads-bulk-count" style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{selectedDeals.length} deal{selectedDeals.length > 1 ? "s" : ""} selected</div>
            {showBulkStagePicker ? (
              <>
                <div style={{ display: "inline-flex", alignItems: "stretch", border: "1.5px solid var(--cborder)", borderRadius: 10, overflow: "hidden", background: "var(--cs)" }}>
                  <select className="bulk-select sales-leads-bulk-select" value={bulkStage} onChange={(event) => setBulkStage(event.target.value)} style={{ border: "none", borderRight: "1.5px solid var(--cborder)", borderRadius: 0, minWidth: 170, background: "transparent" }}>
                    {STAGE_ORDER.map((stage) => <option key={stage} value={stage}>{formatStageLabel(stage)}</option>)}
                  </select>
                  <button className="bulk-btn sales-leads-bulk-button" onClick={handleBulkStageUpdate} style={{ border: "none", borderRadius: 0, boxShadow: "none" }}>Change stage</button>
                </div>
                <button className="bulk-btn sales-leads-bulk-button" onClick={() => setShowBulkStagePicker(false)}>Cancel</button>
              </>
            ) : (
              <button className="bulk-btn sales-leads-bulk-button" onClick={() => setShowBulkStagePicker(true)}>Change stage</button>
            )}
            <button className="bulk-btn sales-leads-bulk-button" onClick={handleExportSelected}>Export</button>
            <button className="bulk-btn bulk-btn--danger sales-leads-bulk-button" onClick={handleBulkDelete}>Delete</button>
            <button className="bulk-btn sales-leads-bulk-button" onClick={clearSelection}>Clear</button>
          </div>
        </div>
      ) : null}

      {viewMode === "kanban" ? <DealsKanbanBoard deals={filteredDeals} onOpenDeal={handleOpenDeal} onDeleteDeal={handleDeleteDeal} onStageDrop={handleStageUpdate} /> : (
        <div className="table-card-shell sales-deals-table-shell">
          <div className="table-card sales-deals-table-card">
            <div className="table-scroll sales-deals-table-scroll">
              <table className={`table sales-deals-table ${wrapText ? "table--wrap" : ""}`}>
                <thead>
                  <tr className="thead-row">
                    <th className="th th-check"><input type="checkbox" className="cb" checked={allFilteredSelected} onChange={toggleAllFiltered} /></th>
                    {activeCols.map((col) => <th key={col.key} className={`th sales-deals-table-head-cell ${col.key === "nextStep" ? "th-next-step" : ""} ${col.key === "description" ? "th-wrap-limit" : ""}`}>{col.label}</th>)}
                    <th className="th th-actions sales-deals-table-head-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <tr><td className="td" colSpan={activeCols.length + 2}><span className="cell-txt">Loading deals...</span></td></tr> : null}
                  {!loading && !deals.length ? <tr><td className="td" colSpan={activeCols.length + 2}><span className="cell-txt">No deals available yet. Convert a lead to see it here.</span></td></tr> : null}
                  {!loading && paginatedDeals.map((deal) => {
                    const dealStage = normalizeStage(deal);
                    const dealStageMeta = STAGE_META[dealStage] || { color: "#475569", bg: "#e2e8f0" };
                    const dealInitials = getInitials(getDealTitle(deal));
                    const dealId = getDealId(deal);
                    return (
                    <tr key={dealId || `${getDealTitle(deal)}-${normalizeClosingDate(deal) || "none"}`} className={`row sales-deals-table-row ${selected.has(dealId) ? "row--sel" : ""}`}>
                      <td className="td td-check"><input type="checkbox" className="cb" checked={selected.has(dealId)} onChange={() => toggleOne(dealId)} /></td>
                      {activeCols.map((col) => {
                        switch (col.key) {
                          case "dealName":
                            return (
                              <td key="dealName" className="td td-name">
                                <div className="name-cell sales-deals-name-cell">
                                  <div className="avatar sales-deals-avatar" style={{ background: dealStageMeta.color }}>{dealInitials}</div>
                                  <div className="name-block sales-deals-name-block">
                                    <button type="button" onClick={() => handleOpenDeal(deal)} className="name-link sales-deals-name-link" style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}>
                                      {getDealTitle(deal)}
                                    </button>
                                    <button type="button" onClick={() => handleOpenDeal(deal)} className="name-link sales-deals-name-link" style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", marginTop: 4 }} title={`Open ${getDealTitle(deal)} details`} aria-label={`Open ${getDealTitle(deal)} details`}>
                                      <span className="sales-leads-name-link__meta">View <IChevR s={11} /></span>
                                    </button>
                                  </div>
                                </div>
                              </td>
                            );
                          case "stage":
                            return <td key="stage" className="td td-status"><StageCell value={dealStage} onChange={(stage) => handleStageUpdate(dealId, stage)} /></td>;
                          case "type":
                            return <td key="type" className="td"><span className="cell-txt">{getDealType(deal)}</span></td>;
                          case "probability":
                            return <td key="probability" className="td"><span className="cell-txt">{deal.probability ?? "-"}</span></td>;
                          case "expectedRevenue":
                            return <td key="expectedRevenue" className="td"><span className="cell-txt">{fmtCurrency(deal.expectedRevenue || 0)}</span></td>;
                          case "account":
                            return <td key="account" className="td"><span className="cell-txt">{getAccountName(deal)}</span></td>;
                          case "contact":
                            return <td key="contact" className="td"><span className="cell-txt">{getContactName(deal)}</span></td>;
                          case "owner":
                            return <td key="owner" className="td"><span className="cell-txt">{deal.dealOwner || "-"}</span></td>;
                          case "nextStep":
                            return <td key="nextStep" className="td td-next-step"><span className="cell-txt">{deal.nextStep || "-"}</span></td>;
                          case "leadSource":
                            return <td key="leadSource" className="td"><span className="cell-txt">{deal.leadSource || "-"}</span></td>;
                          case "campaignSource":
                            return <td key="campaignSource" className="td"><span className="cell-txt">{deal.campaignSource || "-"}</span></td>;
                          case "closingDate":
                            return <td key="closingDate" className="td"><span className="date-txt">{fmtDate(normalizeClosingDate(deal))}</span></td>;
                          case "createdTime":
                            return <td key="createdTime" className="td"><span className="date-txt">{fmtDateTime(getCreatedTime(deal))}</span></td>;
                          case "description":
                            return <td key="description" className="td td-wrap-limit"><span className="cell-txt">{deal.description || "-"}</span></td>;
                          default:
                            return null;
                        }
                      })}
                      <td className="td td-actions">
                        <button
                          type="button"
                          aria-label="Edit deal"
                          onClick={() => handleOpenEdit(deal)}
                          className="act-btn act-btn--edit sales-deals-action-button"
                          style={{ marginRight: 8 }}
                        >
                          <Pencil size={15} strokeWidth={1.9} />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete deal"
                          onClick={() => handleDeleteDeal(deal)}
                          className="act-btn act-btn--edit sales-deals-action-button sales-deals-delete-button"
                        >
                          <Trash2 size={15} strokeWidth={1.9} />
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", borderTop: "1px solid #eef2f7" }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Showing {filteredDeals.length ? (page - 1) * rowsPerPage + 1 : 0}-{Math.min(page * rowsPerPage, filteredDeals.length)} of {filteredDeals.length} deals
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button className="btn-ghost" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>Prev</button>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>
                  Page {page} of {Math.max(1, Math.ceil(filteredDeals.length / rowsPerPage))}
                </div>
                <button className="btn-ghost" onClick={() => setPage((current) => Math.min(Math.max(1, Math.ceil(filteredDeals.length / rowsPerPage)), current + 1))} disabled={page >= Math.max(1, Math.ceil(filteredDeals.length / rowsPerPage))}>Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showColPanel ? <DealManageColumnsPanel visibleCols={visibleCols} setVisibleCols={setVisibleCols} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} wrapText={wrapText} setWrapText={setWrapText} onClose={() => setShowColPanel(false)} /> : null}
      {showImport ? <DealImportModal onClose={() => setShowImport(false)} onImport={handleImportDeals} /> : null}

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
                { key: "stage", label: "Stage", as: "select" },
                { key: "amount", label: "Amount", type: "number" },
                { key: "closingDate", label: "Closing Date", as: "datetime" },
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
                  {field.as === "select" ? (
                    <select value={editForm.stage} onChange={(event) => setEditForm((current) => ({ ...current, stage: event.target.value }))} style={dealModalSelectStyle}>
                      {STAGE_ORDER.map((stage) => <option key={stage} value={stage}>{formatStageLabel(stage)}</option>)}
                    </select>
                  ) : field.as === "datetime" ? (
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
                  ) : (
                    <input
                      type={field.type || "text"}
                      value={editForm[field.key]}
                      onChange={(event) => setEditForm((current) => ({ ...current, [field.key]: event.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none" }}
                    />
                  )}
                </div>
              ))}
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
          <div className="modal" style={{ width: 680, maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={(event) => event.stopPropagation()}>
            <div className="modal-hdr">
              <div>
                <div className="modal-title">Add Deal</div>
              </div>
              <button className="icon-btn modal-close" onClick={() => setCreateOpen(false)}><IX s={15} /></button>
            </div>
            <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px", overflowY: "auto" }}>
              {[
                { key: "dealName", label: "Deal Name *" },
                { key: "stage", label: "Stage", as: "select" },
                { key: "amount", label: "Amount", type: "number" },
                { key: "closingDate", label: "Closing Date", as: "datetime" },
                { key: "type", label: "Type" },
                { key: "probability", label: "Probability", type: "number" },
                { key: "nextStep", label: "Next Step", as: "textarea", span: 2 },
                { key: "leadSource", label: "Lead Source" },
                { key: "campaignSource", label: "Campaign Source" },
              ].map((field) => (
                <div key={field.key} style={{ gridColumn: field.span === 2 ? "1 / -1" : "auto" }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{field.label}</label>
                  {field.as === "textarea" ? (
                    <textarea
                      rows={3}
                      value={createForm[field.key]}
                      onChange={(event) => setCreateForm((current) => ({ ...current, [field.key]: event.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none", resize: "vertical", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                    />
                  ) : field.as === "select" ? (
                    <select
                      value={createForm.stage}
                      onChange={(event) => setCreateForm((current) => ({ ...current, stage: event.target.value }))}
                      style={dealModalSelectStyle}
                    >
                      {STAGE_ORDER.map((stage) => <option key={stage} value={stage}>{formatStageLabel(stage)}</option>)}
                    </select>
                  ) : field.as === "datetime" ? (
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
                  ) : (
                    <input
                      type={field.type || "text"}
                      value={createForm[field.key]}
                      onChange={(event) => setCreateForm((current) => ({ ...current, [field.key]: event.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 13, outline: "none" }}
                    />
                  )}
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Description</label>
                <textarea
                  rows={4}
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

const dealModalSelectStyle = {
  width: "100%",
  minWidth: 0,
  padding: "8px 32px 8px 10px",
  border: "1.5px solid #e5e7eb",
  borderRadius: 6,
  fontSize: 13,
  color: "#111827",
  background: `#ffffff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 8l4 4 4-4'/%3E%3C/svg%3E") no-repeat right 10px center / 14px 14px`,
  outline: "none",
  appearance: "none",
};

