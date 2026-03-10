// src/pages/LeadManager.jsx
import React, { useEffect, useState, useRef } from "react";
import Toast from "../utils/toast";
import {
  FaSearch, FaSync, FaFileExport, FaChevronDown, FaFilter,
  FaWhatsapp, FaCheck, FaTimes, FaPhone, FaVideo,
  FaEnvelope, FaUsers, FaTachometerAlt,
  FaExchangeAlt, FaArrowUp, FaChartLine, FaUserTie,
  FaStar, FaSpinner, FaCalendarAlt, FaSms, FaTimesCircle,
  FaChevronRight, FaChevronLeft, FaPencilAlt,
  FaSave, FaEye, FaUserCheck,
} from "react-icons/fa";
import { useAuth } from "../../auth/AuthContext";

// 5. Conversational English Helper
const formatStatus = (status) => {
  if (!status) return "—";
  return status.replace(/([A-Z])/g, ' $1').trim();
};

const STATUS_OPTIONS = [
  "FreshLead", "Contacted", "FollowUp", "Interested", "Negotiation",
  "NotInterested", "UnableToContact", "JunkLead", "ReEngagement", "ActiveClient", "Lost",
];
const LOCKED_STATUSES = ["Negotiation"];
const getStatusColor = (s) => "bg-gray-50 text-gray-600 border-gray-200";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

