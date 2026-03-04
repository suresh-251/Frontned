// import React, { useState, useEffect } from "react";
// import { 
//   requestBudgetChange, 
//   getBudgetChangeHistory, 
//   approveBudgetChange, 
//   rejectBudgetChange,
//   getDepartments 
// } from "../../api/dept/budgetChange.api";
// import { History, Plus, Loader2, X, MapPin, CheckCircle, XCircle, Clock } from "lucide-react";
// import toast, { Toaster } from "react-hot-toast";

// export default function BudgetChange() {
//   const [history, setHistory] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   
//   const [formData, setFormData] = useState({ departmentId: "", requestedAmount: "", reason: "" });

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const [histRes, deptRes] = await Promise.all([getBudgetChangeHistory(), getDepartments()]);
//       setHistory(histRes.data || histRes || []);
//       setDepartments(deptRes.data || deptRes || []);
//     } catch (err) { 
//       toast.error("Sync Error: Failed to load budget data"); 
//     } finally { 
//       setLoading(false); 
//     }
//   };

//   useEffect(() => { fetchData(); }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const tid = toast.loading("Processing request...");
//     try {
//       // ✅ STRICT PAYLOAD: Matches the curl example exactly
//       const payload = {
//         departmentId: parseInt(formData.departmentId),
//         requestedAmount: parseFloat(formData.requestedAmount),
//         reason: formData.reason
//       };

//       await requestBudgetChange(payload);
//       toast.success("Budget request submitted", { id: tid });
//       setShowModal(false);
//       setFormData({ departmentId: "", requestedAmount: "", reason: "" });
//       fetchData();
//     } catch (err) { 
//       toast.error(err.response?.status === 403 ? "Permission Denied" : "Submission Failed", { id: tid }); 
//     }
//   };

//   // ✅ HANDLERS FOR APPROVAL/REJECTION
//   const handleAction = async (id, actionType) => {
//     const tid = toast.loading(`${actionType === 'approve' ? 'Approving' : 'Rejecting'}...`);
//     try {
//       if (actionType === 'approve') {
//         await approveBudgetChange(id);
//       } else {
//         await rejectBudgetChange(id);
//       }
//       toast.success(`Request ${actionType}d`, { id: tid });
//       fetchData();
//     } catch (err) {
//       toast.error("Action failed", { id: tid });
//     }
//   };

//   return (
//     <div className="p-4 max-w-6xl mx-auto min-h-screen bg-[#F8FAFC]">
//       <Toaster position="top-right" />

//       {/* HEADER */}
//       <div className="flex justify-between items-end mb-6">
//         <div>
//           <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
//             <History size={20} className="text-indigo-600"/> Budget Adjustment Registry
//           </h1>
//           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Financial Request Lifecycle</p>
//         </div>
//         <button 
//           onClick={() => setShowModal(true)} 
//           className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
//         >
//           <Plus size={14} /> New Request
//         </button>
//       </div>

