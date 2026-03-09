// import { useEffect, useState } from "react";
// import { 
//   Edit2, Trash2, Layers, X, AlertCircle, 
//   Loader2, MapPin, Building2, Plus, Hash 
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";

// import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../api/hr.dept";
// import { getBranches } from "../api/api.branch";

// export default function Departments() {
//   const [departments, setDepartments] = useState([]);
//   const [allDepartments, setAllDepartments] = useState([]);
//   const [branches, setBranches] = useState([]);
//   const [selectedBranchId, setSelectedBranchId] = useState("");

//   const [formData, setFormData] = useState({ departmentName: "", branchId: "" });
//   const [editingId, setEditingId] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [showModal, setShowModal] = useState(false);
//   const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: "" });

//   const loadData = async () => {
//     setLoading(true);
//     try {
//       const [branchData, deptData] = await Promise.all([getBranches(), getDepartments()]);
//       setBranches(Array.isArray(branchData) ? branchData : []);
//       const dData = Array.isArray(deptData) ? deptData : [];
//       setAllDepartments(dData);
//       setDepartments(dData);
//     } catch (error) {
//       toast.error("Failed to load data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { loadData(); }, []);

//   useEffect(() => {
//     if (!selectedBranchId) {
//       setDepartments(allDepartments);
//     } else {
//       const filtered = allDepartments.filter(d => d.branchId === Number(selectedBranchId));
//       setDepartments(filtered);
//     }
//   }, [selectedBranchId, allDepartments]);

//   const activeBranches = branches.filter(b => b.status === "Active");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const tid = toast.loading(editingId ? "Updating..." : "Creating...");
//     try {
//       const payload = {
//         departmentName: formData.departmentName,
//         branchId: Number(formData.branchId),
//       };
//       if (editingId) {
//         await updateDepartment(editingId, payload);
//         toast.success("Updated Successfully", { id: tid });
//       } else {
//         await createDepartment(payload);
//         toast.success("Created Successfully", { id: tid });
//       }
//       setShowModal(false);
//       loadData();
//     } catch (error) {
//       toast.error("Request Failed", { id: tid });
//     }
//   };

//   const handleConfirmedDelete = async () => {
//     const tid = toast.loading("Removing...");
//     try {
//       await deleteDepartment(confirmDelete.id);
//       toast.success("Department Removed", { id: tid });
//       setConfirmDelete({ show: false, id: null });
//       loadData();
//     } catch (error) {
//       toast.error("Delete Failed", { id: tid });
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
//       <Toaster position="top-right" />

//       {/* COMPACT HEADER */}
//       <div className="flex items-center justify-between px-1">
//         <div>
//           <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
//             <Layers size={22} className="text-indigo-600" /> Departments
//           </h2>
//           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Organization Units</p>
//         </div>

//         <div className="flex items-center gap-2">
//           <select
//             value={selectedBranchId}
//             onChange={(e) => setSelectedBranchId(e.target.value)}
//             className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-50 transition-all cursor-pointer"
//           >
//             <option value="">Filter: All Branches</option>
//             {branches.map((b) => (
//               <option key={b.branchId} value={b.branchId}>{b.branchName} - {b.location}</option>
//             ))}
//           </select>
//           <button 
//             onClick={() => { setEditingId(null); setFormData({departmentName:"", branchId:""}); setShowModal(true); }}
//             className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
//           >
//             <Plus size={14} strokeWidth={3} /> Add New
//           </button>
//         </div>
//       </div>

