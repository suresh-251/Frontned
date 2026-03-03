// src/pages/Leads.jsx
// ─── IMPROVEMENTS IMPLEMENTED ────────────────────────────────────────────────
// 1. Pagination      — default 25/page, prev/next/page-number controls
// 2. Always-visible action icons — removed opacity-0 / group-hover pattern
// 3. View Lead       — fetches GET /api/Leads/{id} instead of using list data
// 4. Status display  — plain text badge in Leads table; dropdown only in Lead Manager
// 5. Status options  — removed "PERSONAL"; added "Qualified" and "CloseLead"
// 6. Delete fix      — optimistic removal + leadsAPI.delete(id)
// 7. Import Leads    — CSV/Excel file upload with validation + POST /api/Leads/import
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useRef, useCallback } from "react";
import leadsAPI from "../api/leads.api";
import { getLeads as getSocialLeads } from "../../socialCRM/api/facebook.leads.api";
import * as jwtDecode from "jwt-decode";
import Toast from "../utils/toast";
import {
  FaUsers, FaPlus, FaEye, FaTimesCircle, FaTrash, FaFileImport,
  FaList, FaTh, FaSearch, FaSync, FaFileExport, FaFilter,
  FaChevronDown, FaWhatsapp, FaCheck, FaTimes, FaCopy,
  FaPhone, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaGlobe,
  FaBullhorn, FaStickyNote, FaClock, FaUserTie, FaTachometerAlt,
  FaExchangeAlt, FaArrowUp, FaChartLine, FaChevronRight, FaChevronLeft,
  FaSpinner, FaUserCircle, FaStar, FaUpload, FaFileCsv,
} from "react-icons/fa";

// ─────────────────────────────────────────────
// STATUS CONFIG — UPDATED (5)
// Removed: PERSONAL
// Added:   Qualified, CloseLead
// ─────────────────────────────────────────────
const STATUS_OPTIONS = [
  "Lead",
  "Fresh Lead",
  "Interested",
  "Qualified",        // ← NEW
  "Contacted",
  "Follow-Up",
  "Active Client",
  "Re-Engagement",
  "CloseLead",        // ← NEW
  "Junk Lead",
  "Not interested",
  "Unable to contact",
];

const STATUS_NUMBER_MAP = {
  0: "Lead",
  1: "Interested",
  2: "Contacted",
  3: "Follow-Up",
  4: "Active Client",
  5: "Re-Engagement",
  6: "Qualified",
  7: "Junk Lead",
  8: "Fresh Lead",
  9: "Not interested",
  10: "Unable to contact",
};

// Status → color mapping (used by badge + dropdown)
const STATUS_COLOR_MAP = {
  "Lead":             "bg-blue-50 text-blue-700 border-blue-200",
  "Fresh Lead":       "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Interested":       "bg-amber-50 text-amber-700 border-amber-200",
  "Qualified":        "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Contacted":        "bg-violet-50 text-violet-700 border-violet-200",
  "Follow-Up":        "bg-orange-50 text-orange-700 border-orange-200",
  "Active Client":    "bg-green-50 text-green-700 border-green-200",
  "Re-Engagement":    "bg-purple-50 text-purple-700 border-purple-200",
  "CloseLead":        "bg-teal-50 text-teal-700 border-teal-200",
  "Junk Lead":        "bg-red-50 text-red-700 border-red-200",
  "Not interested":   "bg-gray-50 text-gray-600 border-gray-200",
  "Unable to contact":"bg-rose-50 text-rose-700 border-rose-200",
};

const getStatusColor = (status) =>
  STATUS_COLOR_MAP[status] || "bg-gray-50 text-gray-600 border-gray-200";

const normalizeLead = (lead) => ({
  ...lead,
  status:
    typeof lead.status === "number"
      ? (STATUS_NUMBER_MAP[lead.status] ?? `Status ${lead.status}`)
      : (lead.status ?? ""),
});

