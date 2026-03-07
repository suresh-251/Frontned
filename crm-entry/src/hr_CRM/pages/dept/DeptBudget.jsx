// import React, { useState, useEffect, useMemo } from "react";
// import { 
//   Wallet, X, Search, Building2, Plus, 
//   Loader2, Eye, TrendingUp, CircleDollarSign, 
//   MapPin, Calendar, Layers, Trash2 
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";

// // API IMPORTS
// import { 
//   createDepartmentBudget, 
//   getDepartmentBudgets, 
//   deleteDepartmentBudget,
//   getDepartmentBudgetById 
// } from "../../api/dept/deptBudget.api";
// import { getDepartments } from "../../api/hr.dept";
// import { getBranches } from "../../api/api.branch";

// export default function DeptBudget() {
//   const [budgets, setBudgets] = useState([]);
//   const [branches, setBranches] = useState([]);
//   const [allDepartments, setAllDepartments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [createOpen, setCreateOpen] = useState(false);
//   const [selected, setSelected] = useState(null);
//   const [submitting, setSubmitting] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");

//   const [selectedBranchId, setSelectedBranchId] = useState("");
//   const [modalBranchId, setModalBranchId] = useState("");

//   const [form, setForm] = useState({
//     departmentId: "", totalAnnualBudget: "",
//     trainingBudget: "", resourceBudget: "", year: new Date().getFullYear(),
//   });

//   const loadData = async () => {
//     setLoading(true);
//     try {
//       const [budRes, deptRes, branchRes] = await Promise.all([
//         getDepartmentBudgets(),
//         getDepartments(),
//         getBranches()
//       ]);
//       setBudgets(Array.isArray(budRes) ? budRes : budRes?.data || []);
//       setAllDepartments(Array.isArray(deptRes) ? deptRes : deptRes?.data || []);
//       setBranches(Array.isArray(branchRes) ? branchRes : branchRes?.data || []);
//     } catch {
//       toast.error("Sync Error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { loadData(); }, []);

//   const resetForm = () => {
//     setForm({
//       departmentId: "", totalAnnualBudget: "",
//       trainingBudget: "", resourceBudget: "", year: new Date().getFullYear(),
//     });
//     setModalBranchId("");
//   };

//   const modalFilteredDepts = useMemo(() => {
//     if (!modalBranchId) return [];
//     return allDepartments
//       .filter(d => Number(d.branchId) === Number(modalBranchId))
//       .filter(d => !budgets.some(b => b.departmentId === (d.departmentId || d.id)));
//   }, [modalBranchId, allDepartments, budgets]);

//   const filteredBudgets = useMemo(() => {
//     return budgets.filter(b => {
//       const dept = allDepartments.find(d => d.departmentId === b.departmentId);
//       const matchesBranch = !selectedBranchId || Number(dept?.branchId) === Number(selectedBranchId);
//       const matchesSearch = !searchTerm || dept?.departmentName?.toLowerCase().includes(searchTerm.toLowerCase());
//       return matchesBranch && matchesSearch;
//     });
//   }, [selectedBranchId, searchTerm, budgets, allDepartments]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitting(true);
//     try {
//       const payload = {
//         departmentId: Number(form.departmentId),
//         totalAnnualBudget: Number(form.totalAnnualBudget),
//         trainingBudget: Number(form.trainingBudget),
//         resourceBudget: Number(form.resourceBudget),
//         year: Number(form.year)
//       };
//       await createDepartmentBudget(payload);
//       toast.success("Budget Allocated Successfully");
//       setCreateOpen(false);
//       loadData();
//     } catch {
//       toast.error("Allocation Failed");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if(!window.confirm("Remove this budget allocation?")) return;
//     const tid = toast.loading("Removing allocation...");
//     try {
//       await deleteDepartmentBudget(id);
//       toast.success("Budget Removed", { id: tid });
//       loadData();
//     } catch {
//       toast.error("Failed to remove budget", { id: tid });
//     }
//   };

//   const handleView = async (budget) => {
//     setSelected(budget); 
//     try {
//       const freshData = await getDepartmentBudgetById(budget.id);
//       setSelected(freshData.data || freshData);
//     } catch (err) {
//       console.error("Could not fetch fresh details", err);
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
//       <Toaster position="top-right" />

//       {/* COMPACT HEADER (toplook standard) */}
//       <div className="flex items-center justify-between px-1">
//         <div>
//           <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
//             <Wallet size={22} className="text-indigo-600" /> Dept Budgets
//           </h2>
//           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Financial Allocations</p>
//         </div>

