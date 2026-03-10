// THEME CHANGE 

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
      <div className="flex flex-col items-center justify-center h-[60vh] text-center transition-colors duration-300">
        <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 border border-[var(--border-color)]">
          <Lock size={40} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight">Access Restricted</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
          Permission 'BUDGET_VIEW' is required.
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
            <Wallet size={22} className="text-indigo-600" /> Dept Budgets
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Financial Allocations</p>
        </div>

        <div className="flex items-center gap-2">
          <select 
            className="text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            <option value="" className="bg-[var(--bg-card)]">Filter: All Branches</option>
            {branches.map(b => <option key={b.branchId} value={b.branchId} className="bg-[var(--bg-card)]">{b.branchName}</option>)}
          </select>

          {canCreate && (
            <button 
              onClick={() => { resetForm(); setCreateOpen(true); }}
              className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
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
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden overflow-x-auto transition-colors">
          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
            <thead>
              <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                <th className="w-[25%] px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                <th className="w-[30%] px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget Breakdown</th>
                <th className="w-[10%] px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Fiscal</th>
                <th className="w-[20%] px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Annual Total</th>
                <th className="w-[15%] px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/30">
              {filteredBudgets.map((b) => {
                const dept = allDepartments.find(d => d.departmentId === b.departmentId);
                const branch = branches.find(br => br.branchId === dept?.branchId);
                return (
                  <tr key={b.id} className="hover:bg-indigo-500/[0.02] transition-colors group">
                    <td className="px-5 py-4">
                      <p className="text-[12px] font-black text-[var(--text-main)] uppercase leading-none mb-1">{dept?.departmentName || 'Unknown Dept'}</p>
                      <div className="flex items-center gap-1">
                        <MapPin size={10} className="text-indigo-500 shrink-0"/>
                        <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{branch ? branch.branchName : 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col border-l-2 border-indigo-500/20 pl-3">
                          <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Training</span>
                          <span className="text-[12px] font-black text-[var(--text-main)] opacity-90">${b.trainingBudget?.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col border-l-2 border-[var(--border-color)] pl-3">
                          <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-tighter">Resources</span>
                          <span className="text-[12px] font-black text-[var(--text-main)] opacity-90">${b.resourceBudget?.toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-2.5 py-1 bg-[var(--bg-body)] text-[var(--text-main)] text-[10px] font-black border border-[var(--border-color)] rounded-md">{b.year}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-500/10 rounded-lg"><TrendingUp size={14} className="text-emerald-500"/></div>
                        <span className="text-[14px] font-black text-[var(--text-main)]">${b.totalAnnualBudget?.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleView(b)} className="p-2 bg-[var(--bg-body)] rounded-lg text-slate-400 hover:bg-indigo-500 hover:text-white transition-all border border-[var(--border-color)]"><Eye size={14}/></button>
                        {canDelete && (
                          <button onClick={() => handleDelete(b.id)} className="p-2 bg-[var(--bg-body)] rounded-lg text-slate-400 hover:bg-rose-600 hover:text-white transition-all border border-[var(--border-color)]"><Trash2 size={14}/></button>
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

      {/* VIEW MODAL */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} 
               className="bg-[var(--bg-card)] w-full max-w-md rounded-2xl p-6 border border-[var(--border-color)] shadow-2xl transition-colors"
               onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-[var(--border-color)]/30">
                 <h3 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">Budget Audit</h3>
                 <button onClick={() => setSelected(null)} className="p-1 hover:bg-[var(--bg-body)] rounded-full text-slate-400 transition-colors"><X size={18}/></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <MiniInfo label="Total" value={`$${selected.totalAnnualBudget?.toLocaleString()}`} icon={<CircleDollarSign size={12}/>}/>
                 <MiniInfo label="Fiscal" value={selected.year} icon={<Calendar size={12}/>}/>
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={() => setSelected(null)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {canCreate && createOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setCreateOpen(false)}>
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
                className="bg-[var(--bg-card)] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)] transition-colors duration-300"
                onClick={e => e.stopPropagation()}
             >
                <div className="px-6 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                   <h3 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">New Budget Allocation</h3>
                   <button onClick={() => setCreateOpen(false)} className="p-1 hover:bg-[var(--bg-card)] rounded-full text-slate-400 transition-colors"><X size={18}/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-3 gap-x-5 gap-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Branch</label>
                      <select className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold outline-none text-[var(--text-main)]" value={modalBranchId} onChange={e => {setModalBranchId(e.target.value); setForm({...form, departmentId: ""});}}>
                        <option value="" className="bg-[var(--bg-card)]">Select Branch</option>
                        {branches.map(b => <option key={b.branchId} value={b.branchId} className="bg-[var(--bg-card)]">{b.branchName}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                      <select required disabled={!modalBranchId || modalFilteredDepts.length === 0} className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold outline-none disabled:opacity-50 text-[var(--text-main)]" value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}>
                        <option value="" className="bg-[var(--bg-card)]">{!modalBranchId ? "Select Branch First" : modalFilteredDepts.length === 0 ? "No Depts" : "Pick Dept"}</option>
                        {modalFilteredDepts.map(d => <option key={d.departmentId} value={d.departmentId} className="bg-[var(--bg-card)]">{d.departmentName}</option>)}
                      </select>
                    </div>
                    <InputField label="Fiscal Year" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
                    <InputField label="Total Budget" value={form.totalAnnualBudget} onChange={e => setForm({...form, totalAnnualBudget: e.target.value})} />
                    <InputField label="Training" value={form.trainingBudget} onChange={e => setForm({...form, trainingBudget: e.target.value})} />
                    <InputField label="Resource" value={form.resourceBudget} onChange={e => setForm({...form, resourceBudget: e.target.value})} />
                    <div className="col-span-3 pt-4 flex justify-end gap-3 border-t border-[var(--border-color)]/30">
                      <button type="button" onClick={() => setCreateOpen(false)} className="px-6 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                      <button type="submit" disabled={submitting} className="px-8 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md hover:bg-indigo-700 transition-all active:scale-95">Confirm Budget</button>
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
    <input {...props} className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)] transition-all placeholder:text-slate-500" />
  </div>
);

const MiniInfo = ({ label, value, icon }) => (
  <div className="p-3 bg-[var(--bg-body)] border border-[var(--border-color)]/50 rounded-xl group hover:bg-[var(--bg-card)] hover:border-indigo-500/30 transition-all">
    <div className="flex items-center gap-1.5 text-indigo-500 mb-1">
      {icon}
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-[11px] font-black text-[var(--text-main)] truncate pl-0.5 opacity-90">{value || '—'}</p>
  </div>
);