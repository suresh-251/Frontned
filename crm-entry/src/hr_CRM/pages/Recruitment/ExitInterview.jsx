// import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
// import { 
//   getAllExitInterviews, getExitInterviewByUser, scheduleExitInterview, 
//   deleteExitInterview, updateExitInterview, submitExitFeedback 
// } from "../../api/hr.exitInterview";
// import { getAdminUsers } from "../../../api/admin/users.api";
// import { useRole } from "../../hooks/useRole";
// import { jwtDecode } from "jwt-decode";
// import { 
//   LogOut, Plus, Loader2, X, Search, Edit3, Trash2, UserPlus, AlertTriangle, Eye, MessageSquare, CheckCircle2 
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";

// export default function ExitInterview() {
//   const { isManager } = useRole();
//   const [interviews, setInterviews] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [selectedView, setSelectedView] = useState(null);
//   const [editRecord, setEditRecord] = useState(null);
  
//   const [tableSearch, setTableSearch] = useState("");
//   const [empSearchQuery, setEmpSearchQuery] = useState("");
//   const [showDropdown, setShowDropdown] = useState(false);
//   const dropdownRef = useRef(null);
//   const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });

//   const [formData, setFormData] = useState({ userId: "", scheduledDate: "", reasonForLeaving: "" });
//   const [feedbackData, setFeedbackData] = useState({ feedback: "", suggestions: "" });

//   const auth = useMemo(() => {
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) return { id: null, name: "User" };
//       const decoded = jwtDecode(token);
//       return { id: Number(decoded.sub || decoded.id), name: decoded.username || "User" };
//     } catch { return { id: null, name: "User" }; }
//   }, []);

//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const empRes = await getAdminUsers({ page: 1, pageSize: 200 });
//       setEmployees(empRes?.users || empRes || []);
//       let res = isManager ? await getAllExitInterviews() : await getExitInterviewByUser(auth.id);
//       const data = res?.data || res || [];
//       setInterviews(Array.isArray(data) ? data : [data]);
//     } catch { setInterviews([]); }
//     finally { setLoading(false); }
//   }, [isManager, auth.id]);

//   useEffect(() => { fetchData(); }, [fetchData]);

//   const triggerConfirm = (title, message, action) => {
//     setConfirm({ show: true, title, message, onConfirm: action });
//   };

//   const handleUpdateProcess = async (status) => {
//     const tid = toast.loading("Updating status...");
//     try {
//       if (feedbackData.feedback || feedbackData.suggestions) {
//         await submitExitFeedback({
//           userId: editRecord.userId,
//           reasonForLeaving: editRecord.reasonForLeaving || "",
//           feedback: feedbackData.feedback,
//           suggestions: feedbackData.suggestions
//         });
//       }
//       await updateExitInterview(editRecord.id, { ...editRecord, status });
//       toast.success("Registry Updated", { id: tid });
//       setEditRecord(null);
//       fetchData();
//     } catch { toast.error("Failed to update", { id: tid }); }
//   };

//   const handleDelete = async (id) => {
//     try {
//       await deleteExitInterview(id);
//       toast.success("Entry Deleted");
//       fetchData();
//     } catch { toast.error("Action Restricted"); }
//   };

//   const filteredInterviews = interviews.filter(item => {
//     const emp = employees.find(e => e.userId === item.userId);
//     const name = emp?.username || "";
//     return name.toLowerCase().includes(tableSearch.toLowerCase()) || item.userId?.toString().includes(tableSearch);
//   });

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors">
//       <Toaster position="top-right" />

//       {/* CENTERED CONFIRMATION */}
//       <AnimatePresence>
//         {confirm.show && (
//           <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-xs rounded-2xl p-6 border border-[var(--border-color)] text-center shadow-2xl">
//               <AlertTriangle size={24} className="text-rose-500 mx-auto mb-4" />
//               <h3 className="text-[13px] font-black uppercase text-[var(--text-main)] mb-1">{confirm.title}</h3>
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
//       <div className="flex items-center justify-between px-1">
//         <div>
//           <h2 className="text-xl font-extrabold flex items-center gap-2 uppercase tracking-tight"><LogOut size={22} className="text-rose-600" /> Offboarding</h2>
//           <div className="relative mt-2">
//             <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
//             <input type="text" placeholder="FILTER LOGS..." onChange={(e) => setTableSearch(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md pl-6 pr-2 py-1 text-[9px] font-black w-48 uppercase text-[var(--text-main)] outline-none" />
//           </div>
//         </div>
//         {isManager && (
//           <button onClick={() => { setFormData({ userId: "", scheduledDate: "", reasonForLeaving: "" }); setEmpSearchQuery(""); setShowModal(true); }} className="bg-rose-600 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">+ Schedule Exit</button>
//         )}
//       </div>