//         <div className="flex items-center gap-2">
//           <select 
//             className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
//             value={selectedBranchId}
//             onChange={(e) => setSelectedBranchId(e.target.value)}
//           >
//             <option value="">Filter: All Branches</option>
//             {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
//           </select>

//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
//             <input 
//               type="text" placeholder="Search..." value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-48 outline-none focus:ring-2 focus:ring-indigo-50"
//             />
//           </div>

//           <button 
//             onClick={() => { resetForm(); setCreateOpen(true); }}
//             className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
//           >
//             <Plus size={14} strokeWidth={3} /> New Allocation
//           </button>
//         </div>
//       </div>

//       {/* TABLE SECTION */}
//       {/* TABLE SECTION */}
// {loading ? (
//   <div className="flex justify-center py-20">
//     <Loader2 className="animate-spin text-indigo-500" size={24} />
//   </div>
// ) : (
//   <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//     <table className="w-full text-left border-collapse table-fixed"> {/* table-fixed ensures widths are respected */}
//       <thead>
//         <tr className="bg-slate-50 border-b border-slate-200">
//           <th className="w-[30%] px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Department</th>
//           <th className="w-[30%] px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Budget Breakdown</th>
//           <th className="w-[10%] px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Fiscal</th>
//           <th className="w-[20%] px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Annual Total</th>
//           <th className="w-[10%] px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
//         </tr>
//       </thead>
//       <tbody className="divide-y divide-slate-100">
//         {filteredBudgets.map((b) => {
//           const dept = allDepartments.find(d => d.departmentId === b.departmentId);
//           const branch = branches.find(br => br.branchId === dept?.branchId);
//           return (
//             <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
//               {/* DEPARTMENT COLUMN */}
//               <td className="px-5 py-4">
//                 <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-1">
//                   {dept?.departmentName || 'Unknown Dept'}
//                 </p>
//                 <div className="flex items-center gap-1">
//                   <MapPin size={10} className="text-indigo-500 shrink-0"/>
//                   <p className="text-[9px] font-bold text-slate-400 uppercase truncate">
//                     {branch ? `${branch.branchName} • ${branch.location}` : 'Corporate HQ'}
//                   </p>
//                 </div>
//               </td>

//               {/* BREAKDOWN COLUMN - Scaled Up */}
//               <td className="px-5 py-4">
//                 <div className="flex items-center gap-6">
//                   <div className="flex flex-col border-l-2 border-indigo-100 pl-3">
//                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Training</span>
//                     <span className="text-[12px] font-black text-slate-700">
//                       ${b.trainingBudget?.toLocaleString()}
//                     </span>
//                   </div>
//                   <div className="flex flex-col border-l-2 border-slate-100 pl-3">
//                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Resources</span>
//                     <span className="text-[12px] font-black text-slate-700">
//                       ${b.resourceBudget?.toLocaleString()}
//                     </span>
//                   </div>
//                 </div>
//               </td>

//               {/* YEAR COLUMN */}
//               <td className="px-5 py-4 text-center">
//                 <span className="px-2.5 py-1 bg-white text-slate-600 text-[10px] font-black border border-slate-200 rounded-md shadow-sm">
//                   {b.year}
//                 </span>
//               </td>

//               {/* TOTAL COLUMN */}
//               <td className="px-5 py-4">
//                 <div className="flex items-center gap-2">
//                   <div className="p-1.5 bg-emerald-50 rounded-lg">
//                     <TrendingUp size={14} className="text-emerald-600"/>
//                   </div>
//                   <span className="text-[14px] font-black text-slate-800 tracking-tight">
//                     ${b.totalAnnualBudget?.toLocaleString()}
//                   </span>
//                 </div>
//               </td>

