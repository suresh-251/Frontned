/**
 * SalesLeads.jsx
 * Shows Social CRM leads assigned to this Sales user / Sales department.
 * Uses brand-free /api/leads/* endpoints — no active Social CRM brand required.
 */
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
// Legacy screen note:
// AppRouter.jsx currently routes to pages/Leads.jsx, so this file is not part
// of the active Sales CRM experience.
import useAssignedLeads from "../../socialCRM/hooks/useAssignedLeads";
import { getDepartments } from "../../hr_CRM/api/hr.dept";
import { getAdminUsers } from "../../api/admin/users.api";
import { jwtDecode } from "jwt-decode";
import { getAccessToken } from "../../utils/authStorage";
import * as XLSX from "xlsx";
import {
  Users, Eye, X, Search, ChevronLeft, ChevronRight,
  Loader2, UserPlus, Check, RefreshCw, Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// ── Helpers ──────────────────────────────────────────────────────────────────
const Avatar = ({ name }) => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-300 to-purple-500 flex items-center justify-center shadow text-white text-xs font-bold flex-shrink-0">
    {name ? String(name).charAt(0).toUpperCase() : "?"}
  </div>
);

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
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-3 h-3" />
        </button>
        {pages.map((p, i) =>
          p === "..." ? <span key={`e${i}`} className="px-2 text-gray-400 text-xs">…</span> : (
            <button key={p} onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === currentPage ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600"}`}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// ── Role check (Sales) ────────────────────────────────────────────────────────
const useSalesRole = () => {
  return useMemo(() => {
    try {
      const token = getAccessToken();
      if (!token) return { isManager: false, id: null };
      const decoded = jwtDecode(token);
      const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      const role = decoded[ROLE_CLAIM];
      const perm = decoded.perm;
      const isManager =
        role === "SALES_MANAGER" ||
        role === "ADMIN" ||
        perm === "CRM_FULL_ACCESS";
      return { isManager, id: Number(decoded.sub || decoded.id) };
    } catch {
      return { isManager: false, id: null };
    }
  }, []);
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function SalesLeads() {
  const { isManager, id: authId } = useSalesRole();
  const { leads, loading, reload, changeStatus, saveRemark } = useAssignedLeads();

  const [employees, setEmployees]       = useState([]);
  const [salesDeptId, setSalesDeptId]   = useState(null);

  // Table
  const [searchTerm, setSearchTerm]     = useState("");
  const [pageSize, setPageSize]         = useState(25);
  const [currentPage, setCurrentPage]   = useState(1);
  const [remarkMap, setRemarkMap]       = useState({});
  const [savingLeads, setSavingLeads]   = useState(new Set());

  // Modals
  const [viewLead, setViewLead]         = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);

  // Assign dropdown
  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [showDropdown, setShowDropdown]     = useState(false);
  const [targetUserId, setTargetUserId]     = useState("");
  const dropdownRef = useRef(null);

  // Initial load
  const initRegistry = useCallback(async () => {
    try {
      const [depts, emps] = await Promise.all([
        getDepartments(),
        getAdminUsers({ page: 1, pageSize: 200 }),
      ]);
      setEmployees(emps?.users || emps || []);

      if (isManager) {
        const salesDept = depts.find(d => {
          const n = d.departmentName.toUpperCase();
          return n === "SALES" || n === "SALES DEPARTMENT" || n === "SALES TEAM" || n.startsWith("SALES");
        });
        if (salesDept) {
          setSalesDeptId(salesDept.departmentId);
          reload({ departmentId: salesDept.departmentId });
        } else {
          // No Sales dept found — still show leads assigned directly to this manager
          reload({});
          toast("Sales department not found — showing your directly assigned leads", { icon: "ℹ️" });
        }
      } else {
        // Regular sales user — backend returns leads assigned to JWT userId
        reload({});
      }
    } catch {
      toast.error("Failed to load lead registry");
    }
  }, [isManager, authId, reload]);

  useEffect(() => { initRegistry(); }, [initRegistry]);

  // Click-outside for assign dropdown
  useEffect(() => {
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Filtered + paginated
  const filteredLeads = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return leads.filter(l =>
      (l.name  || "").toLowerCase().includes(q) ||
      (l.email || "").toLowerCase().includes(q) ||
      (l.phone || "").includes(q)
    );
  }, [leads, searchTerm]);

  const totalPages     = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  const handleStatusChange = async (leadId, newStatus) => {
    try { await changeStatus(leadId, newStatus); }
    catch { toast.error("Failed to update status"); }
  };

  const handleRemarkBlur = async (lead) => {
    const remark = remarkMap[lead.id];
    if (remark === undefined || remark === (lead.remark ?? "")) return;
    setSavingLeads(prev => new Set(prev).add(lead.id));
    try { await saveRemark(lead.id, remark); }
    catch { toast.error("Failed to save remark"); }
    finally { setSavingLeads(prev => { const n = new Set(prev); n.delete(lead.id); return n; }); }
  };

  const exportToExcel = () => {
    if (!filteredLeads.length) return;
    const rows = filteredLeads.map(l => ({
      ID: l.id, Name: l.name || "", Email: l.email || "", Phone: l.phone || "",
      Status: l.status || "", "Assigned To": l.assignedToUserName || "",
      Department: l.departmentName || "", Remark: l.remark || "",
      Campaign: l.campaignName || "", "Ad Set": l.adsetName || "", Ad: l.adName || "",
      "Created At": l.metaCreatedAt ? new Date(l.metaCreatedAt).toLocaleString() : "",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Sales Leads");
    XLSX.writeFile(wb, `sales-leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-screen-2xl mx-auto px-4 py-4 space-y-5">
        <Toaster position="top-right" />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isManager ? "Sales Lead Bucket" : "My Assigned Leads"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isManager
              ? `Social CRM leads assigned to the Sales department · Dept #${salesDeptId}`
              : "Social CRM leads assigned directly to you"}
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
              {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n} rows</option>)}
            </select>

            <button onClick={exportToExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
              <Download className="w-3.5 h-3.5" /> Export
            </button>

            <button onClick={() => isManager ? reload({ departmentId: salesDeptId }) : reload({})}
              className="p-1.5 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all" title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-500" : ""}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">{filteredLeads.length} leads</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Search leads..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-60 transition-all" />
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
                      <p className="text-xs mt-1">No Social CRM leads are assigned to you yet.</p>
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
                            <p className="text-xs text-gray-400">{l.email || l.phone || "Lead"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        {l.email && <p className="text-xs text-blue-600 font-medium truncate max-w-[150px]">{l.email}</p>}
                        {l.phone && <p className="text-xs text-gray-500">{l.phone}</p>}
                        {!l.email && !l.phone && <span className="text-gray-300">—</span>}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <select
                          value={l.status || "New"}
                          onChange={e => handleStatusChange(l.id, e.target.value)}
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 border focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors cursor-pointer appearance-none text-center
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

                      {/* Assigned To */}
                      <td className="px-4 py-3">
                        {isManager ? (
                          <button
                            onClick={() => { setSelectedLead(l); setTargetUserId(""); setEmpSearchQuery(""); }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
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
                            className="w-[140px] px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 hover:bg-white transition-colors"
                          />
                          {savingLeads.has(l.id) && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
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
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
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

        {/* ── View Detail Modal ── */}
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
                      <p className="text-xs text-gray-400">{viewLead.email || viewLead.phone || "Lead details"}</p>
                    </div>
                  </div>
                  {[
                    ["Email",       viewLead.email],
                    ["Phone",       viewLead.phone],
                    ["Status",      viewLead.status],
                    ["Assigned To", viewLead.assignedToUserName],
                    ["Department",  viewLead.departmentName],
                    ["Campaign",    viewLead.campaignName],
                    ["Ad Set",      viewLead.adsetName],
                    ["Ad",          viewLead.adName],
                    ["Remark",      viewLead.remark],
                    ["Created",     viewLead.metaCreatedAt
                      ? new Date(viewLead.metaCreatedAt).toLocaleString()
                      : viewLead.syncedAt
                      ? new Date(viewLead.syncedAt).toLocaleString()
                      : null],
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
                    <p className="text-xs text-gray-400">{selectedLead.email || selectedLead.phone || "Selected lead"}</p>
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
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
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
                              className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center justify-between border-b last:border-0 border-gray-50 transition-colors">
                              <div>
                                <p className="text-sm font-medium text-gray-700">{emp.username}</p>
                                <p className="text-xs text-gray-400">{emp.email || emp.role || "Sales User"}</p>
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
                          <p className="text-xs text-emerald-500">{searchableEmployees.find((emp) => Number(emp.userId) === Number(targetUserId))?.email || "Ready to assign"}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAssignmentAction}
                    disabled={!targetUserId}
                    className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow hover:bg-blue-700 active:scale-95 disabled:opacity-30 transition-all"
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