//       {/* MAIN TABLE */}
//       <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden">
//         <table className="w-full text-left border-collapse table-fixed">
//           <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
//             <tr className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
//               <th className="px-4 py-3 w-16 text-center">Log ID</th>
//               <th className="px-4 py-3 w-20 text-center">User ID</th>
//               <th className="px-4 py-3 w-auto">Username</th>
//               <th className="px-4 py-3 w-64 text-center">Reason for Leaving</th>
//               <th className="px-4 py-3 w-28 text-center">Status</th>
//               <th className="px-4 py-3 w-36 text-right">Control</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-[var(--border-color)]/30">
//             {filteredInterviews.map((item) => {
//               const emp = employees.find(e => e.userId === item.userId);
//               const username = emp?.username || "Unknown";
//               return (
//                 <tr key={item.id} className="hover:bg-rose-50/5 transition-colors text-[11.5px]">
//                   <td className="px-4 py-4 text-center font-bold text-slate-400">#{item.id}</td>
//                   <td className="px-4 py-4 text-center font-black text-rose-500">#{item.userId}</td>
//                   <td className="px-4 py-4 font-black uppercase text-[var(--text-main)] truncate">{username}</td>
//                   {/* FIXED REASON MAPPING */}
//                   <td className="px-4 py-4 text-slate-500 italic truncate text-center px-4">
//                     {item.reasonForLeaving ? `"${item.reasonForLeaving}"` : "---"}
//                   </td>
//                   <td className="px-4 py-4 text-center">
//                     <span className={`px-2 py-0.5 rounded border font-black text-[8px] uppercase ${item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-200' : 'bg-amber-500/10 text-amber-500 border-amber-200'}`}>
//                       {item.status || 'Scheduled'}
//                     </span>
//                   </td>
//                   <td className="px-4 py-4 text-right">
//                     <div className="flex justify-end gap-1.5">
//                       <button onClick={() => setSelectedView({...item, username})} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-slate-400 hover:text-rose-500"><Eye size={14}/></button>
//                       {isManager && (
//                         <>
//                           <button onClick={() => setEditRecord({...item, username})} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-indigo-400 hover:text-indigo-600"><Edit3 size={14}/></button>
//                           <button onClick={() => triggerConfirm("Delete", `Purge #${item.id}?`, () => handleDelete(item.id))} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
//                         </>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//         {loading && <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-rose-500" /></div>}
//       </div>

