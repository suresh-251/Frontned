import { useEffect, useState, useMemo } from "react";
import { Plus, Edit2, Trash2, MapPin, Building2, Filter, Loader2, AlertTriangle, Search, X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { getBranches, createBranch, updateBranch, deleteBranch } from "../api/api.branch";
import { jwtDecode } from "jwt-decode";
import { getAccessToken } from "../../utils/authStorage";

export default function Branch() {
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Active");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  // --- 🛑 CONFIRMATION STATE ---
  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null });

  const [formData, setFormData] = useState({ 
    branchName: "", 
    location: "", 
    status: "Active" 
  });

  // --- 🔐 SUPERLOGIC AUTH PARSING ---
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

  // --- 🛠️ PERMISSION FLAGS ---
  const canView   = auth.isAdmin || auth.perms.includes("DOMAIN_VIEW");
  const canCreate = auth.isAdmin || auth.perms.includes("ROLE_CREATE");
  const canEdit   = auth.isAdmin || auth.perms.includes("ROLE_UPDATE");
  const canDelete = auth.isAdmin || auth.perms.includes("ROLE_DELETE");

  const loadBranches = async () => {
    if (!canView) return;
    try {
      setLoading(true);
      const data = await getBranches();
      const safeData = Array.isArray(data) ? data : [];
      setBranches(safeData);
      
      if (statusFilter === "All") {
        setFilteredBranches(safeData);
      } else {
        setFilteredBranches(safeData.filter(b => b.status === statusFilter));
      }
    } catch (error) {
      if (error.response?.status !== 403) toast.error("Failed to fetch branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBranches(); }, [canView, statusFilter]);

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // --- 🛠️ CONFIRMATION TRIGGER ---
  const triggerConfirm = (title, message, action) => {
    setConfirm({ open: true, title, message, onConfirm: action });
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
    const title = editingBranch ? "Confirm Update" : "Confirm Entry";
    const msg = editingBranch ? "Update branch details?" : "Register this new office location?";

    triggerConfirm(title, msg, async () => {
      const tid = toast.loading("Processing...");
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
    });
  };

  const handleDeactivateClick = (branch) => {
    triggerConfirm(
      "Deactivate Branch?",
      `Set ${branch.branchName} status to Inactive?`,
      async () => {
        const tid = toast.loading("Updating...");
        try {
          await deleteBranch(branch.branchId);
          toast.success("Branch deactivated", { id: tid });
          loadBranches();
        } catch (error) {
          toast.error("Failed to deactivate", { id: tid });
        }
      }
    );
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 border border-[var(--border-color)] shadow-sm">
          <Lock size={40} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight">Access Restricted</h2>
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
            <Building2 size={22} className="text-indigo-500" /> Branch Directory
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            {auth.isAdmin ? "Master office locations (Full Access)" : "Office locations"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={statusFilter}
            onChange={handleFilterChange}
            className="text-[10px] font-bold bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="All">Filter: All</option>
            <option value="Active">Filter: Active</option>
            <option value="Inactive">Filter: Inactive</option>
          </select>
          {canCreate && (
            <button 
              onClick={() => openModal()}
              className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-[10px] font-black uppercase shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus size={14} strokeWidth={3} /> Add Branch
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
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
                <tr key={branch.branchId} className="hover:bg-indigo-500/[0.01] transition-colors group">
                  <td className="px-5 py-2.5">
                    <p className="text-[12px] font-black text-[var(--text-main)] uppercase">{branch.branchName}</p>
                  </td>
                  <td className="px-5 py-2.5 text-[11px] font-bold text-slate-500 uppercase opacity-80">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-indigo-500" /> {branch.location}
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md border ${
                      branch.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>{branch.status}</span>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      {canEdit && (
                        <button 
                          onClick={() => openModal(branch)} 
                          className="p-1.5 text-slate-400 border border-transparent hover:border-indigo-500/20 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-all"
                        >
                          <Edit2 size={13}/>
                        </button>
                      )}
                      {canDelete && (
                        <button 
                          onClick={() => handleDeactivateClick(branch)} 
                          className="p-1.5 text-slate-400 border border-transparent hover:border-rose-500/20 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={13}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-[var(--bg-card)] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
               <div className="px-5 py-4 bg-[var(--bg-body)] border-b border-[var(--border-color)] flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{editingBranch ? "Edit Office" : "New Office"}</h3>
                  <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><X size={16}/></button>
               </div>
               <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Branch Identity</label>
                    <input className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all uppercase" value={formData.branchName} onChange={(e) => setFormData({...formData, branchName: e.target.value})} placeholder="BRANCH NAME" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Physical Location</label>
                    <input className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all uppercase" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="CITY / REGION" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Operation Status</label>
                    <select className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold outline-none transition-all uppercase" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">Save Changes</button>
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
                 <button onClick={() => setConfirm({ ...confirm, open: false })} className="flex-1 py-1.5 text-[9px] font-black uppercase text-slate-400 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all">Cancel</button>
                 <button onClick={() => { confirm.onConfirm(); setConfirm({ ...confirm, open: false }); }} className="flex-1 py-1.5 text-[9px] font-black uppercase bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 active:scale-95 transition-all">Confirm</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}