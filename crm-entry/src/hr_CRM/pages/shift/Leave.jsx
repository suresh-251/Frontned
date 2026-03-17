// import React, { useState, useEffect, useMemo } from "react";
// import { 
//   Calendar, X, Plus, Loader2, CheckCircle, XCircle, 
//   Trash2, User, Send, AlertTriangle, Search, ShieldCheck 
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";
// import { jwtDecode } from "jwt-decode";
// import { useRole } from "../../hooks/useRole"; // Importing your hook
// import { getAllLeaves, applyLeave, updateLeaveStatus, deleteLeave } from "../../api/LeaveService";

// export default function Leave() {
//   const { isManager, isUser } = useRole();
//   const [leaves, setLeaves] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [showApplyModal, setShowApplyModal] = useState(false);
//   const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });
//   const [searchTerm, setSearchTerm] = useState("");

//   // Get current User Info for IDs and Names
//   const currentUser = useMemo(() => {
//     try {
//       const token = localStorage.getItem("accessToken");
//       if (!token) return null;
//       const decoded = jwtDecode(token);
//       return {
//         id: decoded.sub || decoded.id,
//         name: decoded.unique_name || decoded.username || "Manager"
//       };
//     } catch { return null; }
//   }, []);

//   const [formData, setFormData] = useState({
//     employeeId: currentUser?.id || 0,
//     leaveType: "Annual",
//     startDate: "",
//     endDate: "",
//     reason: "",
//     status: "Pending",
//     approvedBY: null
//   });

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const res = await getAllLeaves();
//       const allData = res.data || res || [];
      
//       // ROLE LOGIC: Manager sees all, User sees only their own ID
//       if (isManager) {
//         setLeaves(allData);
//       } else {
//         setLeaves(allData.filter(l => String(l.employeeId) === String(currentUser?.id)));
//       }
//     } catch {
//       toast.error("Registry Sync Error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { fetchData(); }, [isManager, currentUser?.id]);

//   const triggerConfirm = (title, message, action) => {
//     setConfirm({ show: true, title, message, onConfirm: action });
//   };

//   const handleApply = async () => {
//     const tid = toast.loading("Routing Request...");
//     try {
//       // Force User Constraints: Request for self only, status Pending, approvedBy null
//       await applyLeave({
//         ...formData,
//         employeeId: parseInt(currentUser?.id),
//         status: "Pending",
//         approvedBY: null
//       });
//       toast.success("Request Logged", { id: tid });
//       setShowApplyModal(false);
//       setFormData({ ...formData, startDate: "", endDate: "", reason: "" });
//       fetchData();
//     } catch {
//       toast.error("Routing Failed", { id: tid });
//     }
//   };

//   const handleAction = async (leaveId, status) => {
//     const tid = toast.loading("Updating Registry...");
//     try {
//       await updateLeaveStatus(leaveId, {
//         status: status,
//         approvedBY: currentUser?.name // Manager's name from token
//       });
//       toast.success(`Leave ${status}`, { id: tid });
//       fetchData();
//     } catch {
//       toast.error("Action Failed", { id: tid });
//     }
//   };

//   const handleDelete = async (id) => {
//     try {
//       await deleteLeave(id);
//       toast.success("Record Purged");
//       fetchData();
//     } catch {
//       toast.error("Delete Restricted");
//     }
//   };

//   const filteredLeaves = leaves.filter(l => 
//     l.employeeId?.toString().includes(searchTerm) || 
//     l.leaveType?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans transition-all duration-300">
//       <Toaster position="top-right" />

//       {/* CONFIRMATION POPUP */}
//       <AnimatePresence>
//         {confirm.show && (
//           <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-xs rounded-2xl p-6 border border-slate-200 text-center shadow-2xl">
//               <AlertTriangle size={24} className="text-indigo-500 mx-auto mb-4" />
//               <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest mb-1">{confirm.title}</h3>
//               <p className="text-[10px] font-bold text-slate-500 uppercase mb-6">{confirm.message}</p>
//               <div className="flex gap-2">
//                 <button onClick={() => setConfirm({ ...confirm, show: false })} className="flex-1 py-2 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase border">Cancel</button>
//                 <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, show: false }); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">Confirm</button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* HEADER */}
//       <div className="flex items-center justify-between px-1">
//         <div>
//           <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase">
//             <Calendar size={22} className="text-indigo-500" /> Leave Terminal
//           </h2>
//           <div className="relative mt-1">
//             <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
//             <input type="text" placeholder="SEARCH LOGS..." onChange={(e) => setSearchTerm(e.target.value)} className="bg-white border border-slate-200 rounded-md pl-6 pr-2 py-1 text-[9px] font-black outline-none w-40 uppercase" />
//           </div>
//         </div>
//         <button onClick={() => setShowApplyModal(true)} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">
//           <Plus size={14} className="inline mr-1" /> New Application
//         </button>
//       </div>

