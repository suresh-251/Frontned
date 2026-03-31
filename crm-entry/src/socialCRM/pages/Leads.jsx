// src/pages/Leads.jsx

import { useEffect, useState, useRef, useMemo } from "react";
import useFacebookLeads from "../hooks/useFacebookLeads";
import { useBrand } from "../context/BrandContext";
import { appCache } from "../utils/cache";
import { getConnectedPages } from "../api/facebook.pages.api";
import { getLeadForms, syncLeadsByForm, syncAllLeads, getLeadFilterOptions, getLeadHistory, editLeadRemark, deleteLeadRemark } from "../api/facebook.leads.api";
import { getAccessToken } from "../../utils/authStorage";
import { getGoogleSheetConfig, updateGoogleSheetConfig } from "../api/brand.api";
import useUsers from "../hooks/useUsers";
import * as XLSX from "xlsx";
import * as signalR from "@microsoft/signalr";
import { BASE_URL } from "../api/apiClient";
import Toast from "../../salesCRM/utils/toast";
import { getDepartments } from "../api/departments.api";
import { useAuth } from "../../auth/AuthContext";
import LeadAssignmentModal from "../components/facebook/LeadAssignmentModal";

import {
  FaUsers, FaTimesCircle, FaList, FaTh, FaSearch, FaSync, FaFileExport,
  FaChevronDown, FaCheck, FaTimes, FaEye, FaEdit, FaTrashAlt,
  FaChevronRight, FaChevronLeft, FaSpinner,
  FaCheckSquare, FaCalendarAlt, FaBuilding, FaUserPlus, FaHistory,
  FaPhone, FaCommentDots, FaWhatsapp, FaFacebookMessenger, FaEnvelope,
  FaCopy, FaPhoneAlt, FaFacebook, FaInstagram,
} from "react-icons/fa";

const HUB_URL = BASE_URL.replace("/api", "") + "/hubs/leads";
const LEAD_STATUS_OPTIONS = ["New", "Contacted", "Qualified", "Lost"];
const PLATFORM_STYLE = {
  Facebook: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  Instagram: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", dot: "bg-pink-500" },
  LinkedIn: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", dot: "bg-sky-500" },
};

const normalizePhone = (phone) => String(phone || "").replace(/[^\d+]/g, "");
const getLeadPlatform = (lead) => {
  const platform = String(lead?.platform || "Facebook").trim().toLowerCase();
  if (platform === "instagram") return "Instagram";
  if (platform === "linkedin") return "LinkedIn";
  return "Facebook";
};
const addQueryParam = (url, key, value) => {
  if (!url || !value) return url;
  const divider = url.includes("?") ? "&" : "?";
  return `${url}${divider}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
};

const getMessengerUrl = (lead) => {
  const directUrl =
    lead?.messengerUrl ||
    lead?.messengerLink ||
    lead?.facebookMessengerUrl ||
    lead?.profileUrl;
  if (directUrl) return directUrl;

  const messengerId =
    lead?.psid ||
    lead?.pageScopedId ||
    lead?.facebookUserId ||
    lead?.messengerUserId;
  return messengerId ? `https://m.me/${messengerId}` : null;
};

const getInboxConversationId = (lead) =>
  lead?.conversationId ||
  lead?.inboxConversationId ||
  lead?.messengerConversationId ||
  lead?.facebookConversationId ||
  lead?.threadId ||
  null;

const getInboxUrl = (lead) => {
  const id = getInboxConversationId(lead);
  return id ? `/crm/socialmedia/inbox?conversationId=${encodeURIComponent(String(id))}` : null;
};

