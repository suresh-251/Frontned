import React, { useState, useEffect, useMemo } from "react";
import { 
  Wallet, X, Search, Building2, Plus, 
  Loader2, Eye, TrendingUp, CircleDollarSign, 
  MapPin, Calendar, Layers 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// API IMPORTS
import { createDepartmentBudget, getDepartmentBudgets } from "../../api/dept/deptBudget.api";
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

  const loadData = async () => {
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
    } catch {
      toast.error("Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm({
      departmentId: "", totalAnnualBudget: "",
      trainingBudget: "", resourceBudget: "", year: new Date().getFullYear(),
    });
    setModalBranchId("");
  };

  const modalFilteredDepts = useMemo(() => {
    if (!modalBranchId) return [];
    return allDepartments.filter(d => Number(d.branchId) === Number(modalBranchId));
  }, [modalBranchId, allDepartments]);

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

  return (
    <div className="max-w-7xl mx-auto h-screen flex flex-col bg-white font-sans">
      <Toaster position="top-right" />

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight uppercase">
            <Wallet size={22} className="text-indigo-600" /> Dept Budgets
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Financial Allocations</p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
            <input 
              type="text" placeholder="Search departments..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl pl-9 py-2 w-48 outline-none focus:ring-2 focus:ring-indigo-50"
            />
          </div>

          <button 
            onClick={() => { resetForm(); setCreateOpen(true); }}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            + New Allocation
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="flex-1 overflow-auto px-8 py-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : (
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Breakdown</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Year</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Budget</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBudgets.map((b) => {
                  const dept = allDepartments.find(d => d.departmentId === b.departmentId);
                  const branch = branches.find(br => br.branchId === dept?.branchId);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-black text-slate-700 uppercase">{dept?.departmentName || 'Unknown Dept'}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                           <MapPin size={10} className="text-slate-300"/>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">{branch?.branchName || 'HQ'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-4">
                          <div className="text-[10px]">
                            <span className="text-slate-400 font-bold uppercase mr-1">T:</span>
                            <span className="text-slate-600 font-black">${b.trainingBudget?.toLocaleString()}</span>
                          </div>
                          <div className="text-[10px]">
                            <span className="text-slate-400 font-bold uppercase mr-1">R:</span>
                            <span className="text-slate-600 font-black">${b.resourceBudget?.toLocaleString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-md border border-slate-200">
                          FY {b.year}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                           <TrendingUp size={12} className="text-emerald-500"/>
                           <span className="text-[12px] font-black text-slate-800">${b.totalAnnualBudget?.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelected(b)} className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 text-slate-400 hover:text-indigo-600 transition-all"><Eye size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-50">
                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Financial Audit</h3>
                <button onClick={() => setSelected(null)} className="text-slate-300 hover:text-red-500"><X size={16}/></button>
              </div>
              <div className="grid grid-cols-2 gap-y-5 gap-x-2">
                <MiniInfo label="Total Allocation" value={`$${selected.totalAnnualBudget?.toLocaleString()}`} icon={<CircleDollarSign size={10}/>}/>
                <MiniInfo label="Fiscal Year" value={selected.year} icon={<Calendar size={10}/>}/>
                <MiniInfo label="Training Budget" value={`$${selected.trainingBudget?.toLocaleString()}`} icon={<Layers size={10}/>}/>
                <MiniInfo label="Resource Budget" value={`$${selected.resourceBudget?.toLocaleString()}`} icon={<Building2 size={10}/>}/>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-50 flex justify-end">
                <button onClick={() => setSelected(null)} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Close Record</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALLOCATION MODAL */}
      <AnimatePresence>
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
               <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Budget Allocation Panel</h3>
                  <button onClick={() => setCreateOpen(false)}><X size={18} className="text-slate-400"/></button>
               </div>
               <form onSubmit={handleSubmit} className="p-8 grid grid-cols-3 gap-x-5 gap-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Branch Source</label>
                    <select 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none" 
                      value={modalBranchId} 
                      onChange={e => {
                        setModalBranchId(e.target.value);
                        setForm({...form, departmentId: ""});
                      }}
                    >
                      <option value="">Select Branch</option>
                      {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Target Department</label>
                    <select 
                      required
                      disabled={!modalBranchId}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none disabled:opacity-50" 
                      value={form.departmentId} 
                      onChange={e => setForm({...form, departmentId: e.target.value})}
                    >
                      <option value="">{modalBranchId ? "Pick Department" : "Waiting..."}</option>
                      {modalFilteredDepts.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                    </select>
                  </div>

                  {/* Year Input - Directly enterable text without arrows */}
                  <InputField label="Fiscal Year" type="text" value={form.year} onChange={e => setForm({...form, year: e.target.value.replace(/\D/g, '')})} placeholder="YYYY" />
                  
                  {/* Budget Inputs - Directly enterable text without arrows */}
                  <InputField label="Total Annual Budget ($)" type="text" value={form.totalAnnualBudget} onChange={e => setForm({...form, totalAnnualBudget: e.target.value.replace(/\D/g, '')})} placeholder="e.g. 50000" />
                  <InputField label="Training Budget ($)" type="text" value={form.trainingBudget} onChange={e => setForm({...form, trainingBudget: e.target.value.replace(/\D/g, '')})} placeholder="e.g. 5000" />
                  <InputField label="Resource Budget ($)" type="text" value={form.resourceBudget} onChange={e => setForm({...form, resourceBudget: e.target.value.replace(/\D/g, '')})} placeholder="e.g. 10000" />

                  <div className="col-span-3 pt-6 flex justify-end gap-3 border-t border-slate-50 mt-2">
                    <button type="button" onClick={() => setCreateOpen(false)} className="px-6 py-2 text-[10px] font-black uppercase text-slate-400">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-10 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg">
                        {submitting ? "Allocating..." : "Confirm Budget"}
                    </button>
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
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">{label}</label>
    <input {...props} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-1 focus:ring-indigo-300 transition-all appearance-none" />
  </div>
);

const MiniInfo = ({ label, value, icon }) => (
  <div className="overflow-hidden">
    <div className="flex items-center gap-1 text-indigo-500 mb-0.5">
      {icon}
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
    </div>
    <p className="text-[10px] font-bold text-slate-700 truncate pl-4">{value || '—'}</p>
  </div>
);