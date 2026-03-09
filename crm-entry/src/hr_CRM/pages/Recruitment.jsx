// import { useEffect, useState } from "react";
// import { 
//   Users, X, Search, Briefcase, Mail, Phone, 
//   Building2, Calendar, Eye, Edit2, Trash2, Loader2, ChevronRight, Plus
// } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";
// import { getRecruitments, createRecruitment } from "../api/recruitment.api";
// import { getDepartments } from "../api/hr.dept";
// import hrApi from "../api/hr.api";

// export default function Recruitment() {
//   const [data, setData] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [createOpen, setCreateOpen] = useState(false);
//   const [selected, setSelected] = useState(null);
//   const [isEdit, setIsEdit] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");

//   const [form, setForm] = useState({
//     candidateId: "", firstName: "", lastName: "", email: "",
//     phone: "", appliedPosition: "", departmentId: "",
//     status: "", source: "", applicationDate: "",
//   });

//   const loadData = async () => {
//     setLoading(true);
//     try {
//       const [recRes, deptRes] = await Promise.all([getRecruitments(), getDepartments()]);
//       setData(recRes || []);
//       setDepartments(deptRes || []);
//     } catch { toast.error("Sync Error"); }
//     finally { setLoading(false); }
//   };

//   useEffect(() => { loadData(); }, []);

//   const resetForm = () => {
//     setForm({
//       candidateId: "", firstName: "", lastName: "", email: "",
//       phone: "", appliedPosition: "", departmentId: "",
//       status: "", source: "", applicationDate: "",
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setSubmitting(true);
//     try {
//       const payload = { ...form, departmentId: Number(form.departmentId) };
//       if (isEdit) {
//         await hrApi.put(`/api/Recruitment/${form.candidateId}`, payload);
//         toast.success("Updated Successfully");
//       } else {
//         await createRecruitment({ ...payload, applicationDate: new Date().toISOString() });
//         toast.success("Candidate Added");
//       }
//       setCreateOpen(false);
//       loadData();
//     } catch { toast.error("Request Failed"); }
//     finally { setSubmitting(false); }
//   };

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
//       <Toaster position="top-right" />

//       {/* COMPACT HEADER (toplook standard) */}
//       <div className="flex items-center justify-between px-1">
//         <div>
//           <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
//             <Users size={22} className="text-indigo-600" /> Recruitment
//           </h2>
//           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Candidate Pipeline</p>
//         </div>

//         <div className="flex items-center gap-2">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
//             <input 
//               type="text" placeholder="Search candidates..." value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-56 outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
//             />
//           </div>
//           <button 
//             onClick={() => { resetForm(); setIsEdit(false); setCreateOpen(true); }}
//             className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
//           >
//             <Plus size={14} strokeWidth={3} /> Add Candidate
//           </button>
//         </div>
//       </div>