const normalizeDepartments = (departments = [], activeBrand = null) => {
  const activeBranchId =
    activeBrand?.branchId ??
    activeBrand?.branch?.id ??
    activeBrand?.branch?.branchId ??
    null;

  const source = activeBranchId == null
    ? departments
    : departments.filter((d) => String(d.branchId ?? "") === String(activeBranchId));

  const seen = new Set();
  return source.filter((d) => {
    const key = `${d.departmentId ?? d.id}|${String(d.departmentName || d.name || "").toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getLeadChannelTargets = (lead, message = "", subject = "Lead Follow-up") => {
  const options = [];
  const platform = getLeadPlatform(lead);
  const inboxUrl = getInboxUrl(lead);
  const messengerUrl = getMessengerUrl(lead);
  const phone = normalizePhone(lead?.phone);
  const draftInboxUrl = addQueryParam(inboxUrl, "draft", message);
  const draftText = encodeURIComponent(message || "");
  const mailSubject = encodeURIComponent(subject || "Lead Follow-up");

  if (inboxUrl) {
    options.push({
      key: "inbox",
      type: "inbox",
      label: platform === "Instagram" ? "Instagram Chat" : "Facebook Chat",
      href: message ? draftInboxUrl : inboxUrl,
      external: false,
      Icon: platform === "Instagram" ? FaInstagram : FaFacebookMessenger,
      color: platform === "Instagram" ? "text-pink-600" : "text-blue-600",
    });
  } else if (messengerUrl) {
    options.push({
      key: "messenger",
      type: "messenger",
      label: "Messenger",
      href: messengerUrl,
      external: true,
      Icon: FaFacebookMessenger,
      color: "text-blue-600",
    });
  }

  if (phone) {
    const waNum = phone.replace(/[^0-9]/g, "");
    options.push({
      key: "whatsapp",
      type: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/${waNum}${draftText ? `?text=${draftText}` : ""}`,
      external: true,
      Icon: FaWhatsapp,
      color: "text-green-600",
    });
  }

  if (lead?.email) {
    options.push({
      key: "email",
      type: "email",
      label: "Email",
      href: `mailto:${lead.email}?subject=${mailSubject}&body=${draftText}`,
      external: false,
      Icon: FaEnvelope,
      color: "text-indigo-600",
    });
  }

  return options;
};