//       {/* TABLE */}
//       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//         <table className="w-full text-left border-collapse">
//           <thead className="bg-slate-50 border-b border-slate-200">
//             <tr>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Dates</th>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized By</th>
//               <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Control</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {filteredLeaves.map((l) => (
//               <tr key={l.leaveId} className="hover:bg-slate-50 transition-all">
//                 <td className="px-5 py-3.5">
//                   <p className="text-[12px] font-black text-slate-700 uppercase">ID: #{l.employeeId}</p>
//                   <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase">{l.leaveType}</span>
//                 </td>
//                 <td className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-600">
//                   {new Date(l.startDate).toLocaleDateString()} <span className="text-slate-300">→</span> {new Date(l.endDate).toLocaleDateString()}
//                 </td>
//                 <td className="px-5 py-3.5 text-center">
//                   <span className={`text-[8px] font-black px-2 py-1 rounded border uppercase tracking-widest ${
//                     l.status === 'Approved' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 
//                     l.status === 'Rejected' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-amber-50 text-amber-500 border-amber-100'
//                   }`}>{l.status}</span>
//                 </td>
//                 <td className="px-5 py-3.5 text-[10px] font-black uppercase text-slate-400 italic">
//                   {l.approvedBY || <span className="text-slate-300">Pending Review</span>}
//                 </td>
//                 <td className="px-5 py-3.5 text-right space-x-1">
//                   {isManager && l.status === "Pending" && (
//                     <>
//                       <button onClick={() => triggerConfirm("Approve", "Approve this leave?", () => handleAction(l.leaveId, "Approved"))} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"><CheckCircle size={16}/></button>
//                       <button onClick={() => triggerConfirm("Reject", "Reject this leave?", () => handleAction(l.leaveId, "Rejected"))} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><XCircle size={16}/></button>
//                     </>
//                   )}
//                   {/* Delete Permission: Manager always, User only their own and if Pending */}
//                   {(isManager || (isUser && l.status === "Pending")) && (
//                     <button onClick={() => triggerConfirm("Delete", "Delete request?", () => handleDelete(l.leaveId))} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
//                   )}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//         {loading && <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>}
//       </div>

//       {/* MODAL: APPLY LEAVE */}
//       <AnimatePresence>
//         {showApplyModal && (
//           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
//               <div className="px-5 py-4 bg-slate-50 border-b flex justify-between items-center">
//                 <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Send size={14}/> Submit Request</h3>
//                 <button onClick={() => setShowApplyModal(false)}><X size={18} className="text-slate-400 hover:text-rose-500"/></button>
//               </div>
//               <form onSubmit={(e) => { e.preventDefault(); triggerConfirm("Submit", "Route application?", handleApply); }} className="p-6 space-y-4">
//                 <div className="space-y-1">
//                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1">My ID (Locked)</label>
//                   <input type="text" disabled value={`#${currentUser?.id}`} className="w-full px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-bold" />
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-1">
//                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Leave Type</label>
//                     <select className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-100" onChange={e => setFormData({...formData, leaveType: e.target.value})}>
//                       <option value="Annual">Annual</option>
//                       <option value="Sick">Sick</option>
//                       <option value="Personal">Personal</option>
//                       <option value="Maternity">Maternity</option>
//                     </select>
//                   </div>
//                   <div className="space-y-1">
//                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Status</label>
//                     <div className="w-full px-3 py-2 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase text-center border border-amber-100">Pending</div>
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="space-y-1">
//                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Start Date</label>
//                     <input type="date" required className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold" onChange={e => setFormData({...formData, startDate: new Date(e.target.value).toISOString()})} />
//                   </div>
//                   <div className="space-y-1">
//                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">End Date</label>
//                     <input type="date" required className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold" onChange={e => setFormData({...formData, endDate: new Date(e.target.value).toISOString()})} />
//                   </div>
//                 </div>
//                 <div className="space-y-1">
//                   <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Justification</label>
//                   <textarea required className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none h-16 resize-none" onChange={e => setFormData({...formData, reason: e.target.value})}></textarea>
//                 </div>
//                 <button type="submit" className="w-full py-3 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl tracking-widest shadow-lg">Confirm Routing</button>
//               </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }



import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Calendar, X, Plus, Loader2, CheckCircle, XCircle, Trash2, 
  Search, Send, AlertTriangle, ShieldCheck, Wallet, Umbrella, Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { useRole } from "../../hooks/useRole";
import { 
  getAllLeaves, getLeavesByEmployee, applyLeave, updateLeaveStatus, 
  deleteLeave, getLeaveBalance, getHolidays 
} from "../../api/LeaveService";