//       {/* TABLE SECTION */}
//       {loading ? (
//         <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
//       ) : (
//         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//           <table className="w-full text-left border-collapse">
//             <thead>
//               <tr className="bg-slate-50 border-b border-slate-200">
//                 <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID</th>
//                 <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Candidate</th>
//                 <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Position</th>
//                 <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact</th>
//                 <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
//                 <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100">
//               {data.filter(r => `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())).map((r) => (
//                 <tr key={r.candidateId} className="hover:bg-slate-50/50 transition-colors group">
//                   <td className="px-5 py-2.5 text-[11px] font-bold text-slate-400">#{r.candidateId}</td>
//                   <td className="px-5 py-2.5">
//                     <p className="text-[12px] font-black text-slate-700">{r.firstName} {r.lastName}</p>
//                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{r.source || 'Direct'}</p>
//                   </td>
//                   <td className="px-5 py-2.5">
//                     <div className="flex items-center gap-2">
//                       <Briefcase size={12} className="text-indigo-400" />
//                       <span className="text-[11px] font-bold text-slate-600">{r.appliedPosition}</span>
//                     </div>
//                   </td>
//                   <td className="px-5 py-2.5">
//                     <p className="text-[11px] font-bold text-slate-600">{r.email}</p>
//                     <p className="text-[10px] font-medium text-slate-400">{r.phone}</p>
//                   </td>
//                   <td className="px-5 py-2.5">
//                     <span className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[9px] font-black uppercase rounded-md border border-slate-200">
//                       {r.status || 'Applied'}
//                     </span>
//                   </td>
//                   <td className="px-5 py-2.5 text-right">
//                     {/* Buttons always visible (hover completely removed) */}
//                     <div className="flex justify-end gap-1.5">
//                       <button 
//                         onClick={() => setSelected(r)} 
//                         className="p-1.5 bg-slate-50 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
//                       >
//                         <Eye size={13}/>
//                       </button>
//                       <button 
//                         onClick={() => { setForm(r); setIsEdit(true); setCreateOpen(true); }} 
//                         className="p-1.5 bg-indigo-50 rounded-md text-indigo-600 hover:bg-indigo-100 transition-colors"
//                       >
//                         <Edit2 size={13}/>
//                       </button>
//                       <button 
//                         onClick={() => { if(window.confirm('Delete?')) hrApi.delete(`/api/Recruitment/${r.candidateId}`).then(() => loadData()) }} 
//                         className="p-1.5 bg-rose-50 rounded-md text-rose-600 hover:bg-rose-100 transition-colors"
//                       >
//                         <Trash2 size={13}/>
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* VIEW MODAL (FITTED) */}
//       <AnimatePresence>
//         {selected && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 p-6 overflow-hidden">
//               <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
//                 <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Candidate Dossier</h3>
//                 <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
//               </div>
//               <div className="grid grid-cols-4 gap-y-5 gap-x-3">
//                 <MiniInfo label="First Name" value={selected.firstName} icon={<Users size={12}/>}/>
//                 <MiniInfo label="Last Name" value={selected.lastName} icon={<Users size={12}/>}/>
//                 <MiniInfo label="Email" value={selected.email} icon={<Mail size={12}/>}/>
//                 <MiniInfo label="Phone" value={selected.phone} icon={<Phone size={12}/>}/>
//                 <MiniInfo label="Position" value={selected.appliedPosition} icon={<Briefcase size={12}/>}/>
//                 <MiniInfo label="Dept ID" value={selected.departmentId} icon={<Building2 size={12}/>}/>
//                 <MiniInfo label="Status" value={selected.status} icon={<Search size={12}/>}/>
//                 <MiniInfo label="Date" value={selected.applicationDate?.split('T')[0]} icon={<Calendar size={12}/>}/>
//               </div>
//               <div className="mt-8 pt-4 flex justify-end">
//                 <button onClick={() => setSelected(null)} className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors">Close</button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* CREATE MODAL (3-COLUMN FITTED) */}
//       <AnimatePresence>
//         {createOpen && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
//                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
//                   <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{isEdit ? "Update Candidate" : "Add Candidate"}</h3>
//                   <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
//                </div>
               
//                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-3 gap-x-5 gap-y-4">
//                   <InputField label="First Name" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
//                   <InputField label="Last Name" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
//                   <InputField label="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
//                   <InputField label="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
//                   <InputField label="Position" value={form.appliedPosition} onChange={e => setForm({...form, appliedPosition: e.target.value})} />
                  
//                   <div className="space-y-1">
//                     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Department</label>
//                     <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 transition-all" value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}>
//                       <option value="">Select Dept</option>
//                       {departments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
//                     </select>
//                   </div>
                  
//                   <InputField label="Status" value={form.status} onChange={e => setForm({...form, status: e.target.value})} />
//                   <InputField label="Source" value={form.source} onChange={e => setForm({...form, source: e.target.value})} />
                  
//                   <div className="col-span-3 pt-4 flex justify-end gap-3 mt-2 border-t border-slate-50">
//                     <button type="button" onClick={() => setCreateOpen(false)} className="px-6 py-2 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 rounded-lg transition-all">Cancel</button>
//                     <button type="submit" disabled={submitting} className="px-8 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-md hover:bg-indigo-700 transition-all">
//                        {submitting ? "Saving..." : "Save Entry"}
//                     </button>
//                   </div>
//                </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// // SHARED MINI COMPONENTS
// const InputField = ({ label, ...props }) => (
//   <div className="space-y-1">
//     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
//     <input {...props} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 transition-all" />
//   </div>
// );

// const MiniInfo = ({ label, value, icon }) => (
//   <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
//     <div className="flex items-center gap-1.5 text-indigo-500 mb-1">
//       {icon}
//       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
//     </div>
//     <p className="text-[11px] font-black text-slate-700 truncate pl-0.5">{value || '—'}</p>
//   </div>
// );






// THEME CHANGE 





