// import { useEffect, useState } from "react";
// import useFacebookLeads from "../../socialCRM/hooks/useFacebookLeads";
// import { getDepartments } from "../api/hr.dept";
// import { useAuth } from "../../auth/AuthContext";
// import * as XLSX from "xlsx";
// import {
//   Users, Download, Eye, FileText, X,
//   MessageSquare, MousePointer2, Search, Building2, Loader2
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";

// // Updated to use opacity-based backgrounds for theme compatibility
// const STATUS_COLORS = {
//   new:       "bg-blue-500/10 text-blue-500 border-blue-500/20",
//   contacted: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
//   qualified: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
//   converted: "bg-purple-500/10 text-purple-500 border-purple-500/20",
//   lost:      "bg-red-500/10 text-red-500 border-red-500/20",
// };

// export default function HRLeads() {
//   const { user } = useAuth();
//   const myUserId = user?.sub || user?.id || user?.userId || user?.uid;

//   const { leads, loading, reload, assignLead } = useFacebookLeads();

//   const [departments, setDepartments]       = useState([]);
//   const [deptLoading, setDeptLoading]       = useState(true);
//   const [selectedDeptId, setSelectedDeptId] = useState("");

//   const [searchTerm, setSearchTerm]         = useState("");
//   const [selectedLead, setSelectedLead]     = useState(null);
//   const [remarkMap, setRemarkMap]           = useState({});
//   const [isSelectMode, setIsSelectMode]     = useState(false);
//   const [selectedLeadIds, setSelectedLeadIds] = useState([]);

//   useEffect(() => {
//     getDepartments()
//       .then(data => setDepartments(Array.isArray(data) ? data : []))
//       .catch(() => toast.error("Failed to load departments"))
//       .finally(() => setDeptLoading(false));
//   }, []);

//   useEffect(() => {
//     if (selectedDeptId) {
//       reload({ departmentId: selectedDeptId, assignedToUserId: undefined });
//     } else {
//       reload({ departmentId: undefined, assignedToUserId: myUserId });
//     }
//   }, [selectedDeptId, myUserId]);

//   const filteredLeads = leads.filter(l =>
//     l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     l.phone?.includes(searchTerm)
//   );

//   const toggleSelect = id =>
//     setSelectedLeadIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

//   const exportToExcel = (mode) => {
//     const src = mode === "selected"
//       ? filteredLeads.filter(l => selectedLeadIds.includes(l.id))
//       : filteredLeads;
//     if (!src.length) return;
//     const rows = src.map(l => ({
//       Name: l.name || "",
//       Email: l.email || "",
//       Phone: l.phone || "",
//       Status: l.status || "",
//       Department: l.departmentName || "",
//       AssignedTo: l.assignedToUserName || "",
//       CreatedAt: new Date(l.createdAt).toLocaleString(),
//       ...(l.fields || {}),
//     }));
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Leads");
//     XLSX.writeFile(wb, `dept-leads-${mode}.xlsx`);
//   };

//   const selectedDeptName = departments.find(
//     d => String(d.departmentId) === String(selectedDeptId)
//   )?.departmentName || "All Departments";

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
//       <Toaster position="top-right" />

//       {/* ── Header ── */}
//       <div className="flex items-center justify-between flex-wrap gap-3 px-1">
//         <div>
//           <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2">
//             <Building2 size={22} className="text-indigo-500" /> Department Leads
//           </h2>
//           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
//             Social CRM leads assigned by department
//           </p>
//         </div>

//         <div className="flex items-center gap-2 flex-wrap">
//           {/* Department selector */}
//           <div className="flex items-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-3 py-1.5">
//             <Building2 size={14} className="text-indigo-500 shrink-0" />
//             {deptLoading ? (
//               <Loader2 size={14} className="animate-spin text-slate-400" />
//             ) : (
//               <select
//                 value={selectedDeptId}
//                 onChange={e => { setSelectedDeptId(e.target.value); setSelectedLeadIds([]); }}
//                 className="text-xs font-bold text-[var(--text-main)] bg-transparent outline-none cursor-pointer"
//               >
//                 <option value="" className="bg-[var(--bg-card)]">All Departments</option>
//                 {departments.map(d => (
//                   <option key={d.departmentId} value={d.departmentId} className="bg-[var(--bg-card)]">{d.departmentName}</option>
//                 ))}
//               </select>
//             )}
//           </div>