//       {/* COMPACT CARD GRID */}
//       {loading ? (
//         <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//           {departments.map((d) => {
//             const branch = branches.find(b => b.branchId === d.branchId);
//             return (
//               <motion.div 
//                 layout 
//                 key={d.departmentId} 
//                 initial={{ opacity: 0 }} 
//                 animate={{ opacity: 1 }}
//                 // Reduced outer padding: p-3 instead of p-4
//                 className="bg-white border border-slate-200 rounded-xl p-3 transition-all relative overflow-hidden shadow-sm hover:shadow-md"
//               >
//                 {/* Indigo side-bar (Always visible) */}
//                 <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                
//                 {/* Reduced bottom margin: mb-3 instead of mb-4 */}
//                 <div className="flex justify-between items-start mb-3 pl-1">
//                   <div className="flex items-center gap-3">
//                     {/* Slightly smaller Icon Box */}
//                     <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-indigo-100 text-indigo-600 bg-indigo-50">
//                       <Layers size={14} />
//                     </div>
//                     <div>
//                       <p className="text-[11px] font-black uppercase tracking-tight text-slate-700 leading-tight">
//                         {d.departmentName}
//                       </p>
//                       <div className="flex items-center gap-1 mt-0.5">
//                         <Hash size={8} className="text-slate-300" />
//                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">DEPT-{d.departmentId}</span>
//                       </div>
//                     </div>
//                   </div>
//                   {/* Action Buttons (Always colored and visible) */}
//                   <div className="flex gap-1.5">
//                     <button 
//                       onClick={() => { setEditingId(d.departmentId); setFormData({departmentName: d.departmentName, branchId: d.branchId}); setShowModal(true); }} 
//                       className="p-1.5 bg-indigo-50 rounded-md text-indigo-600 hover:bg-indigo-100 transition-colors"
//                     >
//                       <Edit2 size={12}/>
//                     </button>
//                     <button 
//                       onClick={() => setConfirmDelete({ show: true, id: d.departmentId, name: d.departmentName })} 
//                       className="p-1.5 bg-rose-50 rounded-md text-rose-600 hover:bg-rose-100 transition-colors"
//                     >
//                       <Trash2 size={12}/>
//                     </button>
//                   </div>
//                 </div>

//                 {/* INFO BOX */}
//                 <div className="flex gap-2 pl-1">
//                   {/* Reduced inner padding: p-2 instead of p-2.5 */}
//                   <div className="flex-1 bg-slate-50/50 rounded-lg border border-slate-100 p-2">
//                     <div className="flex items-center gap-2 mb-1">
//                       <MapPin size={11} className="text-slate-400" />
//                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Assigned Branch</span>
//                     </div>
//                     <span className="text-xs font-black text-slate-800 block truncate">
//                        {branch ? `${branch.branchName} - ${branch.location}` : "Unassigned"}
//                     </span>
//                   </div>
//                 </div>
//               </motion.div>
//             );
//           })}
//         </div>
//       )}

//       {/* MODAL - ADD/EDIT */}
//       <AnimatePresence>
//         {showModal && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
//             <motion.div initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }} className="relative bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] w-full max-w-sm overflow-hidden border border-slate-200">
              
//               <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
//                 <div className="flex items-center gap-2">
//                   <Layers size={14} className="text-indigo-600" />
//                   <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">{editingId ? "Update Dept" : "New Dept"}</h3>
//                 </div>
//                 <X size={18} className="text-slate-400 cursor-pointer hover:text-red-500 transition-colors" onClick={() => setShowModal(false)} />
//               </div>
              
//               <form onSubmit={handleSubmit} className="p-6 space-y-4">
//                 <div className="space-y-1.5">
//                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Target Branch (Active)</label>
//                   <div className="relative">
//                     <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
//                     <select
//                       value={formData.branchId}
//                       onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
//                       className="w-full bg-slate-100 border-2 border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-black uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all appearance-none cursor-pointer"
//                       required
//                     >
//                       <option value="">Select branch...</option>
//                       {activeBranches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName} - {b.location}</option>)}
//                     </select>
//                   </div>
//                 </div>

//                 <div className="space-y-1.5">
//                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Department Name</label>
//                   <input
//                     value={formData.departmentName}
//                     onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
//                     className="w-full bg-slate-100 border-2 border-transparent rounded-xl py-2.5 px-4 text-[11px] font-black outline-none focus:bg-white focus:border-indigo-500 transition-all"
//                     placeholder="e.g. Sales & Marketing"
//                     required
//                   />
//                 </div>

//                 <div className="pt-2 flex flex-col gap-2">
//                   <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-95">
//                     Save Record
//                   </button>
//                   <button type="button" onClick={() => setShowModal(false)} className="w-full py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
//                     Discard Changes
//                   </button>
//                 </div>
//               </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* VERIFY DELETE POPUP */}
//       <AnimatePresence>
//         {confirmDelete.show && (
//           <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
//             <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} className="relative bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl border border-slate-200">
//               <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
//                 <AlertCircle size={20} />
//               </div>
//               <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-wide">Delete {confirmDelete.name}?</h3>
//               <p className="text-[10px] text-slate-500 mt-2 font-medium">This action will permanently remove this department from the system.</p>
              