const LeadContactActions = ({ lead, compact = false, onCompose }) => {
  const [callOpen, setCallOpen] = useState(false);
  const ref = useRef();

  const options = getLeadChannelTargets(lead);
  const phone = normalizePhone(lead?.phone);

  useEffect(() => {
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setCallOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const copyPhone = async () => {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
    } catch { /* fallback: do nothing */ }
  };

  return (
    <div className="flex items-center gap-1.5" ref={ref}>
      {/* ── Call Button with dropdown (no browser alert) ── */}
      <div className="relative">
        {phone ? (
          <button
            type="button"
            onClick={() => setCallOpen((p) => !p)}
            className={`inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors ${compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs font-medium"}`}
          >
            <FaPhone className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
            Call
            <FaChevronDown className={compact ? "w-2 h-2" : "w-2.5 h-2.5"} />
          </button>
        ) : (
          <button
            type="button"
            disabled
            className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed ${compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs font-medium"}`}
          >
            <FaPhone className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
            Call
          </button>
        )}

        {callOpen && phone && (
          <div className="absolute left-0 top-full mt-1 w-52 rounded-xl border border-slate-200 bg-white shadow-xl z-30 p-2 space-y-1">
            <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 rounded-lg">
              <span className="text-xs font-semibold text-slate-700">{phone}</span>
              <button onClick={copyPhone} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors" title="Copy number">
                <FaCopy className="w-3 h-3" />
              </button>
            </div>
            <a
              href={`tel:${phone}`}
              onClick={() => setCallOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-green-50 hover:text-green-700 transition-colors"
            >
              <FaPhoneAlt className="w-3 h-3 text-green-500" />
              Open Phone App
            </a>
            <button
              type="button"
              onClick={() => { copyPhone(); setCallOpen(false); }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FaCopy className="w-3 h-3 text-slate-400" />
              Copy Number
            </button>
          </div>
        )}
      </div>

      {/* ── Compose Button ── */}
      <div>
        <button
          type="button"
          disabled={options.length === 0}
          onClick={() => onCompose?.(lead)}
          className={`inline-flex items-center gap-1 rounded-lg border transition-colors ${options.length === 0 ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed" : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"} ${compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1.5 text-xs font-medium"}`}
        >
          <FaCommentDots className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
          Compose
        </button>
      </div>
    </div>
  );
};

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

  // ── Form → Department unified toggle state ───────────────────────────────
  const [deptSearch, setDeptSearch] = useState("");
  const [selectedDeptIds, setSelectedDeptIds] = useState([]);   // current checkbox state
  const [appliedDeptIds, setAppliedDeptIds] = useState([]);     // last-saved server state
  const [applying, setApplying] = useState(false);
  const [formLeadCount, setFormLeadCount] = useState(null); // preview count for dept assignment

  const [remarkMap, setRemarkMap] = useState({});
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [composeLeads, setComposeLeads] = useState([]);
  const [bulkMessageText, setBulkMessageText] = useState("");
  const [bulkMessageSubject, setBulkMessageSubject] = useState("Lead Follow-up");
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
  const [platformFilter, setPlatformFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Export & Filtering States
  const [exportFriendlyLabels, setExportFriendlyLabels] = useState(true);
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [showDateRange, setShowDateRange] = useState(false);

  // ── Google Sheets settings ──────────────────────────────────────────
  const [showSheetSettings, setShowSheetSettings] = useState(false);
  const [sheetConfig, setSheetConfig] = useState({ spreadsheetId: "", sheetName: "Leads", enabled: false });
  const [sheetSaving, setSheetSaving] = useState(false);
  const [sheetMsg, setSheetMsg] = useState("");

  // ── Manual Sync from Meta ──────────────────────────────────────────
  const [syncing, setSyncing] = useState(false);
  const [syncAllLoading, setSyncAllLoading] = useState(false);

  const handleSyncForm = async (formId) => {
    if (!formId) return Toast?.error?.("Select a form first");
    setSyncing(true);
    try {
      // Pass pageId from the selected form for correct token resolution
      const form = forms.find(f => f.id === formId);
      await syncLeadsByForm(formId, null, form?.pageId);
      Toast?.success?.("Leads synced successfully");
      reload({});
    } catch {
      // Error toast is shown by apiClient interceptor
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAllForms = async () => {
    setSyncAllLoading(true);
    try {
      const result = await syncAllLeads();
      Toast?.success?.(result.message || "All leads synced successfully");
      // Refresh forms list (may have discovered new forms from Meta)
      await loadForms();
      reload({});
    } catch {
      // Error toast is shown by apiClient interceptor
    } finally {
      setSyncAllLoading(false);
    }
  };

  /* =========================
     INITIAL LOAD
     ========================= */
  // The useFacebookLeads hook handles initial load and brand switches internally.
  // Only call reload for SignalR or manual refresh — not on mount/brand change.

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
      accessTokenFactory: () => getAccessToken() || ""
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
  const [socialTokenError, setSocialTokenError] = useState(false);

  const loadForms = async () => {
    const slug = activeBrand?.slug;
    if (!slug) { setPages([]); setForms([]); return; }

    const cacheKey = `ph_pages_${slug}`;
    const formsCacheKey = `ph_forms_${slug}`;

    try {
      // Fire both API calls in parallel for faster loading
      const [filterResult, metaFormsResult] = await Promise.allSettled([
        getLeadFilterOptions(),
        getLeadForms(),
      ]);

      // Check for social token errors
      const filterErr = filterResult.status === "rejected" ? filterResult.reason : null;
      const formsErr = metaFormsResult.status === "rejected" ? metaFormsResult.reason : null;
      if (filterErr?.code === "social_token_expired" || formsErr?.code === "social_token_expired") {
        setSocialTokenError(true);
      } else {
        setSocialTokenError(false);
      }

      // Process DB filter options (pages + forms)
      let dbForms = [];
      if (filterResult.status === "fulfilled") {
        const result = filterResult.value;
        const p = result.pages || [];
        setPages(p);
        appCache.set(cacheKey, p);
        dbForms = (result.forms || []).map(f => ({
          id: f.formId || f.id,
          name: f.name || f.formId || f.id,
          pageId: f.pageId ? String(f.pageId) : "",
        }));
        if (dbForms.length) {
          setForms(dbForms);
          appCache.set(formsCacheKey, dbForms);
        }
      } else if (!appCache.isFresh(cacheKey)) {
        getConnectedPages()
          .then(p => { setPages(p); appCache.set(cacheKey, p); })
          .catch(() => setPages([]));
      }

      // Merge with Meta forms (richer data with questions, status, etc.)
      if (metaFormsResult.status === "fulfilled") {
        const metaForms = metaFormsResult.value;
        if (metaForms.length) {
          const metaIds = new Set(metaForms.map(f => f.id));
          const merged = [
            ...metaForms.map(mf => {
              const dbForm = dbForms.find(f => String(f.id) === String(mf.id));
              return { ...mf, pageId: String(mf.pageId || dbForm?.pageId || "") };
            }),
            ...dbForms.filter(f => !metaIds.has(f.id)),
          ];
          setForms(merged);
          appCache.set(formsCacheKey, merged);
        }
      }
    } catch (err) {
      console.error("Failed to load pages/forms:", err);
      if (err?.code === "social_token_expired") setSocialTokenError(true);
    }
  };

  useEffect(() => {
    const slug = activeBrand?.slug;
    if (!slug) { setPages([]); setForms([]); return; }

    const cacheKey = `ph_pages_${slug}`;
    const formsCacheKey = `ph_forms_${slug}`;
    const cachedPages = appCache.getStale(cacheKey);
    const cachedForms = appCache.getStale(formsCacheKey);

    if (cachedPages) setPages(cachedPages.data);
    if (cachedForms) setForms(cachedForms.data);

    loadForms();
  }, [activeBrand?.slug]);

  // Load Google Sheet config per brand
  useEffect(() => {
    const slug = activeBrand?.slug;
    if (!slug) return;
    getGoogleSheetConfig(slug)
      .then(cfg => setSheetConfig({
        spreadsheetId: cfg.spreadsheetId || "",
        sheetName: cfg.sheetName || "Leads",
        enabled: !!cfg.enabled,
      }))
      .catch(() => setSheetConfig({ spreadsheetId: "", sheetName: "Leads", enabled: false }));
  }, [activeBrand?.slug]);

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {});
  }, []);

  const branchDepartments = useMemo(
    () => normalizeDepartments(departments, activeBrand),
    [departments, activeBrand]
  );

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
    if (isSelectMode) {
      setSelectedLeadIds([]);
      setComposeLeads([]);
      setBulkMessageText("");
    }
  };

  // Guard: don't show stale data from a previous brand during transition
  // Allow data when dataSlug matches OR during initial load (dataSlug is catching up)
  const slugMatches = !activeBrand?.slug || dataSlug === activeBrand?.slug;
  const _leads = slugMatches ? leads : [];

  const selectedLeads = useMemo(
    () => _leads.filter((lead) => selectedLeadIds.includes(lead.id)),
    [_leads, selectedLeadIds]
  );

  const openComposeModal = (leadsToCompose = []) => {
    const uniqueLeads = [];
    const seen = new Set();
    leadsToCompose.forEach((lead) => {
      if (!lead || seen.has(lead.id)) return;
      seen.add(lead.id);
      uniqueLeads.push(lead);
    });
    setComposeLeads(uniqueLeads);
  };

  const composedLeadTargets = useMemo(
    () => composeLeads.map((lead) => ({
      ...lead,
      platform: getLeadPlatform(lead),
      channels: getLeadChannelTargets(lead, bulkMessageText.trim(), bulkMessageSubject.trim() || "Lead Follow-up"),
    })),
    [composeLeads, bulkMessageText, bulkMessageSubject]
  );

  const composeEmails = useMemo(
    () => [...new Set(composeLeads.map((lead) => lead.email).filter(Boolean))],
    [composeLeads]
  );

  const composeLinksByType = useMemo(() => {
    const groups = { inbox: [], messenger: [], whatsapp: [], email: [] };
    composedLeadTargets.forEach((lead) => {
      lead.channels.forEach((channel) => {
        if (!groups[channel.type]) groups[channel.type] = [];
        groups[channel.type].push({ ...channel, leadId: lead.id, leadName: lead.name || `Lead ${lead.id}` });
      });
    });
    return groups;
  }, [composedLeadTargets]);

  const openBulkEmail = () => {
    if (composeEmails.length === 0) {
      Toast?.error("No selected leads have an email address.");
      return;
    }
    const subject = encodeURIComponent(bulkMessageSubject.trim() || "Lead Follow-up");
    const body = encodeURIComponent(bulkMessageText || "");
    const bcc = encodeURIComponent(composeEmails.join(","));
    window.location.href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
  };

  const openComposeLinks = (type) => {
    const links = composeLinksByType[type] || [];
    if (links.length === 0) {
      Toast?.error(`No ${type} targets available for the selected leads.`);
      return;
    }

    links.forEach((link, index) => {
      window.setTimeout(() => {
        window.open(link.href, "_blank", "noopener,noreferrer");
      }, index * 140);
    });

    Toast?.success(`Opened ${links.length} ${type === "inbox" ? "chat" : type} target(s).`);
  };

  /* =========================
     FILTERING LOGIC
     ========================= */
  const getLeadDate = (l) => new Date(l.metaCreatedAt || l.syncedAt || l.createdAt);

  const filteredLeads = _leads.filter(l => {
    // 1. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches = (l.name || "").toLowerCase().includes(q) ||
                      (l.email || "").toLowerCase().includes(q) ||
                      (l.phone || "").toLowerCase().includes(q) ||
                      getLeadPlatform(l).toLowerCase().includes(q);
      if (!matches) return false;
    }
    // 2. Platform
    if (platformFilter && getLeadPlatform(l) !== platformFilter) return false;
    // 3. Status
    if (statusFilter && (l.status || "New") !== statusFilter) return false;
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
  }, [searchQuery, platformFilter, statusFilter, filterFromDate, filterToDate, filters.pageId, filters.formId]);

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
     GOOGLE SHEETS SAVE
     ========================= */
  const saveSheetConfig = async () => {
    if (!activeBrand?.slug) return;
    setSheetSaving(true);
    setSheetMsg("");
    try {
      const result = await updateGoogleSheetConfig(activeBrand.slug, sheetConfig);
      setSheetConfig({
        spreadsheetId: result.spreadsheetId || "",
        sheetName: result.sheetName || "Leads",
        enabled: !!result.enabled,
      });
      setSheetMsg("✅ Saved");
      setTimeout(() => setSheetMsg(""), 3000);
    } catch (err) {
      setSheetMsg("❌ " + (err?.response?.data?.message || "Save failed"));
    } finally {
      setSheetSaving(false);
    }
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
          departmentName: branchDepartments.find(d => String(d.departmentId) === id)?.departmentName || "",
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
      await Promise.all(toRemove.map(id => removeDepartmentFromForm(filters.formId, id)));
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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track social leads across connected channels</p>
          </div>
          <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-1">
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
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 text-sm font-bold">
                <FaUsers className="w-3.5 h-3.5" />
                {filteredLeads.length}
                {_leads.length !== filteredLeads.length ? ` / ${_leads.length}` : ""} Leads
              </div>
              {Object.entries(
                _leads.reduce((counts, lead) => {
                  const platform = getLeadPlatform(lead);
                  counts[platform] = (counts[platform] || 0) + 1;
                  return counts;
                }, {})
              ).sort((a, b) => b[1] - a[1]).map(([platform, count]) => {
                const style = PLATFORM_STYLE[platform] || PLATFORM_STYLE.Facebook;
                return (
                  <div key={platform} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${style.bg} border ${style.border} ${style.text} text-sm font-semibold`}>
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                    {platform}: {count}
                  </div>
                );
              })}
            </div>

            <div className="relative w-full max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads by name, email, phone, or platform..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 w-full transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Social Token Error Banner ── */}
        {socialTokenError && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <span className="font-medium">Your social media session has expired.</span>
            <span>Please reconnect your Facebook account to load pages and forms.</span>
          </div>
        )}

        {/* ── Filter Bar ── */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm flex-wrap">
          <FilterDropdown
            label={activeBrand ? `${activeBrand.name} - Pages` : "Page"}
            options={pages.map(p => ({ label: p.name, value: p.pageId }))}
            value={filters.pageId}
            onChange={val => reload({ pageId: val, formId: "" })}
          />

          <FilterDropdown
            label="Form"
            options={(filters.pageId
              ? forms.filter(f => String(f.pageId) === String(filters.pageId))
              : forms
            ).map(f => ({ label: f.name, value: f.id }))}
            value={filters.formId}
            onChange={val => reload({ formId: val })}
            disabled={!filters.pageId}
          />

          <FilterDropdown
            label="Filter by Platform"
            options={[...new Set(_leads.map((lead) => getLeadPlatform(lead)))].map((platform) => ({
              label: platform,
              value: platform,
            }))}
            value={platformFilter}
            onChange={setPlatformFilter}
          />

          <FilterDropdown
            label="Filter by Status"
            options={LEAD_STATUS_OPTIONS.map((status) => ({ label: status, value: status }))}
            value={statusFilter}
            onChange={setStatusFilter}
          />

          {/* Sync from Meta */}
          <button
            onClick={() => filters.formId ? handleSyncForm(filters.formId) : handleSyncAllForms()}
            disabled={syncing || syncAllLoading || !forms.length}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title={filters.formId ? "Sync leads for selected form from Meta" : "Sync leads for all forms from Meta"}
          >
            <FaSync className={`w-3 h-3 ${syncing || syncAllLoading ? "animate-spin" : ""}`} />
            {syncing || syncAllLoading ? "Syncing…" : filters.formId ? "Sync Form" : "Sync All"}
          </button>

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

        {/* ── Department Assignment Panel — only visible when a form is selected ── */}
        {filters.formId && (
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
              {/* Lead count preview badge */}
              {formLeadCount !== null && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                  <FaUsers className="w-3 h-3" />
                  {formLeadCount} lead{formLeadCount !== 1 ? "s" : ""}
                  {(filterFromDate || filterToDate) ? " in range" : " in form"}
                </span>
              )}

              {/* Apply button */}
              <button
                onClick={handleApplyDeptChanges}
                disabled={applying}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {applying ? <FaSpinner className="w-3.5 h-3.5 animate-spin" /> : <FaCheck className="w-3.5 h-3.5" />}
                {applying ? "Applying…" : "Apply Changes"}
              </button>
            </div>
          </div>

          {/* Department checkbox grid */}
          {branchDepartments.length === 0 ? (
            <p className="text-xs text-gray-400 italic pl-1">No departments available for the active brand branch.</p>
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
                {branchDepartments
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
        )}

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
                <>
                  <button 
                    onClick={() => exportToExcel("selected")}
                    disabled={selectedLeadIds.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Export Selected ({selectedLeadIds.length})
                  </button>
                  <button
                    onClick={() => openComposeModal(selectedLeads)}
                    disabled={selectedLeadIds.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1 text-sm text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaCommentDots className="w-3 h-3" />
                    Compose & Forward ({selectedLeadIds.length})
                  </button>
                </>
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

            <button
              onClick={() => setShowSheetSettings(!showSheetSettings)}
              className={`ml-1 flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-all ${
                sheetConfig.enabled
                  ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
              title="Google Sheets Settings"
            >
              📊 Sheets {sheetConfig.enabled ? "ON" : "OFF"}
            </button>
          </div>
          
          <div className="flex items-center gap-2" />
        </div>

        {/* ── Google Sheets Settings Panel ── */}
        {showSheetSettings && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">📊 Google Sheets Integration</h3>
              <button onClick={() => setShowSheetSettings(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              When enabled, new leads will be automatically appended to your Google Sheet.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[220px]">
                <label className="block text-xs font-medium text-gray-600 mb-1">Spreadsheet ID</label>
                <input
                  type="text"
                  value={sheetConfig.spreadsheetId}
                  onChange={e => setSheetConfig(c => ({ ...c, spreadsheetId: e.target.value }))}
                  placeholder="e.g. 1TskPqMIiPYjAY5Eo1IywSfUkkjK4y9n1eSxDQUkBZk8"
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="w-40">
                <label className="block text-xs font-medium text-gray-600 mb-1">Sheet Name</label>
                <input
                  type="text"
                  value={sheetConfig.sheetName}
                  onChange={e => setSheetConfig(c => ({ ...c, sheetName: e.target.value }))}
                  placeholder="Leads"
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sheetConfig.enabled}
                  onChange={e => setSheetConfig(c => ({ ...c, enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-600">Enable</span>
              </label>
              <button
                onClick={saveSheetConfig}
                disabled={sheetSaving}
                className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {sheetSaving ? "Saving..." : "Save"}
              </button>
              {sheetMsg && <span className="text-sm">{sheetMsg}</span>}
            </div>
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {viewMode === "list" ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
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
                      <th key={h} className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
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
                              <p className="text-xs text-gray-400">{l.formName || `${getLeadPlatform(l)} lead`}</p>
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
                          <div className="space-y-1">
                            {l.email && <p className="text-xs text-indigo-600 font-medium truncate max-w-[150px]">{l.email}</p>}
                            {l.phone && <p className="text-xs text-gray-500">{l.phone}</p>}
                            {!l.email && !l.phone && <span className="text-gray-300">—</span>}
                            {(l.phone || getLeadChannelTargets(l).length > 0) && (
                              <div className="pt-1">
                                <LeadContactActions lead={l} compact onCompose={() => openComposeModal([l])} />
                              </div>
                            )}
                          </div>
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
                      {l.phone && <p className="text-xs text-gray-500 mb-1">{l.phone}</p>}

                      {/* Quick action buttons */}
                      {(l.phone || getLeadChannelTargets(l).length > 0) && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <LeadContactActions lead={l} compact onCompose={() => openComposeModal([l])} />
                        </div>
                      )}

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
      <Modal
        isOpen={composeLeads.length > 0}
        onClose={() => setComposeLeads([])}
        title={`${composeLeads.length === 1 ? "Compose Message" : "Compose & Forward"} (${composeLeads.length})`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Recipients</p>
              <p className="text-sm font-semibold text-slate-800">{composeLeads.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Inbox / DM</p>
              <p className="text-sm font-semibold text-slate-800">{(composeLinksByType.inbox?.length || 0) + (composeLinksByType.messenger?.length || 0)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">WhatsApp</p>
              <p className="text-sm font-semibold text-slate-800">{composeLinksByType.whatsapp?.length || 0}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Email</p>
              <p className="text-sm font-semibold text-slate-800">{composeEmails.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[200px,1fr] gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Subject</label>
              <input
                type="text"
                value={bulkMessageSubject}
                onChange={(e) => setBulkMessageSubject(e.target.value)}
                placeholder="Lead Follow-up"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
              <textarea
                value={bulkMessageText}
                onChange={(e) => setBulkMessageText(e.target.value)}
                rows={4}
                placeholder="Write once, then forward to inbox, Instagram, WhatsApp, or email."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => openComposeLinks("inbox")}
              disabled={(composeLinksByType.inbox?.length || 0) === 0}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Open Inbox Chats ({composeLinksByType.inbox?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => openComposeLinks("messenger")}
              disabled={(composeLinksByType.messenger?.length || 0) === 0}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Open Messenger ({composeLinksByType.messenger?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => openComposeLinks("whatsapp")}
              disabled={(composeLinksByType.whatsapp?.length || 0) === 0}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Open WhatsApp ({composeLinksByType.whatsapp?.length || 0})
            </button>
            <button
              type="button"
              onClick={openBulkEmail}
              disabled={composeEmails.length === 0}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Email BCC ({composeEmails.length})
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!bulkMessageText.trim()) return;
                try {
                  await navigator.clipboard.writeText(bulkMessageText.trim());
                  Toast?.success("Message copied. Use it in the opened chat tabs.");
                } catch {
                  Toast?.error("Could not copy message.");
                }
              }}
              disabled={!bulkMessageText.trim()}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Copy Message
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <p className="text-xs font-semibold text-slate-700">Forward Targets</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Facebook and Instagram inbox links open with the drafted message ready in the CRM inbox.</p>
            </div>
            <div className="max-h-80 overflow-auto divide-y divide-slate-100">
              {composedLeadTargets.map((lead) => (
                <div key={lead.id} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{lead.name || `Lead ${lead.id}`}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        lead.platform === "Instagram" ? "bg-pink-50 text-pink-700 border-pink-200" :
                        lead.platform === "LinkedIn" ? "bg-sky-50 text-sky-700 border-sky-200" :
                        "bg-blue-50 text-blue-700 border-blue-200"
                      }`}>
                        {lead.platform}
                      </span>
                      {lead.phone && <span className="text-[11px] text-slate-500">{lead.phone}</span>}
                      {lead.email && <span className="text-[11px] text-slate-500">{lead.email}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {lead.channels.length === 0 ? (
                      <span className="text-xs text-slate-400">No contact source</span>
                    ) : (
                      lead.channels.map((channel) => {
                        const ChannelIcon = channel.Icon;
                        return (
                          <a
                            key={`${lead.id}-${channel.key}`}
                            href={channel.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            {ChannelIcon && <ChannelIcon className={`w-3 h-3 ${channel.color || ""}`} />}
                            {channel.label}
                          </a>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── DETAILS MODAL ── */}
      <Modal isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title="Lead Form Details" size="lg">
        <div className="space-y-5">
          {/* Quick contact actions */}
          {selectedLead && (selectedLead.phone || getLeadChannelTargets(selectedLead).length > 0) && (
            <div className="flex items-center gap-2 flex-wrap p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-2">Quick Actions</span>
              <LeadContactActions lead={selectedLead} onCompose={() => openComposeModal([selectedLead])} />
            </div>
          )}

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
          departments={branchDepartments}
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
