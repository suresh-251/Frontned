// src/pages/Leads.jsx

import { useEffect, useState, useRef } from "react";
import useFacebookLeads from "../hooks/useFacebookLeads";
import { useBrand } from "../context/BrandContext";
import { appCache } from "../utils/cache";
import { getAvailablePages } from "../api/facebook.pages.api";
import { getLeadForms, getLeadHistory, editLeadRemark, deleteLeadRemark } from "../api/facebook.leads.api";
import useUsers from "../hooks/useUsers";
import * as XLSX from "xlsx";
import * as signalR from "@microsoft/signalr";
import { BASE_URL } from "../api/apiClient";
import Toast from "../../salesCRM/utils/toast";
import { getDepartments } from "../../hr_CRM/api/hr.dept";
import { useAuth } from "../../auth/AuthContext";
import LeadAssignmentModal from "../components/facebook/LeadAssignmentModal";

import {
  FaUsers, FaTimesCircle, FaList, FaTh, FaSearch, FaSync, FaFileExport,
  FaChevronDown, FaCheck, FaTimes, FaEye, FaEdit, FaTrashAlt,
  FaChevronRight, FaChevronLeft, FaSpinner,
  FaCheckSquare, FaCalendarAlt, FaBuilding, FaUserPlus, FaHistory,
} from "react-icons/fa";

const HUB_URL = BASE_URL.replace("/api", "") + "/hubs/leads";

// ─────────────────────────────────────────────
// AVATAR COMPONENT
// ─────────────────────────────────────────────
const Avatar = ({ name }) => {
  const initials = name ? String(name).charAt(0).toUpperCase() : "?";
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 flex items-center justify-center shadow text-white text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  );
};

