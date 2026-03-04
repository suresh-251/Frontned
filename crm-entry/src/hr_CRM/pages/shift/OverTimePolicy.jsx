import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, X, Search, Clock, Building2, 
  Edit2, Trash2, Loader2, Plus, Activity, 
  Settings, ChevronRight, Hash, Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// API IMPORTS
import { 
  getOvertimePolicies, 
  createOvertimePolicy, 
  updateOvertimePolicy, 
  deleteOvertimePolicy 
} from "../../api/overtimePolicy.api";
import { getDepartments } from "../../api/hr.dept";

export default function OvertimePolicy() {
  const [policies, setPolicies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    departmentId: "",
    standardDailyHours: 8,
    maxWeeklyOvertimeHours: 20
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [polRes, deptRes] = await Promise.all([
        getOvertimePolicies(),
        getDepartments()
      ]);
      setPolicies(Array.isArray(polRes) ? polRes : polRes?.data || []);
      setDepartments(Array.isArray(deptRes) ? deptRes : deptRes?.data || []);
    } catch (err) {
      toast.error("System sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getDeptName = (id) => {
    const dept = departments.find(d => (d.departmentId || d.id) === id);
    return dept ? dept.departmentName : `Dept #${id}`;
  };

  const handleEdit = (p) => {
    setSelectedPolicy(p);
    setForm({
      departmentId: p.departmentId,
      standardDailyHours: p.standardDailyHours,
      maxWeeklyOvertimeHours: p.maxWeeklyOvertimeHours
    });
    setIsEdit(true);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const tid = toast.loading("Syncing...");
    try {
      if (isEdit) {
        await updateOvertimePolicy(selectedPolicy.id || selectedPolicy.overtimePolicyId, {
          standardDailyHours: Number(form.standardDailyHours),
          maxWeeklyOvertimeHours: Number(form.maxWeeklyOvertimeHours)
        });
      } else {
        await createOvertimePolicy({ ...form, departmentId: Number(form.departmentId) });
      }
      toast.success("Governance Updated", { id: tid });
      setModalOpen(false);
      loadData();
    } catch (err) {
      toast.error("Transmission Failed", { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full h-screen bg-[#F1F5F9] flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Toaster position="top-right" />

      {/* TOPBAR DESIGN */}
      <div className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-600 leading-none">Management</span>
            <span className="text-[13px] font-black uppercase tracking-tighter text-slate-800">OT Protocols</span>
          </div>
          <div className="h-6 w-[1.5px] bg-slate-100 mx-2" />
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={13} />
            <input 
              type="text" placeholder="Search departments..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-100 border border-transparent rounded-full py-1.5 pl-9 pr-4 text-[11px] w-64 outline-none focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* PERMANENT INDIGO BUTTON */}
        <button 
          onClick={() => { setForm({ departmentId: "", standardDailyHours: 8, maxWeeklyOvertimeHours: 20 }); setIsEdit(false); setModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus size={14} strokeWidth={3} /> Create Protocol
        </button>
      </div>

      {/* DATA GRID */}
      <div className="flex-1 overflow-auto p-6 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {policies
              .filter(p => getDeptName(p.departmentId).toLowerCase().includes(searchTerm.toLowerCase()))
              .map((p) => (
              <motion.div 
                layout
                key={p.id || p.overtimePolicyId}
                className="bg-white border border-slate-200/60 rounded-xl p-4 hover:border-indigo-300 hover:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-tight text-slate-700 leading-tight">
                        {getDeptName(p.departmentId)}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Hash size={8} className="text-slate-300" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">UID-{p.id || p.overtimePolicyId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <button onClick={() => handleEdit(p)} className="p-1.5 hover:bg-indigo-50 rounded-md text-slate-300 hover:text-indigo-600 transition-colors"><Edit2 size={13}/></button>
                    <button onClick={() => deleteOvertimePolicy(p.id || p.overtimePolicyId).then(() => loadData())} className="p-1.5 hover:bg-rose-50 rounded-md text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={13}/></button>
                  </div>
                </div>

                {/* COLORED DATA BOXES */}
                <div className="flex gap-2">
                  <div className="flex-1 bg-emerald-50/50 rounded-lg border border-emerald-100/50 p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={11} className="text-emerald-500" />
                      <span className="text-[8px] font-black text-emerald-600/70 uppercase tracking-widest">Base Day</span>
                    </div>
                    <span className="text-xs font-black text-slate-800">{p.standardDailyHours} <span className="text-[9px] text-slate-400">HRS</span></span>
                  </div>
                  <div className="flex-1 bg-indigo-50/50 rounded-lg border border-indigo-100/50 p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity size={11} className="text-indigo-500" />
                      <span className="text-[8px] font-black text-indigo-600/70 uppercase tracking-widest">Weekly Cap</span>
                    </div>
                    <span className="text-xs font-black text-slate-800">{p.maxWeeklyOvertimeHours} <span className="text-[9px] text-slate-400">HRS</span></span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              className="bg-white w-full max-w-sm rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-200 overflow-hidden"
            >
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Settings size={14} className="text-indigo-600" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">
                      Protocol Config
                    </h3>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={18}/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Target Department</label>
                    <div className="relative">
                       <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                       <select 
                        disabled={isEdit} required
                        className="w-full bg-slate-100 border-2 border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-black uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                        value={form.departmentId} 
                        onChange={e => setForm({...form, departmentId: e.target.value})}
                      >
                        <option value="">Search scope...</option>
                        {departments.map(d => (
                          <option key={d.departmentId || d.id} value={d.departmentId || d.id}>{d.departmentName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Standard Day</label>
                      <input 
                        type="number" required
                        className="w-full bg-slate-100 border-2 border-transparent rounded-xl py-2.5 px-4 text-[11px] font-black outline-none focus:bg-white focus:border-indigo-500 transition-all"
                        value={form.standardDailyHours}
                        onChange={e => setForm({...form, standardDailyHours: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Weekly Limit</label>
                      <input 
                        type="number" required
                        className="w-full bg-slate-100 border-2 border-transparent rounded-xl py-2.5 px-4 text-[11px] font-black outline-none focus:bg-white focus:border-indigo-500 transition-all"
                        value={form.maxWeeklyOvertimeHours}
                        onChange={e => setForm({...form, maxWeeklyOvertimeHours: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col gap-2">
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {submitting ? 'Transmitting...' : isEdit ? 'Update Framework' : 'Commit Protocol'}
                    </button>
                    <button type="button" onClick={() => setModalOpen(false)} className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Discard Changes</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}