import React, { useEffect, useState, useMemo } from "react";
import { 
  Users, X, Search, Briefcase, Mail, Phone, 
  Building2, Calendar, Eye, Edit2, Trash2, Loader2, Plus, Lock, AlertTriangle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { getRecruitments, createRecruitment } from "../api/recruitment.api";
import { getDepartments } from "../api/hr.dept";
import hrApi from "../api/hr.api";
import { jwtDecode } from "jwt-decode";

export default function Recruitment() {
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- 🛑 CONFIRMATION STATE ---
  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null });

  const [form, setForm] = useState({
    candidateId: "", firstName: "", lastName: "", email: "",
    phone: "", appliedPosition: "", departmentId: "",
    status: "Applied", source: "", applicationDate: "",
  });

  // --- 🔐 SUPERLOGIC AUTH PARSING ---
  const token = localStorage.getItem("accessToken");
  const auth = useMemo(() => {
    if (!token) return { perms: [], isAdmin: false };
    try {
      const decoded = jwtDecode(token);
      const perms = decoded.perm || [];
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      // SUPERLOGIC Master Bypass
      const isAdmin = role === "ADMIN" || perms.includes("CRM_FULL_ACCESS");
      return { perms, isAdmin };
    } catch (e) { return { perms: [], isAdmin: false }; }
  }, [token]);

  const canView   = auth.isAdmin || auth.perms.includes("RECRUITMENT_VIEW");
  const canCreate = auth.isAdmin || auth.perms.includes("RECRUITMENT_CREATE");
  const canEdit   = auth.isAdmin || auth.perms.includes("RECRUITMENT_UPDATE");
  const canDelete = auth.isAdmin || auth.perms.includes("RECRUITMENT_DELETE");

  const loadData = async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const [recRes, deptRes] = await Promise.all([getRecruitments(), getDepartments()]);
      setData(recRes || []);
      setDepartments(deptRes || []);
    } catch { toast.error("Sync Error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [canView]);

  const resetForm = () => {
    setForm({ candidateId: "", firstName: "", lastName: "", email: "", phone: "", appliedPosition: "", departmentId: "", status: "Applied", source: "", applicationDate: "" });
  };

  const triggerConfirm = (title, message, action) => {
    setConfirm({ open: true, title, message, onConfirm: action });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = isEdit ? "Confirm Update" : "Confirm Entry";
    const msg = isEdit ? "Update candidate details?" : "Add this candidate to the pipeline?";
    
    triggerConfirm(title, msg, async () => {
      setSubmitting(true);
      const tid = toast.loading("Processing...");
      try {
        const payload = { ...form, departmentId: Number(form.departmentId) };
        if (isEdit) {
          await hrApi.put(`/api/Recruitment/${form.candidateId}`, payload);
          toast.success("Updated Successfully", { id: tid });
        } else {
          await createRecruitment({ ...payload, applicationDate: new Date().toISOString() });
          toast.success("Candidate Added", { id: tid });
        }
        setCreateOpen(false);
        loadData();
      } catch { toast.error("Request Failed", { id: tid }); }
      finally { setSubmitting(false); }
    });
  };

  const handleDelete = (id, name) => {
    triggerConfirm("Permanent Deletion", `Remove ${name} from recruitment?`, async () => {
      const tid = toast.loading("Deleting...");
      try {
        await hrApi.delete(`/api/Recruitment/${id}`);
        toast.success("Removed", { id: tid });
        loadData();
      } catch { toast.error("Failed", { id: tid }); }
    });
  };

  if (!canView) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
          <Users size={22} className="text-indigo-500" /> Recruitment
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg pl-9 pr-4 py-2 w-48 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
          </div>
          {canCreate && (
            <button onClick={() => { resetForm(); setIsEdit(false); setCreateOpen(true); }} className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-black uppercase flex items-center gap-2 active:scale-95 transition-all shadow-md">
              <Plus size={14} /> Add Candidate
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm transition-colors">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
              <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase w-20">ID</th>
              <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase w-auto">Candidate</th>
              <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase w-48">Position</th>
              <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase w-32 text-center">Status</th>
              <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]/30">
            {loading ? (
               <tr><td colSpan="5" className="py-20 text-center"><Loader2 className="animate-spin text-indigo-500 mx-auto" /></td></tr>
            ) : data.filter(r => `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())).map((r) => (
              <tr key={r.candidateId} className="hover:bg-indigo-500/[0.01] transition-colors group">
                <td className="px-5 py-3 text-[10px] font-bold text-slate-400">#{r.candidateId}</td>
                <td className="px-5 py-3">
                  <p className="text-[11px] font-black uppercase text-[var(--text-main)]">{r.firstName} {r.lastName}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase truncate">{r.email}</p>
                </td>
                <td className="px-5 py-3 flex items-center gap-2">
                  <Briefcase size={10} className="text-indigo-500" />
                  <span className="text-[10px] font-bold uppercase">{r.appliedPosition}</span>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className="px-2 py-0.5 bg-[var(--bg-body)] text-[8px] font-black uppercase rounded border border-[var(--border-color)]">{r.status || 'Applied'}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setSelected(r)} className="p-1.5 text-slate-400 border border-transparent hover:border-indigo-500/20 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-all"><Eye size={13}/></button>
                    {canEdit && <button onClick={() => { setForm(r); setIsEdit(true); setCreateOpen(true); }} className="p-1.5 text-slate-400 border border-transparent hover:border-indigo-500/20 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-all"><Edit2 size={13}/></button>}
                    {canDelete && <button onClick={() => handleDelete(r.candidateId, `${r.firstName} ${r.lastName}`)} className="p-1.5 text-slate-400 border border-transparent hover:border-rose-500/20 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all"><Trash2 size={13}/></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[var(--bg-card)] w-full max-w-lg rounded-2xl p-6 border border-[var(--border-color)] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border-color)]">
                  <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Candidate Info</h3>
                  <button onClick={() => setSelected(null)} className="text-slate-400"><X size={18}/></button>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <MiniInfo label="Full Name" value={`${selected.firstName} ${selected.lastName}`} icon={<Users size={12}/>}/>
                  <MiniInfo label="Position" value={selected.appliedPosition} icon={<Briefcase size={12}/>}/>
                  <MiniInfo label="Email" value={selected.email} icon={<Mail size={12}/>}/>
                  <MiniInfo label="Phone" value={selected.phone} icon={<Phone size={12}/>}/>
               </div>
               <button onClick={() => setSelected(null)} className="w-full mt-6 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase active:scale-95 transition-all">Close Dossier</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL - COMPACT */}
      <AnimatePresence>
        {createOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setCreateOpen(false)}>
             <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 15, opacity: 0 }} className="bg-[var(--bg-card)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
                <div className="px-5 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                   <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{isEdit ? "Edit Candidate" : "New Candidate"}</h3>
                   <button onClick={() => setCreateOpen(false)} className="text-slate-400"><X size={18}/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-3">
                   <div className="grid grid-cols-2 gap-3">
                      <InputField label="First Name" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                      <InputField label="Last Name" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                      <InputField label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                      <InputField label="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                      <InputField label="Applied Position" value={form.appliedPosition} onChange={e => setForm({...form, appliedPosition: e.target.value})} />
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Department</label>
                        <select required className="w-full px-2 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none" value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}>
                          <option value="">Select...</option>
                          {departments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                        </select>
                      </div>
                      <InputField label="Source" value={form.source} onChange={e => setForm({...form, source: e.target.value})} />
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Pipeline Status</label>
                        <select className="w-full px-2 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none uppercase" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                          <option value="Applied">Applied</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Interview">Interview</option>
                          <option value="Offered">Offered</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                   </div>
                   <button type="submit" disabled={submitting} className="w-full py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-md mt-2">Confirm Candidate</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION POPUP */}
      <AnimatePresence>
        {confirm.open && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-[280px] p-5 text-center">
               <AlertTriangle size={32} className="mx-auto text-amber-500 mb-2" />
               <h3 className="text-[11px] font-black uppercase text-slate-800 mb-1">{confirm.title}</h3>
               <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-5">{confirm.message}</p>
               <div className="flex gap-2">
                 <button onClick={() => setConfirm({ ...confirm, open: false })} className="flex-1 py-1.5 text-[9px] font-black uppercase text-slate-400 bg-slate-50 rounded-lg">Cancel</button>
                 <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, open: false }); }} className="flex-1 py-1.5 text-[9px] font-black uppercase bg-indigo-600 text-white rounded-lg shadow-md">Confirm</button>
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
    <label className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    <input {...props} className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[10px] font-bold outline-none text-[var(--text-main)]" />
  </div>
);

const MiniInfo = ({ label, value, icon }) => (
  <div className="p-3 bg-[var(--bg-body)] border border-[var(--border-color)]/50 rounded-xl flex items-center gap-3">
    <div className="text-indigo-500 p-2 bg-indigo-50 rounded-lg shrink-0">{icon}</div>
    <div className="overflow-hidden">
      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-[11px] font-black text-[var(--text-main)] truncate">{value || '—'}</p>
    </div>
  </div>
);