const api = {
  getLeads: () => fetch("/api/Leads", { headers: authHeader() }).then(r => r.json()),
  // 5. Fixed Endpoint and Method to match standard Lead updates
  updateStatus: (id, status) => {
    // LeadManager previously hit /api/Leads/:id/status
    // But Leads.jsx uses PATCH to /api/Leads/:id for status
    return fetch(`/api/LeadManager/${id}/status`, {
      method: "PATCH", headers: authHeader(), body: JSON.stringify(status),
    }).then(r => r.json());
  },
  updateRemark: (id, remarks) =>
    fetch(`/api/Leads/${id}`, {
      method: "PATCH", headers: authHeader(), body: JSON.stringify({ remarks }),
    }).then(r => r.json()),
  // 3. API for updating follow-up date
  updateFollowUp: (id, nextFollowUpAt, remark) =>
    fetch(`/api/LeadManager/${id}/followup`, {
      method: "PATCH",
      headers: authHeader(),
      body: JSON.stringify({
        nextFollowUpAt,
        remark,
      }),
    }).then(r => r.json()),
  getDashboard: () => fetch("/api/LeadManager/dashboard", { headers: authHeader() }).then(r => r.json()),
  getConversionRate: (userId) => fetch(`/api/LeadManager/performance/conversionrate?userId=${userId}`, { headers: authHeader() }).then(r => r.json()),
  reassignLead: (leadId, newUserId) =>
    fetch(`/api/LeadManager/reassign/${leadId}`, {
      method: "PUT", headers: authHeader(), body: JSON.stringify({ newUserId: Number(newUserId) }),
    }).then(r => r.json()),
  escalateLead: (leadId, reason) => {
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : "";
    return fetch(`/api/LeadManager/escalate/${leadId}${params}`, {
      method: "POST", headers: authHeader(),
    }).then(r => r.json());
  },
};

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, pageSize }) => {
  if (totalPages <= 1) return null;
  const getPages = () => {
    const pages = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1), end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };
  const from = (currentPage - 1) * pageSize + 1, to = Math.min(currentPage * pageSize, totalItems);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
      <p className="text-xs text-gray-500">Showing {from}–{to} of {totalItems} leads</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <FaChevronLeft className="w-3 h-3" />
        </button>
        {getPages().map((page, i) =>
          page === "..." ? <span key={`e-${i}`} className="px-2 text-gray-400 text-xs">…</span> : (
            <button key={page} onClick={() => onPageChange(page)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === currentPage ? "bg-indigo-600 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"}`}>
              {page}
            </button>
          )
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <FaChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const StatusDropdown = ({ leadId, currentStatus, onStatusChange }) => {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const ref = useRef();
  const isLocked = LOCKED_STATUSES.includes(currentStatus);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const handleSelect = async (status) => {
    setOpen(false);
    if (status === currentStatus) return;
    try {
      setUpdating(true);
      await api.updateStatus(leadId, status);
      onStatusChange(leadId, status);
      Toast.success("Status updated");
    } catch { Toast.error("Failed to update status"); } finally { setUpdating(false); }
  };
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => !isLocked && setOpen(o => !o)} disabled={updating || isLocked}
        title={isLocked ? "Status locked at Negotiation" : "Change status"}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${getStatusColor(currentStatus)} ${updating ? "opacity-50 cursor-wait" : isLocked ? "opacity-80 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"}`}>
        {/* 5. Conversational English display */}
        {updating ? "Saving…" : formatStatus(currentStatus) || "—"}
        {!isLocked && <FaChevronDown className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />}
        {isLocked && (
          <svg className="w-2.5 h-2.5 opacity-60 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      {open && !isLocked && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
          {STATUS_OPTIONS.map(status => (
            <button key={status} onClick={() => handleSelect(status)}
              className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between hover:bg-gray-50 text-gray-700 ${status === currentStatus ? "font-semibold bg-gray-50" : ""}`}>
              {formatStatus(status)}
              {status === currentStatus && <FaCheck className="w-3 h-3 opacity-50" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const FilterPanel = ({ open, onClose, filters, setFilters }) => {
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-4 space-y-4">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Filter Options</p>
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">Status</p>
        <div className="space-y-1 max-h-44 overflow-y-auto">
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-indigo-600">
            <input type="radio" name="status" checked={!filters.status} onChange={() => setFilters(f => ({ ...f, status: "" }))} /> All
          </label>
          {STATUS_OPTIONS.map(s => (
            <label key={s} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-indigo-600">
              <input type="radio" name="status" checked={filters.status === s} onChange={() => setFilters(f => ({ ...f, status: s }))} /> {formatStatus(s)}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">WhatsApp</p>
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={filters.whatsappOnly} onChange={(e) => setFilters(f => ({ ...f, whatsappOnly: e.target.checked }))} />
          WhatsApp Enabled Only
        </label>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1">Assigned User ID</p>
        <input type="number" placeholder="User ID" value={filters.assignedUserId}
          onChange={(e) => setFilters(f => ({ ...f, assignedUserId: e.target.value }))}
          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>
      <button onClick={() => { setFilters({ status: "", whatsappOnly: false, assignedUserId: "" }); onClose(); }}
        className="w-full py-1.5 text-xs text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 font-medium transition-colors">
        Clear All Filters
      </button>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, size = "sm" }) => {
  if (!isOpen) return null;
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-2xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><FaTimesCircle className="w-4 h-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const ReassignModal = ({ lead, onClose, onSuccess }) => {
  const [newUserId, setNewUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    if (!newUserId) return Toast.error("Please enter a user ID");
    try { setLoading(true); await api.reassignLead(lead.id, newUserId); Toast.success("Lead reassigned successfully"); onSuccess(); onClose(); }
    catch { Toast.error("Failed to reassign lead"); } finally { setLoading(false); }
  };
  return (
    <Modal isOpen={true} onClose={onClose} title={`Reassign Lead #${lead.id}`}>
      <div className="space-y-4">
        <div className="bg-indigo-50 rounded-lg p-3 flex items-center gap-3 border border-indigo-100">
          <div className="w-9 h-9 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">{lead.name ? lead.name.charAt(0).toUpperCase() : "?"}</div>
          <div><p className="text-sm font-semibold text-gray-800">{lead.name || "—"}</p><p className="text-xs text-gray-500">Currently: {lead.assignedToUserName || (lead.assignedToUserId ? `User #${lead.assignedToUserId}` : "Unassigned")}</p></div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New User ID</label>
          <input type="number" value={newUserId} onChange={e => setNewUserId(e.target.value)} placeholder="Enter user ID"
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
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
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    try { setLoading(true); await api.escalateLead(lead.id, reason); Toast.success("Lead escalated successfully"); onSuccess(); onClose(); }
    catch { Toast.error("Failed to escalate lead"); } finally { setLoading(false); }
  };
  return (
    <Modal isOpen={true} onClose={onClose} title={`Escalate Lead #${lead.id}`}>
      <div className="space-y-4">
        <div className="bg-rose-50 rounded-lg p-3 flex items-center gap-3 border border-rose-100">
          <div className="w-9 h-9 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 font-bold">{lead.name ? lead.name.charAt(0).toUpperCase() : "?"}</div>
          <div><p className="text-sm font-semibold text-gray-800">{lead.name || "—"}</p><p className="text-xs text-gray-500">Status: {lead.status || "—"}</p></div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason</label>
          <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe why this lead needs escalation...(optional)" rows={3}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 resize-none" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-rose-600 hover:bg-rose-700 rounded-lg font-medium disabled:opacity-50">
            {loading && <FaSpinner className="w-3 h-3 animate-spin" />} <FaArrowUp className="w-3 h-3" /> Escalate
          </button>
        </div>
      </div>
    </Modal>
  );
};

const ViewRemarkModal = ({ lead, onClose }) => (
  <Modal isOpen={true} onClose={onClose} title={`Remark — ${lead.name || `Lead #${lead.id}`}`}>
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 min-h-[100px]">
        {lead.remarks || lead.comments
          ? <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{lead.remarks || lead.comments}</p>
          : <p className="text-sm text-gray-400 italic">No remarks added for this lead.</p>}
      </div>
      <div className="flex justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Close</button>
      </div>
    </div>
  </Modal>
);

const EditRemarkModal = ({ lead, onClose, onSave }) => {
  const [text, setText] = useState(lead.remarks || lead.comments || "");
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    try { setSaving(true); await api.updateRemark(lead.id, text); onSave(lead.id, text); Toast.success("Remark saved"); onClose(); }
    catch { Toast.error("Failed to save remark"); } finally { setSaving(false); }
  };
  return (
    <Modal isOpen={true} onClose={onClose} title={`Edit Remark — ${lead.name || `Lead #${lead.id}`}`}>
      <div className="space-y-4">
        <div className="bg-indigo-50 rounded-lg p-3 flex items-center gap-3 border border-indigo-100">
          <div className="w-9 h-9 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">{lead.name ? lead.name.charAt(0).toUpperCase() : "?"}</div>
          <div><p className="text-sm font-semibold text-gray-800">{lead.name || "—"}</p><p className="text-xs text-gray-500">Lead #{lead.id} · {lead.status || "—"}</p></div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Remark</label>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write a remark..." rows={5} autoFocus
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 resize-none" />
          <p className="text-xs text-gray-400 text-right">{text.length} chars</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium disabled:opacity-50">
            {saving ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaSave className="w-3 h-3" />}
            {saving ? "Saving…" : "Save Remark"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const FollowUpModal = ({ lead, onClose, onSuccess }) => {
  const [date, setDate] = useState(
    lead.followUpDate
      ? new Date(lead.followUpDate).toISOString().slice(0, 16)
      : ""
  );
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!date) return Toast.error("Select follow-up date");

    try {
      setLoading(true);

      const isoDate = new Date(date).toISOString();

      await api.updateFollowUp(lead.id, isoDate, remark);

      Toast.success("Follow-up updated");
      console.log('patch:', isoDate)
      onSuccess();
      onClose();
    } catch {
      Toast.error("Failed to update follow-up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Follow-Up — ${lead.name || `Lead #${lead.id}`}`}
    >
      <div className="space-y-4">

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">
            Next Follow-up
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">
            Reason
          </label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
            placeholder="Optional note about this follow-up..."
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>

      </div>
    </Modal>
  );
};
const StatCard = ({ icon: Icon, label, value, subtext, color = "bg-gray-100" }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex items-start gap-4">
    <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5 text-white" /></div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mt-0.5">{value ?? "—"}</p>
      {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
    </div>
  </div>
);

// Contact Type column: video, phone, email, whatsapp
const ContactTypeActions = ({ lead }) => (
  <div className="flex items-center gap-0.5">
    {lead.zoomLink ? (
      <a href={lead.zoomLink} target="_blank" rel="noreferrer" title="Join Zoom Call"
        className="p-1.5 rounded-md hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors">
        <FaVideo className="w-3.5 h-3.5" />
      </a>
    ) : lead.email ? (
      <a href={`https://zoom.us/start/videomeeting?email=${encodeURIComponent(lead.email)}`}
        target="_blank" rel="noreferrer" title="Start Zoom with Email"
        className="p-1.5 rounded-md hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors">
        <FaVideo className="w-3.5 h-3.5 " />
      </a>
    ) : (
      <button disabled title="No contact info for video call"
        className="p-1.5 rounded-md text-gray-300 cursor-not-allowed">
        <FaVideo className="w-3.5 h-3.5" />
      </button>
    )}
    {lead.phone && (
      <a href={`tel:${lead.phone}`} title="Call" className="p-1.5 rounded-md hover:bg-green-50 text-green-500 hover:text-green-700 transition-colors">
        <FaPhone className="w-3.5 h-3.5 scale-x-[-1]" />
      </a>
    )}
    {lead.email && (
      <a href={`mailto:${lead.email}`} title="Email" className="p-1.5 rounded-md hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 transition-colors">
        <FaEnvelope className="w-3.5 h-3.5" />
      </a>
    )}
    {lead.whatsappEnabled && lead.phone && (
      <a href={`https://wa.me/${(lead.phone || "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer" title="WhatsApp"
        className="p-1.5 rounded-md hover:bg-green-50 text-green-500 hover:text-green-700 transition-colors">
        <FaWhatsapp className="w-3.5 h-3.5" />
      </a>
    )}
  </div>
);

const LeadManager = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [conversionRate, setConversionRate] = useState(null);
  const [activeTab, setActiveTab] = useState("manage");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [excludeNoFollowup, setExcludeNoFollowup] = useState(false);
  const [followUpFrom, setFollowUpFrom] = useState("");
  const [followUpTo, setFollowUpTo] = useState("");
  const [filters, setFilters] = useState({ status: "", whatsappOnly: false, assignedUserId: "" });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const filterRef = useRef();
  const [reassignLead, setReassignLead] = useState(null);
  const [escalateLead, setEscalateLead] = useState(null);
  const [followUpLead, setFollowUpLead] = useState(null);
  const [viewRemarkLead, setViewRemarkLead] = useState(null);
  const [editRemarkLead, setEditRemarkLead] = useState(null);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filters, followUpFrom, followUpTo, excludeNoFollowup]);

  const fetchLeads = async () => {
    try { setLoading(true); const data = await api.getLeads(); setLeads(Array.isArray(data) ? data : []); }
    catch { Toast.error("Failed to load leads"); } finally { setLoading(false); }
  };
  const fetchDashboard = async () => {
    try {
      const userId = user?.sub || user?.id; // Get current user ID
      const [dash, conv] = await Promise.allSettled([
        api.getDashboard(),
        api.getConversionRate(userId)
      ]);
      if (dash.status === "fulfilled") setDashboard(dash.value);
      if (conv.status === "fulfilled") setConversionRate(conv.value);
    } catch { }
  };
  useEffect(() => { fetchLeads(); fetchDashboard(); }, []);

  const handleStatusChange = (leadId, newStatus) =>
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  const handleRemarkSave = (leadId, newRemark) =>
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, remarks: newRemark, comments: newRemark } : l));

  // 3. Handle inline follow-up date change
  const handleFollowUpUpdate = async (leadId, date) => {
    try {
      await api.updateFollowUp(leadId, date);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, followUpDate: date } : l));
      Toast.success("Follow-up date updated");
    } catch { Toast.error("Failed to update date"); }
  };

  const formatDate = (val) => !val ? "—" : new Date(val).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const formatDateTime = (val) => !val ? null : new Date(val).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const filteredLeads = leads.filter(lead => {
    if (filters.status && lead.status !== filters.status) return false;
    if (filters.whatsappOnly && !lead.whatsappEnabled) return false;
    if (filters.assignedUserId && String(lead.assignedToUserId) !== filters.assignedUserId) return false;
    if (followUpFrom && lead.followUpDate && new Date(lead.followUpDate) < new Date(followUpFrom)) return false;
    if (followUpTo && lead.followUpDate && new Date(lead.followUpDate) > new Date(followUpTo)) return false;
    if (excludeNoFollowup && !lead.followUpDate) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (lead.name || "").toLowerCase().includes(q) || (lead.phone || "").toLowerCase().includes(q) ||
        (lead.email || "").toLowerCase().includes(q) || (lead.status || "").toLowerCase().includes(q) || String(lead.id).includes(q);
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeFilterCount = [filters.status, filters.whatsappOnly, filters.assignedUserId, followUpFrom, followUpTo].filter(Boolean).length;
  const totalLeads = dashboard?.totalLeads ?? leads.length;
  const activeClients = dashboard?.activeClients ?? leads.filter(l => l.status === "ActiveClient").length;
  const interested = dashboard?.interested ?? leads.filter(l => l.status === "Interested").length;
  const convRate = conversionRate?.rate ?? dashboard?.conversionRate;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-5">
        <div className="flex gap-1 border-b border-gray-200">
          {[{ key: "manage", label: "Manage Leads", icon: FaUsers }, { key: "dashboard", label: "Dashboard", icon: FaTachometerAlt }].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${activeTab === key ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {activeTab === "manage" && (
          <div className="space-y-4">
            {/* 4. Redesigned Top bar with proper labels and placeholders */}
            <div className="flex items-center gap-4 flex-wrap bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-sm">
              <h1 className="text-base font-bold text-gray-800 whitespace-nowrap">Manage Leads</h1>
              <div className="w-px h-8 bg-gray-200 hidden sm:block mx-1" />

              <div className="flex items-center gap-4 flex-wrap flex-1">
                <div className="relative group min-w-[180px]">
                  <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-bold text-gray-400 group-focus-within:text-indigo-500 transition-colors uppercase tracking-wider">Follow-up From</label>
                  <input type="date" value={followUpFrom} onChange={e => setFollowUpFrom(e.target.value)}
                    className="w-full pl-3 pr-4 py-2 text-xs border border-gray-200 rounded-lg bg-white hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-gray-700 transition-all" />
                </div>
                <div className="relative group min-w-[180px]">
                  <label className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] font-bold text-gray-400 group-focus-within:text-indigo-500 transition-colors uppercase tracking-wider">To Follow-up</label>
                  <input type="date" value={followUpTo} onChange={e => setFollowUpTo(e.target.value)}
                    className="w-full pl-3 pr-4 py-2 text-xs border border-gray-200 rounded-lg bg-white hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-gray-700 transition-all" />
                </div>
                {(followUpFrom || followUpTo) && (
                  <button onClick={() => { setFollowUpFrom(""); setFollowUpTo(""); }}
                    className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors" title="Clear Dates">
                    <FaTimes className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="relative" ref={filterRef}>
                <button onClick={() => setFilterPanelOpen(o => !o)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${activeFilterCount > 0 ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"}`}>
                  <FaFilter className="w-3 h-3" /> Filters
                  {activeFilterCount > 0 && <span className="ml-1.5 w-4 h-4 rounded-full bg-white text-indigo-600 text-[10px] flex items-center justify-center font-bold">{activeFilterCount}</span>}
                </button>
                <FilterPanel open={filterPanelOpen} onClose={() => setFilterPanelOpen(false)} filters={filters} setFilters={setFilters} />
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors">
                <input type="checkbox" checked={excludeNoFollowup} onChange={e => setExcludeNoFollowup(e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-300" />
                Exclude No Next Follow-up
              </label>
              <div className="flex items-center gap-2">
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-600">
                  {[25, 50, 100, 200].map(n => <option key={n}>{n}</option>)}
                </select>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all font-medium">
                  <FaFileExport className="w-3 h-3" /> Export
                </button>
                <button onClick={fetchLeads} title="Refresh" className="p-1.5 text-gray-400 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-all">
                  <FaSync className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                </button>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input type="text" placeholder="Search leads..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 pr-4 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 w-44" />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">#</th>
                      <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Name</th>
                      <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                      <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Phone</th>
                      {/* 1. Assigned To Header */}
                      <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Assigned To</th>
                      <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Last Contact</th>
                      {/* 3. Removed chevron from header */}
                      <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center" title="Next Follow-up">
                        Follow-Up
                      </th>
                      <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Created</th>
                      <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      Array.from({ length: 7 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array.from({ length: 11 }).map((_, j) => <td key={j} className="px-3 py-4"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>)}
                        </tr>
                      ))
                    ) : paginatedLeads.length === 0 ? (
                      <tr><td colSpan={11} className="text-center py-16 text-gray-400"><FaUsers className="w-8 h-8 mx-auto mb-3 opacity-30" /><p className="text-sm">No leads found</p></td></tr>
                    ) : paginatedLeads.map(lead => {
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group/row">
                          <td className="px-3 py-3.5"><span className="text-indigo-600 font-semibold text-xs">{lead.id}</span></td>
                          <td className="px-3 py-3.5 font-medium text-indigo-600 hover:underline cursor-pointer whitespace-nowrap text-xs">{lead.name || "/"}</td>
                          <td className="px-3 py-3.5"><ContactTypeActions lead={lead} /></td>
                          <td className="px-3 py-3.5 whitespace-nowrap text-xs text-indigo-500 font-medium">{lead.phone || "—"}</td>

                          {/* 1 & 2. Assigned To Column with ID and Hover Actions */}
                          <td className="px-3 py-3.5 relative group/assigned">
                            <div className="flex items-center gap-1.5">
                              {lead.assignedToUserName ? (
                                <>
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                                    {lead.assignedToUserName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs text-gray-700 font-medium truncate">{lead.assignedToUserName}</span>
                                    <span className="text-[9px] text-gray-400 font-mono">UID: {lead.assignedToUserId || lead.assignedTo || lead.assigned || "N/A"}</span>
                                  </div>
                                </>
                              ) : lead.assignedToUserId || lead.assignedTo || lead.assigned ? (
                                <>
                                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                                    U
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs text-gray-700 font-medium truncate">User #{lead.assignedToUserId || lead.assignedTo || lead.assigned}</span>
                                  </div>
                                </>
                              ) : (
                                <span className="text-xs text-gray-300 italic">Unassigned</span>
                              )}

                              <div className="flex items-center gap-0.5 opacity-0 group-hover/assigned:opacity-100 transition-opacity ml-1">
                                <button title="Reassign" onClick={() => setReassignLead(lead)} className="p-1 rounded hover:bg-amber-50 text-amber-500 transition-colors">
                                  <FaExchangeAlt className="w-3.6 h-3.6" />
                                </button>
                                <button title="Escalate" onClick={() => setEscalateLead(lead)} className="p-1 rounded hover:bg-rose-50 text-rose-400 transition-colors">
                                  <FaArrowUp className="w-3.6 h-3.6" />
                                </button>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3.5"><StatusDropdown leadId={lead.id} currentStatus={lead.status} onStatusChange={handleStatusChange} /></td>
                          <td className="px-3 py-3.5 text-gray-400 text-xs whitespace-nowrap">{formatDate(lead.lastContact)}</td>

                          {/* 3. Inline Calendar for Follow-up */}
                          <td className="px-3 py-3.5">
                            <div className="flex items-center justify-between group/follow">

                              {/* Date Display */}
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-700 font-medium">
                                  {lead.followUpDate
                                    ? formatDate(lead.followUpDate)
                                    : "No follow-up"}
                                </span>

                                {/* View Button */}
                                {lead.followUpDate && (
                                  <button
                                    onClick={() => setFollowUpLead(lead)}
                                    className="text-[10px] text-indigo-500 hover:underline text-left"
                                  >
                                    View
                                  </button>
                                )}
                              </div>

                              {/* Edit icon appears on hover */}
                              <button
                                onClick={() => setFollowUpLead(lead)}
                                title="Edit Follow-up"
                                className="opacity-0 group-hover/row:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600"
                              >
                                <FaPencilAlt className="w-3.5 h-3.5" />
                              </button>

                            </div>
                          </td>

                          <td className="px-3 py-3.5 text-gray-400 text-xs whitespace-nowrap">{formatDate(lead.createdAt)}</td>
                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-1">
                              <button title="Edit remark" onClick={() => setEditRemarkLead(lead)} className="p-1.5 rounded-md hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 transition-colors">
                                <FaPencilAlt className="w-3.5 h-3.5" />
                              </button>
                              <button title={!!(lead.remarks || lead.comments) ? "View remark" : "No remark"} onClick={() => setViewRemarkLead(lead)}
                                className={`p-1.5 rounded-md transition-colors ${!!(lead.remarks || lead.comments) ? "hover:bg-amber-50 text-amber-500" : "text-gray-300"}`}>
                                <FaEye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredLeads.length} pageSize={pageSize} />
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={FaUsers} label="Total Leads" value={totalLeads} color="bg-indigo-500" subtext="All time" />
              <StatCard icon={FaChartLine} label="Conversion Rate" value={convRate != null ? `${Number(convRate).toFixed(1)}%` : "—"} color="bg-emerald-500" subtext="Lead → Client" />
              <StatCard icon={FaUserTie} label="Active Clients" value={activeClients} color="bg-green-500" subtext="Currently active" />
              <StatCard icon={FaStar} label="Interested" value={interested} color="bg-amber-500" subtext="High potential" />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Lead Status Breakdown</h3>
              <div className="space-y-2.5">
                {STATUS_OPTIONS.map(status => {
                  const count = leads.filter(l => l.status === status).length;
                  const pct = leads.length ? Math.round((count / leads.length) * 100) : 0;
                  if (count === 0) return null;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-36 truncate">{formatStatus(status)}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-indigo-400" style={{ width: `${pct}%` }} /></div>
                      <span className="text-xs font-semibold text-gray-600 w-8 text-right">{count}</span>
                      <span className="text-xs text-gray-400 w-8">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Follow-up Overview</h3>
                <div className="space-y-3">
                  {[
                    { label: "With Next Follow-up", count: leads.filter(l => l.followUpDate).length },
                    { label: "No Follow-up Set", count: leads.filter(l => !l.followUpDate).length },
                    { label: "Overdue Follow-ups", count: leads.filter(l => l.followUpDate && new Date(l.followUpDate) < new Date()).length },
                  ].map(({ label, count }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-600">{label}</span>
                      <span className="text-sm font-bold text-gray-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: "Manage All Leads", icon: FaUsers, action: () => setActiveTab("manage") },
                    { label: "Export Leads CSV", icon: FaFileExport, action: () => { } },
                    { label: "Escalation Queue", icon: FaArrowUp, action: () => { } },
                  ].map(({ label, icon: Icon, action }) => (
                    <button key={label} onClick={action} className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all text-left group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors"><Icon className="w-4 h-4 text-gray-500" /></div>
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </div>
                      <FaChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {reassignLead && <ReassignModal lead={reassignLead} onClose={() => setReassignLead(null)} onSuccess={fetchLeads} />}
      {escalateLead && <EscalateModal lead={escalateLead} onClose={() => setEscalateLead(null)} onSuccess={fetchLeads} />}
      {viewRemarkLead && <ViewRemarkModal lead={viewRemarkLead} onClose={() => setViewRemarkLead(null)} />}
      {editRemarkLead && <EditRemarkModal lead={editRemarkLead} onClose={() => setEditRemarkLead(null)} onSave={handleRemarkSave} />}
      {followUpLead && (
        <FollowUpModal
          lead={followUpLead}
          onClose={() => setFollowUpLead(null)}
          onSuccess={fetchLeads}
        />
      )}
    </div>
  );
};

export default LeadManager;