//           {/* Search */}
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
//             <input
//               type="text"
//               placeholder="Search leads..."
//               value={searchTerm}
//               onChange={e => setSearchTerm(e.target.value)}
//               className="text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg pl-9 pr-4 py-2 w-48 outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)]"
//             />
//           </div>

//           {/* Select mode */}
//           <button
//             onClick={() => { setIsSelectMode(!isSelectMode); if (isSelectMode) setSelectedLeadIds([]); }}
//             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
//               isSelectMode
//                 ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
//                 : "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
//             }`}
//           >
//             {isSelectMode ? <X size={14} /> : <MousePointer2 size={14} />}
//             {isSelectMode ? "Cancel" : "Select Mode"}
//           </button>
//         </div>
//       </div>

//       {/* ── Stats badge ── */}
//       <div className="flex items-center gap-3 px-1">
//         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//           {loading ? "Loading…" : `${filteredLeads.length} lead${filteredLeads.length !== 1 ? "s" : ""}`}
//         </span>
//         {selectedDeptId && (
//           <span className="px-2 py-0.5 text-[9px] font-black bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-full uppercase tracking-widest">
//             {selectedDeptName}
//           </span>
//         )}
//       </div>

//       {/* ── Table ── */}
//       <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden transition-colors">
//         {loading ? (
//           <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
//             <Loader2 size={20} className="animate-spin text-indigo-500" />
//             <span className="text-xs font-bold uppercase tracking-widest">Loading leads…</span>
//           </div>
//         ) : filteredLeads.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-16 text-slate-400">
//             <Users size={32} className="mb-2 opacity-30" />
//             <p className="text-xs font-bold uppercase tracking-widest">
//               {selectedDeptId ? "No leads assigned to this department" : "No leads found"}
//             </p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-left border-collapse">
//               <thead>
//                 <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
//                   {isSelectMode && (
//                     <th className="px-4 py-3 text-center w-10">
//                       <input
//                         type="checkbox"
//                         checked={selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0}
//                         onChange={e => setSelectedLeadIds(e.target.checked ? filteredLeads.map(l => l.id) : [])}
//                         className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
//                       />
//                     </th>
//                   )}
//                   <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead</th>
//                   <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Contact</th>
//                   <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Department</th>
//                   <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
//                   <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Assigned To</th>
//                   <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">View</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-[var(--border-color)]/30">
//                 {filteredLeads.map(l => (
//                   <tr key={l.id} className={`transition-all ${selectedLeadIds.includes(l.id) ? "bg-indigo-500/5" : "hover:bg-indigo-500/[0.02]"}`}>
//                     {isSelectMode && (
//                       <td className="px-4 py-4 text-center border-r border-[var(--border-color)]/30">
//                         <input
//                           type="checkbox"
//                           checked={selectedLeadIds.includes(l.id)}
//                           onChange={() => toggleSelect(l.id)}
//                           className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
//                         />
//                       </td>
//                     )}
//                     <td className="px-5 py-3.5">
//                       <div className="flex items-center gap-3">
//                         <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-[10px] border border-indigo-500/20 uppercase">
//                           {l.name?.charAt(0) || "L"}
//                         </div>
//                         <div>
//                           <p className="text-[12px] font-black text-[var(--text-main)] uppercase leading-tight">{l.name || "Unknown"}</p>
//                           <span className="text-[8px] font-bold text-slate-400">#{String(l.id).slice(-6)}</span>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-5 py-3.5 text-center">
//                       <p className="text-[11px] font-bold text-[var(--text-main)] opacity-80">{l.email || "—"}</p>
//                       <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{l.phone || "—"}</p>
//                     </td>
//                     <td className="px-5 py-3.5 text-center">
//                       <span className="px-2 py-0.5 text-[9px] font-black bg-[var(--bg-body)] text-slate-400 border border-[var(--border-color)] rounded-full uppercase tracking-widest">
//                         {l.departmentName || "—"}
//                       </span>
//                     </td>
//                     <td className="px-5 py-3.5 text-center">
//                       <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md border ${STATUS_COLORS[l.status?.toLowerCase()] || "bg-slate-500/10 text-slate-500 border-slate-500/20"}`}>
//                         {l.status || "New"}
//                       </span>
//                     </td>
//                     <td className="px-5 py-3.5 text-center">
//                       <span className="text-[10px] font-bold text-[var(--text-main)] opacity-70">{l.assignedToUserName || "—"}</span>
//                     </td>
//                     <td className="px-5 py-3.5 text-right">
//                       <button
//                         onClick={() => setSelectedLead(l)}
//                         className="p-1.5 bg-[var(--bg-body)] rounded-md text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors border border-[var(--border-color)]"
//                       >
//                         <Eye size={14} />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* ── Floating action bar ── */}
//       <AnimatePresence>
//         {isSelectMode && selectedLeadIds.length > 0 && (
//           <motion.div
//             initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
//             className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 border border-slate-700 z-40"
//           >
//             <span className="text-[10px] font-black text-white uppercase tracking-widest border-r border-slate-700 pr-6">
//               {selectedLeadIds.length} Selected
//             </span>
//             <button
//               onClick={() => exportToExcel("selected")}
//               className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-500 transition-all flex items-center gap-2"
//             >
//               <Download size={12} /> Export Excel
//             </button>
//             <button
//               onClick={() => exportToExcel("all")}
//               className="px-4 py-1.5 bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-600 transition-all flex items-center gap-2"
//             >
//               <Download size={12} /> Export All
//             </button>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* ── Lead detail modal ── */}
//       <AnimatePresence>
//         {selectedLead && (
//           <div
//             className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
//             onClick={() => setSelectedLead(null)}
//           >
//             <motion.div
//               initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
//               className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)] flex flex-col transition-colors"
//               onClick={e => e.stopPropagation()}
//             >
//               <div className="px-5 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
//                 <div className="flex items-center gap-2">
//                   <FileText size={16} className="text-indigo-500" />
//                   <h3 className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Lead Profile</h3>
//                 </div>
//                 <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-[var(--bg-card)] rounded-full text-slate-400 hover:text-red-500 transition-all">
//                   <X size={16} />
//                 </button>
//               </div>

