import { useEffect, useState } from "react";
import { 
  ShieldCheck, X, Search, Clock, Hash, 
  Building2, Edit2, Trash2, Loader2, Plus, 
  Settings2, Activity, Info
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
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
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
      setPolicies(polRes || []);
      setDepartments(deptRes || []);
    } catch {
      toast.error("Protocol Sync Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm({ departmentId: "", standardDailyHours: 8, maxWeeklyOvertimeHours: 20 });
    setIsEdit(false);
  };

  const getDeptName = (id) => {
    const dept = departments.find(d => d.departmentId === id);
    return dept ? dept.departmentName : `Dept #${id}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        // PUT requires standardDailyHours and maxWeeklyOvertimeHours
        await updateOvertimePolicy(selectedPolicy.id, {
          standardDailyHours: Number(form.standardDailyHours),
          maxWeeklyOvertimeHours: Number(form.maxWeeklyOvertimeHours)
        });
        toast.success("Policy Updated");
      } else {
        // POST requires departmentId as well
        await createOvertimePolicy({
          departmentId: Number(form.departmentId),
          standardDailyHours: Number(form.standardDailyHours),
          maxWeeklyOvertimeHours: Number(form.maxWeeklyOvertimeHours)
        });
        toast.success("New Policy Initialized");
      }
      setModalOpen(false);
      loadData();
    } catch {
      toast.error("Transmission Error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirm Permanent Deletion?")) return;
    try {
      await deleteOvertimePolicy(id);
      toast.success("Policy Purged");
      loadData();
    } catch {
      toast.error("Action Aborted");
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-screen flex flex-col bg-white font-sans">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight uppercase">
            <ShieldCheck size={22} className="text-indigo-600" /> OT Policies
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Standardization Framework</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
            <input 
              type="text" placeholder="Filter by Dept ID..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl pl-9 py-2 w-56 outline-none focus:ring-2 focus:ring-indigo-50"
            />
          </div>
          <button 
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            + Create Policy
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
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Policy ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Standard Day</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Weekly Cap</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Decisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {policies.filter(p => p.departmentId.toString().includes(searchTerm)).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-center">
                      <span className="text-[11px] font-bold text-slate-400">#{p.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                            <Building2 size={14} />
                         </div>
                         <p className="text-[12px] font-black text-slate-700 uppercase">{getDeptName(p.departmentId)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg">
                          <Clock size={12} className="text-indigo-500" />
                          <span className="text-[11px] font-black text-slate-700">{p.standardDailyHours}h</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-lg">
                          <Activity size={12} className="text-rose-500" />
                          <span className="text-[11px] font-black text-rose-700">{p.maxWeeklyOvertimeHours}h</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { 
                            setSelectedPolicy(p); 
                            setForm(p); 
                            setIsEdit(true); 
                            setModalOpen(true); 
                          }} 
                          className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 text-slate-400 hover:text-indigo-600 transition-all"
                        >
                          <Edit2 size={14}/>
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)} 
                          className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 text-slate-400 hover:text-red-600 transition-all"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL (3-COLUMN FITTED) */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
               <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                    {isEdit ? `Update Policy #${selectedPolicy.id}` : "Initialize New OT Policy"}
                  </h3>
                  <button onClick={() => setModalOpen(false)}><X size={18} className="text-slate-400"/></button>
               </div>
               <form onSubmit={handleSubmit} className="p-8 grid grid-cols-3 gap-x-6 gap-y-4">
                  {/* Department Field - Locked on Edit */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Department</label>
                    <select 
                      disabled={isEdit}
                      required
                      className={`w-full px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-bold outline-none ${isEdit ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`}
                      value={form.departmentId} 
                      onChange={e => setForm({...form, departmentId: e.target.value})}
                    >
                      <option value="">Select Target...</option>
                      {departments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                    </select>
                  </div>

                  <InputField 
                    label="Standard Daily Hours" 
                    type="number" 
                    value={form.standardDailyHours}
                    onChange={e => setForm({...form, standardDailyHours: e.target.value})} 
                  />

                  <InputField 
                    label="Max Weekly OT" 
                    type="number" 
                    value={form.maxWeeklyOvertimeHours}
                    onChange={e => setForm({...form, maxWeeklyOvertimeHours: e.target.value})} 
                  />

                  <div className="col-span-3 pt-6 flex justify-end gap-3 border-t border-slate-50 mt-2">
                    <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-2 text-[10px] font-black uppercase text-slate-400">Abort</button>
                    <button type="submit" disabled={submitting} className="px-10 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg">
                       {submitting ? "Processing..." : "Commit Policy"}
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

// SHARED MINI COMPONENTS
const InputField = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">{label}</label>
    <input 
      {...props} 
      required
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-1 focus:ring-indigo-300 transition-all" 
    />
  </div>
);