//               <div className="flex gap-2 mt-6">
//                 <button type="button" onClick={() => setConfirmDelete({ show: false, id: null })} className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
//                   Cancel
//                 </button>
//                 <button type="button" onClick={handleConfirmedDelete} className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-lg shadow-rose-200 transition-all">
//                   Confirm
//                 </button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }










// import React, { useEffect, useState, useMemo } from "react";
// import { 
//   Edit2, Trash2, Layers, X, AlertCircle, 
//   Loader2, MapPin, Building2, Plus, Hash, Lock 
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";
// import { jwtDecode } from "jwt-decode"; // 1. Import jwt-decode

// import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../api/hr.dept";
// import { getBranches } from "../api/api.branch";

// export default function Departments() {
//   const [departments, setDepartments] = useState([]);
//   const [allDepartments, setAllDepartments] = useState([]);
//   const [branches, setBranches] = useState([]);
//   const [selectedBranchId, setSelectedBranchId] = useState("");

//   const [formData, setFormData] = useState({ departmentName: "", branchId: "" });
//   const [editingId, setEditingId] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [showModal, setShowModal] = useState(false);
//   const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: "" });

//   // --- 🔑 PERMISSION & ROLE DETECTION ---
//   const token = localStorage.getItem("accessToken");
//   const auth = useMemo(() => {
//     if (!token) return { perms: [], isManager: false };
//     try {
//       const decoded = jwtDecode(token);
//       const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
//       return {
//         perms: decoded.perm || [],
//         isManager: decoded[ROLE_CLAIM] === "HR_MANAGER"
//       };
//     } catch (e) { return { perms: [], isManager: false }; }
//   }, [token]);

//   // Logic: Managers can do everything. Users can view if they have a VIEW permission.
//   // We'll assume the permission name is DEPT_VIEW based on your previous examples.
//   const canView = auth.isManager || auth.perms.includes("DEPT_VIEW") || auth.perms.length > 0; 
//   const canManage = auth.isManager; // Only Manager can Create/Edit/Delete

//   const loadData = async () => {
//     if (!canView) return;
//     setLoading(true);
//     try {
//       const [branchData, deptData] = await Promise.all([getBranches(), getDepartments()]);
//       setBranches(Array.isArray(branchData) ? branchData : []);
//       const dData = Array.isArray(deptData) ? deptData : [];
//       setAllDepartments(dData);
//       setDepartments(dData);
//     } catch (error) {
//       if (error.response?.status !== 403) {
//         toast.error("Failed to load data");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { loadData(); }, [canView]);

//   useEffect(() => {
//     if (!selectedBranchId) {
//       setDepartments(allDepartments);
//     } else {
//       const filtered = allDepartments.filter(d => d.branchId === Number(selectedBranchId));
//       setDepartments(filtered);
//     }
//   }, [selectedBranchId, allDepartments]);

//   const activeBranches = branches.filter(b => b.status === "Active");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!canManage) return toast.error("Unauthorized Action");

//     const tid = toast.loading(editingId ? "Updating..." : "Creating...");
//     try {
//       const payload = {
//         departmentName: formData.departmentName,
//         branchId: Number(formData.branchId),
//       };
//       if (editingId) {
//         await updateDepartment(editingId, payload);
//         toast.success("Updated Successfully", { id: tid });
//       } else {
//         await createDepartment(payload);
//         toast.success("Created Successfully", { id: tid });
//       }
//       setShowModal(false);
//       loadData();
//     } catch (error) {
//       toast.error("Request Failed", { id: tid });
//     }
//   };

//   const handleConfirmedDelete = async () => {
//     if (!canManage) return;
//     const tid = toast.loading("Removing...");
//     try {
//       await deleteDepartment(confirmDelete.id);
//       toast.success("Department Removed", { id: tid });
//       setConfirmDelete({ show: false, id: null });
//       loadData();
//     } catch (error) {
//       toast.error("Delete Failed", { id: tid });
//     }
//   };

//   // Guard: If user has no access at all
//   if (!canView) {
//     return (
//       <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
//         <Lock size={40} className="mb-4 opacity-20" />
//         <p className="font-black uppercase text-[10px] tracking-widest">Access Restricted</p>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
//       <Toaster position="top-right" />

