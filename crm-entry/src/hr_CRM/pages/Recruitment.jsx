import { useEffect, useState } from "react";
import { 
  Users, X, Search, Briefcase, Mail, Phone, 
  Building2, Calendar, Eye, Edit2, Trash2, Loader2, ChevronRight 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { getRecruitments, createRecruitment } from "../api/recruitment.api";
import { getDepartments } from "../api/hr.dept";
import hrApi from "../api/hr.api";

export default function Recruitment() {
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    candidateId: "", firstName: "", lastName: "", email: "",
    phone: "", appliedPosition: "", departmentId: "",
    status: "", source: "", applicationDate: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [recRes, deptRes] = await Promise.all([getRecruitments(), getDepartments()]);
      setData(recRes || []);
      setDepartments(deptRes || []);
    } catch { toast.error("Sync Error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm({
      candidateId: "", firstName: "", lastName: "", email: "",
      phone: "", appliedPosition: "", departmentId: "",
      status: "", source: "", applicationDate: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, departmentId: Number(form.departmentId) };
      if (isEdit) {
        await hrApi.put(`/api/Recruitment/${form.candidateId}`, payload);
        toast.success("Updated Successfully");
      } else {
        await createRecruitment({ ...payload, applicationDate: new Date().toISOString() });
        toast.success("Candidate Added");
      }
      setCreateOpen(false);
      loadData();
    } catch { toast.error("Request Failed"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-7xl mx-auto h-screen flex flex-col bg-white">
      <Toaster position="top-right" />

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight uppercase">
            <Users size={22} className="text-indigo-600" /> Recruitment
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Candidate Pipeline</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
            <input 
              type="text" placeholder="Search candidates..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl pl-9 py-2 w-56 outline-none focus:ring-2 focus:ring-indigo-50"
            />
          </div>
          <button 
            onClick={() => { resetForm(); setIsEdit(false); setCreateOpen(true); }}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            + Add Candidate
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
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Position</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.filter(r => `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())).map((r) => (
                  <tr key={r.candidateId} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3 text-[11px] font-bold text-slate-400">#{r.candidateId}</td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] font-black text-slate-700">{r.firstName} {r.lastName}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{r.source || 'Direct'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Briefcase size={12} className="text-indigo-400" />
                        <span className="text-[11px] font-bold text-slate-600">{r.appliedPosition}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-bold text-slate-600">{r.email}</p>
                      <p className="text-[10px] font-medium text-slate-400">{r.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-md border border-indigo-100">
                        {r.status || 'Applied'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelected(r)} className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 text-slate-400 hover:text-indigo-600 transition-all"><Eye size={14}/></button>
                        <button onClick={() => { setForm(r); setIsEdit(true); setCreateOpen(true); }} className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 text-slate-400 hover:text-blue-600 transition-all"><Edit2 size={14}/></button>
                        <button onClick={() => { if(window.confirm('Delete?')) hrApi.delete(`/api/Recruitment/${r.candidateId}`).then(() => loadData()) }} className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 text-slate-400 hover:text-red-600 transition-all"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW MODAL (FITTED) */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 p-6">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-50">
                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Candidate Dossier</h3>
                <button onClick={() => setSelected(null)} className="text-slate-300 hover:text-red-500"><X size={16}/></button>
              </div>
              <div className="grid grid-cols-4 gap-y-5 gap-x-2">
                <MiniInfo label="First Name" value={selected.firstName} icon={<Users size={10}/>}/>
                <MiniInfo label="Last Name" value={selected.lastName} icon={<Users size={10}/>}/>
                <MiniInfo label="Email" value={selected.email} icon={<Mail size={10}/>}/>
                <MiniInfo label="Phone" value={selected.phone} icon={<Phone size={10}/>}/>
                <MiniInfo label="Position" value={selected.appliedPosition} icon={<Briefcase size={10}/>}/>
                <MiniInfo label="Dept ID" value={selected.departmentId} icon={<Building2 size={10}/>}/>
                <MiniInfo label="Status" value={selected.status} icon={<Search size={10}/>}/>
                <MiniInfo label="Date" value={selected.applicationDate?.split('T')[0]} icon={<Calendar size={10}/>}/>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-50 flex justify-end">
                <button onClick={() => setSelected(null)} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL (3-COLUMN FITTED) */}
      <AnimatePresence>
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
               <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{isEdit ? "Update Candidate" : "Add Candidate"}</h3>
                  <button onClick={() => setCreateOpen(false)}><X size={18} className="text-slate-400"/></button>
               </div>
               <form onSubmit={handleSubmit} className="p-8 grid grid-cols-3 gap-x-5 gap-y-4">
                  <InputField label="First Name" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                  <InputField label="Last Name" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                  <InputField label="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  <InputField label="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  <InputField label="Position" value={form.appliedPosition} onChange={e => setForm({...form, appliedPosition: e.target.value})} />
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Department</label>
                    <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none" value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}>
                      <option value="">Select Dept</option>
                      {departments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                    </select>
                  </div>
                  <InputField label="Status" value={form.status} onChange={e => setForm({...form, status: e.target.value})} />
                  <InputField label="Source" value={form.source} onChange={e => setForm({...form, source: e.target.value})} />
                  <div className="col-span-3 pt-6 flex justify-end gap-3 border-t border-slate-50 mt-2">
                    <button type="button" onClick={() => setCreateOpen(false)} className="px-6 py-2 text-[10px] font-black uppercase text-slate-400">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-10 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg">
                       {submitting ? "Saving..." : "Save Entry"}
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
    <input {...props} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-1 focus:ring-indigo-300 transition-all" />
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