import { useEffect, useState } from "react";
import { 
  Users, X, Search, Briefcase, Mail, Phone, 
  Building2, Calendar, Eye, Edit2, Trash2, Loader2, ChevronRight, Plus
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
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2">
            <Users size={22} className="text-indigo-500" /> Recruitment
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Candidate Pipeline</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" placeholder="Search candidates..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg pl-9 pr-4 py-2 w-56 outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)] transition-all"
            />
          </div>
          <button 
            onClick={() => { resetForm(); setIsEdit(false); setCreateOpen(true); }}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus size={14} strokeWidth={3} /> Add Candidate
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden transition-colors">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Position</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/30">
              {data.filter(r => `${r.firstName} ${r.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())).map((r) => (
                <tr key={r.candidateId} className="hover:bg-indigo-500/[0.02] transition-colors group">
                  <td className="px-5 py-2.5 text-[11px] font-bold text-slate-400">#{r.candidateId}</td>
                  <td className="px-5 py-2.5">
                    <p className="text-[12px] font-black text-[var(--text-main)]">{r.firstName} {r.lastName}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{r.source || 'Direct'}</p>
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <Briefcase size={12} className="text-indigo-400" />
                      <span className="text-[11px] font-bold text-[var(--text-main)] opacity-80">{r.appliedPosition}</span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5">
                    <p className="text-[11px] font-bold text-[var(--text-main)] opacity-70">{r.email}</p>
                    <p className="text-[10px] font-medium text-slate-400">{r.phone}</p>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="px-2.5 py-1 bg-[var(--bg-body)] text-[var(--text-main)] text-[9px] font-black uppercase rounded-md border border-[var(--border-color)]">
                      {r.status || 'Applied'}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button 
                        onClick={() => setSelected(r)} 
                        className="p-1.5 bg-[var(--bg-body)] rounded-md text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors border border-[var(--border-color)]"
                      >
                        <Eye size={13}/>
                      </button>
                      <button 
                        onClick={() => { setForm(r); setIsEdit(true); setCreateOpen(true); }} 
                        className="p-1.5 bg-indigo-500/10 rounded-md text-indigo-500 hover:bg-indigo-500/20 transition-colors border border-indigo-500/10"
                      >
                        <Edit2 size={13}/>
                      </button>
                      <button 
                        onClick={() => { if(window.confirm('Delete?')) hrApi.delete(`/api/Recruitment/${r.candidateId}`).then(() => loadData()) }} 
                        className="p-1.5 bg-rose-500/10 rounded-md text-rose-500 hover:bg-rose-500/20 transition-colors border border-rose-500/10"
                      >
                        <Trash2 size={13}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW MODAL */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[var(--bg-card)] w-full max-w-2xl rounded-2xl shadow-2xl border border-[var(--border-color)] p-6 overflow-hidden transition-colors">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-[var(--border-color)]">
                <h3 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">Candidate Dossier</h3>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
              </div>
              <div className="grid grid-cols-4 gap-y-5 gap-x-3">
                <MiniInfo label="First Name" value={selected.firstName} icon={<Users size={12}/>}/>
                <MiniInfo label="Last Name" value={selected.lastName} icon={<Users size={12}/>}/>
                <MiniInfo label="Email" value={selected.email} icon={<Mail size={12}/>}/>
                <MiniInfo label="Phone" value={selected.phone} icon={<Phone size={12}/>}/>
                <MiniInfo label="Position" value={selected.appliedPosition} icon={<Briefcase size={12}/>}/>
                <MiniInfo label="Dept ID" value={selected.departmentId} icon={<Building2 size={12}/>}/>
                <MiniInfo label="Status" value={selected.status} icon={<Search size={12}/>}/>
                <MiniInfo label="Date" value={selected.applicationDate?.split('T')[0]} icon={<Calendar size={12}/>}/>
              </div>
              <div className="mt-8 pt-4 flex justify-end">
                <button onClick={() => setSelected(null)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors active:scale-95">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {createOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--bg-card)] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)] transition-colors duration-300">
               <div className="px-6 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                  <h3 className="text-[11px] font-black text-[var(--text-main)] uppercase tracking-widest">{isEdit ? "Update Candidate" : "Add Candidate"}</h3>
                  <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-6 grid grid-cols-3 gap-x-5 gap-y-4">
                  <InputField label="First Name" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                  <InputField label="Last Name" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                  <InputField label="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  <InputField label="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  <InputField label="Position" value={form.appliedPosition} onChange={e => setForm({...form, appliedPosition: e.target.value})} />
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Department</label>
                    <select className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)] transition-all" value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}>
                      <option value="" className="bg-[var(--bg-card)]">Select Dept</option>
                      {departments.map(d => <option key={d.departmentId} value={d.departmentId} className="bg-[var(--bg-card)]">{d.departmentName}</option>)}
                    </select>
                  </div>
                  
                  <InputField label="Status" value={form.status} onChange={e => setForm({...form, status: e.target.value})} />
                  <InputField label="Source" value={form.source} onChange={e => setForm({...form, source: e.target.value})} />
                  
                  <div className="col-span-3 pt-4 flex justify-end gap-3 mt-2 border-t border-[var(--border-color)]/30">
                    <button type="button" onClick={() => setCreateOpen(false)} className="px-6 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 rounded-lg transition-all">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-8 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-lg shadow-md hover:bg-indigo-700 transition-all active:scale-95">
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
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    <input {...props} className="w-full px-4 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)] transition-all placeholder:text-slate-500" />
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