// import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
// import { 
//   getAllTrainings, 
//   assignTraining, 
//   updateTrainingStatus, 
//   deleteTraining,
//   getTrainingByEmployee
// } from "../../api/recruitment/hr.employeeTraining";
// import { getAdminUsers } from "../../../api/admin/users.api";
// import { onboardingApi } from "../../api/onboarding.api";
// import { useRole } from "../../hooks/useRole";
// import { jwtDecode } from "jwt-decode";
// import { 
//   ShieldCheck, Plus, Loader2, X, User, Search, 
//   Trash2, BookOpen, CheckCircle2, Award, 
//   ShieldAlert, ChevronRight, Check, UserPlus
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";

// export default function EmployeeTraining() {
//   const { isManager } = useRole();
//   const [records, setRecords] = useState([]);
//   const [employees, setEmployees] = useState([]); // Combined Selection Pool
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filter, setFilter] = useState("all");
  
//   // empsel Logic States
//   const [empSearchQuery, setEmpSearchQuery] = useState(""); 
//   const [showDropdown, setShowDropdown] = useState(false);
//   const dropdownRef = useRef(null);

//   const [formData, setFormData] = useState({
//     employeeId: "", trainingName: "", description: "", isMandatory: false
//   });

//   const auth = useMemo(() => {
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) return { id: null, name: "User" };
//       const decoded = jwtDecode(token);
//       return { 
//         id: Number(decoded.sub || decoded.id), 
//         name: decoded.username || decoded.unique_name || "User" 
//       };
//     } catch { return { id: null, name: "User" }; }
//   }, []);

//   // empsel: Data Hydration (Combining Active + Onboarding)
//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     try {
//       // 1. Fetch both data sources
//       const [empRes, onboardRes] = await Promise.all([
//         getAdminUsers({ page: 1, pageSize: 200 }),
//         onboardingApi.getOnboardingList()
//       ]);

//       // 2. Format Active Employees
//       const activeUsers = (empRes?.users || empRes || []).map(u => ({
//         userId: u.userId || u.id,
//         username: u.username || u.name,
//         type: 'Active'
//       }));

//       // 3. Format Onboarding Hires
//       const onboardingUsers = (onboardRes?.data || onboardRes || []).map(u => ({
//         userId: u.id, // Maps onboarding ID to employeeId for the POST
//         username: u.fullName,
//         type: 'Onboarding'
//       }));

//       // 4. Combine for selection
//       setEmployees([...activeUsers, ...onboardingUsers]);

//       // 5. Load Registry Records
//       if (isManager) {
//         const trainRes = await getAllTrainings();
//         setRecords(Array.isArray(trainRes) ? trainRes : trainRes?.data || []);
//       } else {
//         const trainRes = await getTrainingByEmployee(auth.id);
//         setRecords(Array.isArray(trainRes) ? trainRes : trainRes?.data || []);
//       }
//     } catch (err) {
//       toast.error("Registry Sync Error");
//     } finally {
//       setLoading(false);
//     }
//   }, [isManager, auth.id]);

//   useEffect(() => { if(auth.id) fetchData(); }, [fetchData]);

//   // empsel: Dropdown Click-Outside
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // empsel: Filter Selection Pool
//   const searchableEmployees = useMemo(() => {
//     const query = empSearchQuery.toLowerCase().trim();
//     if (!query || formData.employeeId) return [];
//     return employees.filter(emp => 
//       (emp.username || "").toLowerCase().includes(query) || 
//       (emp.userId || "").toString().includes(query)
//     ).slice(0, 5);
//   }, [employees, empSearchQuery, formData.employeeId]);

//   const filteredRecords = useMemo(() => {
//     return records.filter(item => {
//       const emp = employees.find(e => e.userId === item.employeeId);
//       const name = isManager ? (emp?.username || "Personnel") : auth.name;
//       const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
//                             item.trainingName?.toLowerCase().includes(searchTerm.toLowerCase());
      
//       if (!matchesSearch) return false;
//       if (filter === "Mandatory") return item.isMandatory;
//       if (filter === "Completed") return item.status === "Completed";
//       return true;
//     });
//   }, [records, employees, searchTerm, filter, isManager, auth.name]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!formData.employeeId) return toast.error("Select personnel first");
//     const tid = toast.loading("Processing...");
//     try {
//       await assignTraining({
//         ...formData,
//         employeeId: Number(formData.employeeId)
//       });
//       toast.success("Training Assigned", { id: tid });
//       setShowModal(false);
//       resetForm();
//       fetchData();
//     } catch (err) {
//       toast.error("Assignment Failed", { id: tid });
//     }
//   };