//       {/* COMPACT HEADER */}
//       <div className="flex items-center justify-between px-1">
//         <div>
//           <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
//             <Layers size={22} className="text-indigo-600" /> Departments
//           </h2>
//           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Organization Units</p>
//         </div>

//         <div className="flex items-center gap-2">
//           <select
//             value={selectedBranchId}
//             onChange={(e) => setSelectedBranchId(e.target.value)}
//             className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-50 transition-all cursor-pointer"
//           >
//             <option value="">Filter: All Branches</option>
//             {branches.map((b) => (
//               <option key={b.branchId} value={b.branchId}>{b.branchName} - {b.location}</option>
//             ))}
//           </select>

//           {/* 🔑 UI GUARD: Only show "Add New" to Managers */}
//           {canManage && (
//             <button 
//               onClick={() => { setEditingId(null); setFormData({departmentName:"", branchId:""}); setShowModal(true); }}
//               className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
//             >
//               <Plus size={14} strokeWidth={3} /> Add New
//             </button>
//           )}
//         </div>
//       </div>

//       {/* COMPACT CARD GRID */}
//       {loading ? (
//         <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//           {departments.map((d) => {
//             const branch = branches.find(b => b.branchId === d.branchId);
//             return (
//               <motion.div 
//                 layout 
//                 key={d.departmentId} 
//                 initial={{ opacity: 0 }} 
//                 animate={{ opacity: 1 }}
//                 className="bg-white border border-slate-200 rounded-xl p-3 transition-all relative overflow-hidden shadow-sm hover:shadow-md"
//               >
//                 <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                
//                 <div className="flex justify-between items-start mb-3 pl-1">
//                   <div className="flex items-center gap-3">
//                     <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-indigo-100 text-indigo-600 bg-indigo-50">
//                       <Layers size={14} />
//                     </div>
//                     <div>
//                       <p className="text-[11px] font-black uppercase tracking-tight text-slate-700 leading-tight">
//                         {d.departmentName}
//                       </p>
//                       <div className="flex items-center gap-1 mt-0.5">
//                         <Hash size={8} className="text-slate-300" />
//                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">DEPT-{d.departmentId}</span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* 🔑 UI GUARD: Only show Edit/Delete to Managers */}
//                   {canManage && (
//                     <div className="flex gap-1.5">
//                       <button 
//                         onClick={() => { setEditingId(d.departmentId); setFormData({departmentName: d.departmentName, branchId: d.branchId}); setShowModal(true); }} 
//                         className="p-1.5 bg-indigo-50 rounded-md text-indigo-600 hover:bg-indigo-100 transition-colors"
//                       >
//                         <Edit2 size={12}/>
//                       </button>
//                       <button 
//                         onClick={() => setConfirmDelete({ show: true, id: d.departmentId, name: d.departmentName })} 
//                         className="p-1.5 bg-rose-50 rounded-md text-rose-600 hover:bg-rose-100 transition-colors"
//                       >
//                         <Trash2 size={12}/>
//                       </button>
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex gap-2 pl-1">
//                   <div className="flex-1 bg-slate-50/50 rounded-lg border border-slate-100 p-2">
//                     <div className="flex items-center gap-2 mb-1">
//                       <MapPin size={11} className="text-slate-400" />
//                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Assigned Branch</span>
//                     </div>
//                     <span className="text-xs font-black text-slate-800 block truncate">
//                        {branch ? `${branch.branchName} - ${branch.location}` : "Unassigned"}
//                     </span>
//                   </div>
//                 </div>
//               </motion.div>
//             );
//           })}
//         </div>
//       )}

//       {/* MODAL - Guarded by canManage */}
//       <AnimatePresence>
//         {canManage && showModal && (
//           /* ... Modal Code same as before ... */
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
//              {/* ... form content ... */}
//              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
//              <motion.div initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }} className="relative bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] w-full max-w-sm overflow-hidden border border-slate-200">
//                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
//                  <div className="flex items-center gap-2">
//                    <Layers size={14} className="text-indigo-600" />
//                    <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">{editingId ? "Update Dept" : "New Dept"}</h3>
//                  </div>
//                  <X size={18} className="text-slate-400 cursor-pointer hover:text-red-500 transition-colors" onClick={() => setShowModal(false)} />
//                </div>
               
