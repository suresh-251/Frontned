import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
// useAssignedLeads uses brand-free /api/leads/* endpoints — no brand required for HR users
import useAssignedLeads from "../../socialCRM/hooks/useAssignedLeads";
import { getDepartments } from "../api/hr.dept";
import { getAdminUsers } from "../../api/admin/users.api";
import { useRole } from "../hooks/useRole";
import { jwtDecode } from "jwt-decode";
import * as XLSX from "xlsx";
import {
  Users, Eye, X, Search, ChevronLeft, ChevronRight,
  Loader2, UserPlus, Check, RefreshCw, Download, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// ── Avatar ──────────────────────────────────────────────────────────────────
const Avatar = ({ name }) => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 flex items-center justify-center shadow text-white text-xs font-bold flex-shrink-0">
    {name ? String(name).charAt(0).toUpperCase() : "?"}
  </div>
);

// ── Pagination ───────────────────────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, pageSize }) => {
  if (totalPages <= 1) return null;
  const from = (currentPage - 1) * pageSize + 1;
  const to   = Math.min(currentPage * pageSize, totalItems);
  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const s = Math.max(2, currentPage - 1), e = Math.min(totalPages - 1, currentPage + 1);
    for (let i = s; i <= e; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
      <p className="text-xs text-gray-500">Showing {from}–{to} of {totalItems} leads</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-3 h-3" />
        </button>
        {pages.map((p, i) =>
          p === "..." ? <span key={`e${i}`} className="px-2 text-gray-400 text-xs">…</span> : (
            <button key={p} onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === currentPage ? "bg-indigo-600 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default function HRLeads() {
  const { isManager } = useRole();
  // Brand-free hook — HR users don't need an active brand to see their assigned leads
  const { leads, loading, reload, assignLead, changeStatus, saveRemark } = useAssignedLeads();

  const [employees, setEmployees]   = useState([]);
  const [hrDeptId, setHrDeptId]     = useState(null);

  // Table state
  const [searchTerm, setSearchTerm]   = useState("");
  const [pageSize, setPageSize]       = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [remarkMap, setRemarkMap]     = useState({});
  const [savingLeads, setSavingLeads] = useState(new Set());

  // View lead detail
  const [viewLead, setViewLead] = useState(null);

  // Assign modal (manager only)
  const [selectedLead, setSelectedLead] = useState(null);
  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [showDropdown, setShowDropdown]   = useState(false);
  const [targetUserId, setTargetUserId]   = useState("");
  const dropdownRef = useRef(null);

  // Auth Identity
  const auth = useMemo(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return { id: null };
      const decoded = jwtDecode(token);
      return { id: Number(decoded.sub || decoded.id) };
    } catch { return { id: null }; }
  }, []);

  // Initial load
  const initRegistry = useCallback(async () => {
    try {
      const [depts, emps] = await Promise.all([
        getDepartments(),
        getAdminUsers({ page: 1, pageSize: 200 })
      ]);
      setEmployees(emps?.users || emps || []);

      if (isManager) {
        const hrDept = depts.find(d =>
          d.departmentName.toUpperCase() === "HR" ||
          d.departmentName.toUpperCase() === "HUMAN RESOURCES"
        );
        if (hrDept) {
          setHrDeptId(hrDept.departmentId);
          reload({ departmentId: hrDept.departmentId });
        } else {
          toast.error("HR Department record not found");
        }
      } else {
        reload({});
      }
    } catch {
      toast.error("Failed to synchronize lead registry");
    }
  }, [isManager, auth.id, reload]);

  useEffect(() => { initRegistry(); }, [initRegistry]);

  // Click-outside for assign dropdown
  useEffect(() => {
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Filtered + paginated leads
  const filteredLeads = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return leads.filter(l =>
      (l.name  || "").toLowerCase().includes(q) ||
      (l.email || "").toLowerCase().includes(q) ||
      (l.phone || "").includes(q)
    );
  }, [leads, searchTerm]);

  const totalPages    = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset page on search change
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // Employee search for assign modal
  const searchableEmployees = useMemo(() => {
    const q = empSearchQuery.toLowerCase().trim();
    if (!q || targetUserId) return [];
    return employees.filter(emp =>
      (emp.username || "").toLowerCase().includes(q) ||
      String(emp.userId || "").includes(q)
    ).slice(0, 5);
  }, [employees, empSearchQuery, targetUserId]);

  // Inline status change
  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await changeStatus(leadId, newStatus);
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Inline remark save
  const handleRemarkBlur = async (lead) => {
    const remark = remarkMap[lead.id];
    if (remark === undefined || remark === (lead.remark ?? "")) return;
    setSavingLeads(prev => new Set(prev).add(lead.id));
    try {
      await saveRemark(lead.id, remark);
    } catch {
      toast.error("Failed to save remark");
    } finally {
      setSavingLeads(prev => { const n = new Set(prev); n.delete(lead.id); return n; });
    }
  };

  // Manager assign lead
  const handleAssignmentAction = async () => {
    if (!targetUserId) return toast.error("Select an employee");
    const target = employees.find(e => e.userId === targetUserId);
    const tid = toast.loading("Assigning lead...");
    try {
      await assignLead(selectedLead.id, target.userId, target.username, "Routed by Manager");
      toast.success(`Assigned to ${target.username}`, { id: tid });
      setSelectedLead(null);
      setTargetUserId("");
      setEmpSearchQuery("");
      reload({ departmentId: hrDeptId });
    } catch {
      toast.error("Assignment failed", { id: tid });
    }
  };

  // Export
  const exportToExcel = () => {
    if (!filteredLeads.length) return;
    const rows = filteredLeads.map(l => ({
      ID: l.id, Name: l.name || "", Email: l.email || "", Phone: l.phone || "",
      Status: l.status || "", "Assigned To": l.assignedToUserName || "",
      Department: l.departmentName || "", Remark: l.remark || "",
      "Created At": l.metaCreatedAt ? new Date(l.metaCreatedAt).toLocaleString() : "",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "HR Leads");
    XLSX.writeFile(wb, `hr-leads-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-screen-2xl mx-auto px-4 py-4 space-y-5">
        <Toaster position="top-right" />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isManager ? "HR Lead Bucket" : "My Assigned Leads"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isManager ? `Department pool · Dept #${hrDeptId}` : "Leads assigned directly to you"}
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n} rows</option>)}
            </select>

            <button onClick={exportToExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
              <Download className="w-3.5 h-3.5" /> Export
            </button>

            <button onClick={() => isManager ? reload({ departmentId: hrDeptId }) : reload({})}
              className="p-1.5 text-gray-400 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all" title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">{filteredLeads.length} leads</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Search leads..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 w-60 transition-all" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Name", "Contact", "Status", "Assigned To", "Remark", "Created At", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="h-4 bg-gray-100 rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400">
                      <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No leads found</p>
                      <p className="text-xs mt-1">Adjust your search or check back later.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map(l => (
                    <tr key={l.id} className="group hover:bg-gray-50/50 transition-colors">

                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={l.name} />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{l.name || "—"}</p>
                            <p className="text-xs text-gray-400">ID #{l.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        {l.email && <p className="text-xs text-indigo-600 font-medium truncate max-w-[150px]">{l.email}</p>}
                        {l.phone && <p className="text-xs text-gray-500">{l.phone}</p>}
                        {!l.email && !l.phone && <span className="text-gray-300">—</span>}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <select
                          value={l.status || "New"}
                          onChange={e => handleStatusChange(l.id, e.target.value)}
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 border focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors cursor-pointer appearance-none text-center
                            ${l.status === "New"       ? "bg-blue-50  text-blue-700  border-blue-200"  :
                              l.status === "Contacted" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              l.status === "Qualified" ? "bg-green-50 text-green-700 border-green-200" :
                                                         "bg-rose-50  text-rose-700  border-rose-200"}`}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </td>

                      {/* Assigned To — managers get reassign button, users see display */}
                      <td className="px-4 py-3">
                        {isManager ? (
                          <button
                            onClick={() => { setSelectedLead(l); setTargetUserId(""); setEmpSearchQuery(""); }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                          >
                            <UserPlus className="w-3 h-3" />
                            {l.assignedToUserName || "Unassigned"}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-600">{l.assignedToUserName || "—"}</span>
                        )}
                      </td>

                      {/* Remark */}
                      <td className="px-4 py-3">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Add remark..."
                            value={remarkMap[l.id] ?? l.remark ?? ""}
                            onChange={e => setRemarkMap(prev => ({ ...prev, [l.id]: e.target.value }))}
                            onBlur={() => handleRemarkBlur(l)}
                            className="w-[140px] px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 hover:bg-white transition-colors"
                          />
                          {savingLeads.has(l.id) && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {l.metaCreatedAt
                          ? new Date(l.metaCreatedAt).toLocaleString()
                          : l.syncedAt
                          ? new Date(l.syncedAt).toLocaleString()
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setViewLead(l)}
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
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

        {/* ── View Lead Detail Modal ── */}
        <AnimatePresence>
          {viewLead && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setViewLead(null)}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-base font-semibold text-gray-800">Lead Details</h2>
                  <button onClick={() => setViewLead(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar name={viewLead.name} />
                    <div>
                      <p className="font-semibold text-gray-800">{viewLead.name || "—"}</p>
                      <p className="text-xs text-gray-400">ID #{viewLead.id}</p>
                    </div>
                  </div>
                  {[
                    ["Email", viewLead.email],
                    ["Phone", viewLead.phone],
                    ["Status", viewLead.status],
                    ["Assigned To", viewLead.assignedToUserName],
                    ["Department", viewLead.departmentName],
                    ["Campaign", viewLead.campaignName],
                    ["Ad Set", viewLead.adsetName],
                    ["Ad", viewLead.adName],
                    ["Remark", viewLead.remark],
                    ["Created", viewLead.metaCreatedAt ? new Date(viewLead.metaCreatedAt).toLocaleString() : viewLead.syncedAt ? new Date(viewLead.syncedAt).toLocaleString() : null],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-sm">
                      <span className="text-gray-400 min-w-[90px] font-medium">{k}</span>
                      <span className="text-gray-700">{v}</span>
                    </div>
                  ))}
                  {viewLead.fields && Object.keys(viewLead.fields).length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Form Fields</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(viewLead.fields).map(([k, v]) => (
                          <div key={k} className="p-2 bg-gray-50 rounded-lg">
                            <p className="text-[10px] text-gray-400 uppercase font-medium">{k.replace(/_/g, " ")}</p>
                            <p className="text-xs text-gray-700 font-medium truncate">{v || "—"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Assign Modal (Manager Only) ── */}
        <AnimatePresence>
          {selectedLead && isManager && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-base font-semibold text-gray-800">Assign Lead</h2>
                  <button onClick={() => setSelectedLead(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Lead</p>
                    <p className="font-semibold text-gray-800">{selectedLead.name}</p>
                    <p className="text-xs text-gray-400">ID #{selectedLead.id}</p>
                  </div>

                  <div className="relative" ref={dropdownRef}>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Search employee</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Name or ID..."
                        value={empSearchQuery}
                        onFocus={() => setShowDropdown(true)}
                        onChange={e => { setEmpSearchQuery(e.target.value); setTargetUserId(""); setShowDropdown(true); }}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    </div>

                    <AnimatePresence>
                      {showDropdown && searchableEmployees.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                          className="absolute z-[120] w-full mt-1 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                          {searchableEmployees.map(emp => (
                            <button key={emp.userId} type="button"
                              onClick={() => { setTargetUserId(emp.userId); setEmpSearchQuery(emp.username); setShowDropdown(false); }}
                              className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex items-center justify-between border-b last:border-0 border-gray-50 transition-colors">
                              <div>
                                <p className="text-sm font-medium text-gray-700">{emp.username}</p>
                                <p className="text-xs text-gray-400">ID #{emp.userId}</p>
                              </div>
                              <ChevronRight className="w-3 h-3 text-gray-300" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {targetUserId && (
                      <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-700">{empSearchQuery}</p>
                          <p className="text-xs text-emerald-500">UID: {targetUserId}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAssignmentAction}
                    disabled={!targetUserId}
                    className="w-full py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow hover:bg-indigo-700 active:scale-95 disabled:opacity-30 transition-all"
                  >
                    Assign Lead
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}






// import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
// import useAssignedLeads from "../../socialCRM/hooks/useAssignedLeads";
// import { getDepartments } from "../api/hr.dept";
// import { getAdminUsers } from "../../api/admin/users.api";
// import { useRole } from "../hooks/useRole";
// import { jwtDecode } from "jwt-decode";
// import * as XLSX from "xlsx";
// import {
//   Users, Eye, X, Search, ChevronLeft, ChevronRight,
//   Loader2, UserPlus, Check, RefreshCw, Download, AlertTriangle
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";

// const Avatar = ({ name }) => (
//   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 flex items-center justify-center shadow text-white text-xs font-bold flex-shrink-0">
//     {name ? String(name).charAt(0).toUpperCase() : "?"}
//   </div>
// );

// export default function HRLeads() {
//   const { isManager } = useRole();
//   const { leads, loading, reload, assignLead, changeStatus, saveRemark } = useAssignedLeads();

//   const [employees, setEmployees] = useState([]);
//   const [hrDeptId, setHrDeptId] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [pageSize, setPageSize] = useState(25);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [remarkMap, setRemarkMap] = useState({});
//   const [savingLeads, setSavingLeads] = useState(new Set());
//   const [viewLead, setViewLead] = useState(null);
//   const [selectedLead, setSelectedLead] = useState(null);
//   const [empSearchQuery, setEmpSearchQuery] = useState("");
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [targetUserId, setTargetUserId] = useState("");
//   const dropdownRef = useRef(null);

//   // --- 🛑 CONFIRMATION STATE ---
//   const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null });

//   // --- 🔐 AUTH IDENTITY ---
//   const auth = useMemo(() => {
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) return { id: null, role: "" };
//       const decoded = jwtDecode(token);
//       return { 
//         id: Number(decoded.sub || decoded.id),
//         role: decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
//       };
//     } catch { return { id: null, role: "" }; }
//   }, []);

//   const initRegistry = useCallback(async () => {
//     try {
//       const [depts, emps] = await Promise.all([
//         getDepartments(),
//         getAdminUsers({ page: 1, pageSize: 200 })
//       ]);
//       setEmployees(emps?.users || emps || []);

//       if (isManager) {
//         const hrDept = depts.find(d => d.departmentName.toUpperCase() === "HR" || d.departmentName.toUpperCase() === "HUMAN RESOURCES");
//         if (hrDept) {
//           setHrDeptId(hrDept.departmentId);
//           reload({ departmentId: hrDept.departmentId });
//         }
//       } else {
//         // ✅ USER LOGIC: Reload with only assigned leads
//         reload({ assignedToUserId: auth.id });
//       }
//     } catch { toast.error("Sync Error"); }
//   }, [isManager, auth.id, reload]);

//   useEffect(() => { initRegistry(); }, [initRegistry]);

//   // --- 🎯 DATA SEGREGATION LOGIC ---
//   const filteredLeads = useMemo(() => {
//     let result = leads;
    
//     // 1. Strict Ownership Filter for non-managers
//     if (!isManager) {
//         result = result.filter(l => Number(l.assignedToUserId) === Number(auth.id));
//     }

//     // 2. Search Filter
//     const q = searchTerm.toLowerCase();
//     return result.filter(l =>
//       (l.name || "").toLowerCase().includes(q) ||
//       (l.email || "").toLowerCase().includes(q) ||
//       (l.phone || "").includes(q)
//     );
//   }, [leads, searchTerm, isManager, auth.id]);

//   const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);
//   const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));

//   const handleAssignmentAction = () => {
//     if (!targetUserId) return toast.error("Select an employee");
//     const target = employees.find(e => e.userId === targetUserId);
    
//     // ✅ TRIGGER CENTERED CONFIRMATION
//     setConfirm({
//       open: true,
//       title: "Confirm Assignment",
//       message: `Assign lead "${selectedLead.name}" to ${target.username}?`,
//       onConfirm: async () => {
//         const tid = toast.loading("Assigning...");
//         try {
//           await assignLead(selectedLead.id, target.userId, target.username, "Routed by Manager");
//           toast.success("Assigned Successfully", { id: tid });
//           setSelectedLead(null);
//           setTargetUserId("");
//           setEmpSearchQuery("");
//           reload({ departmentId: hrDeptId });
//         } catch { toast.error("Failed", { id: tid }); }
//       }
//     });
//   };

//   const handleStatusChange = async (leadId, newStatus) => {
//     try { await changeStatus(leadId, newStatus); toast.success("Status Updated"); } 
//     catch { toast.error("Failed"); }
//   };

//   const handleRemarkBlur = async (lead) => {
//     const remark = remarkMap[lead.id];
//     if (remark === undefined || remark === (lead.remark ?? "")) return;
//     setSavingLeads(prev => new Set(prev).add(lead.id));
//     try { await saveRemark(lead.id, remark); } 
//     catch { toast.error("Remark failed"); } 
//     finally { setSavingLeads(prev => { const n = new Set(prev); n.delete(lead.id); return n; }); }
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 p-4">
//       <Toaster position="top-right" />
//       <div className="max-w-screen-2xl mx-auto space-y-4">
        
//         {/* HEADER */}
//         <div className="flex justify-between items-end">
//           <div>
//             <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
//               {isManager ? "HR Manager Bucket" : "My Assigned Leads"}
//             </h1>
//             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
//               {isManager ? "Global Department View" : `Private Leads for UID: ${auth.id}`}
//             </p>
//           </div>
//           <div className="flex gap-2">
//              <button onClick={() => isManager ? reload({ departmentId: hrDeptId }) : reload({ assignedToUserId: auth.id })} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
//                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
//              </button>
//           </div>
//         </div>

//         {/* TABLE */}
//         <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
//           <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
//              <div className="relative w-64">
//                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
//                <input type="text" placeholder="Search my leads..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none" />
//              </div>
//              <div className="text-[10px] font-black text-slate-400 uppercase">{filteredLeads.length} Total Leads</div>
//           </div>

//           <table className="w-full text-left border-collapse">
//             <thead>
//               <tr className="bg-gray-50/50 border-b border-gray-100">
//                 <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase">Lead Info</th>
//                 <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase">Contact</th>
//                 <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase">Status</th>
//                 <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase">Assigned To</th>
//                 <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase">Remarks</th>
//                 <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase text-right">Action</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-50">
//               {loading ? (
//                 <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" /></td></tr>
//               ) : paginatedLeads.map(l => (
//                 <tr key={l.id} className="hover:bg-indigo-500/[0.01] transition-colors group">
//                   <td className="px-6 py-3">
//                     <div className="flex items-center gap-3">
//                       <Avatar name={l.name} />
//                       <div>
//                         <p className="text-[11px] font-black uppercase text-gray-800">{l.name || "Unknown"}</p>
//                         <p className="text-[9px] font-bold text-gray-400">ID: {l.id}</p>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-3">
//                     <p className="text-[10px] font-bold text-indigo-600 lowercase">{l.email}</p>
//                     <p className="text-[10px] font-medium text-gray-500">{l.phone}</p>
//                   </td>
//                   <td className="px-6 py-3">
//                     <select value={l.status || "New"} onChange={e => handleStatusChange(l.id, e.target.value)} className="text-[9px] font-black uppercase border border-gray-200 rounded-lg px-2 py-1 outline-none">
//                       <option value="New">New</option>
//                       <option value="Contacted">Contacted</option>
//                       <option value="Qualified">Qualified</option>
//                       <option value="Lost">Lost</option>
//                     </select>
//                   </td>
//                   <td className="px-6 py-3">
//                     {isManager ? (
//                       <button onClick={() => setSelectedLead(l)} className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:underline">
//                         <UserPlus size={12} /> {l.assignedToUserName || "Unassigned"}
//                       </button>
//                     ) : (
//                       <span className="text-[10px] font-bold text-gray-600">{l.assignedToUserName || "Me"}</span>
//                     )}
//                   </td>
//                   <td className="px-6 py-3">
//                     <input type="text" placeholder="..." value={remarkMap[l.id] ?? l.remark ?? ""} onChange={e => setRemarkMap(prev => ({ ...prev, [l.id]: e.target.value }))} onBlur={() => handleRemarkBlur(l)} className="w-full bg-gray-50 border border-transparent hover:border-gray-200 rounded px-2 py-1 text-[10px] focus:bg-white transition-all outline-none" />
//                   </td>
//                   <td className="px-6 py-3 text-right">
//                     <button onClick={() => setViewLead(l)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye size={14}/></button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* ASSIGN MODAL (MANAGER ONLY) */}
//       <AnimatePresence>
//         {selectedLead && isManager && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
//             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
//               <h3 className="text-xs font-black uppercase text-gray-800 mb-4 flex items-center gap-2"><UserPlus size={16} className="text-indigo-600"/> Assign Personnel</h3>
              
//               <div className="relative mb-6">
//                 <input type="text" placeholder="Search employee..." value={empSearchQuery} onChange={e => { setEmpSearchQuery(e.target.value); setTargetUserId(""); setShowDropdown(true); }} className="w-full px-4 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20" />
//                 {showDropdown && empSearchQuery && (
//                   <div className="absolute w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-50">
//                     {employees.filter(e => e.username.toLowerCase().includes(empSearchQuery.toLowerCase())).slice(0,5).map(e => (
//                       <button key={e.userId} onClick={() => { setTargetUserId(e.userId); setEmpSearchQuery(e.username); setShowDropdown(false); }} className="w-full px-4 py-2 text-left text-[10px] font-bold hover:bg-indigo-50 border-b border-gray-50 last:border-0">{e.username} (ID: {e.userId})</button>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <div className="flex gap-2">
//                 <button onClick={() => setSelectedLead(null)} className="flex-1 py-2 text-[10px] font-black uppercase text-slate-400">Cancel</button>
//                 <button onClick={handleAssignmentAction} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95">Route Lead</button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* 🛑 THE CENTERED CONFIRMATION POPUP */}
//       <AnimatePresence>
//         {confirm.open && (
//           <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
//             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-[280px] p-6 text-center border border-slate-100">
//                <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
//                <h3 className="text-[11px] font-black uppercase text-slate-800 mb-2">{confirm.title}</h3>
//                <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-6">{confirm.message}</p>
//                <div className="flex gap-2">
//                  <button onClick={() => setConfirm({ ...confirm, open: false })} className="flex-1 py-1.5 text-[9px] font-black uppercase text-slate-400 bg-slate-50 rounded-lg">No</button>
//                  <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, open: false }); }} className="flex-1 py-1.5 text-[9px] font-black uppercase bg-indigo-600 text-white rounded-lg shadow-md">Yes, Confirm</button>
//                </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//     </div>
//   );
// }