//               <div className="p-5 overflow-y-auto max-h-[70vh] space-y-3 custom-scrollbar">
//                 {/* Department & Status badges */}
//                 <div className="flex gap-2 flex-wrap">
//                   {selectedLead.departmentName && (
//                     <span className="px-2 py-0.5 text-[9px] font-black bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-full uppercase tracking-widest">
//                       {selectedLead.departmentName}
//                     </span>
//                   )}
//                   {selectedLead.status && (
//                     <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border uppercase tracking-widest ${STATUS_COLORS[selectedLead.status?.toLowerCase()] || "bg-slate-500/10 text-slate-500 border-slate-500/20"}`}>
//                       {selectedLead.status}
//                     </span>
//                   )}
//                 </div>

//                 {/* Form fields */}
//                 <div className="grid grid-cols-2 gap-2">
//                   {selectedLead.fields && Object.entries(selectedLead.fields).map(([k, v]) => (
//                     <div key={k} className="p-2.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl">
//                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">{k.replace(/_/g, " ")}</p>
//                       <p className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-tight truncate">{v || "—"}</p>
//                     </div>
//                   ))}
//                 </div>

//                 {/* Assigned to */}
//                 {selectedLead.assignedToUserName && (
//                   <div className="p-2.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl">
//                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Assigned To</p>
//                     <p className="text-[11px] font-black text-[var(--text-main)]">{selectedLead.assignedToUserName}</p>
//                   </div>
//                 )}