//       {/* 🛠️ MULTI-COLOR UPDATE MODAL */}
//       <AnimatePresence>
//         {editRecord && (
//           <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditRecord(null)}>
//             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl p-5" onClick={e => e.stopPropagation()}>
//               <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 mb-4">
//                 <p className="text-[10px] font-black uppercase text-[var(--text-main)] flex items-center gap-2"><Edit3 size={14} className="text-indigo-500" /> Update Registry</p>
//                 <button onClick={() => setEditRecord(null)}><X size={16}/></button>
//               </div>
//               <div className="space-y-3">
//                 <div className="grid grid-cols-2 gap-2">
//                     <div className="p-2 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
//                         <p className="text-[7px] font-black text-indigo-500 uppercase tracking-widest">Personnel</p>
//                         <p className="text-[10px] font-black uppercase text-[var(--text-main)] truncate">{editRecord.username}</p>
//                     </div>
//                     <div className="p-2 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
//                         <p className="text-[7px] font-black text-rose-500 uppercase tracking-widest">User ID</p>
//                         <p className="text-[10px] font-black text-[var(--text-main)] uppercase">#{editRecord.userId}</p>
//                     </div>
//                 </div>
//                 <div className="space-y-1">
//                     <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Optional Feedback</label>
//                     <textarea rows="2" className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] text-[var(--text-main)] outline-none" placeholder="Enter notes..." onChange={e => setFeedbackData({...feedbackData, feedback: e.target.value})} />
//                 </div>
//                 <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-color)]">
//                     <button 
//                       onClick={() => triggerConfirm("Set Scheduled", "Confirm status?", () => handleUpdateProcess('Scheduled'))}
//                       className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white border border-amber-200 rounded-xl text-[9px] font-black uppercase transition-all"
//                     >Mark as Scheduled</button>
//                     <button 
//                       onClick={() => triggerConfirm("Set Completed", "Confirm completion?", () => handleUpdateProcess('Completed'))}
//                       className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-200 rounded-xl text-[9px] font-black uppercase transition-all"
//                     >Mark as Completed</button>
//                     <button 
//                       onClick={() => triggerConfirm("Set Cancelled", "Confirm cancellation?", () => handleUpdateProcess('Cancelled'))}
//                       className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200 rounded-xl text-[9px] font-black uppercase transition-all"
//                     >Mark as Cancelled</button>
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* CREATE MODAL */}
//       <AnimatePresence>
//         {showModal && isManager && (
//           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden">
//               <div className="px-6 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
//                 <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><UserPlus size={16} className="text-rose-600" /> New Offboarding</h3>
//                 <button onClick={() => setShowModal(false)}><X size={18}/></button>
//               </div>
//               <form onSubmit={(e) => { e.preventDefault(); triggerConfirm("Schedule", "Initialize this exit?", () => scheduleExitInterview({...formData, userId: Number(formData.userId)}).then(() => { toast.success("Scheduled"); fetchData(); setShowModal(false); })); }} className="p-6 space-y-4">
//                 <div className="space-y-1 relative" ref={dropdownRef}>
//                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Select Personnel</label>
//                   <input type="text" placeholder="TYPE NAME..." className="w-full px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-black outline-none text-[var(--text-main)] focus:border-rose-500" value={empSearchQuery} onFocus={() => setShowDropdown(true)} onChange={(e) => { setEmpSearchQuery(e.target.value); setShowDropdown(true); }} />
//                   {showDropdown && (
//                     <div className="absolute z-[120] w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl rounded-xl max-h-40 overflow-y-auto">
//                       {employees.filter(e => (e.username || e.name || "").toLowerCase().includes(empSearchQuery.toLowerCase())).slice(0, 5).map(emp => (
//                         <button key={emp.userId} type="button" onClick={() => { setFormData({...formData, userId: emp.userId}); setEmpSearchQuery(emp.username || emp.name); setShowDropdown(false); }} className="w-full px-4 py-2 text-left hover:bg-rose-500/10 text-[var(--text-main)] text-[10px] font-black uppercase border-b border-[var(--border-color)] last:border-0">{emp.username || emp.name} (#{emp.userId})</button>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Schedule Date</label>
//                   <input required type="datetime-local" className="w-full px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-black text-[var(--text-main)] outline-none" onChange={e => setFormData({...formData, scheduledDate: e.target.value})} />
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Departure Reason</label>
//                   <textarea required rows="3" className="w-full px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-black text-[var(--text-main)] outline-none resize-none" onChange={e => setFormData({...formData, reasonForLeaving: e.target.value})} />
//                 </div>
//                 <button type="submit" disabled={!formData.userId} className="w-full py-3 bg-rose-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all">ROUTE OFFBOARDING</button>
//               </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* 🔍 VIEW DETAILS MODAL */}
//       <AnimatePresence>
//         {selectedView && (
//           <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedView(null)}>
//             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl p-4" onClick={e => e.stopPropagation()}>
//               <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 mb-4">
//                 <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)] leading-none">Record View</h3>
//                 <button onClick={() => setSelectedView(null)}><X size={16}/></button>
//               </div>
//               <div className="grid grid-cols-2 gap-2 text-[var(--text-main)]">
//                 <DetailBox label="Username" value={selectedView.username} />
//                 <DetailBox label="User ID" value={`#${selectedView.userId}`} />
//                 <DetailBox label="Log Date" value={new Date(selectedView.scheduledDate).toLocaleDateString()} />
//                 <DetailBox label="Status" value={selectedView.status || 'Pending'} />
//                 <div className="col-span-2 p-2.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
//                     <p className="text-[7px] font-bold text-slate-400 uppercase mb-1">Departure Reason</p>
//                     <p className="text-[10px] font-black italic">"{selectedView.reasonForLeaving || 'No details listed'}"</p>
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// const DetailBox = ({ label, value }) => (
//     <div className="p-2.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
//         <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">{label}</p>
//         <p className="text-[10px] font-black uppercase truncate">{value || '---'}</p>
//     </div>
// );








// =========================== only status chnage color not chnages ====================















// import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
// import { 
//   getAllExitInterviews, getExitInterviewByUser, scheduleExitInterview, 
//   deleteExitInterview, updateExitInterview, submitExitFeedback 
// } from "../../api/hr.exitInterview";
// import { getAdminUsers } from "../../../api/admin/users.api";
// import { useRole } from "../../hooks/useRole";
// import { jwtDecode } from "jwt-decode";
// import { 
//   LogOut, Plus, Loader2, X, Search, Edit3, Trash2, UserPlus, AlertTriangle, Eye 
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";

