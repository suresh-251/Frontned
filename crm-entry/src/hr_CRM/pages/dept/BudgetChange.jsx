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