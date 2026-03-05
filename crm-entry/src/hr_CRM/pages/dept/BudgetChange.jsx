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
  DollarSign, Search, Trash2, Building2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function BudgetChange() {
  const [history, setHistory] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [branches, setBranches] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("non-rejected");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Selection States for Cascading Dropdown
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [formData, setFormData] = useState({ 
    departmentId: "", requestedAmount: "", reason: "" 
  });

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

  // Filter departments based on selected branch and if they have an existing budget
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestBudgetChange({
        departmentId: parseInt(formData.departmentId),
        requestedAmount: parseFloat(formData.requestedAmount),
        reason: formData.reason
      });
      toast.success("Request Submitted");
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) { 
      toast.error("Submission Failed"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleAction = async (id, actionType) => {
    const tid = toast.loading("Updating...");
    try {
      if (actionType === 'approve') await approveBudgetChange(id);
      else if (actionType === 'reject') await rejectBudgetChange(id);
      else if (actionType === 'delete') {
        if (!window.confirm("Permanent delete?")) return toast.dismiss(tid);
        await deleteBudgetChange(id);
      }
      toast.success("Registry Updated", { id: tid });
      fetchData();
    } catch (err) { 
      toast.error("Action Failed", { id: tid }); 
    }
  };

  const resetForm = () => {
    setFormData({ departmentId: "", requestedAmount: "", reason: "" });
    setSelectedBranchId("");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <History size={22} className="text-indigo-600" /> Budget Registry
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Financial adjustments</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" placeholder="Search..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-48 outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {["non-rejected", "rejected"].map((t) => (
              <button
                key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${
                  filter === t ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t === "non-rejected" ? "Active" : t}
              </button>
            ))}
          </div>

          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus size={14} strokeWidth={3} /> New Request
          </button>
        </div>
      </div>

      {/* TABLE */}
      {loading && history.length === 0 ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Department</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Justification</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.map((item) => {
                const dept = departments.find(d => (d.departmentId || d.id) === item.departmentId);
                const branch = branches.find(b => b.branchId === dept?.branchId);
                
                return (
                  <tr key={item.budgetChangeRequestId} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-2.5">
                      <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-0.5">{dept?.departmentName || 'Dept'}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">{branch ? `${branch.branchName} - ${branch.location}` : 'HQ'}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1">{new Date(item.requestDate).toLocaleDateString()}</p>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-0.5 text-indigo-600 font-black text-[12px]">
                        <DollarSign size={12} />
                        {item.requestedAmount?.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <p className="text-[11px] font-medium text-slate-600 truncate max-w-[250px]">{item.reason}</p>
                    </td>
                    <td className="px-5 py-2.5 text-center">
                      <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md border ${
                        item.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        item.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        {item.status === "Pending" && (
                          <>
                            <button onClick={() => handleAction(item.budgetChangeRequestId, 'approve')} title="Approve" className="p-1.5 bg-emerald-50 rounded-md text-emerald-600 hover:bg-emerald-100 transition-colors"><CheckCircle size={16}/></button>
                            <button onClick={() => handleAction(item.budgetChangeRequestId, 'reject')} title="Reject" className="p-1.5 bg-rose-50 rounded-md text-rose-600 hover:bg-rose-100 transition-colors"><XCircle size={16}/></button>
                          </>
                        )}
                        <button onClick={() => handleAction(item.budgetChangeRequestId, 'delete')} title="Delete" className="p-1.5 bg-slate-50 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
               <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-indigo-600" />
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">New Budget Request</h3>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  {/* CASCADING SELECT 1: BRANCH */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest flex items-center gap-1">
                      <Building2 size={10}/> Select Branch
                    </label>
                    <select 
                      required
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 transition-all"
                      value={selectedBranchId}
                      onChange={(e) => {
                        setSelectedBranchId(e.target.value);
                        setFormData({...formData, departmentId: ""});
                      }}
                    >
                      <option value="">Choose Branch...</option>
                      {branches.map(b => (
                        <option key={b.branchId} value={b.branchId}>{b.branchName} ({b.location})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* CASCADING SELECT 2: DEPARTMENT */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Department</label>
                      <select 
                        required 
                        disabled={!selectedBranchId}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 transition-all disabled:opacity-50" 
                        value={formData.departmentId} 
                        onChange={e => {
                          const val = e.target.value;
                          const existingBudget = budgets.find(b => b.departmentId == val);
                          setFormData({
                            ...formData, 
                            departmentId: val, 
                            requestedAmount: existingBudget ? existingBudget.totalAnnualBudget.toString() : ""
                          });
                        }}
                      >
                        <option value="">
                          {!selectedBranchId ? "Select Branch First" : "Select Dept"}
                        </option>
                        {filteredDeptsForModal.map(d => (
                          <option key={d.departmentId || d.id} value={d.departmentId || d.id}>
                            {d.departmentName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <InputField 
                      label="Amount ($)" 
                      value={formData.requestedAmount} 
                      onChange={e => setFormData({...formData, requestedAmount: e.target.value.replace(/[^0-9.]/g, '')})} 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Justification</label>
                    <textarea 
                      required rows="3" 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 resize-none transition-all" 
                      value={formData.reason} 
                      onChange={e => setFormData({...formData, reason: e.target.value})} 
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-slate-50 mt-1">
                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-1.5 text-[9px] font-black uppercase text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
                    <button type="submit" className="px-6 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-xl shadow-md hover:bg-indigo-700 transition-all">Submit Request</button>
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
    <input {...props} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 transition-all" />
  </div>
);