// export default function ExitInterview() {
//   const { isManager } = useRole();
//   const [interviews, setInterviews] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [selectedView, setSelectedView] = useState(null);
//   const [editRecord, setEditRecord] = useState(null);
  
//   const [tableSearch, setTableSearch] = useState("");
//   const [empSearchQuery, setEmpSearchQuery] = useState("");
//   const [showDropdown, setShowDropdown] = useState(false);
//   const dropdownRef = useRef(null);
//   const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });

//   const [formData, setFormData] = useState({ userId: "", scheduledDate: "", reasonForLeaving: "" });
//   const [feedbackData, setFeedbackData] = useState({ feedback: "", suggestions: "" });

//   const auth = useMemo(() => {
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) return { id: 0 };
//       const decoded = jwtDecode(token);
//       return { id: Number(decoded.sub || decoded.id) };
//     } catch { return { id: 0 }; }
//   }, []);

//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     try {
//       // 1. Fetch Employees first to ensure mapping works
//       const empRes = await getAdminUsers({ page: 1, pageSize: 200 });
//       const empList = empRes?.users || empRes || [];
//       setEmployees(empList);

//       // 2. Fetch Interviews
//       let res = isManager ? await getAllExitInterviews() : await getExitInterviewByUser(auth.id);
//       const data = res?.data || res || [];
//       setInterviews(Array.isArray(data) ? data : [data]);
//     } catch { 
//       toast.error("Registry Sync Error");
//       setInterviews([]); 
//     } finally { setLoading(false); }
//   }, [isManager, auth.id]);

//   useEffect(() => { fetchData(); }, [fetchData]);

//   // Click outside to close dropdown
//   useEffect(() => {
//     const handleOutside = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
//     document.addEventListener("mousedown", handleOutside);
//     return () => document.removeEventListener("mousedown", handleOutside);
//   }, []);

//   const handleCreateSchedule = async () => {
//     const tid = toast.loading("Processing Registry...");
//     try {
//       const payload = {
//         userId: Number(formData.userId),
//         scheduledDate: new Date(formData.scheduledDate).toISOString(),
//         reasonForLeaving: String(formData.reasonForLeaving).trim(),
//         status: "Scheduled"
//       };
//       await scheduleExitInterview(payload);
//       toast.success("Scheduled Successfully", { id: tid });
//       setShowModal(false);
//       fetchData();
//     } catch (err) {
//       toast.error("Submission Failed - Check ID", { id: tid });
//     }
//   };

//   const handleUpdateProcess = async (status) => {
//     const tid = toast.loading("Updating status...");
//     try {
//       const payload = { ...editRecord, status };
//       await updateExitInterview(editRecord.id, payload);
      
//       if (feedbackData.feedback) {
//         await submitExitFeedback({
//           userId: editRecord.userId,
//           reasonForLeaving: editRecord.reasonForLeaving || "",
//           feedback: feedbackData.feedback,
//           suggestions: feedbackData.suggestions || ""
//         });
//       }
      
//       toast.success("Success", { id: tid });
//       setEditRecord(null);
//       fetchData();
//     } catch { toast.error("Error Updating", { id: tid }); }
//   };

//   const filteredInterviews = interviews.filter(item => {
//     const emp = employees.find(e => Number(e.userId) === Number(item.userId));
//     const name = emp?.username || "";
//     return name.toLowerCase().includes(tableSearch.toLowerCase()) || item.userId?.toString().includes(tableSearch);
//   });

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] h-[92vh] flex flex-col overflow-hidden">
//       <Toaster position="top-right" />

//       {/* CONFIRMATION POPUP */}
//       <AnimatePresence>
//         {confirm.show && (
//           <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
//             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-[280px] rounded-2xl p-6 border border-[var(--border-color)] text-center shadow-2xl">
//               <AlertTriangle size={32} className="text-rose-500 mx-auto mb-4" />
//               <h3 className="text-[11px] font-black uppercase mb-1">Confirm Action</h3>
//               <p className="text-[9px] font-bold text-slate-500 uppercase mb-6 leading-relaxed">{confirm.message}</p>
//               <div className="flex gap-2">
//                 <button onClick={() => setConfirm({ ...confirm, show: false })} className="flex-1 py-2 bg-[var(--bg-body)] text-slate-400 rounded-xl text-[10px] font-black border border-[var(--border-color)]">NO</button>
//                 <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, show: false }); }} className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black shadow-lg">YES</button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       <div className="flex items-center justify-between px-1 shrink-0">
//         <div>
//           <h2 className="text-xl font-extrabold flex items-center gap-2 uppercase tracking-tight text-[var(--text-main)]"><LogOut size={22} className="text-rose-600" /> Offboarding</h2>
//           <div className="relative mt-2">
//             <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
//             <input type="text" placeholder="FILTER LOGS..." onChange={(e) => setTableSearch(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md pl-8 pr-2 py-1 text-[9px] font-black w-48 uppercase text-[var(--text-main)] outline-none focus:border-rose-500" />
//           </div>
//         </div>
//         {isManager && (
//           <button onClick={() => { setFormData({ userId: "", scheduledDate: "", reasonForLeaving: "" }); setEmpSearchQuery(""); setShowModal(true); }} className="bg-rose-600 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">+ Schedule Exit</button>
//         )}
//       </div>

