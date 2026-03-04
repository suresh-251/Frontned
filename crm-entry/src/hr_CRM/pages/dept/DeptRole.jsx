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

export default function DeptRole() {
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
    <div className="w-full h-screen flex flex-col bg-white">
      <Toaster position="top-right" />

      {/* COMPACT HEADER (Matches Recruitment Style) */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2 tracking-tighter uppercase">
            <ShieldCheck size={18} className="text-indigo-600" /> Designations
          </h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Role Architecture</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
            <input 
              type="text" placeholder="Search roles..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg pl-8 py-1.5 w-44 outline-none focus:ring-1 focus:ring-indigo-200"
            />
          </div>

          <button 
            onClick={() => { closeAndReset(); setShowModal(true); }}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm hover:bg-indigo-700 transition-all"
          >
            + New Role
          </button>
        </div>
      </div>

      {/* FITTED TABLE SECTION */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading && roles.length === 0 ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" size={20} /></div>
        ) : (
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Role Designation</th>
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Skill Lvl</th>
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Performance</th>
                  <th className="px-4 py-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRoles.map((role) => (
                  <tr key={role.departmentRoleId} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-2">
                      <p className="text-[11px] font-black text-slate-700 uppercase">{role.roleName}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={9} className="text-indigo-400"/>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">{role.departmentName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded border border-amber-100 font-black text-[8px] uppercase">
                        <Star size={8} className="fill-amber-600" /> {role.requiredSkillLevel}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-slate-600 font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[8px] uppercase">
                        {role.performanceLevel || "Standard"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(role)} className="p-1.5 hover:bg-white rounded-md border border-transparent hover:border-slate-100 text-slate-400 hover:text-indigo-600 transition-all">
                          <Edit3 size={14}/>
                        </button>
                        <button onClick={() => handleDelete(role)} className="p-1.5 hover:bg-white rounded-md border border-transparent hover:border-slate-100 text-slate-400 hover:text-red-500 transition-all">
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

      {/* COMPACT MODAL (Matches Budget Registry Style) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-slate-100">
               <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                    {editingId ? "Modify Role" : "Create Role"}
                  </h3>
                  <button onClick={closeAndReset}><X size={14} className="text-slate-400 hover:text-red-500"/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-6 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Branch</label>
                      <select required className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-300"
                        value={modalBranchId} onChange={(e) => { setModalBranchId(e.target.value); setFormData({...formData, departmentId: ""}); }}>
                        <option value="">Select...</option>
                        {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Department</label>
                      <select required disabled={!modalBranchId} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-300 disabled:opacity-50"
                        value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value})}>
                        <option value="">Select...</option>
                        {modalFilteredDepts.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                      </select>
                    </div>
                  </div>

                  <InputField 
                    label="Role Title" 
                    placeholder="e.g. Senior Architect"
                    value={formData.roleName} 
                    onChange={e => setFormData({...formData, roleName: e.target.value})} 
                  />

                  <div className="grid grid-cols-2 gap-3">
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

                  <div className="pt-4 flex justify-end gap-2">
                    <button type="button" onClick={closeAndReset} className="px-4 py-1.5 text-[9px] font-black uppercase text-slate-400">Discard</button>
                    <button type="submit" className="px-6 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg shadow-md hover:bg-indigo-700 transition-all">
                      {editingId ? "Update" : "Save Role"}
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

// Shared Component to maintain consistency with Recruitment/Budget pages
const InputField = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">{label}</label>
    <input {...props} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-300" />
  </div>
);