//               {/* ACTIONS COLUMN */}
//               <td className="px-5 py-4 text-right">
//                 <div className="flex justify-end gap-2">
//                   <button 
//                     onClick={() => handleView(b)} 
//                     className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
//                   >
//                     <Eye size={14}/>
//                   </button>
//                   <button 
//                     onClick={() => handleDelete(b.id)} 
//                     className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
//                   >
//                     <Trash2 size={14}/>
//                   </button>
//                 </div>
//               </td>
//             </tr>
//           );
//         })}
//       </tbody>
//     </table>
//     {filteredBudgets.length === 0 && (
//       <div className="py-12 text-center bg-slate-50/50">
//         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No allocations found</p>
//       </div>
//     )}
//   </div>
// )}
//       {/* VIEW MODAL */}
//       <AnimatePresence>
//         {selected && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 overflow-hidden">
//               <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
//                 <div className="flex items-center gap-2">
//                    <CircleDollarSign size={16} className="text-indigo-600" />
//                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Financial Audit</h3>
//                 </div>
//                 <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
//               </div>
//               <div className="grid grid-cols-2 gap-3">
//                 <MiniInfo label="Total Allocation" value={`$${selected.totalAnnualBudget?.toLocaleString()}`} icon={<CircleDollarSign size={12}/>}/>
//                 <MiniInfo label="Fiscal Year" value={selected.year} icon={<Calendar size={12}/>}/>
//                 <MiniInfo label="Training Budget" value={`$${selected.trainingBudget?.toLocaleString()}`} icon={<Layers size={12}/>}/>
//                 <MiniInfo label="Resource Budget" value={`$${selected.resourceBudget?.toLocaleString()}`} icon={<Building2 size={12}/>}/>
//               </div>
//               <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
//                 <button onClick={() => setSelected(null)} className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Close Record</button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* ALLOCATION MODAL */}
//       <AnimatePresence>
//         {createOpen && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
//                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
//                   <div className="flex items-center gap-2">
//                     <Wallet size={16} className="text-indigo-600" />
//                     <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Budget Allocation</h3>
//                   </div>
//                   <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
//                </div>
//                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-3 gap-x-5 gap-y-4">
//                   <div className="space-y-1">
//                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Branch Source</label>
//                     <select 
//                       className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 transition-all" 
//                       value={modalBranchId} 
//                       onChange={e => {
//                         setModalBranchId(e.target.value);
//                         setForm({...form, departmentId: ""});
//                       }}
//                     >
//                       <option value="">Select Branch</option>
//                       {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName} - {b.location}</option>)}
//                     </select>
//                   </div>

//                   <div className="space-y-1">
//                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Target Department</label>
//                     <select 
//                       required
//                       disabled={!modalBranchId || (modalBranchId && modalFilteredDepts.length === 0)}
//                       className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 transition-all disabled:opacity-50" 
//                       value={form.departmentId} 
//                       onChange={e => setForm({...form, departmentId: e.target.value})}
//                     >
//                       <option value="">
//                         {!modalBranchId 
//                           ? "Select Branch First" 
//                           : modalFilteredDepts.length === 0 
//                             ? "No Depts Available" 
//                             : "Pick Department"}
//                       </option>
//                       {modalFilteredDepts.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
//                     </select>
//                   </div>

//                   <InputField label="Fiscal Year" type="text" value={form.year} onChange={e => setForm({...form, year: e.target.value.replace(/\D/g, '')})} placeholder="YYYY" />
                  
//                   <InputField label="Total Annual Budget ($)" type="text" value={form.totalAnnualBudget} onChange={e => setForm({...form, totalAnnualBudget: e.target.value.replace(/\D/g, '')})} placeholder="Total" />
//                   <InputField label="Training Budget ($)" type="text" value={form.trainingBudget} onChange={e => setForm({...form, trainingBudget: e.target.value.replace(/\D/g, '')})} placeholder="Training" />
//                   <InputField label="Resource Budget ($)" type="text" value={form.resourceBudget} onChange={e => setForm({...form, resourceBudget: e.target.value.replace(/\D/g, '')})} placeholder="Resource" />

//                   <div className="col-span-3 pt-4 flex justify-end gap-3 border-t border-slate-50 mt-1">
//                     <button type="button" onClick={() => setCreateOpen(false)} className="px-6 py-2 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
//                     <button type="submit" disabled={submitting} className="px-8 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50">
//                         {submitting ? "Processing..." : "Confirm Budget"}
//                     </button>
//                   </div>
//                </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// const InputField = ({ label, ...props }) => (
//   <div className="space-y-1">
//     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
//     <input {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 transition-all" />
//   </div>
// );

// const MiniInfo = ({ label, value, icon }) => (
//   <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
//     <div className="flex items-center gap-1.5 text-indigo-500 mb-1">
//       {icon}
//       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
//     </div>
//     <p className="text-[11px] font-black text-slate-700 truncate pl-0.5">{value || '—'}</p>
//   </div>
// );