//       {/* TABLE SECTION */}
//       <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm flex-1 flex flex-col overflow-hidden">
//         <div className="overflow-y-auto">
//           <table className="w-full text-left border-collapse table-fixed">
//             <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)] sticky top-0 z-10">
//               <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//                 <th className="px-4 py-3 w-16 text-center">ID</th>
//                 <th className="px-4 py-3 w-20 text-center">UID</th>
//                 <th className="px-4 py-3 w-auto">Username</th>
//                 <th className="px-4 py-3 w-64 text-center">Departure Reason</th>
//                 <th className="px-4 py-3 w-28 text-center">Status</th>
//                 <th className="px-4 py-3 w-32 text-right">Action</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-[var(--border-color)]/30 bg-[var(--bg-card)]">
//               {filteredInterviews.map((item) => {
//                 const emp = employees.find(e => Number(e.userId) === Number(item.userId));
//                 const username = emp?.username || "UID: " + item.userId;
//                 return (
//                   <tr key={item.id} className="hover:bg-rose-500/5 transition-colors text-[11px]">
//                     <td className="px-4 py-4 text-center font-bold text-slate-400">#{item.id}</td>
//                     <td className="px-4 py-4 text-center font-black text-rose-500">#{item.userId}</td>
//                     <td className="px-4 py-4 font-black uppercase text-[var(--text-main)] truncate">{username}</td>
//                     <td className="px-4 py-4 text-slate-500 italic truncate text-center px-4">{item.reasonForLeaving || "---"}</td>
//                     <td className="px-4 py-4 text-center">
//                       <span className={`px-2 py-0.5 rounded border font-black text-[8px] uppercase ${item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-200' : 'bg-amber-500/10 text-amber-500 border-amber-200'}`}>
//                         {item.status || 'Scheduled'}
//                       </span>
//                     </td>
//                     <td className="px-4 py-4 text-right">
//                       <div className="flex justify-end gap-1.5">
//                         <button onClick={() => setSelectedView({...item, username})} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-slate-400 hover:text-rose-500 transition-all"><Eye size={13}/></button>
//                         {isManager && (
//                           <>
//                             <button onClick={() => setEditRecord({...item, username})} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-indigo-400 hover:text-indigo-600 transition-all"><Edit3 size={13}/></button>
//                             <button onClick={() => setConfirm({ show: true, title: "Purge", message: "Delete record?", onConfirm: () => deleteExitInterview(item.id).then(fetchData) })} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={13}/></button>
//                           </>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//           {loading && <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-rose-500" /></div>}
//         </div>
//       </div>

