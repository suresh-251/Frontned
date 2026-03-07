// import React, { useEffect, useState } from "react";
// import { 
//   ShieldCheck, X, Search, Clock, Building2, 
//   Edit2, Trash2, Plus, Activity, Settings, 
//   Hash, MapPin, Loader2 // FIXED: Added Loader2 to imports
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";

// // API IMPORTS
// import { 
//   getOvertimePolicies, 
//   createOvertimePolicy, 
//   updateOvertimePolicy, 
//   deleteOvertimePolicy 
// } from "../../api/overtimePolicy.api";
// import { getDepartments } from "../../api/hr.dept";
// import { getBranches } from "../../api/api.branch";

// export default function OvertimePolicy() {
//   const [policies, setPolicies] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [branches, setBranches] = useState([]);
  
//   const [loading, setLoading] = useState(false);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [isEdit, setIsEdit] = useState(false);
//   const [selectedPolicy, setSelectedPolicy] = useState(null);
//   const [submitting, setSubmitting] = useState(false);
  
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedBranchId, setSelectedBranchId] = useState("");

//   const [form, setForm] = useState({
//     departmentId: "",
//     standardDailyHours: 8,
//     maxWeeklyOvertimeHours: 20
//   });

//   const loadData = async () => {
//     setLoading(true);
//     try {
//       const [polRes, deptRes, branchRes] = await Promise.all([
//         getOvertimePolicies(),
//         getDepartments(),
//         getBranches()
//       ]);
      
//       setPolicies(Array.isArray(polRes) ? polRes : polRes?.data || []);
//       setDepartments(Array.isArray(deptRes) ? deptRes : deptRes?.data || []);
//       setBranches(Array.isArray(branchRes) ? branchRes : branchRes?.data || []);
//     } catch (err) {
//       toast.error("Failed to sync system data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { loadData(); }, []);

//   const getDeptName = (deptId) => {
//     const dept = departments.find(d => (d.departmentId || d.id) === deptId);
//     return dept ? dept.departmentName : `Dept #${deptId}`;
//   };

//   const handleEdit = (policy) => {
//     const targetDeptId = policy.departmentId;
//     const dept = departments.find(d => (d.departmentId || d.id) === targetDeptId);
    
//     setSelectedPolicy(policy);
//     setForm({
//       departmentId: targetDeptId,
//       standardDailyHours: policy.standardDailyHours,
//       maxWeeklyOvertimeHours: policy.maxWeeklyOvertimeHours
//     });
    
//     setSelectedBranchId(dept ? (dept.branchId || "") : "");
//     setIsEdit(true);
//     setModalOpen(true);
//   };

//   const handleDelete = async (id) => {
//     const tid = toast.loading("Removing protocol...");
//     try {
//       await deleteOvertimePolicy(id);
//       toast.success("Protocol Removed", { id: tid });
//       loadData();
//     } catch (err) {
//       toast.error("Failed to remove protocol", { id: tid });
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitting(true);
//     const tid = toast.loading("Syncing...");
    
//     try {
//       if (isEdit) {
//         await updateOvertimePolicy(selectedPolicy.overtimePolicyId, {
//           standardDailyHours: Number(form.standardDailyHours),
//           maxWeeklyOvertimeHours: Number(form.maxWeeklyOvertimeHours)
//         });
//         toast.success("Protocol Updated", { id: tid });
//       } else {
//         await createOvertimePolicy({
//           departmentId: Number(form.departmentId),
//           standardDailyHours: Number(form.standardDailyHours),
//           maxWeeklyOvertimeHours: Number(form.maxWeeklyOvertimeHours)
//         });
//         toast.success("Protocol Created", { id: tid });
//       }
//       setModalOpen(false);
//       loadData();
//     } catch (err) {
//       const backendMsg = err.response?.data || "Transmission Failed";
//       toast.error(typeof backendMsg === 'string' ? backendMsg : "Transmission Failed", { id: tid });
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const availableDepartments = departments
//     .filter(d => (d.branchId || d.branchId?.toString()) == selectedBranchId)
//     .filter(d => isEdit ? true : !policies.some(p => p.departmentId === (d.departmentId || d.id)));

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
//       <Toaster position="top-right" />

//       {/* COMPACT HEADER (toplook standard) */}
//       <div className="flex items-center justify-between px-1">
//         <div>
//           <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
//             <ShieldCheck size={22} className="text-indigo-600" /> OT Protocols
//           </h2>
//           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Policy Framework</p>
//         </div>

//         <div className="flex items-center gap-2">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
//             <input 
//               type="text" placeholder="Search departments..." 
//               value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
//               className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-56 outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
//             />
//           </div>
//           <button 
//             onClick={() => { 
//               setForm({ departmentId: "", standardDailyHours: 8, maxWeeklyOvertimeHours: 20 }); 
//               setSelectedBranchId("");
//               setIsEdit(false); 
//               setModalOpen(true); 
//             }}
//             className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
//           >
//             <Plus size={14} strokeWidth={3} /> Create Protocol
//           </button>
//         </div>
//       </div>

