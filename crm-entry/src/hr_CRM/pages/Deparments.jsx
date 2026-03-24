import React, { useEffect, useState, useMemo } from "react";
import { 
  Edit2, Trash2, Layers, X, AlertCircle, 
  Loader2, MapPin, Building2, Plus, Hash, Lock, AlertTriangle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../api/hr.dept";
import { getBranches } from "../api/api.branch";
import { getAccessToken } from "../../utils/authStorage";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [formData, setFormData] = useState({ departmentName: "", branchId: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // --- 🛑 CONFIRMATION STATE ---
  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null });

  const token = getAccessToken();
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

  const canViewDepts = auth.isAdmin || auth.perms.includes("DOMAIN_VIEW"); 
  const canCreateDepts = auth.isAdmin || auth.perms.includes("ROLE_CREATE");
  const canEditDepts = auth.isAdmin || auth.perms.includes("ROLE_UPDATE");   
  const canDeleteDepts = auth.isAdmin || auth.perms.includes("ROLE_DELETE");

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
      const filtered = allDepartments.filter(d => Number(d.branchId) === Number(selectedBranchId));
      setDepartments(filtered);
    }
  }, [selectedBranchId, allDepartments]);

  // --- 🛠️ CONFIRMATION WRAPPER ---
  const triggerConfirm = (title, message, action) => {
    setConfirm({ open: true, title, message, onConfirm: action });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = editingId ? "Confirm Update" : "Confirm Creation";
    const msg = editingId ? "Update department details?" : "Register this new department?";
    
    triggerConfirm(title, msg, async () => {
      const tid = toast.loading("Processing...");
      try {
        const payload = { departmentName: formData.departmentName, branchId: Number(formData.branchId) };
        if (editingId) {
          await updateDepartment(editingId, payload);
          toast.success("Updated Successfully", { id: tid });
        } else {
          await createDepartment(payload);
          toast.success("Created Successfully", { id: tid });
        }
        setShowModal(false);
        loadData();
      } catch (error) {
        toast.error("Operation Failed", { id: tid });
      }
    });
  };

  const handleDeleteClick = (id, name) => {
    triggerConfirm(
      "Confirm Deletion",
      `Are you sure you want to remove ${name} permanently?`,
      async () => {
        const tid = toast.loading("Deleting...");
        try {
          await deleteDepartment(id);
          toast.success("Department Removed", { id: tid });
          loadData();
        } catch (error) {
          toast.error("Delete Failed", { id: tid });
        }
      }
    );
  };

  if (!canViewDepts) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600 border border-indigo-500/20 shadow-sm">
            <Layers size={22} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight uppercase leading-none">Departments</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">Unit Registry</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} className="text-[10px] font-bold bg-[var(--bg-card)] border border-[var(--border-color)] p-2 rounded-lg outline-none">
            <option value="">All Locations</option>
            {branches.map((b) => <option key={b.branchId} value={b.branchId}>{b.branchName} ({b.location})</option>)}
          </select>

          {canCreateDepts && (
            <button onClick={() => { setEditingId(null); setFormData({departmentName:"", branchId:""}); setShowModal(true); }} className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 active:scale-95 transition-all shadow-md">
              <Plus size={14} /> Add New
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
              <motion.div layout key={d.departmentId} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 relative shadow-sm hover:shadow-md transition-all group">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                <div className="flex justify-between items-start mb-3 pl-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-indigo-500/10 text-indigo-500 bg-indigo-500/5 text-[10px] font-black uppercase">
                        {d.departmentName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-[var(--text-main)] leading-tight">{d.departmentName}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 opacity-60">ID: {d.departmentId}</p>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    {canEditDepts && (
                      <button 
                        onClick={() => { setEditingId(d.departmentId); setFormData({departmentName: d.departmentName, branchId: d.branchId}); setShowModal(true); }} 
                        className="p-1.5 text-slate-400 border border-transparent hover:border-indigo-500/20 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-all"
                      >
                        <Edit2 size={12}/>
                      </button>
                    )}
                    {canDeleteDepts && (
                      <button 
                        onClick={() => handleDeleteClick(d.departmentId, d.departmentName)} 
                        className="p-1.5 text-slate-400 border border-transparent hover:border-rose-500/20 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
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
                   <p className="text-[11px] font-black text-[var(--text-main)] opacity-90 truncate">
                    {branch ? `${branch.branchName} (${branch.location || 'HQ'})` : "N/A"}
                   </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-4">{editingId ? "Update Department" : "New Department"}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Dept Name</label>
                    <input className="w-full bg-[var(--bg-body)] border border-[var(--border-color)] p-2 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)] transition-all" value={formData.departmentName} onChange={e => setFormData({...formData, departmentName: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Branch Slot</label>
                    <select className="w-full bg-[var(--bg-body)] border border-[var(--border-color)] p-2 rounded-xl text-xs font-bold text-[var(--text-main)] outline-none" value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} required>
                       <option value="">Select...</option>
                       {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName} — {b.location}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20">Save Entry</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🛑 THE CENTERED CONFIRMATION POPUP */}
      <AnimatePresence>
        {confirm.open && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-[300px] p-6 text-center border border-slate-100">
               <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
               <h3 className="text-[12px] font-black uppercase text-slate-800 mb-2">{confirm.title}</h3>
               <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight mb-6">{confirm.message}</p>
               <div className="flex gap-2">
                 <button onClick={() => setConfirm({ ...confirm, open: false })} className="flex-1 py-2 text-[10px] font-black uppercase text-slate-400 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all">Cancel</button>
                 <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, open: false }); }} className="flex-1 py-2 text-[10px] font-black uppercase bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all">Yes, Confirm</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}