//       {/* CREATE MODAL (SCHEDULE) */}
//       <AnimatePresence>
//         {showModal && (
//           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
//             <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden">
//               <div className="px-6 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
//                 <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-[var(--text-main)]"><UserPlus size={16} className="text-rose-600" /> Route Exit</h3>
//                 <button onClick={() => setShowModal(false)}><X size={18}/></button>
//               </div>
//               <form onSubmit={(e) => { e.preventDefault(); handleCreateSchedule(); }} className="p-6 space-y-4 bg-[var(--bg-card)]">
//                 <div className="space-y-1 relative" ref={dropdownRef}>
//                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Personnel</label>
//                   <input type="text" placeholder="SEARCH EMPLOYEE..." className="w-full px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-black outline-none text-[var(--text-main)] focus:border-rose-500" value={empSearchQuery} onFocus={() => setShowDropdown(true)} onChange={(e) => { setEmpSearchQuery(e.target.value); setShowDropdown(true); }} />
//                   {showDropdown && empSearchQuery && (
//                     <div className="absolute z-[120] w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl rounded-xl max-h-40 overflow-y-auto">
//                       {employees.filter(e => (e.username || "").toLowerCase().includes(empSearchQuery.toLowerCase())).map(emp => (
//                         <button key={emp.userId} type="button" onClick={() => { setFormData({...formData, userId: emp.userId}); setEmpSearchQuery(emp.username); setShowDropdown(false); }} className="w-full px-4 py-2 text-left hover:bg-rose-500/10 text-[var(--text-main)] text-[10px] font-black uppercase border-b border-[var(--border-color)] last:border-0">{emp.username} (#{emp.userId})</button>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Interview Date</label>
//                   <input required type="datetime-local" className="w-full px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-black text-[var(--text-main)] outline-none" onChange={e => setFormData({...formData, scheduledDate: e.target.value})} />
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Departure Reason</label>
//                   <textarea required rows="2" className="w-full px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-black text-[var(--text-main)] outline-none" onChange={e => setFormData({...formData, reasonForLeaving: e.target.value})} />
//                 </div>
//                 <button type="submit" disabled={!formData.userId} className="w-full py-3 bg-rose-600 text-white text-[11px] font-black uppercase rounded-xl active:scale-95 transition-all">Submit Registry</button>
//               </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* UPDATE MODAL */}
//       <AnimatePresence>
//         {editRecord && (
//           <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditRecord(null)}>
//             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-xs rounded-2xl border border-[var(--border-color)] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
//               <p className="text-[10px] font-black uppercase text-[var(--text-main)] mb-4 border-b border-[var(--border-color)] pb-2 text-center tracking-widest">Update State</p>
//               <div className="space-y-3">
//                 <textarea rows="2" className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] text-[var(--text-main)] outline-none" placeholder="Feedback notes..." onChange={e => setFeedbackData({...feedbackData, feedback: e.target.value})} />
//                 <div className="flex flex-col gap-2">
//                   <button onClick={() => handleUpdateProcess('InProgress')} className="py-2.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-amber-500 hover:text-white transition-all">In Progress</button>
//                   <button onClick={() => handleUpdateProcess('Completed')} className="py-2.5 bg-emerald-500/10 text-emerald-600 border border-emerald-200 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all">Completed</button>
//                   <button onClick={() => handleUpdateProcess('Cancelled')} className="py-2.5 bg-rose-500/10 text-rose-600 border border-rose-200 rounded-xl text-[9px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">Cancelled</button>
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* VIEW MODAL */}
//       <AnimatePresence>
//         {selectedView && (
//           <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedView(null)}>
//             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-3xl border border-[var(--border-color)] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
//                <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 mb-4">
//                   <h3 className="text-[11px] font-black uppercase text-rose-500">Record Data</h3>
//                   <X size={18} className="text-slate-400 cursor-pointer" onClick={() => setSelectedView(null)}/>
//                </div>
//                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-[var(--text-main)]">
//                   <div className="p-2.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
//                     <p className="text-[7px] text-slate-400 uppercase mb-0.5">Personnel</p>
//                     <p className="uppercase truncate">{selectedView.username}</p>
//                   </div>
//                   <div className="p-2.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
//                     <p className="text-[7px] text-slate-400 uppercase mb-0.5">Log Date</p>
//                     <p>{new Date(selectedView.scheduledDate).toLocaleDateString()}</p>
//                   </div>
//                   <div className="col-span-2 p-3 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
//                     <p className="text-[7px] text-slate-400 uppercase mb-1">Departure Reason</p>
//                     <p className="leading-tight opacity-70 italic">"{selectedView.reasonForLeaving}"</p>
//                   </div>
//                </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }



















