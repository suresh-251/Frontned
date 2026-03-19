import React, { useState, useEffect, useMemo } from "react";
import {
  Wallet, X, Search, Building2, Plus,
  Loader2, Eye, CircleDollarSign,
  MapPin, Calendar, Layers, Trash2, Lock, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// CONFIG & AUTH IMPORTS
import { hasPermission } from "../../configs/auth.utils";
import PermissionGate from "../../configs/Gaurd/PermissionsGate";

// API IMPORTS
import {
  createDepartmentBudget,
  getDepartmentBudgets,
  deleteDepartmentBudget,
} from "../../api/dept/deptBudget.api";
import { getDepartments } from "../../api/hr.dept";
import { getBranches } from "../../api/api.branch";

export default function DeptBudget() {
  const [budgets, setBudgets]             = useState([]);
  const [branches, setBranches]           = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [createOpen, setCreateOpen]       = useState(false);
  const [selected, setSelected]           = useState(null);
  const [submitting, setSubmitting]       = useState(false);
  const [searchTerm, setSearchTerm]       = useState("");

  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null });

  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [modalBranchId, setModalBranchId]         = useState("");

  const [form, setForm] = useState({
    departmentId: "", totalAnnualBudget: "",
    trainingBudget: "", resourceBudget: "", year: new Date().getFullYear(),
  });

  // PERMISSION FLAGS
  const canView   = hasPermission("BUDGET_VIEW");
  const canCreate = hasPermission("BUDGET_CREATE");
  const canDelete = hasPermission("BUDGET_DELETE");

  const loadData = async () => {
    if (!canView) { setLoading(false); return; }
    setLoading(true);
    try {
      const [budRes, deptRes, branchRes] = await Promise.all([
        getDepartmentBudgets(),
        getDepartments(),
        canCreate ? getBranches() : Promise.resolve([])
      ]);
      setBudgets(Array.isArray(budRes) ? budRes : budRes?.data || []);
      setAllDepartments(Array.isArray(deptRes) ? deptRes : deptRes?.data || []);
      setBranches(Array.isArray(branchRes) ? branchRes : branchRes?.data || []);
    } catch (err) {
      if (err?.response?.status !== 403) toast.error("Sync Error");
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [canView]);

  const triggerConfirm = (title, message, onConfirm) => {
    setConfirm({ open: true, title, message, onConfirm });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreate) return toast.error("Unauthorized");
    triggerConfirm("Confirm Allocation", "Allocate this budget profile?", async () => {
      setSubmitting(true);
      const tid = toast.loading("Allocating...");
      try {
        await createDepartmentBudget({
          departmentId:      Number(form.departmentId),
          totalAnnualBudget: Number(form.totalAnnualBudget),
          trainingBudget:    Number(form.trainingBudget),
          resourceBudget:    Number(form.resourceBudget),
          year:              Number(form.year)
        });
        toast.success("Budget Allocated", { id: tid });
        setCreateOpen(false);
        resetForm();
        loadData();
      } catch { toast.error("Allocation Failed", { id: tid }); }
      finally { setSubmitting(false); }
    });
  };

  const handleDelete = async (id) => {
    if (!canDelete) return toast.error("Unauthorized");
    triggerConfirm("Delete Allocation", "Permanent removal of budget data?", async () => {
      const tid = toast.loading("Removing...");
      try {
        await deleteDepartmentBudget(id);
        toast.success("Removed", { id: tid });
        loadData();
      } catch { toast.error("Failed", { id: tid }); }
    });
  };

  const handleView = (budget) => {
    const dept   = allDepartments.find(d => d.departmentId === budget.departmentId);
    const branch = branches.find(br => br.branchId === dept?.branchId);
    setSelected({ ...budget, deptName: dept?.departmentName, branchName: branch?.branchName, branchLoc: branch?.location });
  };

  const resetForm = () => {
    setForm({ departmentId: "", totalAnnualBudget: "", trainingBudget: "", resourceBudget: "", year: new Date().getFullYear() });
    setModalBranchId("");
  };

  const modalFilteredDepts = useMemo(() => {
    if (!modalBranchId) return [];
    return allDepartments
      .filter(d => Number(d.branchId) === Number(modalBranchId))
      .filter(d => !budgets.some(b => b.departmentId === (d.departmentId || d.id)));
  }, [modalBranchId, allDepartments, budgets]);

  const filteredBudgets = budgets.filter(b => {
    const dept = allDepartments.find(d => d.departmentId === b.departmentId);
    const matchesBranch = !selectedBranchId || Number(dept?.branchId) === Number(selectedBranchId);
    const matchesSearch = !searchTerm || dept?.departmentName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  // PAGE GUARD
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center transition-colors duration-300">
        <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 border border-[var(--border-color)] shadow-sm">
          <Lock size={40} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight leading-none">Access Restricted</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">Budget clearance required</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-extrabold flex items-center gap-2">
          <Wallet size={22} className="text-indigo-600" /> Dept Budgets
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text" placeholder="Search..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="text-[10px] font-bold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg pl-8 pr-3 py-2 w-40 outline-none"
            />
          </div>
          <select
            className="text-[10px] font-bold bg-[var(--bg-card)] border border-[var(--border-color)] p-2 rounded-lg outline-none"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName} ({b.location})</option>)}
          </select>
          <PermissionGate permission="BUDGET_CREATE">
            <button
              onClick={() => { resetForm(); setCreateOpen(true); }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 active:scale-95 transition-all"
            >
              <Plus size={14} /> New Allocation
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
              <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase w-[25%] tracking-widest">Department</th>
              <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase w-[30%] tracking-widest">Breakdown</th>
              <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase w-[25%] tracking-widest">Annual Total</th>
              <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase w-[20%] text-right tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]/30">
            {loading ? (
              <tr><td colSpan="4" className="py-20 text-center"><Loader2 className="animate-spin text-indigo-500 mx-auto" /></td></tr>
            ) : filteredBudgets.length === 0 ? (
              <tr><td colSpan="4" className="py-16 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">No budgets found</td></tr>
            ) : filteredBudgets.map((b) => {
              const dept = allDepartments.find(d => d.departmentId === b.departmentId);
              return (
                <tr key={b.id} className="hover:bg-indigo-500/[0.02]">
                  <td className="px-5 py-4">
                    <p className="text-[11px] font-black uppercase leading-none">{dept?.departmentName || "Dept"}</p>
                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{b.year} Fiscal</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col"><span className="text-[7px] font-black text-slate-400 uppercase">Training</span><span className="text-[10px] font-bold">${b.trainingBudget?.toLocaleString()}</span></div>
                      <div className="flex flex-col"><span className="text-[7px] font-black text-slate-400 uppercase">Resource</span><span className="text-[10px] font-bold">${b.resourceBudget?.toLocaleString()}</span></div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-black text-indigo-600 text-[13px]">${b.totalAnnualBudget?.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleView(b)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-all"><Eye size={14} /></button>
                      {canDelete && (
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[var(--bg-card)] w-full max-w-[340px] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-3 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                <h3 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Audit Summary</h3>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-rose-500"><X size={16} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex flex-col">
                  <p className="text-[12px] font-black uppercase text-[var(--text-main)] leading-none">{selected.deptName}</p>
                  <div className="flex items-center gap-1 mt-1 opacity-70">
                    <MapPin size={10} className="text-indigo-500" />
                    <p className="text-[8px] font-bold text-slate-500 uppercase truncate">{selected.branchName} — {selected.branchLoc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MiniInfo label="Fiscal"    value={selected.year}                                    icon={<Calendar size={10} />} />
                  <MiniInfo label="Total"     value={`$${selected.totalAnnualBudget?.toLocaleString()}`} icon={<CircleDollarSign size={10} />} />
                  <MiniInfo label="Training"  value={`$${selected.trainingBudget?.toLocaleString()}`}   icon={<Layers size={10} />} />
                  <MiniInfo label="Resource"  value={`$${selected.resourceBudget?.toLocaleString()}`}   icon={<Building2 size={10} />} />
                </div>
                <button onClick={() => setSelected(null)} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95">Close Entry</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {createOpen && canCreate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setCreateOpen(false)}>
            <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 15, opacity: 0 }} className="bg-[var(--bg-card)] w-full max-w-[380px] rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-3 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                <h3 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Allocate Budget</h3>
                <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-rose-500"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Branch & Location</label>
                  <select required className="w-full px-2.5 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none" value={modalBranchId} onChange={e => { setModalBranchId(e.target.value); setForm({ ...form, departmentId: "" }); }}>
                    <option value="">Select Branch...</option>
                    {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName} — {b.location}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Department</label>
                    <select required disabled={!modalBranchId} className="w-full px-2.5 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none disabled:opacity-40" value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                      <option value="">Select Dept...</option>
                      {modalFilteredDepts.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                    </select>
                  </div>
                  <InputField label="Fiscal Year"   type="number" value={form.year}              onChange={e => setForm({ ...form, year: e.target.value })} />
                  <InputField label="Annual Total"  type="number" value={form.totalAnnualBudget} onChange={e => setForm({ ...form, totalAnnualBudget: e.target.value })} />
                  <InputField label="Training Cap"  type="number" value={form.trainingBudget}    onChange={e => setForm({ ...form, trainingBudget: e.target.value })} />
                  <InputField label="Resource Cap"  type="number" value={form.resourceBudget}    onChange={e => setForm({ ...form, resourceBudget: e.target.value })} />
                </div>
                <button type="submit" disabled={submitting} className="w-full py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md disabled:opacity-50">Confirm Allocation</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirm.open && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-[280px] p-5 text-center">
              <AlertCircle size={28} className="mx-auto text-amber-500 mb-2" />
              <h3 className="text-[11px] font-black uppercase text-slate-800 mb-1">{confirm.title}</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-5">{confirm.message}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirm({ ...confirm, open: false })} className="flex-1 py-1.5 text-[9px] font-black uppercase text-slate-400 bg-slate-50 rounded-lg">No</button>
                <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, open: false }); }} className="flex-1 py-1.5 text-[9px] font-black uppercase bg-indigo-600 text-white rounded-lg shadow-md">Yes</button>
              </div>
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
    <input {...props} className="w-full px-2.5 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none" />
  </div>
);

const MiniInfo = ({ label, value, icon }) => (
  <div className="p-2.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl flex items-center gap-2">
    <div className="text-indigo-500 shrink-0">{icon}</div>
    <div className="overflow-hidden text-left">
      <p className="text-[6px] font-black text-slate-400 uppercase leading-none mb-1 tracking-wider">{label}</p>
      <p className="text-[10px] font-black text-[var(--text-main)] truncate">{value || "—"}</p>
    </div>
  </div>
);