//       {/* DATA GRID */}
//       {loading && policies.length === 0 ? (
//         <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//           {policies
//             .filter(p => getDeptName(p.departmentId).toLowerCase().includes(searchTerm.toLowerCase()))
//             .map((p) => (
//             <motion.div 
//               layout
//               key={p.overtimePolicyId}
//               className="bg-white border border-slate-200 rounded-xl p-3 transition-all relative overflow-hidden shadow-sm hover:shadow-md"
//             >
//               {/* Indigo side-bar (Always visible) */}
//               <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              
//               <div className="flex justify-between items-start mb-3 pl-1">
//                 <div className="flex items-center gap-3">
//                   {/* Icon Box (Always colored) */}
//                   <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-indigo-100 text-indigo-600 bg-indigo-50">
//                     <Building2 size={14} />
//                   </div>
//                   <div>
//                     <p className="text-[11px] font-black uppercase tracking-tight text-slate-700 leading-tight">
//                       {getDeptName(p.departmentId)}
//                     </p>
//                     <div className="flex items-center gap-1 mt-0.5">
//                       <Hash size={8} className="text-slate-300" />
//                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">UID-{p.overtimePolicyId}</span>
//                     </div>
//                   </div>
//                 </div>
//                 {/* Action Buttons (Always colored and visible - No hover required) */}
//                 <div className="flex gap-1.5">
//                   <button onClick={() => handleEdit(p)} className="p-1.5 bg-indigo-50 rounded-md text-indigo-600 hover:bg-indigo-100 transition-colors">
//                     <Edit2 size={12}/>
//                   </button>
//                   <button onClick={() => handleDelete(p.overtimePolicyId)} className="p-1.5 bg-rose-50 rounded-md text-rose-600 hover:bg-rose-100 transition-colors">
//                     <Trash2 size={12}/>
//                   </button>
//                 </div>
//               </div>

//               {/* COLORED DATA BOXES */}
//               <div className="flex gap-2 pl-1">
//                 <div className="flex-1 bg-emerald-50/50 rounded-lg border border-emerald-100 p-2">
//                   <div className="flex items-center gap-2 mb-1">
//                     <Clock size={11} className="text-emerald-500" />
//                     <span className="text-[8px] font-black text-emerald-600/70 uppercase tracking-widest">Base Day</span>
//                   </div>
//                   <span className="text-xs font-black text-slate-800">{p.standardDailyHours} <span className="text-[9px] text-slate-400">HRS</span></span>
//                 </div>
//                 <div className="flex-1 bg-indigo-50/50 rounded-lg border border-indigo-100 p-2">
//                   <div className="flex items-center gap-2 mb-1">
//                     <Activity size={11} className="text-indigo-500" />
//                     <span className="text-[8px] font-black text-indigo-600/70 uppercase tracking-widest">Weekly Cap</span>
//                   </div>
//                   <span className="text-xs font-black text-slate-800">{p.maxWeeklyOvertimeHours} <span className="text-[9px] text-slate-400">HRS</span></span>
//                 </div>
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       )}

//       {/* MODAL */}
//       <AnimatePresence>
//         {modalOpen && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//             <motion.div 
//               initial={{ opacity: 0, y: 10, scale: 0.95 }} 
//               animate={{ opacity: 1, y: 0, scale: 1 }} 
//               exit={{ opacity: 0, y: 10, scale: 0.95 }}
//               className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
//             >
//                <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
//                   <div className="flex items-center gap-2">
//                     <Settings size={14} className="text-indigo-600" />
//                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">
//                       Protocol Config
//                     </h3>
//                   </div>
//                   <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
//                </div>
               
//                <form onSubmit={handleSubmit} className="p-5 space-y-3">
//                   <div className="space-y-1.5">
//                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Target Branch</label>
//                     <div className="relative">
//                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
//                        <select 
//                         disabled={isEdit} required
//                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-10 pr-4 text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-50 transition-all appearance-none cursor-pointer disabled:opacity-50"
//                         value={selectedBranchId} 
//                         onChange={e => {
//                           setSelectedBranchId(e.target.value);
//                           setForm({...form, departmentId: ""}); 
//                         }}
//                       >
//                         <option value="">Select branch...</option>
//                         {branches.map(b => (
//                           <option key={b.branchId || b.id} value={b.branchId || b.id}>
//                             {b.branchName} - {b.location}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>

