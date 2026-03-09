import React, { useEffect, useState, useMemo } from "react";
import { 
  Edit2, Trash2, Layers, X, AlertCircle, 
  Loader2, MapPin, Building2, Plus, Hash, Lock 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../api/hr.dept";
import { getBranches } from "../api/api.branch";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [formData, setFormData] = useState({ departmentName: "", branchId: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: "" });

  // --- 🔑 PERMISSION CHECKING ---
  const token = localStorage.getItem("accessToken");
  const auth = useMemo(() => {
    if (!token) return { perms: [] };
    try {
      const decoded = jwtDecode(token);
      return { perms: decoded.perm || [] };
    } catch (e) { return { perms: [] }; }
  }, [token]);

  const canViewDepts = auth.perms.includes("DOMAIN_VIEW"); 
  const canCreateDepts = auth.perms.includes("ROLE_CREATE");
  const canEditDepts = auth.perms.includes("ROLE_UPDATE");   
  const canDeleteDepts = auth.perms.includes("ROLE_DELETE");

  const loadData = async () => {
    if (!canViewDepts) return; 
    setLoading(true);
    try {
      const [branchData, deptData] = await Promise.all([getBranches(), getDepartments()]);
      setBranches(Array.isArray(branchData) ? branchData : []);
      const dData = Array.isArray(deptData) ? deptData : [];
      setAllDepartments(dData);
      setDepartments(dData);
    } catch (error) {
      if (error.response?.status !== 403) toast.error("Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [canViewDepts]);

  useEffect(() => {
    if (!selectedBranchId) {
      setDepartments(allDepartments);
    } else {
      const filtered = allDepartments.filter(d => d.branchId === Number(selectedBranchId));
      setDepartments(filtered);
    }
  }, [selectedBranchId, allDepartments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreateDepts && !canEditDepts) return toast.error("Action Restricted");

    const tid = toast.loading("Processing...");
    try {
      const payload = {
        departmentName: formData.departmentName,
        branchId: Number(formData.branchId),
      };
      if (editingId) {
        await updateDepartment(editingId, payload);
        toast.success("Updated", { id: tid });
      } else {
        await createDepartment(payload);
        toast.success("Created", { id: tid });
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error("Operation Failed", { id: tid });
    }
  };

  const handleConfirmedDelete = async () => {
    if (!canDeleteDepts) return;
    const tid = toast.loading("Deleting...");
    try {
      await deleteDepartment(confirmDelete.id);
      toast.success("Removed", { id: tid });
      setConfirmDelete({ show: false, id: null });
      loadData();
    } catch (error) {
      toast.error("Delete Failed", { id: tid });
    }
  };

  if (!canViewDepts) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center transition-colors duration-300">
        <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 border border-[var(--border-color)]">
          <Lock size={40} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight">Access Restricted</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
          Permission 'DOMAIN_VIEW' is required to access departments.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2">
            <Layers size={22} className="text-indigo-500" /> Departments
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Unit Registry</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg px-3 py-2 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="" className="bg-[var(--bg-card)]">All Branches</option>
            {branches.map((b) => <option key={b.branchId} value={b.branchId} className="bg-[var(--bg-card)]">{b.branchName}</option>)}
          </select>

          {canCreateDepts && (
            <button 
              onClick={() => { setEditingId(null); setFormData({departmentName:"", branchId:""}); setShowModal(true); }}
              className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus size={14} strokeWidth={3} /> Add New
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departments.map((d) => {
            const branch = branches.find(b => b.branchId === d.branchId);
            return (
              <motion.div layout key={d.departmentId} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 relative shadow-sm hover:shadow-md transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <div className="flex justify-between items-start mb-3 pl-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-indigo-500/20 text-indigo-500 bg-indigo-500/10 text-[10px] font-black uppercase">
                        {d.departmentName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-[var(--text-main)] leading-tight">{d.departmentName}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">ID: {d.departmentId}</p>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {canEditDepts && (
                      <button onClick={() => { setEditingId(d.departmentId); setFormData({departmentName: d.departmentName, branchId: d.branchId}); setShowModal(true); }} className="p-1.5 bg-indigo-500/10 rounded-md text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/10">
                        <Edit2 size={12}/>
                      </button>
                    )}
                    {canDeleteDepts && (
                      <button onClick={() => setConfirmDelete({ show: true, id: d.departmentId, name: d.departmentName })} className="p-1.5 bg-rose-500/10 rounded-md text-rose-500 hover:bg-rose-600 hover:text-white transition-all border border-rose-500/10">
                        <Trash2 size={12}/>
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-[var(--bg-body)] rounded-lg p-2 border border-[var(--border-color)]/50">
                   <div className="flex items-center gap-1.5 mb-0.5">
                      <MapPin size={10} className="text-slate-400" />
                      <span className="text-[8px] font-black text-slate-500 uppercase">Location</span>
                   </div>
                   <p className="text-[11px] font-black text-[var(--text-main)] opacity-90 truncate">{branch ? branch.branchName : "N/A"}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (canCreateDepts || canEditDepts) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} 
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-sm shadow-2xl transition-colors duration-300"
                onClick={e => e.stopPropagation()}
             >
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{editingId ? "Edit Department" : "Create New Department"}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Dept Name</label>
                    <input className="w-full bg-[var(--bg-body)] border border-[var(--border-color)] p-2 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)] transition-all" value={formData.departmentName} onChange={e => setFormData({...formData, departmentName: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Branch</label>
                    <select className="w-full bg-[var(--bg-body)] border border-[var(--border-color)] p-2 rounded-xl text-xs font-bold text-[var(--text-main)] outline-none" value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} required>
                       <option value="" className="bg-[var(--bg-card)]">Select...</option>
                       {branches.map(b => <option key={b.branchId} value={b.branchId} className="bg-[var(--bg-card)]">{b.branchName}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95">Save Changes</button>
                  <button type="button" onClick={() => setShowModal(false)} className="w-full py-1 text-[9px] font-bold uppercase text-slate-500 hover:text-[var(--text-main)] transition-colors">Cancel</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION */}
      <AnimatePresence>
        {confirmDelete.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmDelete({ show: false, id: null })}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl">
              <AlertCircle className="mx-auto text-rose-500 mb-4" size={32} />
              <h3 className="text-[12px] font-black text-[var(--text-main)] uppercase">Delete Department?</h3>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">Remove <b>{confirmDelete.name}</b> permanently?</p>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setConfirmDelete({ show: false, id: null })} className="flex-1 py-2 text-[10px] font-black uppercase bg-[var(--bg-body)] text-slate-400 rounded-xl hover:text-slate-600 transition-colors">Cancel</button>
                <button onClick={handleConfirmedDelete} className="flex-1 py-2 text-[10px] font-black uppercase bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 active:scale-95">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}