export default function Leave() {
  const { isManager, isUser } = useRole();
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  
  const [confirm, setConfirm] = useState({ show: false, title: "", message: "", onConfirm: null });

  const auth = useMemo(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return { id: 0, name: "User" };
      const decoded = jwtDecode(token);
      return { id: Number(decoded.sub || decoded.id), name: decoded.username || "Manager" };
    } catch { return { id: 0, name: "User" }; }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const [leaveRes, balanceRes, holidayRes] = await Promise.all([
        isManager ? getAllLeaves() : getLeavesByEmployee(auth.id),
        getLeaveBalance(auth.id),
        getHolidays(year)
      ]);
      const leaveData = leaveRes.data || leaveRes || [];
      setLeaves(Array.isArray(leaveData) ? leaveData : [leaveData]);
      setBalance(balanceRes.data || balanceRes);
      setHolidays(holidayRes.data || holidayRes || []);
    } catch {
      toast.error("Sync Failure");
    } finally { setLoading(false); }
  }, [isManager, auth.id]);

  useEffect(() => { if(auth.id) fetchData(); }, [fetchData, auth.id]);

  const handleApply = async (e) => {
    e.preventDefault();
    const tid = toast.loading("Processing...");
    try {
      await applyLeave({
        userId: auth.id,
        leaveType: formData.leaveType,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        reason: formData.reason,
        status: "Pending",
        approvedBY: ""
      });
      toast.success("Leave applied successfully.", { id: tid });
      setShowApplyModal(false);
      fetchData();
    } catch { toast.error("Routing Error", { id: tid }); }
  };

  const handleStatusUpdate = async (leaveId, status) => {
    const tid = toast.loading(`Updating...`);
    try {
      await updateLeaveStatus(leaveId, { status, approvedBY: auth.name });
      toast.success(`Leave status updated to ${status}.`, { id: tid });
      fetchData();
    } catch { toast.error("Error", { id: tid }); }
  };

  const [formData, setFormData] = useState({ leaveType: "Sick", startDate: "", endDate: "", reason: "" });

  const filteredLeaves = useMemo(() => {
    return leaves.filter(l => {
      const matchesSearch = l.userId?.toString().includes(searchTerm) || 
                            l.leaveType?.toLowerCase().includes(searchTerm.toLowerCase());
      const currentStatus = (l.status || "").toLowerCase().trim();
      const targetFilter = statusFilter.toLowerCase();
      const matchesStatus = targetFilter === "all" || 
                            (targetFilter === "inprogress" ? (currentStatus === "inprogress" || currentStatus === "in progress") : currentStatus === targetFilter);
      return matchesSearch && matchesStatus;
    });
  }, [leaves, searchTerm, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-3 p-2 font-sans text-[var(--text-main)] h-[92vh] flex flex-col overflow-hidden transition-all duration-300">
      <Toaster position="top-right" />

      {/* CONFIRMATION */}
      <AnimatePresence>
        {confirm.show && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-[280px] rounded-2xl p-6 border border-[var(--border-color)] text-center shadow-2xl">
              <AlertTriangle size={32} className="text-amber-500 mx-auto mb-4" />
              <h3 className="text-[12px] font-black uppercase text-[var(--text-main)] mb-1">{confirm.title}</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-6 leading-tight">{confirm.message}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirm({show:false})} className="flex-1 py-2 bg-[var(--bg-body)] text-slate-400 rounded-xl text-[10px] font-black border border-[var(--border-color)]">NO</button>
                <button onClick={() => { confirm.onConfirm(); setConfirm({show:false}); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-lg">YES</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUMMARY */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
         <SummaryCard icon={<Wallet size={18} className="text-emerald-500"/>} label="Available Balance" value={balance?.balance?.[0]?.remainingDays || '0'} />
         <SummaryCard icon={<Umbrella size={18} className="text-indigo-500"/>} label="Holidays" value={holidays.length} />
         <SummaryCard icon={<Calendar size={18} className="text-amber-500"/>} label="Personal Log" value={leaves.length} />
         <div className="flex items-center justify-end">
            <button onClick={() => setShowApplyModal(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2">
                <Plus size={14} strokeWidth={3} /> Apply Leave
            </button>
         </div>
      </div>

      {/* FILTERS */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <h2 className="text-lg font-black uppercase tracking-tighter text-indigo-600">Leave Terminal</h2>
        <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md pl-6 pr-2 py-1 text-[9px] font-black uppercase outline-none focus:border-indigo-500 text-[var(--text-main)]">
                <option value="pending">Pending</option>
                <option value="inprogress">In Progress</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">View All</option>
              </select>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input type="text" placeholder="ID / TYPE..." onChange={(e) => setSearchTerm(e.target.value)} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md pl-8 pr-2 py-1 text-[9px] font-black w-40 uppercase outline-none focus:border-indigo-500 text-[var(--text-main)]" />
            </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm flex-1 flex flex-col overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)] sticky top-0 z-10">
            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-5 py-3 w-40">User Identity</th>
              <th className="px-5 py-3 text-center w-64">Duration</th>
              <th className="px-5 py-3 text-center w-28">Status</th>
              <th className="px-5 py-3 w-44">Approved By</th>
              <th className="px-5 py-3 text-right w-32">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]/30 bg-[var(--bg-card)]">
            {!loading && filteredLeaves.map((l) => {
              const statusLower = (l.status || "").toLowerCase();
              return (
                <tr key={l.leaveId} className="hover:bg-indigo-500/5 transition-colors text-[11px]">
                  <td className="px-5 py-2.5">
                    <p className="font-black text-[var(--text-main)] uppercase leading-none mb-1">UID: #{l.userId}</p>
                    <span className="text-[8px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase">{l.leaveType}</span>
                  </td>
                  <td className="px-5 py-2.5 text-center">
                     <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500">
                        <span className="bg-[var(--bg-body)] px-2 py-0.5 rounded border border-[var(--border-color)]">{new Date(l.startDate).toLocaleDateString()}</span>
                        <span className="opacity-30">→</span>
                        <span className="bg-[var(--bg-body)] px-2 py-0.5 rounded border border-[var(--border-color)]">{new Date(l.endDate).toLocaleDateString()}</span>
                     </div>
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <span className={`px-2 py-1 rounded border font-black text-[8px] uppercase tracking-widest ${
                      statusLower === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      statusLower === 'rejected' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                      statusLower.includes('progress') ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}>{l.status || 'Pending'}</span>
                  </td>
                  <td className="px-5 py-2.5 font-black uppercase text-slate-400 text-[10px] truncate">{l.approvedBY || '---'}</td>
                  <td className="px-5 py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      {/* ✅ FIX: Manager can now approve Pending OR Inprogress */}
                      {isManager && (statusLower === "pending" || statusLower.includes("progress")) && (
                        <>
                          <button onClick={() => setConfirm({show:true, title:"Approve", message:"Approve leave?", onConfirm:()=>handleStatusUpdate(l.leaveId, "Approved")})} className="p-1 bg-emerald-500/10 text-emerald-500 rounded hover:bg-emerald-500 hover:text-white transition-all"><CheckCircle size={15}/></button>
                          <button onClick={() => setConfirm({show:true, title:"Reject", message:"Reject leave?", onConfirm:()=>handleStatusUpdate(l.leaveId, "Rejected")})} className="p-1 bg-rose-500/10 text-rose-600 rounded hover:bg-rose-500 hover:text-white transition-all"><XCircle size={15}/></button>
                        </>
                      )}
                      {(isManager || (isUser && statusLower === "pending")) && (
                        <button onClick={() => setConfirm({show:true, title:"Purge", message:"Delete record?", onConfirm:()=>deleteLeave(l.leaveId).then(fetchData)})} className="p-1 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={15}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <div className="p-20 text-center bg-[var(--bg-card)]"><Loader2 className="animate-spin mx-auto text-indigo-600" /></div>}
      </div>

      {/* APPLY MODAL */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden">
               <div className="px-5 py-3 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center shrink-0">
                  <h3 className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2"><Send size={14}/> Submit Request</h3>
                  <X size={20} className="text-slate-400 cursor-pointer hover:text-rose-500" onClick={() => setShowApplyModal(false)}/>
               </div>
               <form onSubmit={handleApply} className="p-5 space-y-2 bg-[var(--bg-card)]">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Type</label>
                    <select className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold text-[var(--text-main)] outline-none focus:ring-1 focus:ring-indigo-500" onChange={e => setFormData({...formData, leaveType: e.target.value})}>
                      <option value="Sick">Sick</option>
                      <option value="Casual">Casual</option>
                      <option value="Earned">Earned</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Start</label>
                        <input required type="date" className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold text-[var(--text-main)] outline-none" onChange={e => setFormData({...formData, startDate: e.target.value})} />
                     </div>
                     <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">End</label>
                        <input required type="date" className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold text-[var(--text-main)] outline-none" onChange={e => setFormData({...formData, endDate: e.target.value})} />
                     </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Reason</label>
                     <textarea required rows="2" className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold text-[var(--text-main)] outline-none" onChange={e => setFormData({...formData, reason: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all mt-2">Log Application</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SummaryCard = ({ icon, label, value }) => (
  <div className="bg-[var(--bg-card)] p-2.5 rounded-2xl border border-[var(--border-color)] shadow-sm flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-[var(--bg-body)] flex items-center justify-center border border-[var(--border-color)]/50">{icon}</div>
    <div>
      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[13px] font-black text-[var(--text-main)]">{value}</p>
    </div>
  </div>
);