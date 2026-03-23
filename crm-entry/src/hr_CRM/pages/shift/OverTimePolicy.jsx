import React, { useEffect, useState } from "react";
import {
  ShieldCheck, Search, Clock, Building2,
  Activity, Hash, Loader2, Lock, Plus
} from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// CONFIG & AUTH IMPORTS
import { hasPermission } from "../../configs/auth.utils";
import PermissionGate from "../../configs/Gaurd/PermissionsGate";

// API IMPORTS
import { getOvertimePolicies, createOvertimePolicy } from "../../api/overtimePolicy.api";
import { getDepartments } from "../../api/hr.dept";

export default function OvertimePolicy() {
  const [policies, setPolicies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [formData, setFormData] = useState({
    departmentId: "",
    standardDailyHours: "",
    maxWeeklyOvertimeHours: "",
  });

  // PERMISSION FLAGS
  const canView   = hasPermission("OVERTIME_POLICY_VIEW");
  const canCreate = hasPermission("OVERTIME_POLICY_CREATE");

  const loadData = async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        getOvertimePolicies(),
        canCreate ? getDepartments() : Promise.resolve([])
      ]);
      setPolicies(Array.isArray(pRes) ? pRes : pRes?.data || []);
      setDepartments(dRes || []);
    } catch (err) {
      if (err.response?.status !== 403) toast.error("Failed to load overtime policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [canView]);

  const getDeptName = (deptId) => {
    const found = departments.find(d => Number(d.departmentId) === Number(deptId));
    return found ? found.departmentName : `Dept #${deptId}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreate) return toast.error("Unauthorized");
    const tid = toast.loading("Creating policy...");
    try {
      await createOvertimePolicy(formData);
      toast.success("Policy created", { id: tid });
      setFormData({ departmentId: "", standardDailyHours: "", maxWeeklyOvertimeHours: "" });
      loadData();
    } catch (err) {
      toast.error("Failed", { id: tid });
    }
  };

  // PAGE GUARD
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[520px] w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
        <Lock size={40} className="text-slate-400 mb-4" />
        <h2 className="text-lg font-black text-[var(--text-main)] uppercase">Access Restricted</h2>
      </div>
    );
  }

  const filteredPolicies = policies.filter(p =>
    getDeptName(p.departmentId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[520px] w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm font-sans text-[var(--text-main)]">
      <Toaster position="top-right" />

      {/* LEFT SIDEBAR — only visible with OVERTIME_POLICY_CREATE */}
      <PermissionGate permission="OVERTIME_POLICY_CREATE">
        <div className="w-72 border-r border-[var(--border-color)] flex flex-col shrink-0 bg-[var(--bg-card)]">
          <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-body)]/50 flex items-center">
            <h2 className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2">
              <Plus size={14} /> New Policy
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                required
                className="w-full text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg outline-none text-[var(--text-main)] uppercase"
              >
                <option value="">Department</option>
                {departments.map(d => (
                  <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>
                ))}
              </select>
              <input
                type="number"
                name="standardDailyHours"
                value={formData.standardDailyHours}
                onChange={handleChange}
                placeholder="STANDARD DAILY HOURS"
                className="w-full text-[10px] font-black uppercase bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg outline-none"
                required
              />
              <input
                type="number"
                name="maxWeeklyOvertimeHours"
                value={formData.maxWeeklyOvertimeHours}
                onChange={handleChange}
                placeholder="MAX WEEKLY OT HOURS"
                className="w-full text-[10px] font-black uppercase bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg outline-none"
                required
              />
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 transition active:scale-95"
              >
                Submit Policy
              </button>
            </form>
          </div>
        </div>
      </PermissionGate>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-card)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500"><ShieldCheck size={16} /></div>
            <h2 className="text-xs font-black uppercase tracking-tight">OT Protocols</h2>
          </div>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input
              type="text"
              placeholder="Search departments..."
              className="w-full text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg pl-8 py-1 outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-500" />
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">No policies found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPolicies.map((p) => {
                const isSelected = selectedId === p.overtimePolicyId;
                return (
                  <motion.div
                    layout
                    key={p.overtimePolicyId}
                    onClick={() => setSelectedId(p.overtimePolicyId)}
                    className={`bg-[var(--bg-card)] border rounded-xl p-3 transition-all relative overflow-hidden shadow-sm hover:shadow-md cursor-pointer ${
                      isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/10' : 'border-[var(--border-color)]'
                    }`}
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${isSelected ? 'bg-indigo-600' : 'bg-indigo-500'}`} />

                    <div className="flex justify-between items-start mb-3 pl-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                          isSelected
                          ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                          : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                        }`}>
                          <Building2 size={14} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-tight text-[var(--text-main)] leading-tight">
                            {getDeptName(p.departmentId)}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5 opacity-70">
                            <Hash size={8} className="text-slate-400" />
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              UID-{p.overtimePolicyId}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pl-1">
                      <div className="flex-1 bg-emerald-500/5 rounded-lg border border-emerald-500/20 p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock size={11} className="text-emerald-500" />
                          <span className="text-[8px] font-black text-emerald-500/70 uppercase tracking-widest leading-none">Base Day</span>
                        </div>
                        <span className="text-xs font-black text-[var(--text-main)]">
                          {p.standardDailyHours}<span className="text-[9px] text-slate-500"> HRS</span>
                        </span>
                      </div>
                      <div className="flex-1 bg-indigo-500/5 rounded-lg border border-indigo-500/20 p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity size={11} className="text-indigo-500" />
                          <span className="text-[8px] font-black text-indigo-500/70 uppercase tracking-widest leading-none">Weekly Cap</span>
                        </div>
                        <span className="text-xs font-black text-[var(--text-main)]">
                          {p.maxWeeklyOvertimeHours}<span className="text-[9px] text-slate-500"> HRS</span>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