//                <form onSubmit={handleSubmit} className="p-6 space-y-4">
//                  <div className="space-y-1.5">
//                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Target Branch (Active)</label>
//                    <select
//                      value={formData.branchId}
//                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
//                      className="w-full bg-slate-100 border-2 border-transparent rounded-xl py-2.5 px-4 text-[11px] font-black outline-none focus:bg-white focus:border-indigo-500 transition-all appearance-none cursor-pointer"
//                      required
//                    >
//                      <option value="">Select branch...</option>
//                      {activeBranches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName} - {b.location}</option>)}
//                    </select>
//                  </div>
//                  <div className="space-y-1.5">
//                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Department Name</label>
//                    <input
//                      value={formData.departmentName}
//                      onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
//                      className="w-full bg-slate-100 border-2 border-transparent rounded-xl py-2.5 px-4 text-[11px] font-black outline-none focus:bg-white focus:border-indigo-500 transition-all"
//                      placeholder="e.g. Sales & Marketing"
//                      required
//                    />
//                  </div>
//                  <div className="pt-2 flex flex-col gap-2">
//                    <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-indigo-700 transition-all">Save Record</button>
//                  </div>
//                </form>
//              </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* DELETE CONFIRM - Guarded by canManage */}
//       <AnimatePresence>
//         {canManage && confirmDelete.show && (
//            /* ... Delete Confirmation JSX ... */
//            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
//               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
//               <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} className="relative bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl border border-slate-200">
//                 <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
//                   <AlertCircle size={20} />
//                 </div>
//                 <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-wide">Delete {confirmDelete.name}?</h3>
//                 <div className="flex gap-2 mt-6">
//                   <button type="button" onClick={() => setConfirmDelete({ show: false, id: null })} className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 rounded-xl">Cancel</button>
//                   <button type="button" onClick={handleConfirmedDelete} className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-rose-500 rounded-xl shadow-lg shadow-rose-200">Confirm</button>
//                 </div>
//               </motion.div>
//            </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }


























// import React, { useEffect, useState, useMemo } from "react";
// import { 
//   Edit2, Trash2, Layers, X, AlertCircle, 
//   Loader2, MapPin, Building2, Plus, Hash, Lock 
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";
// import { jwtDecode } from "jwt-decode";

// import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../api/hr.dept";
// import { getBranches } from "../api/api.branch";

// export default function Departments() {
//   const [departments, setDepartments] = useState([]);
//   const [allDepartments, setAllDepartments] = useState([]);
//   const [branches, setBranches] = useState([]);
//   const [selectedBranchId, setSelectedBranchId] = useState("");

//   const [formData, setFormData] = useState({ departmentName: "", branchId: "" });
//   const [editingId, setEditingId] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [showModal, setShowModal] = useState(false);
//   const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: "" });

//   // --- 🔑 PERMISSION CHECKING ---
//   const token = localStorage.getItem("accessToken");
//   const auth = useMemo(() => {
//     if (!token) return { perms: [] };
//     try {
//       const decoded = jwtDecode(token);
//       return { perms: decoded.perm || [] };
//     } catch (e) { return { perms: [] }; }
//   }, [token]);

//   /**
//    * MAPPING LOGIC:
//    * hrUser has ROLE_VIEW but NOT DOMAIN_VIEW.
//    * If we want to hide Depts from hrUser, we must check for DOMAIN_VIEW.
//    */
//   const canViewDepts = auth.perms.includes("DOMAIN_VIEW"); 
//   const canCreateDepts = auth.perms.includes("ROLE_CREATE"); // Manager has this, User doesn't
//   const canEditDepts = auth.perms.includes("ROLE_UPDATE");   // Manager has this, User doesn't
//   const canDeleteDepts = auth.perms.includes("ROLE_DELETE"); // Manager has this, User doesn't

//   const loadData = async () => {
//     if (!canViewDepts) return; // Prevent API call if they can't view
//     setLoading(true);
//     try {
//       const [branchData, deptData] = await Promise.all([getBranches(), getDepartments()]);
//       setBranches(Array.isArray(branchData) ? branchData : []);
//       const dData = Array.isArray(deptData) ? deptData : [];
//       setAllDepartments(dData);
//       setDepartments(dData);
//     } catch (error) {
//       if (error.response?.status !== 403) toast.error("Sync Error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { loadData(); }, [canViewDepts]);

