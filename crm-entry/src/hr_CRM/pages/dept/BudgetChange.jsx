import React, { useState, useEffect, useMemo } from "react";
import { 
  requestBudgetChange, 
  getBudgetChangeHistory, 
  approveBudgetChange, 
  rejectBudgetChange,
  deleteBudgetChange,
  getDepartments,
  getDepartmentBudgets
} from "../../api/dept/budgetChange.api";
import { getBranches } from "../../api/api.branch";
import { 
  History, Plus, Loader2, X, CheckCircle, XCircle, 
  DollarSign, Search, Trash2, Building2, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

export default function BudgetChange() {
  const [history, setHistory] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [branches, setBranches] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("non-rejected");
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- 🛑 CONFIRMATION STATE ---
  const [confirm, setConfirm] = useState({ open: false, type: "", id: null, action: null });

  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [formData, setFormData] = useState({ 
    departmentId: "", requestedAmount: "", reason: "" 
  });

  const token = localStorage.getItem("accessToken");
  const auth = useMemo(() => {
    if (!token) return { perms: [], isAdmin: false };
    try {
      const decoded = jwtDecode(token);
      const perms = decoded.perm || [];
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      const isAdmin = role === "ADMIN" || perms.includes("CRM_FULL_ACCESS");
      return { perms, isAdmin };
    } catch (e) { return { perms: [], isAdmin: false }; }
  }, [token]);

  const isManager = auth.isAdmin || auth.perms.includes("BUDGET_APPROVE") || auth.perms.includes("BUDGET_VIEW_ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [histRes, deptRes, budRes, branchRes] = await Promise.all([
        getBudgetChangeHistory(), 
        getDepartments(),
        getDepartmentBudgets(),
        getBranches()
      ]);
      setHistory(histRes.data || histRes || []);
      setDepartments(deptRes.data || deptRes || []);
      setBudgets(budRes.data || budRes || []);
      setBranches(branchRes.data || branchRes || []);
    } catch (err) { 
      toast.error("Sync Error"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredDeptsForModal = useMemo(() => {
    if (!selectedBranchId) return [];
    return departments.filter(d => 
      String(d.branchId) === String(selectedBranchId) &&
      budgets.some(b => b.departmentId === (d.departmentId || d.id))
    );
  }, [selectedBranchId, departments, budgets]);

  const filteredHistory = history.filter(item => {
    const dept = departments.find(d => (d.departmentId || d.id) === item.departmentId);
    const matchesSearch = dept?.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    return filter === "non-rejected" ? item.status !== "Rejected" : 
           filter === "rejected" ? item.status === "Rejected" : true;
  });

  // --- 🛠️ ACTION WRAPPERS ---
  const handleActionClick = (id, type) => {
    setConfirm({ open: true, type, id, action: () => executeAction(id, type) });
  };

  const executeAction = async (id, actionType) => {
    const tid = toast.loading("Updating...");
    try {
      if (actionType === 'approve') await approveBudgetChange(id);
      else if (actionType === 'reject') await rejectBudgetChange(id);
      else if (actionType === 'delete') await deleteBudgetChange(id);
      toast.success("Done", { id: tid });
      fetchData();
    } catch (err) { 
      toast.error("Failed", { id: tid }); 
    }
    setConfirm({ open: false, type: "", id: null, action: null });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirm({ 
      open: true, 
      type: "submit", 
      id: null, 
      action: async () => {
        const tid = toast.loading("Submitting...");
        try {
          await requestBudgetChange({
            departmentId: parseInt(formData.departmentId),
            requestedAmount: parseFloat(formData.requestedAmount),
            reason: formData.reason
          });
          toast.success("Submitted", { id: tid });
          setShowModal(false);
          resetForm();
          fetchData();
        } catch { toast.error("Failed", { id: tid }); }
        setConfirm({ open: false, type: "", id: null, action: null });
      }
    });
  };

  const resetForm = () => {
    setFormData({ departmentId: "", requestedAmount: "", reason: "" });
    setSelectedBranchId("");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2">
            <History size={22} className="text-indigo-500" /> Budget Registry
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            {auth.isAdmin ? "Master Financial Registry (Full Access)" : "Financial adjustments"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" placeholder="Search..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg pl-9 pr-4 py-2 w-48 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div className="flex bg-[var(--bg-body)] p-1 rounded-lg border border-[var(--border-color)]">
            {["non-rejected", "rejected"].map((t) => (
              <button
                key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${
                  filter === t ? "bg-[var(--bg-card)] text-indigo-500 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t === "non-rejected" ? "Active" : t}
              </button>
            ))}
          </div>

          {isManager && (
            <button 
              onClick={() => { resetForm(); setShowModal(true); }}
              className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus size={14} strokeWidth={3} /> New Request
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      {loading && history.length === 0 ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden transition-colors">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                {isManager && <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/30">
              {filteredHistory.map((item) => (
                <tr key={item.budgetChangeRequestId} className="hover:bg-indigo-500/[0.02]">
                  <td className="px-5 py-2.5">
                    <p className="text-[12px] font-black text-[var(--text-main)] uppercase">{departments.find(d => (d.departmentId || d.id) === item.departmentId)?.departmentName || 'Dept'}</p>
                    <p className="text-[9px] font-bold text-slate-500 mt-1">{new Date(item.requestDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-5 py-2.5 font-black text-indigo-500 text-[12px]"><DollarSign size={12} className="inline"/>{item.requestedAmount?.toLocaleString()}</td>
                  <td className="px-5 py-2.5 text-center">
                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md border ${item.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : item.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{item.status}</span>
                  </td>
                  {isManager && (
                    <td className="px-5 py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        {item.status === "Pending" && (
                          <>
                            <button onClick={() => handleActionClick(item.budgetChangeRequestId, 'approve')} className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-md border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"><CheckCircle size={16}/></button>
                            <button onClick={() => handleActionClick(item.budgetChangeRequestId, 'reject')} className="p-1.5 bg-rose-500/10 text-rose-500 rounded-md border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"><XCircle size={16}/></button>
                          </>
                        )}
                        <button onClick={() => handleActionClick(item.budgetChangeRequestId, 'delete')} className="p-1.5 bg-[var(--bg-body)] text-slate-400 rounded-md border border-[var(--border-color)] hover:text-rose-500 transition-all"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🛑 THE CENTERED CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirm.open && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-[300px] p-6 text-center border border-slate-100">
               <AlertCircle size={32} className="mx-auto text-amber-500 mb-3" />
               <h3 className="text-xs font-black uppercase text-slate-800 mb-2">Are you sure?</h3>
               <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight mb-6">Confirming this action will update the budget registry.</p>
               <div className="flex gap-2">
                 <button onClick={() => setConfirm({ ...confirm, open: false })} className="flex-1 py-2 text-[9px] font-black uppercase text-slate-400 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">Cancel</button>
                 <button onClick={confirm.action} className="flex-1 py-2 text-[9px] font-black uppercase bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Yes, Confirm</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL (ORIGINAL DESIGN) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
               className="bg-[var(--bg-card)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)]"
               onClick={e => e.stopPropagation()}
            >
               <div className="px-5 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2"><History size={16}/> New Budget Request</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-500"><X size={18}/></button>
               </div>
               <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <select required className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl text-[10px] font-bold outline-none" value={selectedBranchId} onChange={(e) => { setSelectedBranchId(e.target.value); setFormData({...formData, departmentId: ""}); }}>
                    <option value="">Select Branch...</option>
                    {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <select required disabled={!selectedBranchId} className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl text-[10px] font-bold outline-none disabled:opacity-50" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                      <option value="">Select Dept</option>
                      {filteredDeptsForModal.map(d => <option key={d.departmentId || d.id} value={d.departmentId || d.id}>{d.departmentName}</option>)}
                    </select>
                    <InputField label="Amount ($)" value={formData.requestedAmount} onChange={e => setFormData({...formData, requestedAmount: e.target.value.replace(/[^0-9.]/g, '')})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Justification</label>
                    <textarea required rows="3" className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl text-[10px] font-bold outline-none resize-none" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                  </div>
                  <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border-color)]/30 mt-1">
                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
                    <button type="submit" className="px-6 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-xl shadow-md hover:bg-indigo-700 transition-all active:scale-95">Submit Request</button>
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
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    <input {...props} className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
  </div>
);