import React, { useState, useEffect, useMemo } from "react";
import { 
  Wallet, X, Search, Building2, Plus, 
  Loader2, Eye, TrendingUp, CircleDollarSign, 
  MapPin, Calendar, Layers, Trash2, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

// API IMPORTS
import { 
  createDepartmentBudget, 
  getDepartmentBudgets, 
  deleteDepartmentBudget,
  getDepartmentBudgetById 
} from "../../api/dept/deptBudget.api";
import { getDepartments } from "../../api/hr.dept";
import { getBranches } from "../../api/api.branch";

export default function DeptBudget() {
  const [budgets, setBudgets] = useState([]);
  const [branches, setBranches] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [modalBranchId, setModalBranchId] = useState("");

  const [form, setForm] = useState({
    departmentId: "", totalAnnualBudget: "",
    trainingBudget: "", resourceBudget: "", year: new Date().getFullYear(),
  });

  // --- 🔑 PERMISSION DETECTION ---
  const token = localStorage.getItem("accessToken");
  const auth = useMemo(() => {
    if (!token) return { perms: [] };
    try {
      const decoded = jwtDecode(token);
      return { perms: decoded.perm || [] };
    } catch (e) { return { perms: [] }; }
  }, [token]);

  // Use your specific Permission Strings
  const canView = auth.perms.includes("BUDGET_VIEW");
  const canCreate = auth.perms.includes("BUDGET_CREATE");
  const canDelete = auth.perms.includes("BUDGET_DELETE");
  const canApprove = auth.perms.includes("BUDGET_APPROVE");

  const loadData = async () => {
    if (!canView) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [budRes, deptRes, branchRes] = await Promise.all([
        getDepartmentBudgets(),
        getDepartments(),
        getBranches()
      ]);
      setBudgets(Array.isArray(budRes) ? budRes : budRes?.data || []);
      setAllDepartments(Array.isArray(deptRes) ? deptRes : deptRes?.data || []);
      setBranches(Array.isArray(branchRes) ? branchRes : branchRes?.data || []);
    } catch (err) {
      if (err.response?.status !== 403) toast.error("Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [canView]);

  // ... (resetForm, modalFilteredDepts, filteredBudgets logic remain the same)
  const resetForm = () => {
    setForm({
      departmentId: "", totalAnnualBudget: "",
      trainingBudget: "", resourceBudget: "", year: new Date().getFullYear(),
    });
    setModalBranchId("");
  };

  const modalFilteredDepts = useMemo(() => {
    if (!modalBranchId) return [];
    return allDepartments
      .filter(d => Number(d.branchId) === Number(modalBranchId))
      .filter(d => !budgets.some(b => b.departmentId === (d.departmentId || d.id)));
  }, [modalBranchId, allDepartments, budgets]);

  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => {
      const dept = allDepartments.find(d => d.departmentId === b.departmentId);
      const matchesBranch = !selectedBranchId || Number(dept?.branchId) === Number(selectedBranchId);
      const matchesSearch = !searchTerm || dept?.departmentName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesBranch && matchesSearch;
    });
  }, [selectedBranchId, searchTerm, budgets, allDepartments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreate) return toast.error("Unauthorized: BUDGET_CREATE required");
    setSubmitting(true);
    try {
      const payload = {
        departmentId: Number(form.departmentId),
        totalAnnualBudget: Number(form.totalAnnualBudget),
        trainingBudget: Number(form.trainingBudget),
        resourceBudget: Number(form.resourceBudget),
        year: Number(form.year)
      };
      await createDepartmentBudget(payload);
      toast.success("Budget Allocated Successfully");
      setCreateOpen(false);
      loadData();
    } catch {
      toast.error("Allocation Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) return toast.error("Unauthorized: BUDGET_DELETE required");
    if(!window.confirm("Remove this budget allocation?")) return;
    const tid = toast.loading("Removing allocation...");
    try {
      await deleteDepartmentBudget(id);
      toast.success("Budget Removed", { id: tid });
      loadData();
    } catch {
      toast.error("Failed to remove budget", { id: tid });
    }
  };

  const handleView = async (budget) => {
    setSelected(budget); 
    try {
      const freshData = await getDepartmentBudgetById(budget.id);
      setSelected(freshData.data || freshData);
    } catch (err) {
      console.error("Could not fetch fresh details", err);
    }
  };

  // 🛑 PAGE GUARD
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-slate-100 p-6 rounded-full mb-4">
          <Lock size={40} className="text-slate-300" />
        </div>
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Access Restricted</h2>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
          Permission 'BUDGET_VIEW' is required.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Wallet size={22} className="text-indigo-600" /> Dept Budgets
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Financial Allocations</p>
        </div>

        <div className="flex items-center gap-2">
          <select 
            className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-50"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            <option value="">Filter: All Branches</option>
            {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
          </select>

          {/* 🔑 UI GUARD: Create Permission */}
          {canCreate && (
            <button 
              onClick={() => { resetForm(); setCreateOpen(true); }}
              className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Plus size={14} strokeWidth={3} /> New Allocation
            </button>
          )}
        </div>
      </div>

      {/* TABLE SECTION */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="w-[25%] px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Department</th>
                <th className="w-[30%] px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Budget Breakdown</th>
                <th className="w-[10%] px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Fiscal</th>
                <th className="w-[20%] px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Annual Total</th>
                <th className="w-[15%] px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBudgets.map((b) => {
                const dept = allDepartments.find(d => d.departmentId === b.departmentId);
                const branch = branches.find(br => br.branchId === dept?.branchId);
                return (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-1">{dept?.departmentName || 'Unknown Dept'}</p>
                      <div className="flex items-center gap-1">
                        <MapPin size={10} className="text-indigo-500 shrink-0"/>
                        <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{branch ? branch.branchName : 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col border-l-2 border-indigo-100 pl-3">
                          <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Training</span>
                          <span className="text-[12px] font-black text-slate-700">${b.trainingBudget?.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col border-l-2 border-slate-100 pl-3">
                          <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Resources</span>
                          <span className="text-[12px] font-black text-slate-700">${b.resourceBudget?.toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-2.5 py-1 bg-white text-slate-600 text-[10px] font-black border border-slate-200 rounded-md">{b.year}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 rounded-lg"><TrendingUp size={14} className="text-emerald-600"/></div>
                        <span className="text-[14px] font-black text-slate-800">${b.totalAnnualBudget?.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleView(b)} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:bg-indigo-600 hover:text-white transition-all"><Eye size={14}/></button>
                        
                        {/* 🔑 UI GUARD: Delete Permission */}
                        {canDelete && (
                          <button onClick={() => handleDelete(b.id)} className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={14}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS guarded similarly... */}
      <AnimatePresence>
        {selected && (
          // View Modal is okay for anyone who canView
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-2xl p-6">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
                 <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Budget Audit</h3>
                 <button onClick={() => setSelected(null)}><X size={18}/></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <MiniInfo label="Total" value={`$${selected.totalAnnualBudget?.toLocaleString()}`} icon={<CircleDollarSign size={12}/>}/>
                 <MiniInfo label="Fiscal" value={selected.year} icon={<Calendar size={12}/>}/>
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={() => setSelected(null)} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {canCreate && createOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
             {/* ... form content same as your original ... */}
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                   <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">New Budget Allocation</h3>
                   <button onClick={() => setCreateOpen(false)}><X size={18}/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-3 gap-x-5 gap-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Branch</label>
                      <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none" value={modalBranchId} onChange={e => {setModalBranchId(e.target.value); setForm({...form, departmentId: ""});}}>
                        <option value="">Select Branch</option>
                        {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                      <select required disabled={!modalBranchId || modalFilteredDepts.length === 0} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none disabled:opacity-50" value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}>
                        <option value="">{!modalBranchId ? "Select Branch First" : modalFilteredDepts.length === 0 ? "No Depts" : "Pick Dept"}</option>
                        {modalFilteredDepts.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                      </select>
                    </div>
                    <InputField label="Fiscal Year" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
                    <InputField label="Total Budget" value={form.totalAnnualBudget} onChange={e => setForm({...form, totalAnnualBudget: e.target.value})} />
                    <InputField label="Training" value={form.trainingBudget} onChange={e => setForm({...form, trainingBudget: e.target.value})} />
                    <InputField label="Resource" value={form.resourceBudget} onChange={e => setForm({...form, resourceBudget: e.target.value})} />
                    <div className="col-span-3 pt-4 flex justify-end gap-3 border-t">
                      <button type="button" onClick={() => setCreateOpen(false)} className="px-6 py-2 text-[10px] font-black uppercase text-slate-500">Cancel</button>
                      <button type="submit" disabled={submitting} className="px-8 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl">Confirm Budget</button>
                    </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ... InputField and MiniInfo helpers remain the same ...
const InputField = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    <input {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 transition-all" />
  </div>
);

const MiniInfo = ({ label, value, icon }) => (
  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
    <div className="flex items-center gap-1.5 text-indigo-500 mb-1">
      {icon}
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-[11px] font-black text-slate-700 truncate pl-0.5">{value || '—'}</p>
  </div>
);