//   useEffect(() => {
//     if (!selectedBranchId) {
//       setDepartments(allDepartments);
//     } else {
//       const filtered = allDepartments.filter(d => d.branchId === Number(selectedBranchId));
//       setDepartments(filtered);
//     }
//   }, [selectedBranchId, allDepartments]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!canCreateDepts && !canEditDepts) return toast.error("Action Restricted");

//     const tid = toast.loading("Processing...");
//     try {
//       const payload = {
//         departmentName: formData.departmentName,
//         branchId: Number(formData.branchId),
//       };
//       if (editingId) {
//         await updateDepartment(editingId, payload);
//         toast.success("Updated", { id: tid });
//       } else {
//         await createDepartment(payload);
//         toast.success("Created", { id: tid });
//       }
//       setShowModal(false);
//       loadData();
//     } catch (error) {
//       toast.error("Operation Failed", { id: tid });
//     }
//   };

//   const handleConfirmedDelete = async () => {
//     if (!canDeleteDepts) return;
//     const tid = toast.loading("Deleting...");
//     try {
//       await deleteDepartment(confirmDelete.id);
//       toast.success("Removed", { id: tid });
//       setConfirmDelete({ show: false, id: null });
//       loadData();
//     } catch (error) {
//       toast.error("Delete Failed", { id: tid });
//     }
//   };

//   // 🛑 GUARD: Block the page for hrUser because they lack DOMAIN_VIEW
//   if (!canViewDepts) {
//     return (
//       <div className="flex flex-col items-center justify-center h-[60vh] text-center">
//         <div className="bg-slate-100 p-6 rounded-full mb-4">
//           <Lock size={40} className="text-slate-300" />
//         </div>
//         <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Access Restricted</h2>
//         <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
//           Permission 'DOMAIN_VIEW' is required to access departments.
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
//       <Toaster position="top-right" />

//       {/* HEADER */}
//       <div className="flex items-center justify-between px-1">
//         <div>
//           <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
//             <Layers size={22} className="text-indigo-600" /> Departments
//           </h2>
//           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Unit Registry</p>
//         </div>

//         <div className="flex items-center gap-2">
//           <select
//             value={selectedBranchId}
//             onChange={(e) => setSelectedBranchId(e.target.value)}
//             className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none"
//           >
//             <option value="">All Branches</option>
//             {branches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
//           </select>

//           {/* 🔑 Only show Add button if they have ROLE_CREATE */}
//           {canCreateDepts && (
//             <button 
//               onClick={() => { setEditingId(null); setFormData({departmentName:"", branchId:""}); setShowModal(true); }}
//               className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
//             >
//               <Plus size={14} strokeWidth={3} /> Add New
//             </button>
//           )}
//         </div>
//       </div>

//       {loading ? (
//         <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//           {departments.map((d) => {
//             const branch = branches.find(b => b.branchId === d.branchId);
//             return (
//               <motion.div layout key={d.departmentId} className="bg-white border border-slate-200 rounded-xl p-3 relative shadow-sm hover:shadow-md transition-all">
//                 <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
//                 <div className="flex justify-between items-start mb-3 pl-1">
//                   <div className="flex items-center gap-3">
//                     <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-indigo-100 text-indigo-600 bg-indigo-50 text-[10px] font-black uppercase">
//                         {d.departmentName.charAt(0)}
//                     </div>
//                     <div>
//                       <p className="text-[11px] font-black uppercase text-slate-700 leading-tight">{d.departmentName}</p>
//                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {d.departmentId}</p>
//                     </div>
//                   </div>

//                   {/* 🔑 Only show Edit/Delete if they have ROLE_UPDATE / ROLE_DELETE */}
//                   <div className="flex gap-1">
//                     {canEditDepts && (
//                       <button onClick={() => { setEditingId(d.departmentId); setFormData({departmentName: d.departmentName, branchId: d.branchId}); setShowModal(true); }} className="p-1.5 bg-indigo-50 rounded-md text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
//                         <Edit2 size={12}/>
//                       </button>
//                     )}
//                     {canDeleteDepts && (
//                       <button onClick={() => setConfirmDelete({ show: true, id: d.departmentId, name: d.departmentName })} className="p-1.5 bg-rose-50 rounded-md text-rose-600 hover:bg-rose-600 hover:text-white transition-all">
//                         <Trash2 size={12}/>
//                       </button>
//                     )}
//                   </div>
//                 </div>