// ─────────────────────────────────────────────
// STATUS BADGE — plain text, no dropdown (for Leads table) (4)
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(status)}`}
  >
    {status || "—"}
  </span>
);

// ─────────────────────────────────────────────
// STATUS DROPDOWN — editable, for Lead Manager (4)
// ─────────────────────────────────────────────
const StatusDropdown = ({ leadId, currentStatus, onStatusChange }) => {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allOptions =
    currentStatus && !STATUS_OPTIONS.includes(currentStatus)
      ? [currentStatus, ...STATUS_OPTIONS]
      : STATUS_OPTIONS;

  const handleSelect = async (status) => {
    setOpen(false);
    if (status === currentStatus) return;
    try {
      setUpdating(true);
      // PUT /api/Leads/{id}
      await leadsAPI.update(leadId, { status });
      onStatusChange(leadId, status);
      Toast.success("Status updated");
    } catch {
      Toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={updating}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-opacity
          ${getStatusColor(currentStatus)}
          ${updating ? "opacity-50 cursor-wait" : "hover:opacity-80 cursor-pointer"}`}
      >
        {updating ? "Saving…" : currentStatus || "—"}
        <FaChevronDown className="w-2.5 h-2.5 opacity-70 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
          {allOptions.map((status) => (
            <button
              key={status}
              onClick={() => handleSelect(status)}
              className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between hover:bg-gray-50 text-gray-700
                ${status === currentStatus ? "font-semibold bg-gray-50" : ""}`}
            >
              <span>{status}</span>
              {status === currentStatus && <FaCheck className="w-3 h-3 opacity-60" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// AVATAR
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
// FILTER DROPDOWN
// ─────────────────────────────────────────────
const FilterDropdown = ({ label, options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:shadow-sm transition-all min-w-[160px]
          ${value ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
      >
        <span className="flex-1 text-left truncate">{value || label}</span>
        <FaChevronDown className="w-3 h-3 flex-shrink-0 text-gray-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1 max-h-60 overflow-y-auto">
          <button
            onClick={() => { onChange(""); setOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50"
          >
            All {label}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors
                ${value === opt ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// MODAL
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
// INPUT
// ─────────────────────────────────────────────
const Input = ({ label, name, type = "text", value, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={label}
      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
    />
  </div>
);

// ─────────────────────────────────────────────
// TOGGLE
// ─────────────────────────────────────────────
const Toggle = ({ label, name, checked, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <div className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-indigo-500" : "bg-gray-200"}`}>
      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only" />
    </div>
    <span className="text-sm text-gray-600 group-hover:text-gray-800">{label}</span>
  </label>
);

// ─────────────────────────────────────────────
// PAGINATION COMPONENT (1)
// ─────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, pageSize }) => {
  if (totalPages <= 1) return null;

  // Build page number array with ellipsis
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
// IMPORT LEADS MODAL (7)
// ─────────────────────────────────────────────
const ImportLeadsModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  const ACCEPTED = [".csv", ".xlsx", ".xls"];
  const MAX_SIZE_MB = 10;

  const validateFile = (f) => {
    if (!f) return "Please select a file.";
    const ext = "." + f.name.split(".").pop().toLowerCase();
    if (!ACCEPTED.includes(ext)) return `Unsupported format. Use ${ACCEPTED.join(", ")}.`;
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File too large (max ${MAX_SIZE_MB} MB).`;
    return null;
  };

  const handleFileChange = (f) => {
    setError("");
    setPreview(null);
    const validationError = validateFile(f);
    if (validationError) { setError(validationError); return; }
    setFile(f);

    // Show lightweight preview for CSV
    if (f.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const lines = e.target.result.split("\n").slice(0, 4);
        setPreview(lines);
      };
      reader.readAsText(f);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileChange(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) { setError(validationError); return; }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      // POST /api/Leads/import
      const response = await fetch("/api/Leads/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Upload failed (${response.status})`);
      }

      const data = await response.json();
      Toast.success(`Imported ${data.imported ?? "?"} leads successfully`);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Import failed. Please try again.");
      Toast.error("Import failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Import Leads" size="md">
      <div className="space-y-5">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${file ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files[0])}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FaFileCsv className="w-10 h-10 text-indigo-500" />
              <p className="text-sm font-semibold text-indigo-700">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                className="text-xs text-rose-500 hover:text-rose-700 font-medium mt-1"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <FaUpload className="w-8 h-8 text-gray-300" />
              <p className="text-sm text-gray-500 font-medium">Drop your file here or click to browse</p>
              <p className="text-xs text-gray-400">Supports CSV, XLSX, XLS · Max {MAX_SIZE_MB} MB</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            <FaTimes className="w-3 h-3 flex-shrink-0" /> {error}
          </div>
        )}

        {/* CSV Preview */}
        {preview && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Preview (first 3 rows)</p>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-xs">
                {preview.map((row, i) => (
                  <tr key={i} className={i === 0 ? "bg-gray-50 font-semibold" : "border-t border-gray-50"}>
                    {row.split(",").map((cell, j) => (
                      <td key={j} className="px-3 py-1.5 text-gray-700 whitespace-nowrap">{cell.trim()}</td>
                    ))}
                  </tr>
                ))}
              </table>
            </div>
          </div>
        )}

        {/* Template hint */}
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-xs text-amber-700">
          <p className="font-semibold mb-1">Required CSV columns:</p>
          <p className="text-amber-600">name, email, phone, company, source, status</p>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center gap-2 px-5 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {uploading ? <FaSpinner className="w-3.5 h-3.5 animate-spin" /> : <FaUpload className="w-3.5 h-3.5" />}
            {uploading ? "Importing…" : "Import Leads"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// VIEW LEAD MODAL
// Uses the lead object passed directly from the list (instant open),
// then optionally enriches with GET /api/Leads/{id} for extra fields.
// Never closes on API failure — always shows what we have.
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// CONTACT HISTORY MODAL — name, id, history only
// ─────────────────────────────────────────────
const ContactHistoryModal = ({ leadId, leadName, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const authHeader = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    if (!leadId) return;
    const fetch_ = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await fetch(`/api/Leads/${leadId}/contact-history`, { headers: authHeader });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : data.data ?? data.history ?? data.items ?? []);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [leadId]);

  const formatDateTime = (val) => {
    if (!val) return "—";
    return new Date(val).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const timeAgo = (val) => {
    if (!val) return "—";
    const diff = Math.floor((Date.now() - new Date(val)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return formatDateTime(val);
  };

  const getContactStyle = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("call") || t.includes("phone")) return { icon: FaPhone, color: "bg-blue-100 text-blue-600", label: "Call" };
    if (t.includes("email") || t.includes("mail")) return { icon: FaEnvelope, color: "bg-violet-100 text-violet-600", label: "Email" };
    if (t.includes("whatsapp") || t.includes("wa"))  return { icon: FaWhatsapp, color: "bg-green-100 text-green-600", label: "WhatsApp" };
    if (t.includes("note") || t.includes("comment")) return { icon: FaStickyNote, color: "bg-amber-100 text-amber-600", label: "Note" };
    if (t.includes("meet") || t.includes("visit"))   return { icon: FaUserTie, color: "bg-indigo-100 text-indigo-600", label: "Meeting" };
    return { icon: FaClock, color: "bg-gray-100 text-gray-500", label: type || "Activity" };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — only name + id */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-800 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
              {leadName ? leadName.charAt(0).toUpperCase() : "?"}
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">{leadName || "Unknown"}</p>
              <p className="text-sky-200 text-xs">ID #{leadId} · Contact History</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors">
            <FaTimesCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Body — history only */}
        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                    <div className="h-2 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <FaTimesCircle className="w-8 h-8 mx-auto mb-2 text-rose-200" />
              <p className="text-sm text-gray-400">Failed to load history</p>
              <button
                onClick={() => { setError(false); setLoading(true); }}
                className="mt-3 text-xs text-sky-500 hover:text-sky-700 font-medium"
              >Retry</button>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
                <FaClock className="w-6 h-6 text-gray-200" />
              </div>
              <p className="text-sm font-medium text-gray-400">No contact history yet</p>
              <p className="text-xs text-gray-300 mt-1">Calls, emails and messages will appear here</p>
            </div>
          ) : (
            <div className="relative">
              {/* Count */}
              <p className="text-xs text-gray-400 mb-4">{history.length} {history.length === 1 ? "entry" : "entries"}</p>
              {/* Vertical connector line */}
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-100" />
              <div className="space-y-4">
                {history.map((entry, idx) => {
                  const style = getContactStyle(entry.type ?? entry.contactType ?? entry.method ?? "");
                  const Icon = style.icon;
                  const timestamp = entry.contactedAt ?? entry.date ?? entry.createdAt ?? entry.timestamp;
                  const note      = entry.notes ?? entry.note ?? entry.comment ?? entry.description ?? entry.remarks ?? "";
                  const agent     = entry.agentName ?? entry.userName ?? entry.createdByName ?? entry.agent ?? "";
                  const outcome   = entry.outcome ?? entry.result ?? entry.status ?? "";
                  const duration  = entry.duration ?? entry.durationMinutes ?? null;

                  return (
                    <div key={idx} className="relative flex gap-3">
                      {/* Icon bubble */}
                      <div className={`relative z-10 w-8 h-8 rounded-full ${style.color} flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {/* Card */}
                      <div className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.color}`}>{style.label}</span>
                            {outcome && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                                ${outcome.toLowerCase().includes("success") || outcome.toLowerCase().includes("answer") || outcome.toLowerCase().includes("connect")
                                  ? "bg-green-50 text-green-700"
                                  : outcome.toLowerCase().includes("fail") || outcome.toLowerCase().includes("no answer") || outcome.toLowerCase().includes("busy")
                                    ? "bg-red-50 text-red-600"
                                    : "bg-gray-50 text-gray-600"}`}>
                                {outcome}
                              </span>
                            )}
                            {duration && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <FaClock className="w-2.5 h-2.5" /> {duration}m
                              </span>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-xs text-gray-400 font-medium">{timeAgo(timestamp)}</p>
                            <p className="text-[10px] text-gray-300">{formatDateTime(timestamp)}</p>
                          </div>
                        </div>
                        {note && (
                          <p className="text-xs text-gray-600 leading-relaxed mt-1.5 bg-gray-50 rounded-lg px-3 py-2">
                            "{note}"
                          </p>
                        )}
                        {agent && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-4 h-4 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-[10px] font-bold flex-shrink-0">
                              {String(agent).charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[10px] text-gray-400">{agent}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3 flex justify-end bg-gray-50 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-1.5 text-xs text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg font-medium transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// VIEW LEAD MODAL — no history tab, no history references
// ─────────────────────────────────────────────
const ViewLeadModal = ({ leadId, leadData, onClose, onStatusChange, onDelete }) => {
  const [lead, setLead] = useState(leadData ? normalizeLead(leadData) : null);
  const [loading, setLoading] = useState(!leadData);
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState("");

  const authHeader = { Authorization: `Bearer ${localStorage.getItem("token")}` };

  useEffect(() => {
    if (!leadId) return;
    const fetchLead = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/Leads/${leadId}`, { headers: authHeader });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setLead(normalizeLead(await res.json()));
      } catch {
        if (!lead) { Toast.error("Failed to load lead details"); onClose(); }
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [leadId]);

  const copy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  };

  const fmt = (val) => {
    if (!val) return "—";
    return new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };
  const fmtDate = (val) => {
    if (!val) return "—";
    return new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const TABS = ["overview", "campaign", "location", "notes"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && !lead ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <FaSpinner className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-sm text-gray-400">Loading lead details…</p>
          </div>
        ) : lead ? (
          <>
            {/* HEADER */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-5 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {lead.name ? lead.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white leading-tight">{lead.name || "Unknown Lead"}</h2>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-indigo-200 text-xs">#{lead.id}</span>
                      {lead.company && (<><span className="text-indigo-400 text-xs">•</span><span className="text-indigo-200 text-xs">{lead.company}</span></>)}
                    </div>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors">
                  <FaTimesCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <StatusBadge status={lead.status} />
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg transition-colors">
                    <FaPhone className="w-3 h-3" /> Call
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg transition-colors">
                    <FaEnvelope className="w-3 h-3" /> Email
                  </a>
                )}
                {lead.whatsappEnabled && lead.phone && (
                  <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-400 text-white text-xs font-medium rounded-lg transition-colors">
                    <FaWhatsapp className="w-3 h-3" /> WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* TABS — no history */}
            <div className="flex border-b border-gray-100 bg-white flex-shrink-0 px-2">
              {TABS.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-all border-b-2 -mb-px capitalize
                    ${activeTab === tab ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* BODY */}
            <div className="overflow-y-auto flex-1 p-6">

              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  <section>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Contact Details</p>
                    <div className="space-y-2">
                      {lead.phone && (
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                          <div className="flex items-center gap-3">
                            <FaPhone className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            <div><p className="text-xs text-gray-400 mb-0.5">Phone</p><p className="text-sm font-semibold text-gray-800">{lead.phone}</p></div>
                          </div>
                          <button onClick={() => copy(lead.phone, "phone")} className="p-1.5 rounded hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 transition-colors">
                            {copied === "phone" ? <FaCheck className="w-3 h-3 text-green-500" /> : <FaCopy className="w-3 h-3" />}
                          </button>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                          <div className="flex items-center gap-3">
                            <FaEnvelope className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            <div><p className="text-xs text-gray-400 mb-0.5">Email</p><p className="text-sm font-semibold text-gray-800">{lead.email}</p></div>
                          </div>
                          <button onClick={() => copy(lead.email, "email")} className="p-1.5 rounded hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 transition-colors">
                            {copied === "email" ? <FaCheck className="w-3 h-3 text-green-500" /> : <FaCopy className="w-3 h-3" />}
                          </button>
                        </div>
                      )}
                      {lead.company && (
                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                          <FaBuilding className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          <div><p className="text-xs text-gray-400 mb-0.5">Company</p><p className="text-sm font-semibold text-gray-800">{lead.company}</p></div>
                        </div>
                      )}
                      {!lead.phone && !lead.email && !lead.company && (
                        <p className="text-sm text-gray-400 italic">No contact details available</p>
                      )}
                    </div>
                  </section>

                  <section>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Lead Details</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Source",      value: lead.source || "—" },
                        { label: "Assigned To", value: lead.assignedToUserId != null ? `User #${lead.assignedToUserId}` : "—" },
                        { label: "Score",       value: lead.score != null ? lead.score : "—" },
                        { label: "SLA Hours",   value: lead.slaHours != null ? `${lead.slaHours}h` : "—" },
                        { label: "Deposits",    value: lead.deposits != null ? `₹${Number(lead.deposits).toLocaleString("en-IN")}` : "—" },
                        { label: "Position",    value: lead.position || "—" },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                          <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                          <p className="text-sm font-semibold text-gray-800">{value}</p>
                        </div>
                      ))}
                      <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                        <p className="text-xs text-gray-400 mb-0.5">SLA Breached</p>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${lead.isSlaBreached ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {lead.isSlaBreached ? "Breached" : "Within SLA"}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Timeline</p>
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      {[
                        { label: "Created",       value: lead.createdAt,       icon: FaPlus,  color: "text-indigo-400" },
                        { label: "First Response", value: lead.firstResponseAt, icon: FaCheck, color: "text-green-400" },
                        { label: "Last Contacted", value: lead.lastContactedAt, icon: FaPhone, color: "text-blue-400" },
                      ].map(({ label, value, icon: Icon, color }, i) => (
                        <div key={label} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-gray-50" : ""} ${value ? "bg-white" : "bg-gray-50/50"}`}>
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-3.5 h-3.5 ${value ? color : "text-gray-200"}`} />
                            <span className={`text-xs font-medium ${value ? "text-gray-600" : "text-gray-300"}`}>{label}</span>
                          </div>
                          <span className={`text-xs font-semibold ${value ? "text-gray-800" : "text-gray-300"}`}>{fmt(value)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* CAMPAIGN */}
              {activeTab === "campaign" && (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Campaign Information</p>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { label: "Source",          value: lead.source,         desc: "Where the lead originally came from" },
                      { label: "Campaign Name",   value: lead.campaignName,   desc: "The marketing campaign name" },
                      { label: "Campaign Source", value: lead.campaignSource, desc: "Platform or channel" },
                      { label: "Campaign Medium", value: lead.campaignMedium, desc: "Medium type (CPC, email, organic)" },
                    ].map(({ label, value, desc }) => (
                      <div key={label} className={`rounded-lg px-4 py-3 border ${value ? "bg-indigo-50 border-indigo-100" : "bg-gray-50 border-gray-100"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                            <p className={`text-sm font-semibold ${value ? "text-indigo-800" : "text-gray-400"}`}>{value || "Not set"}</p>
                          </div>
                          {value && (
                            <button onClick={() => copy(value, label)} className="p-1.5 rounded hover:bg-indigo-100 text-indigo-300 hover:text-indigo-600 transition-colors">
                              {copied === label ? <FaCheck className="w-3 h-3 text-green-500" /> : <FaCopy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LOCATION */}
              {activeTab === "location" && (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Location Details</p>
                  {!(lead.address || lead.city || lead.state || lead.country || lead.zipCode) ? (
                    <div className="text-center py-10 text-gray-300">
                      <FaMapMarkerAlt className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No location data available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Address",  value: lead.address },
                        { label: "City",     value: lead.city },
                        { label: "State",    value: lead.state },
                        { label: "Country",  value: lead.country },
                        { label: "Zip Code", value: lead.zipCode },
                        { label: "Website",  value: lead.website },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                          <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                          {label === "Website" && value ? (
                            <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noreferrer"
                              className="text-sm font-semibold text-indigo-600 hover:underline truncate block">{value}</a>
                          ) : (
                            <p className="text-sm font-semibold text-gray-800">{value || "—"}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* NOTES */}
              {activeTab === "notes" && (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Notes & Description</p>
                  {!lead.comments && !lead.description ? (
                    <div className="text-center py-10 text-gray-300">
                      <FaStickyNote className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No notes added for this lead</p>
                    </div>
                  ) : (
                    <>
                      {lead.comments && (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                          <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-2">Comments</p>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{lead.comments}</p>
                        </div>
                      )}
                      {lead.description && (
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Description</p>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{lead.description}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between bg-gray-50 flex-shrink-0">
              <p className="text-xs text-gray-400">
                Created {fmtDate(lead.createdAt)}
                {lead.lastContactedAt && ` · Last contact ${fmtDate(lead.lastContactedAt)}`}
              </p>
              <div className="flex gap-2">
                {lead.id && (
                  <button onClick={() => onDelete(lead.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors font-medium">
                    <FaTrash className="w-3 h-3" /> Delete
                  </button>
                )}
                <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors font-medium">
                  Close
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// LEAD MANAGER — with editable status dropdown (4)
// ─────────────────────────────────────────────
const leadManagerAPI = {
  getDashboard: () =>
    fetch("/api/LeadManager/dashboard", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((r) => r.json()),
  getConversionRate: () =>
    fetch("/api/LeadManager/performance/Convertionrate", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((r) => r.json()),
  reassignLead: (leadId, newUserId) =>
    fetch(`/api/LeadManager/reassign/${leadId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ newUserId: Number(newUserId) }),
    }).then((r) => r.json()),
  escalateLead: (leadId, data) =>
    fetch(`/api/LeadManager/escalate/${leadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
};

const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-start gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-0.5">{value ?? "—"}</p>
      {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
    </div>
  </div>
);

const ReassignModal = ({ lead, onClose, onSuccess }) => {
  const [newUserId, setNewUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newUserId) return Toast.error("Please enter a user ID");
    try {
      setLoading(true);
      await leadManagerAPI.reassignLead(lead.id, newUserId);
      Toast.success("Lead reassigned successfully");
      onSuccess();
      onClose();
    } catch {
      Toast.error("Failed to reassign lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Reassign Lead #${lead.id}`} size="sm">
      <div className="space-y-4">
        <div className="bg-indigo-50 rounded-lg p-3 flex items-center gap-3 border border-indigo-100">
          <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
            {lead.name ? lead.name.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{lead.name || "—"}</p>
            <p className="text-xs text-gray-500">Currently: User #{lead.assignedToUserId ?? "Unassigned"}</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New User ID</label>
          <input
            type="number"
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            placeholder="Enter user ID to assign"
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium disabled:opacity-50">
            {loading && <FaSpinner className="w-3 h-3 animate-spin" />} Reassign
          </button>
        </div>
      </div>
    </Modal>
  );
};

const EscalateModal = ({ lead, onClose, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("high");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return Toast.error("Please provide an escalation reason");
    try {
      setLoading(true);
      await leadManagerAPI.escalateLead(lead.id, { reason, priority });
      Toast.success("Lead escalated successfully");
      onSuccess();
      onClose();
    } catch {
      Toast.error("Failed to escalate lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Escalate Lead #${lead.id}`} size="sm">
      <div className="space-y-4">
        <div className="bg-rose-50 rounded-lg p-3 flex items-center gap-3 border border-rose-100">
          <div className="w-8 h-8 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 font-bold text-sm">
            {lead.name ? lead.name.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{lead.name || "—"}</p>
            <p className="text-xs text-gray-500">Status: {lead.status || "—"}</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</label>
          <div className="flex gap-2">
            {["low", "medium", "high", "critical"].map((p) => (
              <button key={p} onClick={() => setPriority(p)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize
                  ${priority === p
                    ? p === "critical" ? "bg-red-600 text-white border-red-600"
                      : p === "high" ? "bg-orange-500 text-white border-orange-500"
                        : p === "medium" ? "bg-amber-400 text-white border-amber-400"
                          : "bg-green-500 text-white border-green-500"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
              >{p}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe why this lead needs escalation..." rows={3}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 bg-gray-50 resize-none" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-700 rounded-lg font-medium disabled:opacity-50">
            {loading && <FaSpinner className="w-3 h-3 animate-spin" />}
            <FaArrowUp className="w-3 h-3" /> Escalate
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Lead Manager Section — uses StatusDropdown (editable) + pagination (1)
const LeadManagerSection = ({ leads, onRefresh, onStatusChange }) => {
  const [dashboard, setDashboard] = useState(null);
  const [conversionRate, setConversionRate] = useState(null);
  const [loadingDash, setLoadingDash] = useState(true);
  const [reassignLead, setReassignLead] = useState(null);
  const [escalateLead, setEscalateLead] = useState(null);
  const [managerSearch, setManagerSearch] = useState("");
  const [managerTab, setManagerTab] = useState("dashboard");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25; // (1) default 25

  useEffect(() => {
    leadManagerAPI.getDashboard()
      .then(setDashboard)
      .catch(() => Toast.error("Failed to load dashboard"))
      .finally(() => setLoadingDash(false));
    leadManagerAPI.getConversionRate()
      .then(setConversionRate)
      .catch(() => { });
  }, []);

  useEffect(() => { setCurrentPage(1); }, [managerSearch]);

  const filteredLeads = leads.filter((l) => {
    if (!managerSearch) return true;
    const q = managerSearch.toLowerCase();
    return (
      (l.name || "").toLowerCase().includes(q) ||
      (l.phone || "").toLowerCase().includes(q) ||
      (l.status || "").toLowerCase().includes(q) ||
      String(l.assignedToUserId || "").includes(q)
    );
  });

  const totalPages = Math.ceil(filteredLeads.length / PAGE_SIZE);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-gray-200">
        {[{ key: "dashboard", label: "Dashboard", icon: FaTachometerAlt }, { key: "leads", label: "Lead Actions", icon: FaExchangeAlt }].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setManagerTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px
              ${managerTab === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {managerTab === "dashboard" && (
        <div className="space-y-5">
          {loadingDash ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
                  <div className="h-8 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={FaUsers} label="Total Leads" value={dashboard?.totalLeads ?? leads.length} color="bg-indigo-500" subtext="All time" />
              <StatCard icon={FaChartLine} label="Conversion Rate"
                value={conversionRate?.rate != null ? `${Number(conversionRate.rate).toFixed(1)}%` : "—"}
                color="bg-emerald-500" subtext="Lead → Client" />
              <StatCard icon={FaUserTie} label="Active Clients"
                value={dashboard?.activeClients ?? leads.filter((l) => l.status === "Active Client").length}
                color="bg-green-500" subtext="Currently active" />
              <StatCard icon={FaStar} label="Interested"
                value={dashboard?.interested ?? leads.filter((l) => l.status === "Interested").length}
                color="bg-amber-500" subtext="High potential" />
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Lead Status Breakdown</h3>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((status) => {
                const count = leads.filter((l) => l.status === status).length;
                const pct = leads.length ? Math.round((count / leads.length) * 100) : 0;
                if (count === 0) return null;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-36 truncate">{status}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{count}</span>
                  </div>
                );
              })}
              {leads.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No leads to display</p>}
            </div>
          </div>
        </div>
      )}

      {managerTab === "leads" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-gray-500">
              Showing {paginatedLeads.length} of {filteredLeads.length} leads
            </p>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Search leads..." value={managerSearch}
                onChange={(e) => setManagerSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 w-52" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["#", "Name", "Phone", "Status", "Assigned To", "Last Contact", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        <FaUsers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No leads found</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-indigo-600 font-medium">{lead.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={lead.name} />
                            <span className="font-medium text-gray-800">{lead.name || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{lead.phone || "—"}</td>
                        {/* (4) Editable status dropdown in Lead Manager */}
                        <td className="px-4 py-3">
                          <StatusDropdown leadId={lead.id} currentStatus={lead.status} onStatusChange={onStatusChange} />
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {lead.assignedToUserId ? `User #${lead.assignedToUserId}` : <span className="text-gray-300">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {lead.lastContactedAt
                            ? new Date(lead.lastContactedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                        </td>
                        {/* (2) Always-visible action buttons */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setReassignLead(lead)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors">
                              <FaExchangeAlt className="w-3 h-3" /> Reassign
                            </button>
                            <button onClick={() => setEscalateLead(lead)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors">
                              <FaArrowUp className="w-3 h-3" /> Escalate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* (1) Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredLeads.length}
              pageSize={PAGE_SIZE}
            />
          </div>
        </div>
      )}

      {reassignLead && <ReassignModal lead={reassignLead} onClose={() => setReassignLead(null)} onSuccess={onRefresh} />}
      {escalateLead && <EscalateModal lead={escalateLead} onClose={() => setEscalateLead(null)} onSuccess={onRefresh} />}
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const Leads = () => {
  const [salesLeads, setSalesLeads] = useState([]);
  const [socialLeads, setSocialLeads] = useState([]);
  const [activeType, setActiveType] = useState("sales");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  // Two separate modals — eye opens full view, clock opens history only
  const [viewLeadEntry, setViewLeadEntry] = useState(null);   // { id, data }
  const [historyEntry, setHistoryEntry] = useState(null);     // { id, name }
  const openLeadView = (lead) => setViewLeadEntry({ id: lead.id, data: lead });
  const closeLeadView = () => setViewLeadEntry(null);
  const openHistory = (lead) => setHistoryEntry({ id: lead.id, name: lead.name });
  const closeHistory = () => setHistoryEntry(null);
  const [formData, setFormData] = useState({});

  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // (1) Pagination state — default 25
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [filterStatus, filterSource, searchQuery, activeType]);

  // ── Auth ──
  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const decoded = jwtDecode.default(token);
      return decoded.userId || decoded.sub;
    } catch { return null; }
  };

  // ── Fetch ──
  const fetchSalesLeads = async () => {
    try {
      setLoading(true);
      const data = await leadsAPI.getAll();
      setSalesLeads(Array.isArray(data) ? data.map(normalizeLead) : []);
    } catch {
      Toast.error("Failed to load sales leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchSocialLeads = async () => {
    try {
      const userId = getUserIdFromToken();
      if (!userId) return;
      const data = await getSocialLeads({ assignedToUserId: userId });
      setSocialLeads(Array.isArray(data) ? data.map(normalizeLead) : []);
    } catch {
      Toast.error("Failed to load social leads");
    }
  };

  const refreshAll = () => {
    fetchSalesLeads();
    fetchSocialLeads();
  };

  useEffect(() => { refreshAll(); }, []);

  // ── Status change (shared) ──
  const handleStatusChange = (leadId, newStatus) => {
    setSalesLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));
    setSocialLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  // ── Form handlers ──
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCreate = async () => {
    try {
      await leadsAPI.create(formData);
      Toast.success("Lead created successfully");
      setIsAddOpen(false);
      setFormData({});
      fetchSalesLeads();
    } catch {
      Toast.error("Failed to create lead");
    }
  };

  // (6) Delete fix — optimistic removal, tries leadsAPI.delete then direct fetch fallback
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this lead? This cannot be undone.")) return;

    // Optimistic: remove from UI immediately so it feels instant
    setSalesLeads((prev) => prev.filter((l) => l.id !== id));
    setSocialLeads((prev) => prev.filter((l) => l.id !== id));
    closeLeadView();

    try {
      // Primary: use the API module (DELETE /api/Leads/{id})
      await leadsAPI.delete(id);
      Toast.success("Lead deleted");
    } catch {
      // Fallback: direct fetch in case leadsAPI.delete isn't wired correctly
      try {
        const res = await fetch(`/api/Leads/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        Toast.success("Lead deleted");
      } catch (err) {
        Toast.error(`Delete failed (${err.message}) — refreshing`);
        // Rollback: re-fetch to restore correct state
        fetchSalesLeads();
      }
    }
  };

  // ── Date formatter ──
  const formatDate = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "1 mo ago" : `${months} mo ago`;
  };

  // ── Filter & search ──
  const rawLeads = activeType === "sales" ? salesLeads : socialLeads;
  const filteredLeads = rawLeads.filter((lead) => {
    if (filterStatus && lead.status !== filterStatus) return false;
    if (filterSource && lead.source !== filterSource) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (lead.name || "").toLowerCase().includes(q) ||
        (lead.email || "").toLowerCase().includes(q) ||
        (lead.phone || "").toLowerCase().includes(q) ||
        (lead.company || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort by real lead.id ascending (smallest ID first)
  const sortedLeads = [...filteredLeads].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));

  // Pagination
  const totalPages = Math.ceil(sortedLeads.length / pageSize);
  const paginatedLeads = sortedLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const uniqueSources = [...new Set(rawLeads.map((l) => l.source).filter(Boolean))];

  // ── Add modal fields ──
  // NOTE: LeadCard is defined here (inside Leads but before return) so it correctly
  // captures openLeadView, openHistory, handleDelete, activeType, formatDate from closure.
  const LeadCard = ({ lead }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-indigo-200 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Avatar name={lead.name} />
          <div>
            <p className="text-sm font-semibold text-gray-800">{lead.name || "—"}</p>
            <p className="text-xs text-gray-400">#{lead.id}</p>
          </div>
        </div>
        <StatusBadge status={lead.status} />
      </div>
      {lead.email && <p className="text-xs text-indigo-500 mb-1 truncate">{lead.email}</p>}
      {lead.phone && <p className="text-xs text-gray-500 mb-1">{lead.phone}</p>}
      {lead.source && <p className="text-xs text-gray-400 mb-3">Source: {lead.source}</p>}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-400">{formatDate(lead.createdAt)}</span>
        <div className="flex gap-1">
          <button onClick={() => openLeadView(lead)}
            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors" title="View lead">
            <FaEye className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => openHistory(lead)}
            className="p-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors" title="Contact history">
            <FaClock className="w-3.5 h-3.5" />
          </button>
          {activeType === "sales" && (
            <button onClick={() => handleDelete(lead.id)}
              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors" title="Delete">
              <FaTrash className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const leadFields = [
    { name: "name", label: "Name" }, { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone" }, { name: "company", label: "Company" },
    { name: "position", label: "Position" }, { name: "source", label: "Source" },
    { name: "campaignName", label: "Campaign Name" }, { name: "campaignSource", label: "Campaign Source" },
    { name: "campaignMedium", label: "Campaign Medium" }, { name: "status", label: "Status" },
    { name: "assignedToUserId", label: "Assigned User ID", type: "number" },
    { name: "address", label: "Address" }, { name: "city", label: "City" },
    { name: "state", label: "State" }, { name: "country", label: "Country" },
    { name: "zipCode", label: "Zip Code" }, { name: "website", label: "Website" },
    { name: "deposits", label: "Deposits", type: "number" },
  ];
  const checkboxFields = [
    { name: "isPublic", label: "Is Public" },
    { name: "contactedToday", label: "Contacted Today" },
    { name: "whatsappEnabled", label: "WhatsApp Enabled" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-5">

        {/* ── Top Action Bar ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all active:scale-95">
            <FaPlus className="w-3.5 h-3.5" /> New Lead
          </button>
          {/* (7) Import button opens modal */}
          <button onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 shadow-sm transition-all active:scale-95">
            <FaFileImport className="w-3.5 h-3.5 text-indigo-500" /> Import Leads
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

        {/* ── Lead type sub-tabs ── */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {["sales", "social"].map((type) => (
            <button key={type} onClick={() => setActiveType(type)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all
                ${activeType === type ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {type === "sales" ? "Sales Leads" : "Social Leads"}
            </button>
          ))}
        </div>

        {/* ── Filter Bar ── */}
        <div className="flex items-center gap-3 flex-wrap bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
          <FaFilter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-500 font-medium">Filter</span>
          <FilterDropdown label="Status" options={STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
          <FilterDropdown label="Source" options={uniqueSources} value={filterSource} onChange={setFilterSource} />
          {(filterStatus || filterSource) && (
            <button onClick={() => { setFilterStatus(""); setFilterSource(""); }}
              className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1">
              <FaTimes className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        {/* ── Table Toolbar ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {/* (1) Page size selector */}
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {[25, 50, 100, 200].map((n) => <option key={n}>{n}</option>)}
            </select>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all"
              onClick={() => {
                // Export filtered leads as CSV
                const headers = ["ID","Name","Email","Phone","Company","Status","Source","Assigned To","Deposits","Last Contact","Created"];
                const rows = filteredLeads.map(l => [
                  l.id,
                  l.name || "",
                  l.email || "",
                  l.phone || "",
                  l.company || "",
                  l.status || "",
                  l.source || "",
                  l.assignedToUserId != null ? `User #${l.assignedToUserId}` : "",
                  l.deposits != null ? l.deposits : "",
                  l.lastContactedAt ? new Date(l.lastContactedAt).toLocaleDateString("en-IN") : "",
                  l.createdAt ? new Date(l.createdAt).toLocaleDateString("en-IN") : "",
                ]);
                const csv = [headers, ...rows]
                  .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
                  .join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `leads_export_${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                Toast.success(`Exported ${filteredLeads.length} leads`);
              }}>
              <FaFileExport className="w-3.5 h-3.5" /> Export
            </button>
            <button onClick={refreshAll}
              className="p-1.5 text-gray-400 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all" title="Refresh">
              <FaSync className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">
              {filteredLeads.length} leads
              {filteredLeads.length !== rawLeads.length && ` (filtered from ${rawLeads.length})`}
            </p>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 w-52" />
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
                    <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></th>
                    {["#", "Name", "Comments", "Email", "Phone", "Value", "Assigned", "Status", "Source", "Last Contact", "Created", "WA", "Actions"].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 14 }).map((_, j) => (
                          <td key={j} className="px-3 py-3"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
                        ))}
                      </tr>
                    ))
                  ) : paginatedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="text-center py-16 text-gray-400">
                        <FaUsers className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No leads found</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedLeads.map((lead, idx) => {
                      // Check all possible field names the API might return for assigned user
                      const assignedId = lead.assignedToUserId ?? lead.assignedTo ?? lead.assigned ?? null;
                      const assignedName = lead.assignedToUserName ?? lead.assignedUserName ?? lead.assignedName ?? null;
                      const assignedLabel = assignedName
                        ? assignedName
                        : assignedId != null
                          ? `User #${assignedId}`
                          : null;
                      const assignedInitial = assignedName
                        ? assignedName.charAt(0).toUpperCase()
                        : assignedId != null
                          ? String(assignedId).charAt(0)
                          : "?";
                      return (
                        <tr key={lead.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>

                          {/* # — real DB lead ID from API */}
                          <td className="px-3 py-3">
                            <span className="text-indigo-600 font-medium">{lead.id}</span>
                          </td>

                          <td className="px-3 py-3 font-medium">
                            <span
                              className="text-indigo-600 hover:underline cursor-pointer"
                              onClick={() => openLeadView(lead)}
                            >
                              {lead.name || "/"}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-gray-500 max-w-[120px] truncate text-xs">{lead.comments || "—"}</td>
                          <td className="px-3 py-3 text-indigo-500 text-xs">{lead.email || "—"}</td>
                          <td className="px-3 py-3 text-gray-600">{lead.phone || "—"}</td>
                          <td className="px-3 py-3 text-gray-500">{lead.deposits != null ? `₹${lead.deposits}` : "—"}</td>

                          {/* Assigned — avatar initial + label text */}
                          <td className="px-3 py-3">
                            {assignedLabel ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                                  {assignedInitial}
                                </div>
                                <span className="text-xs text-gray-700 font-medium">{assignedLabel}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300 italic">Unassigned</span>
                            )}
                          </td>

                          <td className="px-3 py-3"><StatusBadge status={lead.status} /></td>
                          <td className="px-3 py-3 text-gray-500 whitespace-nowrap text-xs">{lead.source || "—"}</td>
                          <td className="px-3 py-3 text-gray-400 whitespace-nowrap text-xs">{formatDate(lead.lastContactedAt)}</td>
                          <td className="px-3 py-3 text-gray-400 whitespace-nowrap text-xs">{formatDate(lead.createdAt)}</td>
                          <td className="px-3 py-3">
                            {lead.whatsappEnabled
                              ? <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">Enabled</span>
                              : <span className="text-xs text-gray-300 font-medium">Disabled</span>}
                          </td>

                          {/* Actions: Eye | History | Delete */}
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openLeadView(lead)}
                                className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                title="View lead"
                              >
                                <FaEye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openHistory(lead)}
                                className="p-1.5 rounded-md bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                                title="Contact history"
                              >
                                <FaClock className="w-3.5 h-3.5" />
                              </button>
                              {activeType === "sales" && (
                                <button
                                  onClick={() => handleDelete(lead.id)}
                                  className="p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                  title="Delete lead"
                                >
                                  <FaTrash className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* (1) Pagination controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredLeads.length}
              pageSize={pageSize}
            />
          </div>
        ) : (
          /* ── GRID VIEW ── */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                        <div className="h-2 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))
                : paginatedLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
              {!loading && paginatedLeads.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-400">
                  <FaUsers className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No leads found</p>
                </div>
              )}
            </div>
            {/* (1) Grid pagination */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredLeads.length}
                pageSize={pageSize}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── ADD LEAD MODAL ── */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="New Lead" size="xl">
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {leadFields.filter((f) => ["name", "email", "phone", "company", "position"].includes(f.name)).map((f) => (
                <Input key={f.name} {...f} value={formData[f.name] || ""} onChange={handleChange} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Location</h3>
            <div className="grid grid-cols-3 gap-4">
              {leadFields.filter((f) => ["address", "city", "state", "country", "zipCode", "website"].includes(f.name)).map((f) => (
                <Input key={f.name} {...f} value={formData[f.name] || ""} onChange={handleChange} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Campaign & Source</h3>
            <div className="grid grid-cols-2 gap-4">
              {leadFields.filter((f) => ["source", "campaignName", "campaignSource", "campaignMedium"].includes(f.name)).map((f) => (
                <Input key={f.name} {...f} value={formData[f.name] || ""} onChange={handleChange} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Assignment & Status</h3>
            <div className="grid grid-cols-3 gap-4">
              {leadFields.filter((f) => ["status", "assignedToUserId", "deposits"].includes(f.name)).map((f) => (
                <Input key={f.name} {...f} value={formData[f.name] || ""} onChange={handleChange} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Notes</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Comments</label>
                <textarea name="comments" value={formData.comments || ""} onChange={handleChange} rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 hover:bg-white resize-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Description</label>
                <textarea name="description" value={formData.description || ""} onChange={handleChange} rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 hover:bg-white resize-none" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Settings</h3>
            <div className="flex flex-wrap gap-6">
              {checkboxFields.map((f) => (
                <Toggle key={f.name} {...f} checked={!!formData[f.name]}
                  onChange={(e) => setFormData({ ...formData, [f.name]: e.target.checked })} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button onClick={() => { setIsAddOpen(false); setFormData({}); }}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium">
              Cancel
            </button>
            <button onClick={handleCreate}
              className="px-5 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium shadow-sm active:scale-95">
              Save Lead
            </button>
          </div>
        </div>
      </Modal>

      {/* (7) IMPORT LEADS MODAL */}
      {isImportOpen && (
        <ImportLeadsModal
          onClose={() => setIsImportOpen(false)}
          onSuccess={refreshAll}
        />
      )}

      {/* VIEW LEAD MODAL — no history */}
      {viewLeadEntry && (
        <ViewLeadModal
          leadId={viewLeadEntry.id}
          leadData={viewLeadEntry.data}
          onClose={closeLeadView}
          onStatusChange={handleStatusChange}
          onDelete={(id) => {
            closeLeadView();
            handleDelete(id);
          }}
        />
      )}

      {/* CONTACT HISTORY MODAL — name, id, history only */}
      {historyEntry && (
        <ContactHistoryModal
          leadId={historyEntry.id}
          leadName={historyEntry.name}
          onClose={closeHistory}
        />
      )}
    </div>
  );
};

export default Leads;