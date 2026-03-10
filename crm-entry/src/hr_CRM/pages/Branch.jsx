// theme change

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, MapPin, Building2, Filter, Loader2, AlertTriangle, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { getBranches, createBranch, updateBranch, deleteBranch } from "../api/api.branch";
import { Button } from "../components/ui/Buttons";

export default function Branch() {
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Active");
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, branch: null });
  const [editingBranch, setEditingBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    branchName: "", 
    location: "", 
    status: "Active" 
  });

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await getBranches();
      const safeData = Array.isArray(data) ? data : [];
      setBranches(safeData);
      
      const activeOnly = safeData.filter(b => b.status === "Active");
      setFilteredBranches(activeOnly);
    } catch (error) {
      toast.error("Failed to fetch branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBranches(); }, []);

  const handleFilterChange = (e) => {
    const val = e.target.value;
    setStatusFilter(val);
    if (val === "All") {
      setFilteredBranches(branches);
    } else {
      setFilteredBranches(branches.filter(b => b.status === val));
    }
  };

  const openModal = (branch = null) => {
    setEditingBranch(branch);
    setFormData(branch ? { 
      branchName: branch.branchName, 
      location: branch.location, 
      status: branch.status 
    } : { branchName: "", location: "", status: "Active" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = toast.loading(editingBranch ? "Updating..." : "Creating...");
    try {
      if (editingBranch) {
        await updateBranch(editingBranch.branchId, formData);
        toast.success("Branch updated", { id: tid });
      } else {
        await createBranch(formData);
        toast.success("Branch created", { id: tid });
      }
      setShowModal(false);
      loadBranches();
    } catch (error) {
      toast.error("Operation failed", { id: tid });
    }
  };

  const handleDeactivate = async () => {
    const tid = toast.loading("Deactivating...");
    try {
      await deleteBranch(confirmDelete.branch.branchId);
      toast.success("Branch deactivated", { id: tid });
      setConfirmDelete({ show: false, branch: null });
      loadBranches();
    } catch (error) {
      toast.error("Failed to deactivate", { id: tid });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-[var(--text-main)] transition-colors duration-300">
      <Toaster position="top-right" />

      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight flex items-center gap-2">
            <Building2 size={22} className="text-indigo-500" /> Branch Directory
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Manage office locations</p>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={statusFilter}
            onChange={handleFilterChange}
            className="text-xs font-bold bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
          >
            <option value="All" className="bg-[var(--bg-card)]">Filter: All</option>
            <option value="Active" className="bg-[var(--bg-card)]">Filter: Active</option>
            <option value="Inactive" className="bg-[var(--bg-card)]">Filter: Inactive</option>
          </select>
          <button 
            onClick={() => openModal()}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus size={14} strokeWidth={3} /> Add Branch
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
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Name</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]/30">
              {filteredBranches.map((branch) => (
                <tr key={branch.branchId} className="hover:bg-indigo-500/[0.02] transition-colors">
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500 text-[11px] font-bold border border-indigo-500/20">
                          <Building2 size={14} />
                        </div>
                        <p className="text-[12px] font-black text-[var(--text-main)] uppercase">{branch.branchName}</p>
                    </div>
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-1.5 text-[var(--text-main)]">
                      <MapPin size={12} className="text-indigo-500" />
                      <span className="text-[11px] font-bold uppercase opacity-80">{branch.location}</span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-center">
                      <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md border ${
                        branch.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {branch.status}
                      </span>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button 
                        onClick={() => openModal(branch)} 
                        className="p-1.5 bg-indigo-500/10 rounded-md text-indigo-500 hover:bg-indigo-500/20 transition-colors border border-indigo-500/10"
                      >
                        <Edit2 size={13}/>
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ show: true, branch })} 
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

      {/* MODAL SYSTEM */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)] transition-colors">
               <div className="px-5 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-indigo-500" />
                    <h3 className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">{editingBranch ? "Edit Branch" : "New Branch"}</h3>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-[var(--bg-card)] rounded-full text-slate-400 hover:text-red-500 transition-colors"><X size={16}/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Branch Name</label>
                    <input 
                      className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)] transition-all"
                      value={formData.branchName} 
                      onChange={(e) => setFormData({...formData, branchName: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Location</label>
                    <input 
                      className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)] transition-all"
                      value={formData.location} 
                      onChange={(e) => setFormData({...formData, location: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Status</label>
                    <select 
                      className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)] transition-all"
                      value={formData.status} 
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="Active" className="bg-[var(--bg-card)]">Active</option>
                      <option value="Inactive" className="bg-[var(--bg-card)]">Inactive</option>
                    </select>
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
                      Save Branch
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} className="w-full py-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Discard</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VERIFY DEACTIVATE */}
      <AnimatePresence>
        {confirmDelete.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} className="relative bg-[var(--bg-card)] rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl border border-[var(--border-color)]">
              <AlertTriangle className="mx-auto text-amber-500 mb-4" size={32} />
              <h3 className="text-[12px] font-black text-[var(--text-main)] uppercase">Deactivate?</h3>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">Change <b>{confirmDelete.branch.branchName}</b> status to Inactive?</p>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setConfirmDelete({ show: false, branch: null })} className="flex-1 py-2 text-[10px] font-black uppercase bg-[var(--bg-body)] text-slate-400 rounded-xl hover:text-slate-600 transition-colors">Cancel</button>
                <button onClick={handleDeactivate} className="flex-1 py-2 text-[10px] font-black uppercase bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20 active:scale-95">Deactivate</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}