//                 <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
//                    <div className="flex items-center gap-1.5 mb-0.5">
//                       <MapPin size={10} className="text-slate-400" />
//                       <span className="text-[8px] font-black text-slate-500 uppercase">Location</span>
//                    </div>
//                    <p className="text-[11px] font-black text-slate-800 truncate">{branch ? branch.branchName : "N/A"}</p>
//                 </div>
//               </motion.div>
//             );
//           })}
//         </div>
//       )}

//       {/* MODAL - GUARDED BY canManage */}
//       <AnimatePresence>
//         {showModal && (canCreateDepts || canEditDepts) && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
//                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{editingId ? "Edit Department" : "Create New Department"}</h3>
//                 <form onSubmit={handleSubmit} className="space-y-4">
//                   <div>
//                     <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Dept Name</label>
//                     <input className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-bold outline-none focus:border-indigo-500" value={formData.departmentName} onChange={e => setFormData({...formData, departmentName: e.target.value})} required />
//                   </div>
//                   <div>
//                     <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Branch</label>
//                     <select className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-bold" value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} required>
//                        <option value="">Select...</option>
//                        {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
//                     </select>
//                   </div>
//                   <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all">Save Changes</button>
//                   <button type="button" onClick={() => setShowModal(false)} className="w-full py-1 text-[9px] font-bold uppercase text-slate-400">Cancel</button>
//                 </form>
//              </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }






import React, { useEffect, useState, useMemo } from "react";
import { 
  Edit2, Trash2, Layers, X, AlertCircle, 
  Loader2, MapPin, Building2, Plus, Hash, Lock 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../api/hr.dept";
import { getBranches } from "../api/api.branch";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [formData, setFormData] = useState({ departmentName: "", branchId: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: "" });

  // --- 🔑 PERMISSION CHECKING ---
  const token = localStorage.getItem("accessToken");
  const auth = useMemo(() => {
    if (!token) return { perms: [] };
    try {
      const decoded = jwtDecode(token);
      return { perms: decoded.perm || [] };
    } catch (e) { return { perms: [] }; }
  }, [token]);

  const canViewDepts = auth.perms.includes("DOMAIN_VIEW"); 
  const canCreateDepts = auth.perms.includes("ROLE_CREATE");
  const canEditDepts = auth.perms.includes("ROLE_UPDATE");   
  const canDeleteDepts = auth.perms.includes("ROLE_DELETE");

  const loadData = async () => {
    if (!canViewDepts) return; 
    setLoading(true);
    try {
      const [branchData, deptData] = await Promise.all([getBranches(), getDepartments()]);
      setBranches(Array.isArray(branchData) ? branchData : []);
      const dData = Array.isArray(deptData) ? deptData : [];
      setAllDepartments(dData);
      setDepartments(dData);
    } catch (error) {
      if (error.response?.status !== 403) toast.error("Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [canViewDepts]);

  useEffect(() => {
    if (!selectedBranchId) {
      setDepartments(allDepartments);
    } else {
      const filtered = allDepartments.filter(d => d.branchId === Number(selectedBranchId));
      setDepartments(filtered);
    }
  }, [selectedBranchId, allDepartments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreateDepts && !canEditDepts) return toast.error("Action Restricted");

    const tid = toast.loading("Processing...");
    try {
      const payload = {
        departmentName: formData.departmentName,
        branchId: Number(formData.branchId),
      };
      if (editingId) {
        await updateDepartment(editingId, payload);
        toast.success("Updated", { id: tid });
      } else {
        await createDepartment(payload);
        toast.success("Created", { id: tid });
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error("Operation Failed", { id: tid });
    }
  };

  const handleConfirmedDelete = async () => {
    if (!canDeleteDepts) return;
    const tid = toast.loading("Deleting...");
    try {
      await deleteDepartment(confirmDelete.id);
      toast.success("Removed", { id: tid });
      setConfirmDelete({ show: false, id: null });
      loadData();
    } catch (error) {
      toast.error("Delete Failed", { id: tid });
    }
  };

  if (!canViewDepts) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center transition-colors duration-300">
        <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 border border-[var(--border-color)]">
          <Lock size={40} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight">Access Restricted</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
          Permission 'DOMAIN_VIEW' is required to access departments.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2">
            <Layers size={22} className="text-indigo-500" /> Departments
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Unit Registry</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg px-3 py-2 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="" className="bg-[var(--bg-card)]">All Branches</option>
            {branches.map((b) => <option key={b.branchId} value={b.branchId} className="bg-[var(--bg-card)]">{b.branchName}</option>)}
          </select>

          {canCreateDepts && (
            <button 
              onClick={() => { setEditingId(null); setFormData({departmentName:"", branchId:""}); setShowModal(true); }}
              className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus size={14} strokeWidth={3} /> Add New
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departments.map((d) => {
            const branch = branches.find(b => b.branchId === d.branchId);
            return (
              <motion.div layout key={d.departmentId} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 relative shadow-sm hover:shadow-md transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <div className="flex justify-between items-start mb-3 pl-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-indigo-500/20 text-indigo-500 bg-indigo-500/10 text-[10px] font-black uppercase">
                        {d.departmentName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-[var(--text-main)] leading-tight">{d.departmentName}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">ID: {d.departmentId}</p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {canEditDepts && (
                      <button onClick={() => { setEditingId(d.departmentId); setFormData({departmentName: d.departmentName, branchId: d.branchId}); setShowModal(true); }} className="p-1.5 bg-indigo-500/10 rounded-md text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/10">
                        <Edit2 size={12}/>
                      </button>
                    )}
                    {canDeleteDepts && (
                      <button onClick={() => setConfirmDelete({ show: true, id: d.departmentId, name: d.departmentName })} className="p-1.5 bg-rose-500/10 rounded-md text-rose-500 hover:bg-rose-600 hover:text-white transition-all border border-rose-500/10">
                        <Trash2 size={12}/>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-[var(--bg-body)] rounded-lg p-2 border border-[var(--border-color)]/50">
                   <div className="flex items-center gap-1.5 mb-0.5">
                      <MapPin size={10} className="text-slate-400" />
                      <span className="text-[8px] font-black text-slate-500 uppercase">Location</span>
                   </div>
                   <p className="text-[11px] font-black text-[var(--text-main)] opacity-90 truncate">{branch ? branch.branchName : "N/A"}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (canCreateDepts || canEditDepts) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} 
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-sm shadow-2xl transition-colors duration-300"
                onClick={e => e.stopPropagation()}
             >
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{editingId ? "Edit Department" : "Create New Department"}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Dept Name</label>
                    <input className="w-full bg-[var(--bg-body)] border border-[var(--border-color)] p-2 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)] transition-all" value={formData.departmentName} onChange={e => setFormData({...formData, departmentName: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Branch</label>
                    <select className="w-full bg-[var(--bg-body)] border border-[var(--border-color)] p-2 rounded-xl text-xs font-bold text-[var(--text-main)] outline-none" value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} required>
                       <option value="" className="bg-[var(--bg-card)]">Select...</option>
                       {branches.map(b => <option key={b.branchId} value={b.branchId} className="bg-[var(--bg-card)]">{b.branchName}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95">Save Changes</button>
                  <button type="button" onClick={() => setShowModal(false)} className="w-full py-1 text-[9px] font-bold uppercase text-slate-500 hover:text-[var(--text-main)] transition-colors">Cancel</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION */}
      <AnimatePresence>
        {confirmDelete.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmDelete({ show: false, id: null })}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl">
              <AlertCircle className="mx-auto text-rose-500 mb-4" size={32} />
              <h3 className="text-[12px] font-black text-[var(--text-main)] uppercase">Delete Department?</h3>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">Remove <b>{confirmDelete.name}</b> permanently?</p>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setConfirmDelete({ show: false, id: null })} className="flex-1 py-2 text-[10px] font-black uppercase bg-[var(--bg-body)] text-slate-400 rounded-xl hover:text-slate-600 transition-colors">Cancel</button>
                <button onClick={handleConfirmedDelete} className="flex-1 py-2 text-[10px] font-black uppercase bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 active:scale-95">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}