// ─────────────────────────────────────────────
// FILTER DROPDOWN COMPONENT
// ─────────────────────────────────────────────
const FilterDropdown = ({ label, options, value, onChange, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-all min-w-[160px] max-w-[200px]
          ${disabled ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed" :
            value ? "border-indigo-300 bg-indigo-50 text-indigo-700 hover:shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:shadow-sm"}`}
      >
        <span className="flex-1 text-left truncate">{selectedLabel || label}</span>
        <FaChevronDown className="w-3 h-3 flex-shrink-0 text-gray-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1 max-h-60 overflow-y-auto">
          <button
            onClick={() => { onChange(""); setOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            All {label.replace("Filter by ", "")}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors truncate
                ${value === opt.value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// MODAL COMPONENT
// ─────────────────────────────────────────────
const Modal = ({ isOpen, onClose, title, children, size = "lg" }) => {
  if (!isOpen) return null;
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimesCircle className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};



// ─────────────────────────────────────────────
// PAGINATION COMPONENT
// ─────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, pageSize }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  return (


    
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
      <p className="text-xs text-gray-500">
        Showing {from}–{to} of {totalItems} leads
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FaChevronLeft className="w-3 h-3" />
        </button>

        {getPageNumbers().map((page, i) =>
          page === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-xs">…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors
                ${page === currentPage
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"}`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FaChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function Leads() {
  const { user } = useAuth();
  const myUserId = user?.sub || user?.id || user?.userId || user?.uid;
  const { activeBrand } = useBrand();

  const {
    leads,
    loading,
    dataSlug,
    filters,
    reload,
    changeStatus,
    assignLead,
    assignByFormToDepartments,
    removeDepartmentFromForm,
    countFormLeads,
    getLeadDepartments,
    assignLeadDepartments,
    removeLeadDepartment,
    getLeadUsers,
    assignLeadUsers,
    removeLeadUser,
  } = useFacebookLeads();

  const [pages, setPages] = useState([]);
  const [forms, setForms] = useState([]);
  const users = useUsers();
  const [departments, setDepartments] = useState([]);

  // ── Form → Multi-department assignment state ──────────────────────────────
  const [assignDeptIds, setAssignDeptIds] = useState([]);
  const [assignDeptNames, setAssignDeptNames] = useState({});
  const [assigningDept, setAssigningDept] = useState(false);
  // ── Form → Department unified toggle state ───────────────────────────────
  const [deptSearch, setDeptSearch] = useState("");
  const [selectedDeptIds, setSelectedDeptIds] = useState([]);   // current checkbox state
  const [appliedDeptIds, setAppliedDeptIds] = useState([]);     // last-saved server state
  const [applying, setApplying] = useState(false);
  const [formLeadCount, setFormLeadCount] = useState(null); // preview count for dept assignment

  const [remarkMap, setRemarkMap] = useState({});
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  // Multi-user/dept assignment modal
  const [assignModalLead, setAssignModalLead] = useState(null);
  // Remark history (inline popover in table)
  const [remarkHistory, setRemarkHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLeadId, setHistoryLeadId] = useState(null);
  const [newRemarkText, setNewRemarkText] = useState("");
  const [savingRemark, setSavingRemark] = useState(false);
  const [editingRemarkId, setEditingRemarkId] = useState(null);
  const [editingRemarkText, setEditingRemarkText] = useState("");
  const historyPopRef = useRef();
  
  // UI & Selection States
  const [viewMode, setViewMode] = useState("list");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Export & Filtering States
  const [exportFriendlyLabels, setExportFriendlyLabels] = useState(true);
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [showDateRange, setShowDateRange] = useState(false);

  /* =========================
     INITIAL LOAD
     ========================= */
  useEffect(() => {
    reload({});
  }, []);

  /* =========================
     SIGNALR REAL-TIME
     ========================= */
const connectionRef = useRef(null);
const mountedRef = useRef(false);

useEffect(() => {
  // Guard against React StrictMode double-invoke
  if (mountedRef.current) return;
  mountedRef.current = true;

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => localStorage.getItem("accessToken")
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  connectionRef.current = connection;

  connection.on("LeadUpdated", () => {
    reload({});
  });

  const startConnection = async () => {
    try {
      if (connection.state === signalR.HubConnectionState.Disconnected) {
        await connection.start();
      }
    } catch (err) {
      // Non-critical — real-time updates unavailable but page still works
      console.warn("SignalR unavailable:", err?.message ?? err);
    }
  };

  startConnection();

  return () => {
    mountedRef.current = false;
    connectionRef.current = null;
    connection.stop().catch(() => {});
  };
}, []);

  /* =========================
     LOAD PAGES & FORMS
     ========================= */
  useEffect(() => {
    const slug = activeBrand?.slug;
    const cacheKey = `ph_pages_${slug ?? "none"}`;
    const cached = appCache.getStale(cacheKey);
    if (cached) setPages(cached.data);
    if (!appCache.isFresh(cacheKey)) {
      getAvailablePages().then(pages => {
        setPages(pages);
        if (slug) appCache.set(cacheKey, pages);
      });
    }
  }, [activeBrand?.slug]);

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    if (!filters.pageId) {
      setForms([]);
      return;
    }
    getLeadForms(filters.pageId).then(setForms);
  }, [filters.pageId]);

  // Live preview: count leads in selected form matching date range
  useEffect(() => {
    if (!filters.formId) { setFormLeadCount(null); return; }
    const timer = setTimeout(() => {
      countFormLeads(
        filters.formId,
        filterFromDate || null,
        filterToDate || null
      ).then(setFormLeadCount);
    }, 400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.formId, filterFromDate, filterToDate]);

  /* =========================
     SELECT LEADS LOGIC
     ========================= */
  const toggleLeadSelection = (id) => {
    setSelectedLeadIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAllVisible = (checked, visibleLeads) => {
    setSelectedLeadIds(checked ? visibleLeads.map(l => l.id) : []);
  };

  // Turn off select mode completely & clear array
  const handleToggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) setSelectedLeadIds([]);
  };

  /* =========================
     FILTERING LOGIC
     ========================= */
  const getLeadDate = (l) => new Date(l.metaCreatedAt || l.syncedAt || l.createdAt);

  // Guard: don't show stale data from a previous brand during transition
  const _leads = dataSlug === activeBrand?.slug ? leads : [];

  const filteredLeads = _leads.filter(l => {
    // 1. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches = (l.name || "").toLowerCase().includes(q) ||
                      (l.email || "").toLowerCase().includes(q) ||
                      (l.phone || "").toLowerCase().includes(q);
      if (!matches) return false;
    }
    // 2. From Date
    if (filterFromDate) {
      if (getLeadDate(l) < new Date(filterFromDate)) return false;
    }
    // 3. To Date
    if (filterToDate) {
      const to = new Date(filterToDate);
      to.setHours(23, 59, 59, 999);
      if (getLeadDate(l) > to) return false;
    }
    return true;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => new Date(getLeadDate(b)) - new Date(getLeadDate(a)));
  const totalPages = Math.ceil(sortedLeads.length / pageSize);
  const paginatedLeads = sortedLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterFromDate, filterToDate, filters.pageId, filters.formId]);

  /* =========================
     EXPORT TO EXCEL
     ========================= */
  const exportToExcel = (mode) => {
    if (!filteredLeads || filteredLeads.length === 0) {
      Toast?.error("No leads to export");
      return;
    }

    const exportLeads = mode === "selected"
      ? filteredLeads.filter(l => selectedLeadIds.includes(l.id))
      : filteredLeads;

    if (!exportLeads.length) {
      Toast?.error("No leads selected for export");
      return;
    }

    const rows = exportLeads.map(l => {
      const row = {
        Name: l.name || "",
        Platform: l.platform || "Facebook",
        Email: l.email || "",
        Phone: l.phone || "",
        Status: l.status || "",
        AssignedTo: l.assignedToUserName || "",
        CreatedAt: l.metaCreatedAt
          ? new Date(l.metaCreatedAt).toLocaleString()
          : l.syncedAt ? new Date(l.syncedAt).toLocaleString() : ""
      };

      if (l.fields) {
        Object.entries(l.fields).forEach(([key, value]) => {
          const label = exportFriendlyLabels
            ? key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
            : key;
          row[label] = value;
        });
      }
      return row;
    });

    // Remove empty columns
    const usedColumns = {};
    rows.forEach(r => Object.entries(r).forEach(([k, v]) => {
      if (v !== "" && v != null) usedColumns[k] = true;
    }));

    const cleanedRows = rows.map(r => {
      const obj = {};
      Object.keys(usedColumns).forEach(k => (obj[k] = r[k]));
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(cleanedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

    XLSX.writeFile(workbook, mode === "selected" ? "facebook-leads-selected.xlsx" : "facebook-leads-all.xlsx");
    Toast?.success(`Exported ${exportLeads.length} leads successfully.`);
  };

  /* =========================
     RESET DEPT SELECTION WHEN FORM CHANGES
     ========================= */
  useEffect(() => {
    setSelectedDeptIds([]);
    setAppliedDeptIds([]);
    setDeptSearch("");
  }, [filters.formId]);

  /* =========================
     DERIVE APPLIED DEPT IDS FROM LOADED LEADS (persists after reload)
     ========================= */
  useEffect(() => {
    if (!filters.formId || leads.length === 0) return;
    const formLeads = leads.filter(l => l.formId === filters.formId);
    if (formLeads.length === 0) return;
    const deptIds = new Set();
    formLeads.forEach(l => (l.departments || []).forEach(d => deptIds.add(String(d.departmentId))));
    const ids = [...deptIds];
    setAppliedDeptIds(ids);
    setSelectedDeptIds(ids);
  }, [leads, filters.formId]);

  /* =========================
     APPLY DEPARTMENT CHANGES (assign newly checked, remove newly unchecked)
     ========================= */
  const handleApplyDeptChanges = async () => {
    if (!filters.formId) return Toast?.error("Select a form first");

    const toAssign = selectedDeptIds.filter(id => !appliedDeptIds.includes(id));
    const toRemove = appliedDeptIds.filter(id => !selectedDeptIds.includes(id));

    if (!toAssign.length && !toRemove.length) return Toast?.info?.("No changes to apply") || Toast?.success("No changes to apply");

    try {
      setApplying(true);
      if (toAssign.length) {
        const depts = toAssign.map(id => ({
          departmentId: id,
          departmentName: departments.find(d => String(d.departmentId) === id)?.departmentName || "",
        }));
        const result = await assignByFormToDepartments(
          filters.formId,
          depts,
          filterFromDate || null,
          filterToDate || null,
        );
        const leadAssigned = result?.added ?? "?";
        Toast?.success(
          `Assigned ${leadAssigned} lead(s) to ${toAssign.length} department(s)` +
          (toRemove.length ? `, removed ${toRemove.length} department(s)` : "")
        );
      } else {
        Toast?.success(`Removed ${toRemove.length} department(s)`);
      }
      for (const id of toRemove) {
        await removeDepartmentFromForm(filters.formId, id);
      }
      setAppliedDeptIds([...selectedDeptIds]);
    } catch {
      Toast?.error("Failed to apply department changes");
    } finally {
      setApplying(false);
    }
  };

  const toggleDeptSelect = (id) => {
    setSelectedDeptIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  /**
   * Save remark from the inline table input on blur.
   */
  const handleSaveRemark = async (lead) => {
    const leadId = lead.id;
    const remark = remarkMap[leadId];
    if (remark === undefined || remark === (lead.remark ?? "")) return; // no change

    try {
      await assignLead(leadId, lead.assignedToUserId ?? null, lead.assignedToUserName ?? null, remark ?? "");
    } catch {
      Toast?.error?.("Failed to save remark");
    }
  };

  /* =========================
     LOAD REMARK HISTORY (inline popover)
     ========================= */
  useEffect(() => {
    if (!historyLeadId) {
      setRemarkHistory([]);
      setNewRemarkText("");
      setEditingRemarkId(null);
      setEditingRemarkText("");
      return;
    }
    setHistoryLoading(true);
    getLeadHistory(historyLeadId)
      .then(data => setRemarkHistory(Array.isArray(data) ? data : []))
      .catch(() => setRemarkHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [historyLeadId]);

  // Close history popover on outside click
  useEffect(() => {
    if (!historyLeadId) return;
    const handler = (e) => {
      if (historyPopRef.current && !historyPopRef.current.contains(e.target)) {
        setHistoryLeadId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [historyLeadId]);

  /* =========================
     RENDER
     ========================= */
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-screen-2xl mx-auto px-4 py-4 space-y-5">
        
        {/* ── Page Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your Facebook leads</p>
        </div>

        
        {/* ── Top Action Bar ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={handleToggleSelectMode}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-all active:scale-95 ${
              isSelectMode 
                ? "bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200" 
                : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
            }`}
          >
            <FaCheckSquare className={`w-3.5 h-3.5 ${isSelectMode ? "text-indigo-600" : "text-gray-400"}`} /> 
            {isSelectMode ? "Cancel Selection" : "Select Leads"}
          </button>
          
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg border transition-all ${viewMode === "list" ? "bg-white border-indigo-300 text-indigo-600 shadow-sm" : "border-gray-200 text-gray-400 hover:border-gray-300 bg-white"}`}>
              <FaList className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg border transition-all ${viewMode === "grid" ? "bg-white border-indigo-300 text-indigo-600 shadow-sm" : "border-gray-200 text-gray-400 hover:border-gray-300 bg-white"}`}>
              <FaTh className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm flex-wrap">
          <FilterDropdown
            label="Page"
            options={pages.map(p => ({ label: p.name, value: p.pageId }))}
            value={filters.pageId}
            onChange={val => reload({ pageId: val, formId: "" })}
          />

          <FilterDropdown
            label="Form"
            options={forms.map(f => ({ label: f.name, value: f.id }))}
            value={filters.formId}
            onChange={val => reload({ formId: val })}
            disabled={!filters.pageId}
          />

          {/* Department quick filter */}
          <select
            value={filters.departmentId || ""}
            onChange={e => reload({ departmentId: e.target.value || undefined })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-700"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
            ))}
          </select>

          {/* My Leads quick filter */}
          <button
            onClick={() => {
              const isActive = String(filters.assignedToUserId) === String(myUserId);
              reload({ assignedToUserId: isActive ? undefined : myUserId });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border transition-all ${
              String(filters.assignedToUserId) === String(myUserId)
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
            }`}
          >
            <FaCheck className="w-3 h-3" /> My Leads
          </button>

          {/* Date Range Toggle */}
          <button
            onClick={() => setShowDateRange(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ml-auto
              ${showDateRange || filterFromDate || filterToDate
                ? "bg-amber-50 border-amber-300 text-amber-700"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
          >
            <FaCalendarAlt className="w-3.5 h-3.5" />
            {showDateRange ? "Hide Range" : "Show Range"}
            {(filterFromDate || filterToDate) && !showDateRange && (
              <span className="w-2 h-2 rounded-full bg-amber-500 ml-0.5" />
            )}
          </button>

          {/* Date Range (collapsible) */}
          {showDateRange && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
               <input
                  type="date"
                  value={filterFromDate}
                  onChange={e => setFilterFromDate(e.target.value)}
                  className="bg-transparent text-sm text-gray-600 focus:outline-none"
               />
               <span className="text-gray-400 text-xs font-medium px-1">to</span>
               <input
                  type="date"
                  value={filterToDate}
                  onChange={e => setFilterToDate(e.target.value)}
                  className="bg-transparent text-sm text-gray-600 focus:outline-none"
               />
               {(filterFromDate || filterToDate) && (
                  <button onClick={() => { setFilterFromDate(""); setFilterToDate(""); }} className="ml-1 text-rose-500 hover:text-rose-700 p-1">
                    <FaTimes className="w-3 h-3" />
                  </button>
               )}
            </div>
          )}
        </div>

        {/* ── Department Assignment Panel (unified toggle) ── */}
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-4 shadow-sm space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <FaBuilding className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-700">Form → Department Assignment</span>
                <p className="text-xs text-gray-400 mt-0.5">Check to assign · Uncheck to remove · Apply to save changes</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Form selector */}
              <select
                value={filters.formId}
                onChange={e => reload({ formId: e.target.value })}
                disabled={!filters.pageId}
                className={`text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all
                  ${!filters.pageId ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed" : "bg-white border-gray-200 text-gray-700"}`}
              >
                <option value="">— Select Form —</option>
                {forms.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>

              {/* Lead count preview badge */}
              {filters.formId && formLeadCount !== null && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                  <FaUsers className="w-3 h-3" />
                  {formLeadCount} lead{formLeadCount !== 1 ? "s" : ""}
                  {(filterFromDate || filterToDate) ? " in range" : " in form"}
                </span>
              )}

              {/* Apply button */}
              <button
                onClick={handleApplyDeptChanges}
                disabled={!filters.formId || applying}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {applying ? <FaSpinner className="w-3.5 h-3.5 animate-spin" /> : <FaCheck className="w-3.5 h-3.5" />}
                {applying ? "Applying…" : "Apply Changes"}
              </button>
            </div>
          </div>

          {/* Department checkbox grid */}
          {!filters.formId ? (
            <p className="text-xs text-gray-400 italic pl-1">
              {!filters.pageId ? "Select a page then a form to manage department assignments." : "Select a form above to manage department assignments."}
            </p>
          ) : departments.length === 0 ? (
            <p className="text-xs text-gray-400 italic pl-1">No departments available.</p>
          ) : (
            <div className="space-y-2">
              {/* Search */}
              <input
                type="text"
                placeholder="Search departments…"
                value={deptSearch}
                onChange={e => setDeptSearch(e.target.value)}
                className="w-full sm:w-64 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              {/* Grid of toggles */}
              <div className="flex flex-wrap gap-2">
                {departments
                  .filter(d => (d.departmentName || "").toLowerCase().includes(deptSearch.toLowerCase()))
                  .map(d => {
                    const id = String(d.departmentId);
                    const isChecked = selectedDeptIds.includes(id);
                    const wasApplied = appliedDeptIds.includes(id);
                    // visual state: applied+checked=green, checked-only=indigo(pending assign), applied+unchecked=rose(pending remove), none=gray
                    let chipStyle = "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300";
                    let checkStyle = "border-gray-300";
                    if (isChecked && wasApplied) {
                      chipStyle = "bg-green-50 border-green-300 text-green-700";
                      checkStyle = "bg-green-500 border-green-500";
                    } else if (isChecked && !wasApplied) {
                      chipStyle = "bg-indigo-50 border-indigo-300 text-indigo-700";
                      checkStyle = "bg-indigo-600 border-indigo-600";
                    } else if (!isChecked && wasApplied) {
                      chipStyle = "bg-rose-50 border-rose-300 text-rose-600 line-through opacity-70";
                      checkStyle = "border-rose-300";
                    }
                    return (
                      <button
                        key={id}
                        onClick={() => toggleDeptSelect(id)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-lg transition-all select-none ${chipStyle}`}
                      >
                        <span className={`w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${checkStyle}`}>
                          {isChecked && <FaCheck className="w-2.5 h-2.5 text-white" />}
                        </span>
                        {d.departmentName}
                      </button>
                    );
                  })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 pt-1 text-xs text-gray-400 flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> Pending assign</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Applied</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" /> Pending remove</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Table Toolbar ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {[25, 50, 100, 200].map((n) => <option key={n} value={n}>{n} rows</option>)}
            </select>
            
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              <button 
                onClick={() => exportToExcel("all")}
                className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-all"
              >
                <FaFileExport className="w-3.5 h-3.5" /> Export All
              </button>
              {isSelectMode && (
                <button 
                  onClick={() => exportToExcel("selected")}
                  disabled={selectedLeadIds.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   Export Selected ({selectedLeadIds.length})
                </button>
              )}
            </div>
            
            <label className="flex items-center gap-1.5 ml-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={exportFriendlyLabels} 
                onChange={e => setExportFriendlyLabels(e.target.checked)} 
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
              />
              <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">Friendly Export Headers</span>
            </label>

            <button onClick={() => reload({})} className="ml-2 p-1.5 text-gray-400 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all" title="Refresh">
              <FaSync className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">
              {filteredLeads.length} leads
            </p>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Search leads..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 w-60 transition-all" />
            </div>
          </div>
        </div>

        {/* ── LIST VIEW ── */}
        {viewMode === "list" ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {isSelectMode && (
                      <th className="w-10 px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={selectedLeadIds.length > 0 && selectedLeadIds.length === paginatedLeads.length}
                          onChange={(e) => selectAllVisible(e.target.checked, paginatedLeads)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                        />
                      </th>
                    )}
                    {["Name", "Platform", "Contact", "Status", "Assigned To", "Remark", "Created At", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={isSelectMode ? 10 : 9} className="px-4 py-4">
                          <div className="h-4 bg-gray-100 rounded w-full" />
                        </td>
                      </tr>
                    ))
                  ) : paginatedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={isSelectMode ? 10 : 9} className="text-center py-16 text-gray-400">
                        <FaUsers className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No leads found</p>
                        <p className="text-xs mt-1">Adjust your filters or search query.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedLeads.map((l) => (
                      <tr key={l.id} className={`group transition-colors ${selectedLeadIds.includes(l.id) ? "bg-indigo-50/50" : "hover:bg-gray-50/50"}`}>
                        
                        {isSelectMode && (
                          <td className="px-4 py-3">
                            <input 
                              type="checkbox" 
                              checked={selectedLeadIds.includes(l.id)}
                              onChange={() => toggleLeadSelection(l.id)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                            />
                          </td>
                        )}
                        
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={l.name || "?"} />
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{l.name || "—"}</p>
                              <p className="text-xs text-gray-400">{l.email || l.phone || l.platform || "Lead"}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border w-fit
                              ${l.platform === "Instagram" ? "bg-pink-50 text-pink-600 border-pink-200" :
                                l.platform === "LinkedIn" ? "bg-sky-50 text-sky-700 border-sky-200" :
                                "bg-blue-50 text-blue-700 border-blue-200"}`}>
                              {l.platform || "Facebook"}
                            </span>
                            {/* {l.leadSource && (
                              <span className="text-[9px] text-gray-400 px-1">
                                {l.leadSource === "WebhookRealtime" ? "⚡ Webhook" :
                                 l.leadSource === "ManualSync" ? "🔄 Synced" :
                                 l.leadSource === "InstagramDirect" ? "IG Direct" :
                                 l.leadSource === "FacebookLeadForm" ? "FB Lead Form" :
                                 l.leadSource === "FacebookLeadCentre" ? "FB Lead Centre" :
                                 l.leadSource === "LinkedInLead" ? "LinkedIn" :
                                 l.leadSource === "ManualEntry" ? "Manual" :
                                 l.leadSource}
                              </span>
                            )} */}
                            {l.qualityScore > 0 && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-fit
                                ${l.qualityScore >= 70 ? "bg-green-100 text-green-700" :
                                  l.qualityScore >= 40 ? "bg-yellow-100 text-yellow-700" :
                                  "bg-red-100 text-red-600"}`}>
                                {l.qualityGrade || (l.qualityScore >= 70 ? "A" : l.qualityScore >= 40 ? "B" : "C")} ({l.qualityScore})
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {l.email && <p className="text-xs text-indigo-600 font-medium truncate max-w-[150px]">{l.email}</p>}
                          {l.phone && <p className="text-xs text-gray-500">{l.phone}</p>}
                          {!l.email && !l.phone && <span className="text-gray-300">—</span>}
                        </td>
                        
                        <td className="px-4 py-3">
                          <select
                            value={l.status || "New"}
                            onChange={(e) => changeStatus(l.id, e.target.value)}
                            className={`text-xs font-semibold rounded-full px-2.5 py-1 border focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors cursor-pointer appearance-none text-center
                              ${l.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                l.status === 'Contacted' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                l.status === 'Qualified' ? 'bg-green-50 text-green-700 border-green-200' :
                                'bg-rose-50 text-rose-700 border-rose-200'}`}
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Lost">Lost</option>
                          </select>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 items-center min-w-[110px]">
                            {(l.assignedUsers && l.assignedUsers.length > 0) ? (
                              <>
                                {l.assignedUsers.slice(0, 2).map(u => (
                                  <span key={u.userId} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 truncate max-w-[80px]" title={u.userName}>
                                    {u.userName}
                                  </span>
                                ))}
                                {l.assignedUsers.length > 2 && (
                                  <span className="text-[10px] text-gray-400">+{l.assignedUsers.length - 2}</span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Unassigned</span>
                            )}
                            <button
                              onClick={() => setAssignModalLead(l)}
                              className="p-1 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors ml-1 flex-shrink-0"
                              title="Manage user & department assignments"
                            >
                              <FaUserPlus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="relative">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="Add remark..."
                                value={remarkMap[l.id] ?? l.remark ?? ""}
                                onChange={e => setRemarkMap(prev => ({ ...prev, [l.id]: e.target.value }))}
                                onBlur={() => handleSaveRemark(l)}
                                className="w-[120px] px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 hover:bg-white transition-colors"
                              />
                              <button
                                onClick={() => setHistoryLeadId(historyLeadId === l.id ? null : l.id)}
                                className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${historyLeadId === l.id ? "bg-indigo-100 text-indigo-600" : "bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-500"}`}
                                title="Remark history"
                              >
                                <FaHistory className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Remarks Popover */}
                            {historyLeadId === l.id && (() => {
                              const remarks = remarkHistory.filter(h => h.remark);

                              return (
                              <div ref={historyPopRef} className="absolute z-50 top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-3 space-y-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                    <FaHistory className="w-3 h-3 text-indigo-400" /> Remarks
                                  </span>
                                  <button onClick={() => setHistoryLeadId(null)} className="text-gray-400 hover:text-gray-600">
                                    <FaTimes className="w-3 h-3" />
                                  </button>
                                </div>

                                {historyLoading ? (
                                  <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                                    <FaSpinner className="w-3 h-3 animate-spin" /> Loading…
                                  </div>
                                ) : (
                                  <>
                                    <div>
                                      {remarks.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">No remarks yet.</p>
                                      ) : (
                                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                          {remarks.map((h) => (
                                            <div key={h.id} className="bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 group/remark">
                                              <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-[10px] font-semibold text-indigo-600">
                                                  {h.assignedToUserName || "System"}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                  {h.editedAt && (
                                                    <span className="text-[9px] text-amber-500 italic">edited</span>
                                                  )}
                                                  <span className="text-[10px] text-gray-400">
                                                    {new Date(h.assignedAt).toLocaleDateString()}
                                                  </span>
                                                </div>
                                              </div>

                                              {editingRemarkId === h.id ? (
                                                <div className="flex gap-1 mt-1">
                                                  <input
                                                    type="text"
                                                    autoFocus
                                                    value={editingRemarkText}
                                                    onChange={e => setEditingRemarkText(e.target.value)}
                                                    onKeyDown={e => {
                                                      if (e.key === "Escape") { setEditingRemarkId(null); setEditingRemarkText(""); }
                                                      if (e.key === "Enter") document.getElementById(`save-edit-${h.id}`)?.click();
                                                    }}
                                                    className="flex-1 px-2 py-1 border border-indigo-300 rounded text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                                                  />
                                                  <button
                                                    id={`save-edit-${h.id}`}
                                                    onClick={async () => {
                                                      if (!editingRemarkText.trim()) return;
                                                      try {
                                                        await editLeadRemark(l.id, h.id, editingRemarkText.trim());
                                                        setEditingRemarkId(null);
                                                        setEditingRemarkText("");
                                                        const updated = await getLeadHistory(l.id);
                                                        setRemarkHistory(Array.isArray(updated) ? updated : []);
                                                        Toast?.success("Remark updated");
                                                      } catch { Toast?.error("Failed to update"); }
                                                    }}
                                                    className="px-2 py-1 text-[10px] font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                                  >
                                                    Save
                                                  </button>
                                                  <button
                                                    onClick={() => { setEditingRemarkId(null); setEditingRemarkText(""); }}
                                                    className="px-1.5 py-1 text-gray-400 hover:text-gray-600"
                                                  >
                                                    <FaTimes className="w-2.5 h-2.5" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="flex items-start justify-between">
                                                  <p className="text-xs text-gray-700 flex-1">{h.remark}</p>
                                                  <div className="flex items-center gap-0.5 ml-2 opacity-0 group-hover/remark:opacity-100 transition-opacity flex-shrink-0">
                                                    <button
                                                      onClick={() => { setEditingRemarkId(h.id); setEditingRemarkText(h.remark); }}
                                                      className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                      title="Edit remark"
                                                    >
                                                      <FaEdit className="w-2.5 h-2.5" />
                                                    </button>
                                                    <button
                                                      onClick={async () => {
                                                        if (!confirm("Delete this remark?")) return;
                                                        try {
                                                          await deleteLeadRemark(l.id, h.id);
                                                          const updated = await getLeadHistory(l.id);
                                                          setRemarkHistory(Array.isArray(updated) ? updated : []);
                                                          Toast?.success("Remark deleted");
                                                        } catch { Toast?.error("Failed to delete"); }
                                                      }}
                                                      className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                      title="Delete remark"
                                                    >
                                                      <FaTrashAlt className="w-2.5 h-2.5" />
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}

                                {/* Add new remark */}
                                <div className="flex gap-1.5 pt-1 border-t border-gray-100">
                                  <input
                                    type="text"
                                    placeholder="Add remark…"
                                    value={newRemarkText}
                                    onChange={e => setNewRemarkText(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === "Enter" && newRemarkText.trim()) {
                                        e.target.blur();
                                        document.getElementById(`save-remark-${l.id}`)?.click();
                                      }
                                    }}
                                    className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
                                  />
                                  <button
                                    id={`save-remark-${l.id}`}
                                    disabled={!newRemarkText.trim() || savingRemark}
                                    onClick={async () => {
                                      if (!newRemarkText.trim()) return;
                                      setSavingRemark(true);
                                      try {
                                        await assignLead(l.id, l.assignedToUserId ?? null, l.assignedToUserName ?? null, newRemarkText.trim());
                                        setNewRemarkText("");
                                        const updated = await getLeadHistory(l.id);
                                        setRemarkHistory(Array.isArray(updated) ? updated : []);
                                        Toast?.success("Remark saved");
                                      } catch {
                                        Toast?.error("Failed to save remark");
                                      } finally {
                                        setSavingRemark(false);
                                      }
                                    }}
                                    className="px-2.5 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-95"
                                  >
                                    {savingRemark ? <FaSpinner className="w-3 h-3 animate-spin" /> : "Save"}
                                  </button>
                                </div>
                              </div>
                              );
                            })()}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {l.metaCreatedAt ? new Date(l.metaCreatedAt).toLocaleString() : l.syncedAt ? new Date(l.syncedAt).toLocaleString() : "—"}
                        </td>
                        
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedLead(l)}
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                            title="View details"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                        </td>
                        
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredLeads.length}
              pageSize={pageSize}
            />
          </div>
        ) : (
          /* ── GRID VIEW (Minimalistic approach for FB Leads) ── */
          <div className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginatedLeads.map(l => (
                   <div key={l.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all relative">
                      {isSelectMode && (
                        <div className="absolute top-3 right-3 z-10">
                          <input 
                            type="checkbox" 
                            checked={selectedLeadIds.includes(l.id)}
                            onChange={() => toggleLeadSelection(l.id)}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                         <Avatar name={l.name || "?"} />
                         <div className={`flex-1 min-w-0 ${isSelectMode ? "pr-6" : ""}`}>
                            <p className="text-sm font-semibold text-gray-800 truncate">{l.name || "—"}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border
                                ${l.platform === "Instagram" ? "bg-pink-50 text-pink-600 border-pink-200" :
                                  l.platform === "LinkedIn" ? "bg-sky-50 text-sky-700 border-sky-200" :
                                  "bg-blue-50 text-blue-700 border-blue-200"}`}>
                                {l.platform || "Facebook"}
                              </span>
                              {l.qualityScore > 0 && (
                                <span className={`text-[8px] font-bold px-1 py-0.5 rounded
                                  ${l.qualityScore >= 70 ? "bg-green-100 text-green-700" :
                                    l.qualityScore >= 40 ? "bg-yellow-100 text-yellow-700" :
                                    "bg-red-100 text-red-600"}`}>
                                  {l.qualityGrade || "?"} ({l.qualityScore})
                                </span>
                              )}
                            </div>
                         </div>
                      </div>
                      {l.email && <p className="text-xs text-indigo-600 font-medium truncate mb-1">{l.email}</p>}
                      {l.phone && <p className="text-xs text-gray-500 mb-2">{l.phone}</p>}
                      
                      <div className="flex gap-2 mb-3 mt-3">
                         <select
                            value={l.status || "New"}
                            onChange={(e) => changeStatus(l.id, e.target.value)}
                            className="flex-1 text-[11px] font-semibold rounded-md px-2 py-1 border focus:outline-none bg-gray-50"
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Lost">Lost</option>
                          </select>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                         <span className="text-[10px] text-gray-400">
                           {l.metaCreatedAt ? new Date(l.metaCreatedAt).toLocaleDateString() : ""}
                         </span>
                         <button onClick={() => setSelectedLead(l)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                            Details &rarr;
                         </button>
                      </div>
                   </div>
                ))}
             </div>
             {paginatedLeads.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                   <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredLeads.length} pageSize={pageSize} />
                </div>
             )}
          </div>
        )}
      </div>

      {/* ── DETAILS MODAL ── */}
      <Modal isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title="Lead Form Details" size="lg">
        <div className="space-y-5">
          {/* Form fields */}
          {selectedLead?.fields && Object.keys(selectedLead.fields).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(selectedLead.fields).map(([k, v]) => (
                <div key={k} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                    {k.replace(/_/g, " ")}
                  </p>
                  <p className="text-sm font-medium text-gray-800">{v || "—"}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FaEye className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No additional form data available</p>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              onClick={() => setSelectedLead(null)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* ── ASSIGNMENT MODAL (multi-user & dept) ── */}
      {assignModalLead && (
        <LeadAssignmentModal
          lead={assignModalLead}
          departments={departments}
          users={users}
          onClose={() => { setAssignModalLead(null); reload({}, true); }}
          hookHandlers={{
            getLeadDepartments,
            assignLeadDepartments,
            removeLeadDepartment,
            getLeadUsers,
            assignLeadUsers,
            removeLeadUser,
          }}
        />
      )}

    </div>
  );
}




