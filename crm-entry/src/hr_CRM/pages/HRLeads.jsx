import { useEffect, useState } from "react";
import useFacebookLeads from "../../socialCRM/hooks/useFacebookLeads";
import { getDepartments } from "../api/hr.dept";
import { useAuth } from "../../auth/AuthContext";
import * as XLSX from "xlsx";
import {
  Users, Download, Eye, FileText, X,
  MessageSquare, MousePointer2, Search, Building2, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

const STATUS_COLORS = {
  new:       "bg-blue-50 text-blue-600 border-blue-100",
  contacted: "bg-yellow-50 text-yellow-600 border-yellow-100",
  qualified: "bg-emerald-50 text-emerald-600 border-emerald-100",
  converted: "bg-purple-50 text-purple-600 border-purple-100",
  lost:      "bg-red-50 text-red-500 border-red-100",
};

export default function HRLeads() {
  const { user } = useAuth();
  const myUserId = user?.sub || user?.id || user?.userId || user?.uid;

  const { leads, loading, reload, assignLead } = useFacebookLeads();

  const [departments, setDepartments]       = useState([]);
  const [deptLoading, setDeptLoading]       = useState(true);
  const [selectedDeptId, setSelectedDeptId] = useState("");

  const [searchTerm, setSearchTerm]         = useState("");
  const [selectedLead, setSelectedLead]     = useState(null);
  const [remarkMap, setRemarkMap]           = useState({});
  const [isSelectMode, setIsSelectMode]     = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);

  /* load departments once */
  useEffect(() => {
    getDepartments()
      .then(data => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load departments"))
      .finally(() => setDeptLoading(false));
  }, []);

  /* reload leads: by dept if selected, otherwise by current user only */
  useEffect(() => {
    if (selectedDeptId) {
      reload({ departmentId: selectedDeptId, assignedToUserId: undefined });
    } else {
      reload({ departmentId: undefined, assignedToUserId: myUserId });
    }
  }, [selectedDeptId, myUserId]);

  const filteredLeads = leads.filter(l =>
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone?.includes(searchTerm)
  );

  const toggleSelect = id =>
    setSelectedLeadIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const exportToExcel = (mode) => {
    const src = mode === "selected"
      ? filteredLeads.filter(l => selectedLeadIds.includes(l.id))
      : filteredLeads;
    if (!src.length) return;
    const rows = src.map(l => ({
      Name: l.name || "",
      Email: l.email || "",
      Phone: l.phone || "",
      Status: l.status || "",
      Department: l.departmentName || "",
      AssignedTo: l.assignedToUserName || "",
      CreatedAt: new Date(l.createdAt).toLocaleString(),
      ...(l.fields || {}),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Leads");
    XLSX.writeFile(wb, `dept-leads-${mode}.xlsx`);
  };

  const selectedDeptName = departments.find(
    d => String(d.departmentId) === String(selectedDeptId)
  )?.departmentName || "All Departments";

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
      <Toaster position="top-right" />

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 size={22} className="text-indigo-600" /> Department Leads
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            Social CRM leads assigned by department
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Department selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
            <Building2 size={14} className="text-indigo-500 shrink-0" />
            {deptLoading ? (
              <Loader2 size={14} className="animate-spin text-slate-400" />
            ) : (
              <select
                value={selectedDeptId}
                onChange={e => { setSelectedDeptId(e.target.value); setSelectedLeadIds([]); }}
                className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
                ))}
              </select>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-48 outline-none focus:ring-2 focus:ring-indigo-50"
            />
          </div>

          {/* Select mode */}
          <button
            onClick={() => { setIsSelectMode(!isSelectMode); if (isSelectMode) setSelectedLeadIds([]); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              isSelectMode
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : "bg-slate-900 text-white shadow-sm hover:bg-slate-800"
            }`}
          >
            {isSelectMode ? <X size={14} /> : <MousePointer2 size={14} />}
            {isSelectMode ? "Cancel" : "Select Mode"}
          </button>
        </div>
      </div>

      {/* ── Stats badge ── */}
      <div className="flex items-center gap-3 px-1">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {loading ? "Loading…" : `${filteredLeads.length} lead${filteredLeads.length !== 1 ? "s" : ""}`}
        </span>
        {selectedDeptId && (
          <span className="px-2 py-0.5 text-[9px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full uppercase tracking-widest">
            {selectedDeptName}
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Loading leads…</span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users size={32} className="mb-2 opacity-30" />
            <p className="text-xs font-bold uppercase tracking-widest">
              {selectedDeptId ? "No leads assigned to this department" : "No leads found"}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {isSelectMode && (
                  <th className="px-4 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
                      onChange={e => setSelectedLeadIds(e.target.checked ? filteredLeads.map(l => l.id) : [])}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Contact</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Department</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Assigned To</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map(l => (
                <tr key={l.id} className={`transition-all ${selectedLeadIds.includes(l.id) ? "bg-indigo-50/40" : "hover:bg-slate-50/50"}`}>
                  {isSelectMode && (
                    <td className="px-4 py-4 text-center border-r border-slate-100">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(l.id)}
                        onChange={() => toggleSelect(l.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-[10px] border border-indigo-100 uppercase">
                        {l.name?.charAt(0) || "L"}
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-slate-800 uppercase leading-tight">{l.name || "Unknown"}</p>
                        <span className="text-[8px] font-bold text-slate-400">#{String(l.id).slice(-6)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <p className="text-[11px] font-bold text-slate-600">{l.email || "—"}</p>
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{l.phone || "—"}</p>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="px-2 py-0.5 text-[9px] font-black bg-slate-50 text-slate-500 border border-slate-200 rounded-full uppercase tracking-widest">
                      {l.departmentName || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md border ${STATUS_COLORS[l.status?.toLowerCase()] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
                      {l.status || "New"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-[10px] font-bold text-slate-600">{l.assignedToUserName || "—"}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedLead(l)}
                      className="p-1.5 bg-slate-50 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-200"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Floating action bar ── */}
      <AnimatePresence>
        {isSelectMode && selectedLeadIds.length > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 border border-slate-700 z-40"
          >
            <span className="text-[10px] font-black text-white uppercase tracking-widest border-r border-slate-700 pr-6">
              {selectedLeadIds.length} Selected
            </span>
            <button
              onClick={() => exportToExcel("selected")}
              className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-500 transition-all flex items-center gap-2"
            >
              <Download size={12} /> Export Excel
            </button>
            <button
              onClick={() => exportToExcel("all")}
              className="px-4 py-1.5 bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-600 transition-all flex items-center gap-2"
            >
              <Download size={12} /> Export All
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lead detail modal ── */}
      <AnimatePresence>
        {selectedLead && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedLead(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600" />
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Lead Profile</h3>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-all">
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[70vh] space-y-3">
                {/* Department & Status badges */}
                <div className="flex gap-2 flex-wrap">
                  {selectedLead.departmentName && (
                    <span className="px-2 py-0.5 text-[9px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full uppercase tracking-widest">
                      {selectedLead.departmentName}
                    </span>
                  )}
                  {selectedLead.status && (
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border uppercase tracking-widest ${STATUS_COLORS[selectedLead.status?.toLowerCase()] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
                      {selectedLead.status}
                    </span>
                  )}
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-2 gap-2">
                  {selectedLead.fields && Object.entries(selectedLead.fields).map(([k, v]) => (
                    <div key={k} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">{k.replace(/_/g, " ")}</p>
                      <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight truncate">{v || "—"}</p>
                    </div>
                  ))}
                </div>

                {/* Assigned to */}
                {selectedLead.assignedToUserName && (
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Assigned To</p>
                    <p className="text-[11px] font-black text-slate-700">{selectedLead.assignedToUserName}</p>
                  </div>
                )}

                {/* Remarks */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-indigo-600 uppercase ml-1 tracking-widest flex items-center gap-1">
                    <MessageSquare size={12} /> Internal Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="Type notes and press Enter..."
                    value={remarkMap[selectedLead.id] ?? selectedLead.remark ?? ""}
                    onChange={e => setRemarkMap(prev => ({ ...prev, [selectedLead.id]: e.target.value }))}
                    onBlur={() => assignLead(selectedLead.id, selectedLead.assignedToUserId, selectedLead.assignedToUserName, remarkMap[selectedLead.id])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
                  />
                </div>

                <button onClick={() => setSelectedLead(null)} className="w-full py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-600 transition-all tracking-widest shadow-md">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}