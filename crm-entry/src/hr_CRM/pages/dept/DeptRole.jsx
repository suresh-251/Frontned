import React, { useState, useEffect, useMemo } from "react";
import { 
  getDepartmentRoles, 
  createDepartmentRole, 
  updateDepartmentRole, 
  deleteDepartmentRole 
} from "../../api/dept/deptRole.api";
import { getDepartments } from "../../api/hr.dept";
import { getBranches } from "../../api/api.branch";
import { ShieldCheck, Plus, Search, Trash2, Loader2, X, Star, MapPin, Edit3, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

export default function DeptRole() {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- 🛑 CONFIRMATION STATE ---
  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null });

  const [editingId, setEditingId] = useState(null); 
  const [modalBranchId, setModalBranchId] = useState("");
  const [formData, setFormData] = useState({
    roleName: "",
    requiredSkillLevel: "",
    performanceLevel: "",
    departmentId: ""
  });

  const token = localStorage.getItem("accessToken");
  const auth = useMemo(() => {
    if (!token) return { perms: [], isAdmin: false };
    try {
      const decoded = jwtDecode(token);
      const perms = decoded.perm || [];
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      const isAdmin = role === "ADMIN" || perms.includes("CRM_FULL_ACCESS");
      return { perms, isAdmin };
    } catch (e) { return { perms: [], isAdmin: false }; }
  }, [token]);

  const isManager = auth.isAdmin || auth.perms.includes("ROLE_CREATE") || auth.perms.includes("ROLE_UPDATE");

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

  const triggerConfirm = (title, message, action) => {
    setConfirm({ open: true, title, message, onConfirm: action });
  };

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
    const title = editingId ? "Confirm Update" : "Confirm Creation";
    const msg = editingId ? "Update this role designation?" : "Register this new designation?";

    triggerConfirm(title, msg, async () => {
      setLoading(true);
      const tid = toast.loading("Processing...");
      try {
        const payload = {
          roleName: formData.roleName,
          requiredSkillLevel: formData.requiredSkillLevel,
          performanceLevel: formData.performanceLevel || "Standard",
          departmentId: parseInt(formData.departmentId)
        };

        if (editingId) {
          await updateDepartmentRole(editingId, payload);
          toast.success("Updated", { id: tid });
        } else {
          await createDepartmentRole(payload);
          toast.success("Created", { id: tid });
        }
        closeAndReset();
        fetchData();
      } catch (err) {
        toast.error("Failed", { id: tid });
      } finally {
        setLoading(false);
      }
    });
  };

  const closeAndReset = () => {
    setShowModal(false);
    setEditingId(null);
    setModalBranchId("");
    setFormData({ roleName: "", requiredSkillLevel: "", performanceLevel: "", departmentId: "" });
  };

  const handleDelete = (role) => {
    triggerConfirm(
      "Confirm Deletion",
      `Permanently remove the designation: ${role.roleName}?`,
      async () => {
        const tid = toast.loading("Deleting...");
        try {
          await deleteDepartmentRole(role.departmentRoleId);
          toast.success("Removed", { id: tid });
          fetchData();
        } catch (err) {
          toast.error("Error", { id: tid });
        }
      }
    );
  };

  const filteredRoles = roles.filter(r => {
    const dept = departments.find(d => (d.departmentId || d.id) === r.departmentId);
    const branch = branches.find(b => b.branchId === dept?.branchId);
    
    return r.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           branch?.location?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2">
            <ShieldCheck size={22} className="text-indigo-600" /> Designations
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            {auth.isAdmin ? "Master Role Architecture (Full Access)" : "Role Architecture"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" placeholder="Search roles..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg pl-9 pr-4 py-2 w-52 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

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

      {/* TABLE */}
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
                {isManager && <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/30">
              {filteredRoles.map((role) => {
                const dept = departments.find(d => (d.departmentId || d.id) === role.departmentId);
                const branch = branches.find(b => b.branchId === dept?.branchId);
                return (
                  <tr key={role.departmentRoleId} className="hover:bg-indigo-500/[0.02] transition-colors group">
                    <td className="px-5 py-2.5">
                      <p className="text-[12px] font-black text-[var(--text-main)] uppercase leading-none mb-0.5">{role.roleName}</p>
                      <div className="flex items-center gap-1 opacity-80">
                        <MapPin size={10} className="text-indigo-500"/>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          {role.departmentName} {branch ? `(${branch.location})` : ""}
                        </p>
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
                    {isManager && (
                      <td className="px-5 py-2.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handleEditClick(role)} className="p-1.5 bg-indigo-500/10 rounded-md text-indigo-500 hover:bg-indigo-500/20 transition-all border border-indigo-500/10">
                            <Edit3 size={13}/>
                          </button>
                          <button onClick={() => handleDelete(role)} className="p-1.5 bg-rose-500/10 rounded-md text-rose-500 hover:bg-rose-500/20 transition-all border border-rose-500/10 shadow-sm">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      <AnimatePresence>
        {showModal && isManager && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={closeAndReset}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-[var(--bg-card)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)]"
              onClick={e => e.stopPropagation()}
            >
               <div className="px-6 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-indigo-600" />
                    <h3 className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">{editingId ? "Modify Role" : "Create Role"}</h3>
                  </div>
                  <button onClick={closeAndReset} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Branch</label>
                      <select required className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={modalBranchId} onChange={(e) => { setModalBranchId(e.target.value); setFormData({...formData, departmentId: ""}); }}>
                        <option value="">Select...</option>
                        {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName} ({b.location})</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Department</label>
                      <select required disabled={!modalBranchId} className="w-full px-3 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl text-[10px] font-bold outline-none disabled:opacity-50"
                        value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value})}>
                        <option value="">Select...</option>
                        {modalFilteredDepts.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                      </select>
                    </div>
                  </div>
                  <InputField label="Role Title" placeholder="e.g. Senior Architect" value={formData.roleName} onChange={e => setFormData({...formData, roleName: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Skill Level" placeholder="Expert" value={formData.requiredSkillLevel} onChange={e => setFormData({...formData, requiredSkillLevel: e.target.value})} />
                    <InputField label="Perf Level" placeholder="High" value={formData.performanceLevel} onChange={e => setFormData({...formData, performanceLevel: e.target.value})} />
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95">Save Changes</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🛑 THE CENTERED CONFIRMATION POPUP */}
      <AnimatePresence>
        {confirm.open && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-[280px] p-6 text-center">
               <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
               <h3 className="text-[11px] font-black uppercase text-slate-800 mb-2">{confirm.title}</h3>
               <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-6">{confirm.message}</p>
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
    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">{label}</label>
    <input {...props} className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-main)] rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" />
  </div>
);