//                   <div className="space-y-1.5">
//                     <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Target Department</label>
//                     <div className="relative">
//                        <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
//                        <select 
//                         disabled={isEdit || !selectedBranchId || (!isEdit && availableDepartments.length === 0)} required
//                         className="w-full bg-slate-100 border-2 border-transparent rounded-xl py-1.5 pl-10 pr-4 text-[11px] font-black uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
//                         value={form.departmentId} 
//                         onChange={e => setForm({...form, departmentId: e.target.value})}
//                       >
//                         <option value="">
//                           {!selectedBranchId 
//                             ? "Select branch first" 
//                             : availableDepartments.length === 0 && !isEdit 
//                               ? "No eligible departments" 
//                               : "Select department..."}
//                         </option>
//                         {availableDepartments.map(d => (
//                             <option key={d.departmentId || d.id} value={d.departmentId || d.id}>
//                               {d.departmentName}
//                             </option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-2 gap-3">
//                     <div className="space-y-1">
//                       <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Standard Day</label>
//                       <input 
//                         type="number" required
//                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
//                         value={form.standardDailyHours}
//                         onChange={e => setForm({...form, standardDailyHours: e.target.value})} 
//                       />
//                     </div>
//                     <div className="space-y-1">
//                       <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Weekly Limit</label>
//                       <input 
//                         type="number" required
//                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
//                         value={form.maxWeeklyOvertimeHours}
//                         onChange={e => setForm({...form, maxWeeklyOvertimeHours: e.target.value})} 
//                       />
//                     </div>
//                   </div>

//                   <div className="pt-2 flex flex-col gap-2">
//                     <button 
//                       type="submit" 
//                       disabled={submitting}
//                       className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
//                     >
//                       {submitting ? 'Transmitting...' : isEdit ? 'Update Framework' : 'Commit Protocol'}
//                     </button>
//                     <button type="button" onClick={() => setModalOpen(false)} className="w-full py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Discard Changes</button>
//                   </div>
//                </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }





import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, Search, Clock, Building2, 
  Activity, Hash, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// ONLY GET API
import { getOvertimePolicies } from "../../api/overtimePolicy.api";

export default function OvertimePolicy() {

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {

      const res = await getOvertimePolicies();
      const data = Array.isArray(res) ? res : res?.data || [];

      setPolicies(data);

    } catch (err) {
      toast.error("Failed to load overtime policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getDeptName = (deptId) => {
    return deptId ? `Dept #${deptId}` : "Unknown Department";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">

      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">

        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck size={22} className="text-indigo-600" /> OT Protocols
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            Policy Framework
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-56 outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
          />
        </div>

      </div>

      {/* DATA GRID */}

      {loading && policies.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-indigo-500" size={24} />
        </div>
      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

          {policies
            .filter(p =>
              getDeptName(p.departmentId)
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
            )
            .map((p) => (

              <motion.div
                layout
                key={p.overtimePolicyId}
                className="bg-white border border-slate-200 rounded-xl p-3 transition-all relative overflow-hidden shadow-sm hover:shadow-md"
              >

                {/* LEFT BAR */}
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />

                <div className="flex justify-between items-start mb-3 pl-1">

                  <div className="flex items-center gap-3">

                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-indigo-100 text-indigo-600 bg-indigo-50">
                      <Building2 size={14} />
                    </div>

                    <div>

                      <p className="text-[11px] font-black uppercase tracking-tight text-slate-700 leading-tight">
                        {getDeptName(p.departmentId)}
                      </p>

                      <div className="flex items-center gap-1 mt-0.5">
                        <Hash size={8} className="text-slate-300" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          UID-{p.overtimePolicyId}
                        </span>
                      </div>

                    </div>

                  </div>

                </div>

                {/* DATA BOXES */}

                <div className="flex gap-2 pl-1">

                  <div className="flex-1 bg-emerald-50/50 rounded-lg border border-emerald-100 p-2">

                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={11} className="text-emerald-500" />
                      <span className="text-[8px] font-black text-emerald-600/70 uppercase tracking-widest">
                        Base Day
                      </span>
                    </div>

                    <span className="text-xs font-black text-slate-800">
                      {p.standardDailyHours}
                      <span className="text-[9px] text-slate-400"> HRS</span>
                    </span>

                  </div>

                  <div className="flex-1 bg-indigo-50/50 rounded-lg border border-indigo-100 p-2">

                    <div className="flex items-center gap-2 mb-1">
                      <Activity size={11} className="text-indigo-500" />
                      <span className="text-[8px] font-black text-indigo-600/70 uppercase tracking-widest">
                        Weekly Cap
                      </span>
                    </div>

                    <span className="text-xs font-black text-slate-800">
                      {p.maxWeeklyOvertimeHours}
                      <span className="text-[9px] text-slate-400"> HRS</span>
                    </span>

                  </div>

                </div>

              </motion.div>

            ))}

        </div>

      )}

    </div>
  );
}