//       {/* DATA TABLE */}
//       <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
//         <table className="w-full text-left text-[12px]">
//           <thead className="bg-slate-50 border-b font-black text-slate-400 uppercase tracking-widest">
//             <tr>
//               <th className="px-6 py-4">Department & Info</th>
//               <th className="px-6 py-4">Requested Amount</th>
//               <th className="px-6 py-4">Justification</th>
//               <th className="px-6 py-4 text-center">Status</th>
//               <th className="px-6 py-4 text-right">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-100">
//             {loading ? (
//               <tr><td colSpan="5" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={24} /></td></tr>
//             ) : history.length > 0 ? (
//               history.map((item) => {
//                 const dept = departments.find(d => (d.departmentId || d.id) === item.departmentId);
//                 return (
//                   <tr key={item.budgetChangeRequestId} className="hover:bg-slate-50/50 transition-colors group">
//                     <td className="px-6 py-4">
//                       <div className="font-black text-slate-800 text-[13px] uppercase">
//                         {dept?.departmentName || `Dept ID: ${item.departmentId}`}
//                       </div>
//                       <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
//                         <Clock size={10}/> {new Date(item.requestDate).toLocaleDateString()}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="font-black text-indigo-600 text-sm">
//                         ${item.requestedAmount?.toLocaleString()}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <p className="text-slate-500 italic max-w-[200px] truncate">"{item.reason}"</p>
//                     </td>
//                     <td className="px-6 py-4 text-center">
//                       <span className={`px-3 py-1 rounded-full font-black uppercase text-[9px] border ${
//                         item.status === 'Approved' ? 'bg-green-50 text-green-600 border-green-100' : 
//                         item.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
//                         'bg-amber-50 text-amber-600 border-amber-100'
//                       }`}>
//                         {item.status}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 text-right">
//                       {item.status === "Pending" ? (
//                         <div className="flex justify-end gap-2">
//                           <button 
//                             onClick={() => handleAction(item.budgetChangeRequestId, 'approve')}
//                             className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-all"
//                             title="Approve"
//                           >
//                             <CheckCircle size={18}/>
//                           </button>
//                           <button 
//                             onClick={() => handleAction(item.budgetChangeRequestId, 'reject')}
//                             className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"
//                             title="Reject"
//                           >
//                             <XCircle size={18}/>
//                           </button>
//                         </div>
//                       ) : (
//                         <span className="text-[10px] font-black text-slate-300 uppercase">Settled</span>
//                       )}
//                     </td>
//                   </tr>
//                 );
//               })
//             ) : (
//               <tr><td colSpan="5" className="py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">No request history found</td></tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* REQUEST MODAL */}
//       {showModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
//           <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
//             <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
//               <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">New Budget Request</h2>
//               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
//             </div>
//             
//             <form onSubmit={handleSubmit} className="p-8 space-y-5">
//               <div>
//                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">1. Target Department</label>
//                 <select required className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-bold text-slate-700 outline-none focus:ring-2 ring-indigo-500/10 transition-all"
//                   value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value})}>
//                   <option value="">Select Department...</option>
//                   {departments.map(d => (
//                     <option key={d.departmentId || d.id} value={d.departmentId || d.id}>
//                       {d.departmentName}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">2. Requested Increase ($)</label>
//                 <input 
//                   required 
//                   type="number" 
//                   placeholder="0.00"
//                   className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-bold text-slate-700 outline-none focus:ring-2 ring-indigo-500/10 transition-all" 
//                   value={formData.requestedAmount}
//                   onChange={(e) => setFormData({...formData, requestedAmount: e.target.value})} 
//                 />
//               </div>

//               <div>
//                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1">3. Justification</label>
//                 <textarea 
//                   required 
//                   rows="3" 
//                   placeholder="Explain why these funds are needed..."
//                   className="w-full mt-1.5 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-bold text-slate-700 outline-none resize-none focus:ring-2 ring-indigo-500/10 transition-all" 
//                   value={formData.reason}
//                   onChange={(e) => setFormData({...formData, reason: e.target.value})} 
//                 />
//               </div>

//               <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 mt-2">
//                 Send Request
//               </button>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



