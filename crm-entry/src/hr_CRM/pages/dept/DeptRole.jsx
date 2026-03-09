// import React, { useState, useEffect, useMemo } from "react";
// import { 
//   getDepartmentRoles, 
//   createDepartmentRole, 
//   updateDepartmentRole, 
//   deleteDepartmentRole 
// } from "../../api/dept/deptRole.api";
// import { getDepartments } from "../../api/hr.dept";
// import { getBranches } from "../../api/api.branch";
// import { ShieldCheck, Plus, Search, Trash2, Loader2, X, Star, MapPin, Edit3 } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import toast, { Toaster } from "react-hot-toast";

// export default function DeptRole() {
//   const [roles, setRoles] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [branches, setBranches] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showModal, setShowModal] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");

//   const [editingId, setEditingId] = useState(null); 
//   const [modalBranchId, setModalBranchId] = useState("");
//   const [formData, setFormData] = useState({
//     roleName: "",
//     requiredSkillLevel: "",
//     performanceLevel: "",
//     departmentId: ""
//   });

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const [roleRes, deptRes, branchRes] = await Promise.all([
//         getDepartmentRoles(),
//         getDepartments(),
//         getBranches()
//       ]);
//       setRoles(roleRes?.data || roleRes || []);
//       setDepartments(deptRes?.data || deptRes || []);
//       setBranches(branchRes?.data || branchRes || []);
//     } catch (err) {
//       toast.error("Sync Error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { fetchData(); }, []);

//   const modalFilteredDepts = useMemo(() => {
//     if (!modalBranchId) return [];
//     return departments.filter(d => Number(d.branchId) === Number(modalBranchId));
//   }, [modalBranchId, departments]);

//   const handleEditClick = (role) => {
//     setEditingId(role.departmentRoleId);
//     const dept = departments.find(d => (d.departmentId || d.id) === role.departmentId);
//     setModalBranchId(dept?.branchId || "");
//     setFormData({
//       roleName: role.roleName,
//       requiredSkillLevel: role.requiredSkillLevel,
//       performanceLevel: role.performanceLevel,
//       departmentId: role.departmentId
//     });
//     setShowModal(true);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const payload = {
//         roleName: formData.roleName,
//         requiredSkillLevel: formData.requiredSkillLevel,
//         performanceLevel: formData.performanceLevel || "Standard",
//         departmentId: parseInt(formData.departmentId)
//       };

//       if (editingId) {
//         await updateDepartmentRole(editingId, payload);
//         toast.success("Updated");
//       } else {
//         await createDepartmentRole(payload);
//         toast.success("Created");
//       }
//       closeAndReset();
//       fetchData();
//     } catch (err) {
//       toast.error("Failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const closeAndReset = () => {
//     setShowModal(false);
//     setEditingId(null);
//     setModalBranchId("");
//     setFormData({ roleName: "", requiredSkillLevel: "", performanceLevel: "", departmentId: "" });
//   };

//   const handleDelete = async (role) => {
//     if (!window.confirm(`Delete ${role.roleName}?`)) return;
//     try {
//       await deleteDepartmentRole(role.departmentRoleId);
//       toast.success("Removed");
//       fetchData();
//     } catch (err) {
//       toast.error("Error");
//     }
//   };

//   const filteredRoles = roles.filter(r => 
//     r.roleName?.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
//       <Toaster position="top-right" />

//       {/* COMPACT HEADER (toplook standard) */}
//       <div className="flex items-center justify-between px-1">
//         <div>
//           <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
//             <ShieldCheck size={22} className="text-indigo-600" /> Designations
//           </h2>
//           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Role Architecture</p>
//         </div>

//         <div className="flex items-center gap-2">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
//             <input 
//               type="text" placeholder="Search roles..." value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-44 outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
//             />
//           </div>

//           <button 
//             onClick={() => { closeAndReset(); setShowModal(true); }}
//             className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
//           >
//             <Plus size={14} strokeWidth={3} /> New Role
//           </button>
//         </div>
//       </div>

//       {/* TABLE SECTION */}
//       {loading && roles.length === 0 ? (
//         <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
//       ) : (
//         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//           <table className="w-full text-left border-collapse">
//             <thead>
//               <tr className="bg-slate-50 border-b border-slate-200">
//                 <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Role Designation</th>
//                 <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Skill Lvl</th>
//                 <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Performance</th>
//                 <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100">
//               {filteredRoles.map((role) => (
//                 <tr key={role.departmentRoleId} className="hover:bg-slate-50/50 transition-colors group">
//                   <td className="px-5 py-2.5">
//                     <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-0.5">{role.roleName}</p>
//                     <div className="flex items-center gap-1">
//                       <MapPin size={10} className="text-indigo-500"/>
//                       <p className="text-[9px] font-bold text-slate-400 uppercase">{role.departmentName}</p>
//                     </div>
//                   </td>
//                   <td className="px-5 py-2.5 text-center">
//                     <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-md border border-amber-100 font-black text-[9px] uppercase">
//                       <Star size={10} className="fill-amber-600" /> {role.requiredSkillLevel}
//                     </span>
//                   </td>
//                   <td className="px-5 py-2.5 text-center">
//                     <span className="text-slate-600 font-black bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-[9px] uppercase">
//                       {role.performanceLevel || "Standard"}
//                     </span>
//                   </td>
//                   <td className="px-5 py-2.5 text-right">
//                     <div className="flex justify-end gap-1.5">
//                       <button onClick={() => handleEditClick(role)} className="p-1.5 bg-indigo-50 rounded-md text-indigo-600 hover:bg-indigo-100 transition-colors">
//                         <Edit3 size={13}/>
//                       </button>
//                       <button onClick={() => handleDelete(role)} className="p-1.5 bg-rose-50 rounded-md text-rose-600 hover:bg-rose-100 transition-colors">
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

//       {/* COMPACT MODAL */}
//       <AnimatePresence>
//         {showModal && (
//           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
//             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
//                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
//                   <div className="flex items-center gap-2">
//                     <ShieldCheck size={16} className="text-indigo-600" />
//                     <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
//                       {editingId ? "Modify Role" : "Create Role"}
//                     </h3>
//                   </div>
//                   <button onClick={closeAndReset} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
//                </div>
               
//                <form onSubmit={handleSubmit} className="p-5 space-y-4">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-1">
//                       <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Branch</label>
//                       <select required className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 transition-all cursor-pointer"
//                         value={modalBranchId} onChange={(e) => { setModalBranchId(e.target.value); setFormData({...formData, departmentId: ""}); }}>
//                         <option value="">Select...</option>
//                         {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
//                       </select>
//                     </div>
//                     <div className="space-y-1">
//                       <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Department</label>
//                       <select required disabled={!modalBranchId} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 transition-all disabled:opacity-50 cursor-pointer"
//                         value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value})}>
//                         <option value="">Select...</option>
//                         {modalFilteredDepts.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
//                       </select>
//                     </div>
//                   </div>

//                   <InputField 
//                     label="Role Title" 
//                     placeholder="e.g. Senior Architect"
//                     value={formData.roleName} 
//                     onChange={e => setFormData({...formData, roleName: e.target.value})} 
//                   />

//                   <div className="grid grid-cols-2 gap-4">
//                     <InputField 
//                       label="Skill Level" 
//                       placeholder="Expert"
//                       value={formData.requiredSkillLevel} 
//                       onChange={e => setFormData({...formData, requiredSkillLevel: e.target.value})} 
//                     />
//                     <InputField 
//                       label="Perf Level" 
//                       placeholder="High"
//                       value={formData.performanceLevel} 
//                       onChange={e => setFormData({...formData, performanceLevel: e.target.value})} 
//                     />
//                   </div>

//                   <div className="pt-2 flex flex-col gap-2">
//                     <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
//                       {editingId ? "Update Framework" : "Save Role"}
//                     </button>
//                     <button type="button" onClick={closeAndReset} className="w-full py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Discard changes</button>
//                   </div>
//                </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// const InputField = ({ label, ...props }) => (
//   <div className="space-y-1">
//     <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
//     <input {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 focus:border-indigo-300 transition-all" />
//   </div>
// );











// THEME CHNSGE



import React, { useState, useEffect, useMemo } from "react";
import { 
  getDepartmentRoles, 
  createDepartmentRole, 
  updateDepartmentRole, 
  deleteDepartmentRole 
} from "../../api/dept/deptRole.api";
import { getDepartments } from "../../api/hr.dept";
import { getBranches } from "../../api/api.branch";
import { ShieldCheck, Plus, Search, Trash2, Loader2, X, Star, MapPin, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useRole } from "../../hooks/useRole"; // Import your permission hook

export default function DeptRole() {
  const { isManager } = useRole(); // Check for HR_MANAGER or CRM_FULL_ACCESS
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [editingId, setEditingId] = useState(null); 
  const [modalBranchId, setModalBranchId] = useState("");
  const [formData, setFormData] = useState({
    roleName: "",
    requiredSkillLevel: "",
    performanceLevel: "",
    departmentId: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roleRes, deptRes, branchRes] = await Promise.all([
        getDepartmentRoles(),
        getDepartments(),
        getBranches()
      ]);
      setRoles(roleRes?.data || roleRes || []);
      setDepartments(deptRes?.data || deptRes || []);
      setBranches(branchRes?.data || branchRes || []);
    } catch (err) {
      toast.error("Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const modalFilteredDepts = useMemo(() => {
    if (!modalBranchId) return [];
    return departments.filter(d => Number(d.branchId) === Number(modalBranchId));
  }, [modalBranchId, departments]);

  const handleEditClick = (role) => {
    setEditingId(role.departmentRoleId);
    const dept = departments.find(d => (d.departmentId || d.id) === role.departmentId);
    setModalBranchId(dept?.branchId || "");
    setFormData({
      roleName: role.roleName,
      requiredSkillLevel: role.requiredSkillLevel,
      performanceLevel: role.performanceLevel,
      departmentId: role.departmentId
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        roleName: formData.roleName,
        requiredSkillLevel: formData.requiredSkillLevel,
        performanceLevel: formData.performanceLevel || "Standard",
        departmentId: parseInt(formData.departmentId)
      };

      if (editingId) {
        await updateDepartmentRole(editingId, payload);
        toast.success("Updated");
      } else {
        await createDepartmentRole(payload);
        toast.success("Created");
      }
      closeAndReset();
      fetchData();
    } catch (err) {
      toast.error("Failed");
    } finally {
      setLoading(false);
    }
  };

  const closeAndReset = () => {
    setShowModal(false);
    setEditingId(null);
    setModalBranchId("");
    setFormData({ roleName: "", requiredSkillLevel: "", performanceLevel: "", departmentId: "" });
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`Delete ${role.roleName}?`)) return;
    try {
      await deleteDepartmentRole(role.departmentRoleId);
      toast.success("Removed");
      fetchData();
    } catch (err) {
      toast.error("Error");
    }
  };

  const filteredRoles = roles.filter(r => 
    r.roleName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2">
            <ShieldCheck size={22} className="text-indigo-600" /> Designations
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Role Architecture</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" placeholder="Search roles..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg pl-9 pr-4 py-2 w-44 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* PERMISSION CHECK: Only show "New Role" for managers */}
          {isManager && (
            <button 
              onClick={() => { closeAndReset(); setShowModal(true); }}
              className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus size={14} strokeWidth={3} /> New Role
            </button>
          )}
        </div>
      </div>

      {/* TABLE SECTION */}
      {loading && roles.length === 0 ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-sm overflow-hidden transition-colors">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role Designation</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Skill Lvl</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Performance</th>
                {/* PERMISSION CHECK: Only show actions header for managers */}
                {isManager && <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/30">
              {filteredRoles.map((role) => (
                <tr key={role.departmentRoleId} className="hover:bg-indigo-500/[0.02] transition-colors group">
                  <td className="px-5 py-2.5">
                    <p className="text-[12px] font-black text-[var(--text-main)] uppercase leading-none mb-0.5">{role.roleName}</p>
                    <div className="flex items-center gap-1 opacity-80">
                      <MapPin size={10} className="text-indigo-500"/>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{role.departmentName}</p>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-md border border-amber-500/20 font-black text-[9px] uppercase">
                      <Star size={10} className="fill-amber-600" /> {role.requiredSkillLevel}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <span className="text-[var(--text-main)] opacity-90 font-black bg-[var(--bg-body)] px-2.5 py-1 rounded-md border border-[var(--border-color)] text-[9px] uppercase">
                      {role.performanceLevel || "Standard"}
                    </span>
                  </td>
                  {/* PERMISSION CHECK: Only show action buttons for managers */}
                  {isManager && (
                    <td className="px-5 py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleEditClick(role)} className="p-1.5 bg-indigo-500/10 rounded-md text-indigo-500 hover:bg-indigo-500/20 transition-all border border-indigo-500/10">
                          <Edit3 size={13}/>
                        </button>
                        <button onClick={() => handleDelete(role)} className="p-1.5 bg-rose-500/10 rounded-md text-rose-500 hover:bg-rose-500/20 transition-all border border-rose-500/10">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      <AnimatePresence>
        {showModal && isManager && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={closeAndReset}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-[var(--bg-card)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)] transition-colors"
              onClick={e => e.stopPropagation()}
            >
               <div className="px-6 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-indigo-600" />
                    <h3 className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">
                      {editingId ? "Modify Role" : "Create Role"}
                    </h3>
                  </div>
                  <button onClick={closeAndReset} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Branch</label>
                      <select required className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                        value={modalBranchId} onChange={(e) => { setModalBranchId(e.target.value); setFormData({...formData, departmentId: ""}); }}>
                        <option value="" className="bg-[var(--bg-card)]">Select...</option>
                        {branches.map(b => <option key={b.branchId} value={b.branchId} className="bg-[var(--bg-card)]">{b.branchName}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Department</label>
                      <select required disabled={!modalBranchId} className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
                        value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value})}>
                        <option value="" className="bg-[var(--bg-card)]">Select...</option>
                        {modalFilteredDepts.map(d => <option key={d.departmentId} value={d.departmentId} className="bg-[var(--bg-card)]">{d.departmentName}</option>)}
                      </select>
                    </div>
                  </div>

                  <InputField 
                    label="Role Title" 
                    placeholder="e.g. Senior Architect"
                    value={formData.roleName} 
                    onChange={e => setFormData({...formData, roleName: e.target.value})} 
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <InputField 
                      label="Skill Level" 
                      placeholder="Expert"
                      value={formData.requiredSkillLevel} 
                      onChange={e => setFormData({...formData, requiredSkillLevel: e.target.value})} 
                    />
                    <InputField 
                      label="Perf Level" 
                      placeholder="High"
                      value={formData.performanceLevel} 
                      onChange={e => setFormData({...formData, performanceLevel: e.target.value})} 
                    />
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
                      {editingId ? "Update Framework" : "Save Role"}
                    </button>
                    <button type="button" onClick={closeAndReset} className="w-full py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Discard changes</button>
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
    <input 
      {...props} 
      className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all placeholder:text-slate-500" 
    />
  </div>
);