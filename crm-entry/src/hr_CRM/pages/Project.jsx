import React, { useEffect, useState, useMemo } from "react";
import {
  Briefcase, Plus, Search, Trash2,
  User, Loader2, Edit3, Clock, MapPin, Lock, CheckCircle2, X, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// CONFIG & AUTH IMPORTS
import { hasPermission } from "../configs/auth.utils";
import PermissionGate from "../configs/Gaurd/PermissionsGate";

// API IMPORTS
import { getProjects, createProject, updateProject, deleteProject } from "../api/project.api";
import { getManagers } from "../../api/users/users.api";
import { getDepartments } from "../api/hr.dept";
import { getBranches } from "../api/api.branch";

export default function Project() {
  const [projects, setProjects]       = useState([]);
  const [managers, setManagers]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [searchTerm, setSearchTerm]   = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [modalBranchId, setModalBranchId]         = useState("");

  const [confirm, setConfirm] = useState({ open: false, title: "", message: "", onConfirm: null });

  const [formData, setFormData] = useState({
    projectName: "", duration: "", status: "Active", managerId: "", departmentId: "",
  });

  // PERMISSION FLAGS
  const canView   = hasPermission("PROJECT_VIEW");
  const canCreate = hasPermission("PROJECT_CREATE");
  const canUpdate = hasPermission("PROJECT_UPDATE");
  const canDelete = hasPermission("PROJECT_DELETE");

  const showPanel = canCreate || canUpdate;

  const loadAllData = async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const [proj, depts, mans, branc] = await Promise.all([
        getProjects(),
        getDepartments(),
        getManagers("SOCIALMEDIA"),
        getBranches()
      ]);
      setProjects(proj || []);
      setDepartments(depts || []);
      setManagers(mans || []);
      setBranches(branc || []);
    } catch (err) {
      if (err?.response?.status !== 403) toast.error("Data Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, [canView]);

  // Departments filtered by selected branch in the form modal
  const modalFilteredDepts = useMemo(() => {
    if (!modalBranchId) return [];
    return departments.filter(d => Number(d.branchId) === Number(modalBranchId));
  }, [modalBranchId, departments]);

  // Projects filtered by branch filter + search
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const dept   = departments.find(d => d.departmentName === p.departmentName);
      const matchesBranch = !selectedBranchId || Number(dept?.branchId) === Number(selectedBranchId);
      const matchesSearch = !searchTerm || p.projectName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesBranch && matchesSearch;
    });
  }, [projects, departments, selectedBranchId, searchTerm]);

  const triggerConfirm = (title, message, onConfirm) => {
    setConfirm({ open: true, title, message, onConfirm });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId && !canUpdate) return toast.error("Unauthorized Action");
    if (!editingId && !canCreate) return toast.error("Unauthorized Action");

    const action = editingId ? "Update status?" : "Create this project?";
    triggerConfirm(editingId ? "Update Project" : "New Project", action, async () => {
      const tid = toast.loading(editingId ? "Updating..." : "Creating...");
      try {
        if (editingId) {
          await updateProject(editingId, formData);
          toast.success("Status Updated", { id: tid });
        } else {
          await createProject(formData);
          toast.success("Project Created", { id: tid });
        }
        resetForm();
        loadAllData();
      } catch (err) {
        toast.error("Process Failed", { id: tid });
      }
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setModalBranchId("");
    setFormData({ projectName: "", duration: "", status: "Active", managerId: "", departmentId: "" });
  };

  const handleEdit = (p) => {
    if (!canUpdate) return toast.error("Unauthorized Action");
    const dept   = departments.find(d => d.departmentName === p.departmentName);
    const branch = branches.find(b => String(b.branchId) === String(dept?.branchId));
    setEditingId(p.projectId);
    setModalBranchId(branch?.branchId?.toString() || "");
    setFormData({
      projectName:  p.projectName,
      duration:     p.duration,
      status:       p.status || "Active",
      managerId:    p.managerId,
      departmentId: dept?.departmentId || p.departmentId
    });
  };

  const handleDelete = (id) => {
    if (!canDelete) return toast.error("Unauthorized Action");
    triggerConfirm("Delete Project", "Permanently remove this project?", async () => {
      const tid = toast.loading("Removing...");
      try {
        await deleteProject(id);
        toast.success("Deleted", { id: tid });
        loadAllData();
      } catch {
        toast.error("Delete Failed", { id: tid });
      }
    });
  };

  const getDeptInfo = (deptName) => {
    const dept   = departments.find(d => d.departmentName === deptName);
    if (!dept) return { name: deptName || "N/A", location: "HQ", branchName: "" };
    const branch = branches.find(b => String(b.branchId) === String(dept.branchId));
    return {
      name:       dept.departmentName,
      branchName: branch?.branchName || "",
      location:   branch?.location || branch?.branchName || "HQ"
    };
  };

  // PAGE GUARD
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center transition-colors duration-300">
        <div className="bg-[var(--bg-card)] p-6 rounded-full mb-4 border border-[var(--border-color)] shadow-sm">
          <Lock size={40} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight leading-none">Access Restricted</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">Project clearance required</p>
      </div>
    );
  }

  return (
    <div className="flex h-[520px] w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm font-sans mt-1 transition-colors duration-300">
      <Toaster position="top-right" />

      {/* LEFT PANEL — create / update form */}
      {showPanel && (
        <div className="w-80 border-r border-[var(--border-color)] flex flex-col shrink-0 bg-[var(--bg-card)]">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-body)]/50">
            <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
              {editingId ? <CheckCircle2 size={14} /> : <Plus size={14} />}
              {editingId ? "Update Project Status" : "Add Project"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!canCreate && !editingId ? (
              <p className="text-[9px] font-black text-slate-400 uppercase text-center mt-8 opacity-60">
                Click edit on a project to update its status
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Title</label>
                  <input
                    disabled={!!editingId}
                    type="text" name="projectName" value={formData.projectName}
                    onChange={handleChange} required placeholder="PROJECT NAME"
                    className={`w-full text-[10px] font-black uppercase border border-[var(--border-color)] p-2 rounded-lg outline-none ${editingId ? "bg-slate-100 text-slate-400" : "bg-[var(--bg-body)] text-[var(--text-main)]"}`}
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Duration</label>
                  <input
                    disabled={!!editingId}
                    type="text" name="duration" value={formData.duration}
                    onChange={handleChange} required placeholder="e.g. 1 YEAR"
                    className={`w-full text-[10px] font-bold border border-[var(--border-color)] p-2 rounded-lg outline-none ${editingId ? "bg-slate-100 text-slate-400" : "bg-[var(--bg-body)] text-[var(--text-main)]"}`}
                  />
                </div>

                {/* Status — always editable */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-indigo-500 uppercase ml-1">Status</label>
                  <select
                    name="status" value={formData.status} onChange={handleChange}
                    className="w-full text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] p-2 rounded-lg uppercase outline-none text-[var(--text-main)] cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="InProgress">InProgress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                {/* Manager */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Manager</label>
                  <select
                    disabled={!!editingId} required
                    name="managerId" value={formData.managerId} onChange={handleChange}
                    className={`w-full text-[10px] font-bold border border-[var(--border-color)] p-2 rounded-lg outline-none ${editingId ? "bg-slate-100 text-slate-400" : "bg-[var(--bg-body)] text-[var(--text-main)]"}`}
                  >
                    <option value="">SELECT MANAGER...</option>
                    {managers.map(m => <option key={m.userId} value={m.userId}>{m.name}</option>)}
                  </select>
                </div>

                {/* Branch — cascading */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Branch & Location</label>
                  <select
                    disabled={!!editingId} required
                    value={modalBranchId}
                    onChange={e => { setModalBranchId(e.target.value); setFormData(prev => ({ ...prev, departmentId: "" })); }}
                    className={`w-full text-[10px] font-bold border border-[var(--border-color)] p-2 rounded-lg outline-none ${editingId ? "bg-slate-100 text-slate-400" : "bg-[var(--bg-body)] text-[var(--text-main)]"}`}
                  >
                    <option value="">SELECT BRANCH...</option>
                    {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName} — {b.location}</option>)}
                  </select>
                </div>

                {/* Department — filtered by branch */}
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Department</label>
                  <select
                    disabled={!!editingId || !modalBranchId} required
                    name="departmentId" value={formData.departmentId} onChange={handleChange}
                    className={`w-full text-[10px] font-bold border border-[var(--border-color)] p-2 rounded-lg outline-none disabled:opacity-40 ${editingId ? "bg-slate-100 text-slate-400" : "bg-[var(--bg-body)] text-[var(--text-main)]"}`}
                  >
                    <option value="">SELECT DEPT...</option>
                    {modalFilteredDepts.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg hover:bg-indigo-700 transition active:scale-95"
                >
                  {editingId ? "Update Status" : "Confirm Project"}
                </button>
                {editingId && (
                  <button
                    type="button" onClick={resetForm}
                    className="w-full py-2 bg-[var(--bg-body)] text-slate-400 text-[9px] font-black uppercase rounded-lg border border-[var(--border-color)]"
                  >Cancel</button>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* RIGHT PANEL — project list */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-card)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] shrink-0 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><Briefcase size={18} /></div>
            <h2 className="text-xs font-black text-[var(--text-main)] uppercase tracking-tight">Project Hub</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Branch filter */}
            <select
              className="text-[10px] font-bold bg-[var(--bg-card)] border border-[var(--border-color)] p-2 rounded-lg outline-none text-[var(--text-main)]"
              value={selectedBranchId}
              onChange={e => setSelectedBranchId(e.target.value)}
            >
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.branchId} value={b.branchId}>{b.branchName} ({b.location})</option>)}
            </select>
            {/* Search */}
            <div className="relative w-40">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                type="text" placeholder="Filter..."
                className="w-full text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg pl-8 py-1.5 outline-none text-[var(--text-main)]"
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-500" size={24} />
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Project</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Meta Resources</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                    {(canUpdate || canDelete) && (
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/30">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-16 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        No projects found
                      </td>
                    </tr>
                  ) : filteredProjects.map(p => {
                    const deptInfo = getDeptInfo(p.departmentName);
                    return (
                      <tr key={p.projectId} className="hover:bg-indigo-500/[0.01] transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-[10px] font-black text-[var(--text-main)] uppercase mb-1">{p.projectName}</p>
                          <div className="flex items-center gap-1 opacity-70">
                            <Clock size={8} className="text-indigo-500" />
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{p.duration}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <User size={10} className="text-slate-400" />
                              <span className="text-[9px] font-bold text-[var(--text-main)] opacity-80 uppercase">
                                {managers.find(m => m.userId === p.managerId)?.name || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin size={10} className="text-slate-400" />
                              <span className="text-[8px] font-medium text-slate-400 uppercase">
                                {deptInfo.name}
                                {deptInfo.branchName && (
                                  <> • <span className="text-indigo-500 font-black">{deptInfo.branchName}</span></>
                                )}
                                {deptInfo.location && deptInfo.location !== deptInfo.branchName && (
                                  <> • <span className="text-slate-500">{deptInfo.location}</span></>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${
                            p.status === "Active"     ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            p.status === "InProgress" ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" :
                            p.status === "Pending"    ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                            p.status === "Completed"  ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                                        "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          }`}>{p.status || "Active"}</span>
                        </td>
                        {(canUpdate || canDelete) && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <PermissionGate permission="PROJECT_UPDATE">
                                <button
                                  onClick={() => handleEdit(p)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-all"
                                >
                                  <Edit3 size={13} />
                                </button>
                              </PermissionGate>
                              <PermissionGate permission="PROJECT_DELETE">
                                <button
                                  onClick={() => handleDelete(p.projectId)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </PermissionGate>
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
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirm.open && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-[280px] p-5 text-center"
            >
              <AlertCircle size={28} className="mx-auto text-amber-500 mb-2" />
              <h3 className="text-[11px] font-black uppercase text-slate-800 mb-1">{confirm.title}</h3>
              <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight mb-5">{confirm.message}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirm(prev => ({ ...prev, open: false }))}
                  className="flex-1 py-1.5 text-[9px] font-black uppercase text-slate-400 bg-slate-50 rounded-lg"
                >No</button>
                <button
                  onClick={() => { confirm.onConfirm(); setConfirm(prev => ({ ...prev, open: false })); }}
                  className="flex-1 py-1.5 text-[9px] font-black uppercase bg-indigo-600 text-white rounded-lg shadow-md"
                >Yes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