//                 {/* Remarks */}
//                 <div className="space-y-1">
//                   <label className="text-[9px] font-black text-indigo-500 uppercase ml-1 tracking-widest flex items-center gap-1">
//                     <MessageSquare size={12} /> Internal Remarks
//                   </label>
//                   <input
//                     type="text"
//                     placeholder="Type notes and press Enter..."
//                     value={remarkMap[selectedLead.id] ?? selectedLead.remark ?? ""}
//                     onChange={e => setRemarkMap(prev => ({ ...prev, [selectedLead.id]: e.target.value }))}
//                     onBlur={() => assignLead(selectedLead.id, selectedLead.assignedToUserId, selectedLead.assignedToUserName, remarkMap[selectedLead.id])}
//                     className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)] transition-all"
//                   />
//                 </div>

//                 <button onClick={() => setSelectedLead(null)} className="w-full py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 transition-all tracking-widest shadow-md">
//                   Close
//                 </button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }










import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import useFacebookLeads from "../../socialCRM/hooks/useFacebookLeads";
import { getDepartments } from "../api/hr.dept";
import { getAdminUsers } from "../../api/admin/users.api";
import { useRole } from "../hooks/useRole";
import { jwtDecode } from "jwt-decode";
import {
  Users, Eye, X, Search, Building2, 
  Loader2, UserPlus, Check, ChevronRight, Filter,
  MessageSquare, Briefcase
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function HRLeads() {
  const { isManager } = useRole();
  const { leads, loading, reload, assignLead } = useFacebookLeads();

  // Data States
  const [employees, setEmployees] = useState([]);
  const [hrDeptId, setHrDeptId] = useState(null);

  // UI & Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  
  // empsel Logic States (Standardized)
  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
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

  // 1. Initial Load & Hydration
  const initRegistry = useCallback(async () => {
    try {
      const [depts, emps] = await Promise.all([
        getDepartments(),
        getAdminUsers({ page: 1, pageSize: 200 })
      ]);

      // Populate empsel pool (Users only)
      setEmployees(emps?.users || emps || []);

      if (isManager) {
        // Manager Logic: Find HR Dept and get all departmental leads
        const hrDept = depts.find(d => 
          d.departmentName.toUpperCase() === "HR" || 
          d.departmentName.toUpperCase() === "HUMAN RESOURCES"
        );
        if (hrDept) {
          setHrDeptId(hrDept.departmentId);
          reload({ departmentId: hrDept.departmentId, assignedToUserId: undefined });
        } else {
          toast.error("HR Department record not found");
        }
      } else {
        // hrUser Logic: Fetch leads assigned specifically to login User ID
        reload({ departmentId: undefined, assignedToUserId: auth.id });
      }
    } catch {
      toast.error("Failed to synchronize lead registry");
    }
  }, [isManager, auth.id, reload]);

  useEffect(() => { initRegistry(); }, [initRegistry]);

  // empsel: Dropdown Click-Outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // empsel: Filter Search Results (Employees Only)
  const searchableEmployees = useMemo(() => {
    const query = empSearchQuery.toLowerCase().trim();
    if (!query || targetUserId) return [];
    return employees.filter(emp => 
      (emp.username || "").toLowerCase().includes(query) || 
      (emp.userId || "").toString().includes(query)
    ).slice(0, 5);
  }, [employees, empSearchQuery, targetUserId]);

  // Table Filter
  const filteredLeads = leads.filter(l =>
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone?.includes(searchTerm)
  );

  // Handle Assignment (Manager Only)
  const handleAssignmentAction = async () => {
    if (!targetUserId) return toast.error("Select an employee");
    const target = employees.find(e => e.userId === targetUserId);

    const tid = toast.loading("Processing Lead Routing...");
    try {
      await assignLead(selectedLead.id, target.userId, target.username, "Routed by Manager");
      toast.success(`Dispatched to ${target.username}`, { id: tid });
      setSelectedLead(null);
      setTargetUserId("");
      setEmpSearchQuery("");
      // Refresh departmental pool
      reload({ departmentId: hrDeptId });
    } catch {
      toast.error("Routing Failed", { id: tid });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-slate-900 transition-all duration-300">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase">
            <Users size={22} className="text-indigo-600" /> {isManager ? "HR Lead Bucket" : "My Assigned Leads"}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
            {isManager ? `Department Pool: #${hrDeptId}` : `User ID: #${auth.id}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search leads..."
              onChange={e => setSearchTerm(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-48 outline-none focus:ring-2 focus:ring-indigo-50"
            />
          </div>
          <button 
            onClick={() => isManager ? reload({ departmentId: hrDeptId }) : reload({ assignedToUserId: auth.id })} 
            className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
          >
            <Loader2 size={16} className={loading ? "animate-spin text-indigo-600" : "text-slate-400"} />
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-auto">Lead Details</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-64">Contact</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32">Status</th>
              {isManager && <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-24">Assign</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLeads.map(l => (
              <tr key={l.id} className="hover:bg-slate-50 transition-all group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-[10px] border border-indigo-100">
                      {l.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-1">{l.name}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Ref: {l.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-center">
                  <p className="text-[11px] font-bold text-slate-600 truncate">{l.email || "—"}</p>
                  <p className="text-[9px] font-black text-indigo-500 uppercase">{l.phone || "—"}</p>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="px-2.5 py-1 text-[8px] font-black bg-blue-50 text-blue-600 border border-blue-100 rounded-md uppercase tracking-widest">
                    {l.status || "Open"}
                  </span>
                </td>
                {isManager && (
                  <td className="px-5 py-4 text-right">
                    <button 
                      onClick={() => setSelectedLead(l)} 
                      className="p-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all active:scale-90"
                    >
                      <UserPlus size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>}
        {!loading && filteredLeads.length === 0 && (
          <div className="p-16 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">No active leads in registry</div>
        )}
      </div>

      {/* empsel ASSIGNMENT MODAL (Manager Only) */}
      <AnimatePresence>
        {selectedLead && isManager && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center shrink-0">
                 <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Reassign Lead</h3>
                 <button onClick={() => setSelectedLead(null)}><X size={18} className="text-slate-400 hover:text-rose-500"/></button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Prospect</p>
                   <p className="text-[13px] font-black text-slate-700 uppercase leading-none">{selectedLead.name}</p>
                </div>

                {/* empsel Search Field */}
                <div className="space-y-1 relative" ref={dropdownRef}>
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Select Assignee (Employees Only)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search Name or ID..." 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all" 
                      value={empSearchQuery} 
                      onFocus={() => setShowDropdown(true)}
                      onChange={(e) => { 
                        setEmpSearchQuery(e.target.value); 
                        setTargetUserId("");
                        setShowDropdown(true); 
                      }} 
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                  </div>

                  <AnimatePresence>
                    {showDropdown && searchableEmployees.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="absolute z-[120] w-full mt-1 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                        {searchableEmployees.map(emp => (
                          <button key={emp.userId} type="button" onClick={() => { 
                            setTargetUserId(emp.userId); 
                            setEmpSearchQuery(emp.username); 
                            setShowDropdown(false); 
                          }} className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex items-center justify-between border-b last:border-0 border-slate-50 transition-colors">
                            <div className="flex flex-col text-left">
                              <span className="text-[11px] font-black text-slate-700 uppercase">{emp.username}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Staff ID: #{emp.userId}</span>
                            </div>
                            <ChevronRight size={12} className="text-slate-300" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {targetUserId && (
                    <div className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                       <Check size={16} className="text-emerald-500 font-bold"/>
                       <div>
                          <p className="text-[10px] font-black text-emerald-700 uppercase leading-none">Employee Locked</p>
                          <p className="text-[8px] font-bold text-emerald-600 uppercase mt-0.5">UID: {targetUserId}</p>
                       </div>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleAssignmentAction}
                  disabled={!targetUserId}
                  className="w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase rounded-2xl shadow-lg active:scale-95 disabled:opacity-30 transition-all mt-4 tracking-widest"
                >
                  Authorize Assignment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}