//   const handleUpdateStatus = async (id, status) => {
//     try {
//       await updateTrainingStatus(id, status);
//       toast.success(`Updated to ${status}`);
//       fetchData();
//     } catch { toast.error("Update Blocked"); }
//   };

//   const resetForm = () => {
//     setFormData({ employeeId: "", trainingName: "", description: "", isMandatory: false });
//     setEmpSearchQuery("");
//   };

//   const getSelectedEmployeeName = () => {
//     const emp = employees.find(e => e.userId == formData.employeeId);
//     return emp?.username || 'Selected User';
//   };

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-slate-900 transition-all duration-300">
//       <Toaster position="top-right" />

//       {/* HEADER */}
//       <div className="flex items-center justify-between px-1">
//         <div>
//           <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase">
//             <ShieldCheck size={22} className="text-emerald-600" /> Compliance Training
//           </h2>
//           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
//             {isManager ? "Administrative Oversight" : "Personal Training Registry"}
//           </p>
//         </div>

//         <div className="flex items-center gap-2">
//           {isManager && (
//             <>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
//                 <input type="text" placeholder="Filter List..." onChange={(e) => setSearchTerm(e.target.value)} className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-44 outline-none focus:ring-2 focus:ring-emerald-50" />
//               </div>
//               <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95">
//                 <Plus size={14} strokeWidth={3} /> Assign New
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       {/* REGISTRY TABLE */}
//       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
//         <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
//           <thead className="bg-slate-50 border-b border-slate-200">
//             <tr>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-auto">Personnel & Module</th>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-72 text-center">Overview</th>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32">Priority</th>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-28">Status</th>
//               {isManager && <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-24">Action</th>}
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {filteredRecords.map((item) => {
//               const emp = employees.find(e => e.userId === item.employeeId);
//               const staffName = isManager ? (emp?.username || "Personnel") : auth.name;
//               return (
//                 <tr key={item.id} className="hover:bg-slate-50 transition-all group">
//                   <td className="px-5 py-4">
//                     <div className="flex items-center gap-3">
//                       <div className="h-9 w-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 font-black text-[10px] uppercase">
//                         {staffName.charAt(0)}
//                       </div>
//                       <div className="truncate">
//                         <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-1">{item.trainingName}</p>
//                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
//                            <User size={10}/> {staffName}
//                         </p>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-5 py-4 text-center text-[11px] font-medium text-slate-500 italic truncate">"{item.description}"</td>
//                   <td className="px-5 py-4 text-center">
//                     {item.isMandatory ? (
//                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[8px] font-black uppercase tracking-tighter"><ShieldAlert size={10}/> Mandatory</span>
//                     ) : (
//                        <span className="text-[8px] font-black text-slate-300 uppercase">Elective</span>
//                     )}
//                   </td>
//                   <td className="px-5 py-4 text-center">
//                     <span className={`px-2.5 py-1 rounded-md border font-black uppercase text-[8px] ${item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{item.status || 'Pending'}</span>
//                   </td>
//                   {isManager && (
//                     <td className="px-5 py-4 text-right">
//                        <button onClick={async () => { if(confirm("Purge?")) { await deleteTraining(item.id); fetchData(); } }} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={15}/></button>
//                     </td>
//                   )}
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//         {loading && <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>}
//       </div>

//       {/* empsel MODAL */}
//       <AnimatePresence>
//         {showModal && isManager && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
//                <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center shrink-0">
//                   <div className="flex items-center gap-2">
//                     <Award size={18} className="text-emerald-600" />
//                     <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Assign Training Module</h3>
//                   </div>
//                   <button onClick={() => { setShowModal(false); resetForm(); }}><X size={18} className="text-slate-400 hover:text-rose-500"/></button>
//                </div>
               
//                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
//                   {/* Selection logic including Onboarding hires */}
//                   <div className="space-y-1 relative" ref={dropdownRef}>
//                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Search Active or New Hires</label>
//                     <div className="relative">
//                       <input 
//                         type="text" 
//                         placeholder="Name or ID..." 
//                         className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-emerald-50 transition-all" 
//                         value={empSearchQuery} 
//                         onFocus={() => setShowDropdown(true)}
//                         onChange={(e) => { 
//                           setEmpSearchQuery(e.target.value); 
//                           setFormData(prev => ({...prev, employeeId: ""}));
//                           setShowDropdown(true); 
//                         }} 
//                       />
//                       <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
//                     </div>

//                     <AnimatePresence>
//                       {showDropdown && searchableEmployees.length > 0 && (
//                         <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute z-[120] w-full mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden max-h-48 overflow-y-auto">
//                           {searchableEmployees.map(emp => (
//                             <button key={`${emp.type}-${emp.userId}`} type="button" onClick={() => { 
//                               setFormData({...formData, employeeId: emp.userId}); 
//                               setEmpSearchQuery(emp.username); 
//                               setShowDropdown(false); 
//                             }} className="w-full px-4 py-3 text-left hover:bg-emerald-50 flex items-center justify-between border-b last:border-0 border-slate-50 transition-colors">
//                               <div className="flex flex-col text-left">
//                                 <span className="text-[11px] font-black text-slate-700 uppercase">{emp.username}</span>
//                                 <span className={`text-[8px] font-bold uppercase tracking-tighter ${emp.type === 'Onboarding' ? 'text-indigo-500' : 'text-slate-400'}`}>
//                                   {emp.type === 'Onboarding' ? 'New Hire (Onboarding)' : `Employee ID: #${emp.userId}`}
//                                 </span>
//                               </div>
//                               <ChevronRight size={12} className="text-slate-300" />
//                             </button>
//                           ))}
//                         </motion.div>
//                       )}
//                     </AnimatePresence>
//                     {formData.employeeId && (
//                       <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
//                          <div className="flex items-center gap-2">
//                            <Check size={14} className="text-emerald-500 font-bold"/>
//                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter leading-none">Target Locked</p>
//                          </div>
//                          <span className="text-[10px] font-bold text-emerald-600">UID: {formData.employeeId}</span>
//                       </div>
//                     )}
//                   </div>

//                   <div className="space-y-1">
//                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Training Module Title</label>
//                     <input required type="text" placeholder="e.g. Data Protection Act 2026" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-emerald-50" value={formData.trainingName} onChange={e => setFormData({...formData, trainingName: e.target.value})} />
//                   </div>

//                   <div className="space-y-1">
//                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Requirement Description</label>
//                     <textarea required rows="2" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none resize-none focus:ring-2 focus:ring-emerald-50" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
//                   </div>

//                   <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
//                     <div className="flex items-center gap-2">
//                       <ShieldAlert size={14} className="text-rose-500" />
//                       <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">Required Certification</span>
//                     </div>
//                     <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-600 accent-emerald-500 cursor-pointer" checked={formData.isMandatory} onChange={e => setFormData({...formData, isMandatory: e.target.checked})} />
//                   </div>

//                   <button type="submit" disabled={!formData.employeeId} className="w-full py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 disabled:opacity-30 transition-all shrink-0">
//                     Assign Training Track
//                   </button>
//                </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }








// import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
// import { 
//   getAllTrainings, assignTraining, updateTrainingStatus, deleteTraining, getTrainingByUser 
// } from "../../api/recruitment/hr.employeeTraining";
// import { getAdminUsers } from "../../../api/admin/users.api";
// import { onboardingApi } from "../../api/onboarding.api";
// import { useRole } from "../../hooks/useRole";
// import { jwtDecode } from "jwt-decode";
// import { 
//   Plus, Loader2, X, Search, Trash2, Eye, Edit3, ChevronRight, UserPlus, ShieldCheck, AlertTriangle, ChevronLeft
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";

// export default function EmployeeTraining() {
//   const { isManager } = useRole();
//   const [records, setRecords] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [selectedView, setSelectedView] = useState(null);
//   const [editRecord, setEditRecord] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });

//   const [currentPage, setCurrentPage] = useState(1);
//   const rowsPerPage = 9;

//   const [empSearchQuery, setEmpSearchQuery] = useState(""); 
//   const [showDropdown, setShowDropdown] = useState(false);
//   const dropdownRef = useRef(null);

//   const [formData, setFormData] = useState({
//     userId: "", trainingName: "", description: "", isMandatory: false,
//     trainingProvider: "", category: "", durationHours: "", dueDate: ""
//   });

//   // --- 🔑 Auth / AssignedBy (Capturing ID & Name) ---
//   const currentUser = useMemo(() => {
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) return { id: 0, name: "Manager" };
//       const decoded = jwtDecode(token);
//       return { 
//         id: Number(decoded.sub || decoded.id || 16),
//         name: decoded.unique_name || decoded.username || "Manager"
//       };
//     } catch { return { id: 0, name: "Manager" }; }
//   }, []);

//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const [empRes, onboardRes] = await Promise.all([
//         getAdminUsers({ page: 1, pageSize: 200 }),
//         onboardingApi.getOnboardingList()
//       ]);
      
//       const active = (empRes?.users || empRes || []).map(u => ({ 
//         userId: u.userId || u.id, 
//         username: u.username || u.name, 
//         key: `act-${u.userId || u.id}` 
//       }));
      
//       const onboarding = (onboardRes?.data || onboardRes || []).map(u => ({ 
//         userId: u.employeeOnboardingId, 
//         username: u.fullName, 
//         key: `onb-${u.employeeOnboardingId}` 
//       }));
      
//       setEmployees([...active, ...onboarding]);

//       let res = isManager ? await getAllTrainings() : await getTrainingByUser(currentUser.id);
//       setRecords(res?.data || res || []);
//     } catch { toast.error("Sync Error"); }
//     finally { setLoading(false); }
//   }, [isManager, currentUser.id]);

//   useEffect(() => { fetchData(); }, [fetchData]);

//   const handleStatusUpdate = async (status) => {
//     const tid = toast.loading("Syncing status...");
//     try {
//       await updateTrainingStatus(editRecord.id, {
//         status,
//         progress: status === "Completed" ? 100 : 0,
//         completionDate: new Date().toISOString(),
//         isCertified: status === "Completed",
//         score: 0,
//         feedback: `Updated by ${currentUser.name}`
//       });
//       toast.success("Registry Updated", { id: tid });
//       setEditRecord(null);
//       fetchData();
//     } catch { toast.error("Action Blocked", { id: tid }); }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const tid = toast.loading("Routing Data...");
//     try {
//       // 🛠️ FIXING 400 ERROR: Ensuring strict data types
//       const payload = {
//         userId: Number(formData.userId),
//         trainingName: formData.trainingName,
//         description: formData.description,
//         isMandatory: Boolean(formData.isMandatory),
//         trainingProvider: formData.trainingProvider || "Internal",
//         category: formData.category || "General",
//         durationHours: Number(formData.durationHours) || 0,
//         assignedBy: currentUser.id, // Sends ID but UI shows name
//         dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : new Date().toISOString()
//       };
//       await assignTraining(payload);
//       toast.success("Track Assigned", { id: tid });
//       setShowModal(false);
//       setEmpSearchQuery("");
//       fetchData();
//     } catch { toast.error("Bad Request (400)", { id: tid }); }
//   };

//   const filtered = records.filter(r => {
//     const emp = employees.find(e => e.userId === r.userId);
//     const s = searchTerm.toLowerCase();
//     return (emp?.username || "").toLowerCase().includes(s) || r.trainingName.toLowerCase().includes(s);
//   });

//   const currentData = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

//   return (
//     <div className="max-w-7xl mx-auto space-y-2 p-2 font-sans text-[var(--text-main)] h-[92vh] flex flex-col transition-all">
//       <Toaster position="top-right" />

//       {/* CONFIRMATION POPUP */}
//       <AnimatePresence>
//         {confirm.show && (
//           <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-xs rounded-2xl p-6 border border-[var(--border-color)] text-center shadow-2xl">
//               <AlertTriangle size={24} className="text-rose-500 mx-auto mb-4" />
//               <h3 className="text-[13px] font-black uppercase text-[var(--text-main)] mb-1">Confirm Action</h3>
//               <p className="text-[9px] font-bold text-slate-500 uppercase mb-6 leading-relaxed">{confirm.message}</p>
//               <div className="flex gap-2">
//                 <button onClick={() => setConfirm({ ...confirm, show: false })} className="flex-1 py-2 bg-[var(--bg-body)] text-slate-400 rounded-xl text-[10px] font-black border border-[var(--border-color)]">CANCEL</button>
//                 <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, show: false }); }} className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black shadow-lg">CONFIRM</button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* HEADER */}
//       <div className="flex items-center justify-between px-1 shrink-0">
//         <h2 className="text-xl font-extrabold flex items-center gap-2 uppercase tracking-tight text-[var(--text-main)]"><ShieldCheck size={22} className="text-emerald-500" /> Training Hub</h2>
//         <div className="flex items-center gap-2">
//            <div className="relative">
//               <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
//               <input type="text" placeholder="FILTER..." onChange={(e) => setSearchTerm(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md pl-7 pr-2 py-1 text-[9px] font-black w-48 uppercase outline-none focus:border-emerald-500 text-[var(--text-main)]" />
//             </div>
//            {isManager && (
//             <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">+ Assign New</button>
//            )}
//         </div>
//       </div>

//       {/* TABLE */}
//       <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm flex-1 flex flex-col overflow-hidden">
//         <table className="w-full text-left border-collapse table-fixed">
//           <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
//             <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
//               <th className="px-4 py-2.5 w-16 text-center">ID</th>
//               <th className="px-4 py-2.5 w-44">Personnel</th>
//               <th className="px-4 py-2.5 w-auto">Module Title</th>
//               <th className="px-4 py-2.5 w-44 text-center">Overview</th>
//               <th className="px-4 py-2.5 w-24 text-center">Status</th>
//               <th className="px-4 py-2.5 w-32 text-right">Control</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-[var(--border-color)]/30">
//             {currentData.map((r) => {
//               const emp = employees.find(e => e.userId === r.userId);
//               return (
//                 <tr key={`row-${r.id}`} className="hover:bg-emerald-500/5 transition-colors text-[10.5px]">
//                   <td className="px-4 py-1.5 text-center font-bold text-slate-400">#{r.id}</td>
//                   <td className="px-4 py-1.5">
//                     <p className="font-black uppercase truncate text-[var(--text-main)]">{emp?.username || "UID: "+r.userId}</p>
//                     <p className="text-[8px] font-bold text-emerald-500 tracking-tighter">ID: #{r.userId}</p>
//                   </td>
//                   <td className="px-4 py-1.5 font-black uppercase text-emerald-600 truncate">{r.trainingName}</td>
//                   <td className="px-4 py-1.5 text-center text-slate-500 italic truncate px-4">
//                     {r.description ? `${r.description.substring(0, 20)}...` : '---'}
//                   </td>
//                   <td className="px-4 py-1.5 text-center">
//                     <span className={`px-2 py-0.5 rounded border font-black text-[8px] uppercase ${r.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-200' : 'bg-amber-500/10 text-amber-500 border-amber-200'}`}>
//                       {r.status || 'Assigned'}
//                     </span>
//                   </td>
//                   <td className="px-4 py-1.5 text-right">
//                     <div className="flex justify-end gap-1">
//                       <button onClick={() => setSelectedView({...r, username: emp?.username})} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-slate-400 hover:text-emerald-500 transition-all"><Eye size={13}/></button>
//                       {isManager && (
//                         <>
//                           <button onClick={() => setEditRecord({...r, username: emp?.username})} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-indigo-400 hover:text-indigo-600 transition-all"><Edit3 size={13}/></button>
//                           <button onClick={() => setConfirm({ show: true, title: "Purge", message: `Delete log #${r.id}?`, onConfirm: () => deleteTraining(r.id).then(fetchData) })} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={13}/></button>
//                         </>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
        
//         <div className="mt-auto px-4 py-1.5 bg-[var(--bg-body)] border-t border-[var(--border-color)] flex items-center justify-between shrink-0 text-[var(--text-main)]">
//           <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Registry Data Page {currentPage}</span>
//           <div className="flex gap-1">
//             <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1 border border-[var(--border-color)] rounded disabled:opacity-30"><ChevronLeft size={14}/></button>
//             <button disabled={currentPage >= Math.ceil(filtered.length / rowsPerPage)} onClick={() => setCurrentPage(p => p + 1)} className="p-1 border border-[var(--border-color)] rounded disabled:opacity-30"><ChevronRight size={14}/></button>
//           </div>
//         </div>
//       </div>

//       {/* VIEW MODAL */}
//       <AnimatePresence>
//         {selectedView && (
//           <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedView(null)}>
//             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl p-5 text-[var(--text-main)]" onClick={e => e.stopPropagation()}>
//               <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 mb-3">
//                 <h3 className="text-[10px] font-black uppercase text-emerald-500">Record Summary</h3>
//                 <button onClick={() => setSelectedView(null)}><X size={16}/></button>
//               </div>
//               <div className="grid grid-cols-2 gap-2 mb-3">
//                 <DetailBox label="Personnel" value={selectedView.username} />
//                 <DetailBox label="Assigned By" value={employees.find(e => e.userId === selectedView.assignedBy)?.username || "ID: "+selectedView.assignedBy} />
//                 <DetailBox label="Hours" value={selectedView.durationHours} />
//                 <DetailBox label="Progress" value={selectedView.progress + "%"} />
//               </div>
//               <div className="p-3 bg-[var(--bg-body)] rounded-xl border border-[var(--border-color)]">
//                 <p className="text-[7px] font-bold text-slate-400 uppercase mb-1">Description</p>
//                 <p className="text-[11px] font-medium leading-relaxed italic">"{selectedView.description}"</p>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* UPDATE STATUS MODAL */}
//       <AnimatePresence>
//         {editRecord && (
//           <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-xs rounded-2xl border border-[var(--border-color)] shadow-2xl p-5">
//               <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 mb-4 text-[var(--text-main)]">
//                 <p className="text-[10px] font-black uppercase">Transition Progress</p>
//                 <button onClick={() => setEditRecord(null)}><X size={16}/></button>
//               </div>
//               <div className="flex flex-col gap-2">
//                 <button onClick={() => handleStatusUpdate('InProgress')} className="py-2 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl text-[9px] font-black uppercase">In Progress</button>
//                 <button onClick={() => handleStatusUpdate('Completed')} className="py-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase">Completed</button>
//                 <button onClick={() => handleStatusUpdate('Cancelled')} className="py-2 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-xl text-[9px] font-black uppercase">Cancelled</button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
      
//       {/* ASSIGN MODAL */}
//       <AnimatePresence>
//         {showModal && (
//           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl flex flex-col max-h-[90vh]">
//               <div className="px-5 py-3 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
//                 <h3 className="text-[10px] font-black uppercase flex items-center gap-2"><UserPlus size={16} className="text-emerald-600" /> New Module</h3>
//                 <button onClick={() => setShowModal(false)}><X size={18}/></button>
//               </div>
//               <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto">
//                 <div className="relative">
//                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Assign To (Target)</label>
//                   <input type="text" placeholder="Select Employee..." className="w-full px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-black outline-none focus:border-emerald-500 text-[var(--text-main)]" value={empSearchQuery} onFocus={() => setShowDropdown(true)} onChange={(e) => setEmpSearchQuery(e.target.value)} />
//                   {showDropdown && (
//                     <div className="absolute z-[120] w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl rounded-xl max-h-32 overflow-y-auto">
//                       {employees.filter(e => e.username.toLowerCase().includes(empSearchQuery.toLowerCase())).map(emp => (
//                         <button key={emp.key} type="button" onClick={() => { setFormData({...formData, userId: emp.userId}); setEmpSearchQuery(emp.username); setShowDropdown(false); }} className="w-full px-4 py-2 text-left hover:bg-emerald-500/10 text-[9px] font-black uppercase border-b border-[var(--border-color)] last:border-0 text-[var(--text-main)]">{emp.username}</button>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//                 <InputField label="Training Module Name" placeholder="e.g. Advanced Java Full Stack" onChange={e => setFormData({...formData, trainingName: e.target.value})} />
//                 <div className="space-y-1">
//                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Short Description</label>
//                     <textarea required rows="2" placeholder="Comprehensive training covering React, Java..." className="w-full px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none text-[var(--text-main)]" onChange={e => setFormData({...formData, description: e.target.value})} />
//                 </div>
//                 <div className="grid grid-cols-2 gap-2">
//                     <InputField label="Category" placeholder="Technical" onChange={e => setFormData({...formData, category: e.target.value})} />
//                     <InputField label="Provider" placeholder="TechSkill Academy" onChange={e => setFormData({...formData, trainingProvider: e.target.value})} />
//                 </div>
//                 <div className="grid grid-cols-2 gap-2">
//                     <InputField label="Duration (Hours)" type="number" placeholder="40" onChange={e => setFormData({...formData, durationHours: e.target.value})} />
//                     <div className="space-y-1">
//                         <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Assigned By (Manager)</label>
//                         <input disabled value={currentUser.name} className="w-full px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-black text-emerald-500 opacity-80" />
//                     </div>
//                 </div>
//                 <div className="space-y-1">
//                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Target Completion Date</label>
//                     <input required type="date" className="w-full px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-black text-[var(--text-main)] outline-none" onChange={e => setFormData({...formData, dueDate: e.target.value})} />
//                 </div>
//                 <button type="submit" disabled={!formData.userId} className="w-full py-3 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all">Submit Assignment</button>
//               </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// const DetailBox = ({ label, value }) => (
//   <div className="p-2 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
//     <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">{label}</p>
//     <p className="text-[10px] font-black uppercase truncate text-[var(--text-main)]">{value || '---'}</p>
//   </div>
// );

// const InputField = ({ label, ...props }) => (
//   <div className="space-y-1">
//     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
//     <input {...props} className="w-full px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none text-[var(--text-main)] focus:border-emerald-500" />
//   </div>
// );













import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
  getAllTrainings, assignTraining, updateTrainingStatus, deleteTraining, getTrainingByUser 
} from "../../api/recruitment/hr.employeeTraining";
import { getAdminUsers } from "../../../api/admin/users.api";
import { onboardingApi } from "../../api/onboarding.api";
import { useRole } from "../../hooks/useRole";
import { jwtDecode } from "jwt-decode";
import { 
  Plus, Loader2, X, Search, Trash2, Eye, Edit3, ShieldCheck, AlertTriangle, ChevronLeft, ChevronRight 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function EmployeeTraining() {
  const { isManager } = useRole();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedView, setSelectedView] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 9;

  const [empSearchQuery, setEmpSearchQuery] = useState(""); 
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    userId: "", trainingName: "", description: "", isMandatory: false,
    trainingProvider: "", category: "", durationHours: "", dueDate: ""
  });

  const currentAuth = useMemo(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return { id: 0 };
      const decoded = jwtDecode(token);
      return { id: Number(decoded.sub || decoded.id || decoded.nameid) };
    } catch { return { id: 0 }; }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, onboardRes] = await Promise.all([
        getAdminUsers({ page: 1, pageSize: 200 }),
        onboardingApi.getOnboardingList()
      ]);
      const active = (empRes?.users || empRes || []).map(u => ({ userId: u.userId || u.id, username: u.username || u.name }));
      const onboarding = (onboardRes?.data || onboardRes || []).map(u => ({ userId: u.employeeOnboardingId, username: u.fullName }));
      setEmployees([...active, ...onboarding]);

      let res = isManager ? await getAllTrainings() : await getTrainingByUser(currentAuth.id);
      setRecords(Array.isArray(res) ? res : (res?.data || []));
    } catch { toast.error("Sync Error"); }
    finally { setLoading(false); }
  }, [isManager, currentAuth.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.userId) return toast.error("Selection required");
    const tid = toast.loading("Processing...");
    try {
      const syncedId = Number(formData.userId);
      const payload = {
        userId: syncedId,
        assignedBy: syncedId,
        trainingName: String(formData.trainingName).trim(),
        description: String(formData.description).trim(),
        isMandatory: Boolean(formData.isMandatory),
        trainingProvider: String(formData.trainingProvider || "N/A"),
        category: String(formData.category || "General"),
        durationHours: Number(formData.durationHours) || 0,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : new Date().toISOString()
      };
      await assignTraining(payload);
      toast.success("Success", { id: tid });
      setShowModal(false);
      setFormData({ userId: "", trainingName: "", description: "", isMandatory: false, trainingProvider: "", category: "", durationHours: "", dueDate: "" });
      setEmpSearchQuery("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Format Error", { id: tid });
    }
  };

  const filtered = records.filter(r => {
    const emp = employees.find(e => e.userId === r.userId);
    return (emp?.username || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
           (r.trainingName || "").toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const currentData = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="max-w-7xl mx-auto space-y-3 p-2 font-sans text-[var(--text-main)] h-[92vh] flex flex-col overflow-hidden">
      <Toaster position="top-right" />

      {/* CONFIRMATION POPUP */}
      <AnimatePresence>
        {confirm.show && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-[280px] rounded-2xl p-6 border border-[var(--border-color)] text-center shadow-2xl">
              <AlertTriangle size={32} className="text-rose-500 mx-auto mb-4" />
              <h3 className="text-[11px] font-black uppercase mb-1">Confirm Update</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-6 leading-relaxed">{confirm.message}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirm({ ...confirm, show: false })} className="flex-1 py-2 bg-[var(--bg-body)] text-slate-400 rounded-xl text-[10px] font-black border border-[var(--border-color)]">NO</button>
                <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, show: false }); }} className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black shadow-lg">YES</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between px-1 shrink-0">
        <h2 className="text-xl font-extrabold flex items-center gap-2 uppercase tracking-tight text-emerald-600"><ShieldCheck size={22} /> Training Hub</h2>
        <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input type="text" placeholder="SEARCH..." onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md pl-8 pr-2 py-1 text-[9px] font-black w-48 uppercase outline-none focus:border-emerald-500" />
            </div>
            {isManager && (
              <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">+ Assign</button>
            )}
        </div>
      </div>

      {/* THEME FIXED TABLE */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm flex-1 flex flex-col overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-4 py-3 w-16 text-center">ID</th>
              <th className="px-4 py-3 w-48">Personnel</th>
              <th className="px-4 py-3 w-auto">Module</th>
              <th className="px-4 py-3 w-32 text-center">Status</th>
              <th className="px-4 py-3 w-28 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]/30 bg-[var(--bg-card)]">
            {loading ? (
                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-emerald-600" /></td></tr>
            ) : currentData.map((r) => {
              const emp = employees.find(e => e.userId === r.userId);
              return (
                <tr key={`row-${r.id}`} className="hover:bg-emerald-500/5 transition-colors">
                  <td className="px-4 py-2 text-center font-bold text-slate-400 text-[11px]">#{r.id}</td>
                  <td className="px-4 py-2 truncate">
                    <p className="font-black uppercase text-[11px] truncate text-[var(--text-main)]">{emp?.username || "UID: "+r.userId}</p>
                    <p className="text-[8px] font-bold text-emerald-500">UID: #{r.userId}</p>
                  </td>
                  <td className="px-4 py-2 font-black uppercase text-emerald-600 truncate text-[11px]">{r.trainingName}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded border font-black text-[8px] uppercase ${r.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-200' : 'bg-amber-500/10 text-amber-500 border-amber-200'}`}>{r.status || 'Assigned'}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setSelectedView({...r, username: emp?.username})} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-slate-400 hover:text-emerald-500"><Eye size={13}/></button>
                      {isManager && (
                        <button onClick={() => setConfirm({ show: true, title: "Purge", message: "Delete this assignment?", onConfirm: () => deleteTraining(r.id).then(fetchData) })} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-slate-300 hover:text-rose-500"><Trash2 size={13}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        <div className="mt-auto px-4 py-2 bg-[var(--bg-body)] border-t border-[var(--border-color)] flex items-center justify-between shrink-0">
          <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1 border border-[var(--border-color)] rounded bg-[var(--bg-card)] disabled:opacity-30"><ChevronLeft size={14}/></button>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1 border border-[var(--border-color)] rounded bg-[var(--bg-card)] disabled:opacity-30"><ChevronRight size={14}/></button>
          </div>
        </div>
      </div>

      {/* THEME FIXED MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-[var(--bg-card)] w-full max-w-lg rounded-2xl border border-[var(--border-color)] shadow-2xl flex flex-col overflow-hidden">
               <div className="px-5 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                  <h3 className="text-[11px] font-black uppercase text-emerald-600 flex items-center gap-2"><Plus size={16}/> New Module</h3>
                  <X size={20} className="text-slate-400 cursor-pointer hover:text-rose-500" onClick={() => setShowModal(false)}/>
               </div>
               <form onSubmit={handleSubmit} className="p-6 space-y-3 overflow-y-auto bg-[var(--bg-card)]">
                  <div className="relative">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Personnel</label>
                    <input type="text" placeholder="SEARCH..." className="w-full px-4 py-2.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-black outline-none focus:border-emerald-500 text-[var(--text-main)]" value={empSearchQuery} onFocus={() => setShowDropdown(true)} onChange={(e) => { setEmpSearchQuery(e.target.value); setShowDropdown(true); }} />
                    {showDropdown && (
                      <div className="absolute z-[120] w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl rounded-xl max-h-40 overflow-y-auto">
                        {employees.filter(e => e.username.toLowerCase().includes(empSearchQuery.toLowerCase())).map(emp => (
                          <button key={emp.userId} type="button" onClick={() => { setFormData({...formData, userId: emp.userId}); setEmpSearchQuery(emp.username); setShowDropdown(false); }} className="w-full px-4 py-2 text-left hover:bg-emerald-500/10 text-[10px] font-black uppercase border-b border-[var(--border-color)] last:border-0 text-[var(--text-main)]">{emp.username}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <InputField label="Title" required value={formData.trainingName} onChange={e => setFormData({...formData, trainingName: e.target.value})} />
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Description</label>
                     <textarea required rows="2" className="w-full px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none text-[var(--text-main)]" onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <InputField label="Category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                     <InputField label="Provider" value={formData.trainingProvider} onChange={e => setFormData({...formData, trainingProvider: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <InputField label="Hours" type="number" value={formData.durationHours} onChange={e => setFormData({...formData, durationHours: e.target.value})} />
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Due Date</label>
                        <input required type="date" className="w-full px-4 py-2.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-black outline-none text-[var(--text-main)]" onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                     </div>
                  </div>
                  <button type="submit" className="w-full py-3 bg-emerald-600 text-white text-[11px] font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all">Submit Assignment</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const InputField = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    <input {...props} className="w-full px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none focus:border-emerald-500 transition-colors text-[var(--text-main)]" />
  </div>
);