import React, { useState, useEffect } from "react";
import { 
  requestBudgetChange, 
  getBudgetChangeHistory, 
  approveBudgetChange, 
  rejectBudgetChange,
  getDepartments 
} from "../../api/dept/budgetChange.api";
import { 
  History, Plus, Loader2, X, CheckCircle, XCircle, 
  Clock, DollarSign, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function BudgetChange() {
  const [history, setHistory] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("non-rejected");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({ 
    departmentId: "", requestedAmount: "", reason: "" 
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [histRes, deptRes] = await Promise.all([getBudgetChangeHistory(), getDepartments()]);
      setHistory(histRes.data || histRes || []);
      setDepartments(deptRes.data || deptRes || []);
    } catch (err) { toast.error("Sync Error"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredHistory = history.filter(item => {
    const dept = departments.find(d => (d.departmentId || d.id) === item.departmentId);
    const matchesSearch = dept?.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    return filter === "non-rejected" ? item.status !== "Rejected" : 
           filter === "rejected" ? item.status === "Rejected" : true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestBudgetChange({
        departmentId: parseInt(formData.departmentId),
        requestedAmount: parseFloat(formData.requestedAmount),
        reason: formData.reason
      });
      toast.success("Submitted");
      setShowModal(false);
      setFormData({ departmentId: "", requestedAmount: "", reason: "" });
      fetchData();
    } catch (err) { toast.error("Error"); }
    finally { setLoading(false); }
  };

  const handleAction = async (id, actionType) => {
    try {
      if (actionType === 'approve') await approveBudgetChange(id);
      else await rejectBudgetChange(id);
      toast.success("Updated");
      fetchData();
    } catch (err) { toast.error("Failed"); }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white">
      <Toaster position="top-right" />

      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2 tracking-tighter uppercase">
            <History size={18} className="text-indigo-600" /> Budget Registry
          </h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Financial adjustments</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
            <input 
              type="text" placeholder="Search..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg pl-8 py-1.5 w-44 outline-none focus:ring-1 focus:ring-indigo-200"
            />
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {["non-rejected", "rejected"].map((t) => (
              <button
                key={t} onClick={() => setFilter(t)}
                className={`px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all ${
                  filter === t ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t === "non-rejected" ? "Active" : t}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm hover:bg-indigo-700 transition-all"
          >
            + New Request
          </button>
        </div>
      </div>

      {/* FITTED TABLE SECTION */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading && history.length === 0 ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" size={20} /></div>
        ) : (
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Justification</th>
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredHistory.map((item) => {
                  const dept = departments.find(d => (d.departmentId || d.id) === item.departmentId);
                  return (
                    <tr key={item.budgetChangeRequestId} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-2">
                        <p className="text-[11px] font-black text-slate-700 uppercase">{dept?.departmentName || 'Dept'}</p>
                        <p className="text-[8px] font-bold text-slate-400">{new Date(item.requestDate).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-0.5 text-indigo-600 font-black text-[11px]">
                          <DollarSign size={10} />
                          {item.requestedAmount?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <p className="text-[10px] font-medium text-slate-500 truncate max-w-[200px]">{item.reason}</p>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded border ${
                          item.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          item.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {item.status === "Pending" ? (
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleAction(item.budgetChangeRequestId, 'approve')} className="p-1 hover:text-emerald-500 text-slate-300"><CheckCircle size={14}/></button>
                            <button onClick={() => handleAction(item.budgetChangeRequestId, 'reject')} className="p-1 hover:text-rose-400 text-slate-300"><XCircle size={14}/></button>
                          </div>
                        ) : (
                          <span className="text-[8px] font-black text-slate-200 uppercase">Closed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SMALLER MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-slate-100">
               <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">New Request</h3>
                  <button onClick={() => setShowModal(false)}><X size={14} className="text-slate-400"/></button>
               </div>
               <form onSubmit={handleSubmit} className="p-6 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Dept</label>
                      <select required className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-300" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                        <option value="">Select</option>
                        {departments.map(d => <option key={d.departmentId || d.id} value={d.departmentId || d.id}>{d.departmentName}</option>)}
                      </select>
                    </div>
                    <InputField label="Amount ($)" value={formData.requestedAmount} onChange={e => setFormData({...formData, requestedAmount: e.target.value.replace(/[^0-9.]/g, '')})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Justification</label>
                    <textarea required rows="2" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-300 resize-none" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                  </div>
                  <div className="pt-4 flex justify-end gap-2">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-1.5 text-[9px] font-black uppercase text-slate-400">Cancel</button>
                    <button type="submit" className="px-6 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg shadow-md hover:bg-indigo-700">Submit</button>
                  </div>
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
    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">{label}</label>
    <input {...props} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-300" />
  </div>
);