import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
  getAllExitInterviews, getExitInterviewByUser, scheduleExitInterview, 
  deleteExitInterview, updateExitInterview, submitExitFeedback 
} from "../../api/hr.exitInterview";
import { getAdminUsers } from "../../../api/admin/users.api";
import { useRole } from "../../hooks/useRole";
import { jwtDecode } from "jwt-decode";
import { 
  LogOut, Plus, Loader2, X, Search, Edit3, Trash2, UserPlus, AlertTriangle, Eye 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function ExitInterview() {
  const { isManager } = useRole();
  const [interviews, setInterviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedView, setSelectedView] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  
  const [tableSearch, setTableSearch] = useState("");
  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });

  const [formData, setFormData] = useState({ userId: "", scheduledDate: "", reasonForLeaving: "" });
  const [feedbackData, setFeedbackData] = useState({ feedback: "", suggestions: "" });

  const auth = useMemo(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return { id: 0 };
      const decoded = jwtDecode(token);
      return { id: Number(decoded.sub || decoded.id) };
    } catch { return { id: 0 }; }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const empRes = await getAdminUsers({ page: 1, pageSize: 200 });
      setEmployees(empRes?.users || empRes || []);

      let res = isManager ? await getAllExitInterviews() : await getExitInterviewByUser(auth.id);
      const data = res?.data || res || [];
      setInterviews(Array.isArray(data) ? data : [data]);
    } catch { 
      toast.error("Registry Sync Error");
      setInterviews([]); 
    } finally { setLoading(false); }
  }, [isManager, auth.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateSchedule = async () => {
    const tid = toast.loading("Processing...");
    try {
      const payload = {
        userId: Number(formData.userId),
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
        reasonForLeaving: String(formData.reasonForLeaving).trim(),
        status: "Scheduled"
      };
      await scheduleExitInterview(payload);
      toast.success("Scheduled", { id: tid });
      setShowModal(false);
      fetchData();
    } catch { toast.error("Submission Failed", { id: tid }); }
  };

  const handleUpdateProcess = async (status) => {
    const tid = toast.loading("Updating...");
    try {
      await updateExitInterview(editRecord.id, { ...editRecord, status });
      toast.success("Success", { id: tid });
      setEditRecord(null);
      fetchData();
    } catch { toast.error("Failed", { id: tid }); }
  };

  const filteredInterviews = interviews.filter(item => {
    const emp = employees.find(e => Number(e.userId) === Number(item.userId));
    return (emp?.username || "").toLowerCase().includes(tableSearch.toLowerCase()) || 
           item.userId?.toString().includes(tableSearch);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-3 p-2 font-sans text-[var(--text-main)] h-[92vh] flex flex-col overflow-hidden transition-all">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <h2 className="text-xl font-black uppercase flex items-center gap-2 tracking-tight"><LogOut size={22} className="text-rose-600" /> Exit Terminal</h2>
        <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input type="text" placeholder="FILTER LOGS..." onChange={(e) => setTableSearch(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md pl-8 pr-2 py-1 text-[9px] font-black w-48 uppercase outline-none focus:border-rose-500" />
            </div>
            {isManager && (
              <button onClick={() => { setShowModal(true); setEmpSearchQuery(""); }} className="bg-rose-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">+ Schedule</button>
            )}
        </div>
      </div>

      {/* TABLE WITH SEPARATE COLUMNS & DELETE RESTORED */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm flex-1 flex flex-col overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-4 py-2 w-16 text-center">ID</th>
              <th className="px-4 py-2 w-20 text-center">User ID</th>
              <th className="px-4 py-2 w-48">Username</th>
              <th className="px-4 py-2 w-auto">Reason</th>
              <th className="px-4 py-2 w-32 text-center">Status</th>
              <th className="px-4 py-2 w-28 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]/30 bg-[var(--bg-card)]">
            {loading ? (
                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-rose-500" /></td></tr>
            ) : filteredInterviews.map((item) => {
              const emp = employees.find(e => Number(e.userId) === Number(item.userId));
              return (
                <tr key={item.id} className="hover:bg-rose-500/5 transition-colors">
                  <td className="px-4 py-2 text-center font-bold text-slate-400 text-[11px]">#{item.id}</td>
                  <td className="px-4 py-2 text-center font-black text-rose-500 text-[11px]">#{item.userId}</td>
                  <td className="px-4 py-2 font-black uppercase text-[11px] truncate text-[var(--text-main)]">{emp?.username || "---"}</td>
                  <td className="px-4 py-2 text-slate-500 italic truncate text-[11px] font-medium">{item.reasonForLeaving || "---"}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded border font-black text-[8px] uppercase ${
                      item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-200' : 
                      item.status === 'InProgress' ? 'bg-amber-500/10 text-amber-500 border-amber-200' :
                      'bg-rose-500/10 text-rose-600 border-rose-200'
                    }`}>{item.status || 'Scheduled'}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setSelectedView({...item, username: emp?.username})} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-slate-400 hover:text-rose-500 transition-all"><Eye size={13}/></button>
                      {isManager && (
                        <>
                          <button onClick={() => setEditRecord({...item, username: emp?.username})} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-indigo-400 hover:text-indigo-600 transition-all"><Edit3 size={13}/></button>
                          <button onClick={() => setConfirm({ show: true, title: "Purge", message: "Delete record?", onConfirm: () => deleteExitInterview(item.id).then(fetchData) })} className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={13}/></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CONFIRMATION POPUP */}
      <AnimatePresence>
        {confirm.show && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-[260px] rounded-2xl p-5 border border-[var(--border-color)] text-center shadow-2xl">
              <AlertTriangle size={32} className="text-rose-500 mx-auto mb-3" />
              <h3 className="text-[11px] font-black uppercase text-[var(--text-main)] mb-1">Confirm Action</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-6 leading-tight">{confirm.message}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirm({ ...confirm, show: false })} className="flex-1 py-1.5 bg-[var(--bg-body)] text-slate-400 rounded-xl text-[9px] font-black">NO</button>
                <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, show: false }); }} className="flex-1 py-1.5 bg-rose-600 text-white rounded-xl text-[9px] font-black shadow-lg">YES</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {selectedView && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedView(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 mb-4">
                  <h3 className="text-[10px] font-black uppercase text-rose-500 leading-none text-[var(--text-main)]">Record Data</h3>
                  <button onClick={() => setSelectedView(null)}><X size={18} className="text-slate-400 hover:text-rose-500"/></button>
               </div>
               <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-[var(--text-main)]">
                  <div className="p-2.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
                    <p className="text-[7px] text-slate-400 uppercase mb-0.5">Personnel</p>
                    <p className="uppercase truncate">{selectedView.username}</p>
                  </div>
                  <div className="p-2.5 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
                    <p className="text-[7px] text-slate-400 uppercase mb-0.5">Log Date</p>
                    <p>{new Date(selectedView.scheduledDate).toLocaleDateString()}</p>
                  </div>
                  <div className="col-span-2 p-3 bg-[var(--bg-body)] rounded-lg border border-[var(--border-color)]">
                    <p className="text-[7px] text-slate-400 uppercase mb-1">Departure Reason</p>
                    <p className="leading-tight opacity-70 italic text-[var(--text-main)]">"{selectedView.reasonForLeaving}"</p>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPDATE STATUS MODAL */}
      <AnimatePresence>
        {editRecord && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditRecord(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-xs rounded-2xl border border-[var(--border-color)] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
              <p className="text-[10px] font-black uppercase text-[var(--text-main)] mb-4 border-b border-[var(--border-color)] pb-2 text-center tracking-widest">Update State</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleUpdateProcess('InProgress')} className="py-2.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-amber-500 hover:text-white transition-all">In Progress</button>
                <button onClick={() => handleUpdateProcess('Completed')} className="py-2.5 bg-emerald-500/10 text-emerald-600 border border-emerald-200 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all">Completed</button>
                <button onClick={() => handleUpdateProcess('Cancelled')} className="py-2.5 bg-rose-500/10 text-rose-600 border border-rose-200 rounded-xl text-[9px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">Cancelled</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden">
               <div className="px-5 py-3 bg-[var(--bg-body)] border-b flex justify-between items-center shrink-0">
                  <h3 className="text-[10px] font-black uppercase text-rose-600 flex items-center gap-2"><UserPlus size={16}/> New Schedule</h3>
                  <X size={20} className="text-slate-400 cursor-pointer hover:text-rose-500" onClick={() => setShowModal(false)}/>
               </div>
               <form onSubmit={(e) => { e.preventDefault(); handleCreateSchedule(); }} className="p-5 space-y-2 bg-[var(--bg-card)]">
                  <div className="relative">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Personnel</label>
                    <input type="text" placeholder="SELECT USER..." className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-rose-500 text-[var(--text-main)]" value={empSearchQuery} onFocus={() => setShowDropdown(true)} onChange={(e) => { setEmpSearchQuery(e.target.value); setShowDropdown(true); }} />
                    {showDropdown && (
                      <div className="absolute z-[120] w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl rounded-xl max-h-32 overflow-y-auto">
                        {employees.filter(e => (e.username || "").toLowerCase().includes(empSearchQuery.toLowerCase())).map(emp => (
                          <button key={emp.userId} type="button" onClick={() => { setFormData({...formData, userId: emp.userId}); setEmpSearchQuery(emp.username); setShowDropdown(false); }} className="w-full px-4 py-2 text-left hover:bg-rose-500/10 text-[var(--text-main)] text-[10px] font-black uppercase border-b border-[var(--border-color)] last:border-0 text-[var(--text-main)]">{emp.username} (ID: {emp.userId})</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Interview Date</label>
                    <input required type="datetime-local" className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold text-[var(--text-main)] outline-none" onChange={e => setFormData({...formData, scheduledDate: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Reason</label>
                    <textarea required rows="2" className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none text-[var(--text-main)]" onChange={e => setFormData({...formData, reasonForLeaving: e.target.value})} />
                  </div>
                  <button type="submit" disabled={!formData.userId} className="w-full py-2.5 bg-rose-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all">Route Offboarding</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}