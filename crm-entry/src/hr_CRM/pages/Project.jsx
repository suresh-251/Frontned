import React, { useEffect, useState, useMemo } from "react";
import { 
  Briefcase, Plus, Search, Trash2, 
  User, Loader2, Edit3, Clock, MapPin, Lock, CheckCircle2
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

// API IMPORTS
import { getProjects, createProject, updateProject, deleteProject } from "../api/project.api";
import { getManagers } from "../../api/users/users.api";
import { getDepartments } from "../api/hr.dept";
import { getBranches } from "../api/api.branch";

export default function Project() {
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    projectName: "", duration: "", status: "Active", managerId: "", departmentId: "",
  });

  const token = localStorage.getItem("accessToken");
  const auth = useMemo(() => {
    if (!token) return { perms: [], isAdmin: false };
    try {
      const decoded = jwtDecode(token);
      const perms = decoded.perm || [];
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      return { perms, isAdmin: role === "ADMIN" || perms.includes("CRM_FULL_ACCESS") };
    } catch (e) { return { perms: [], isAdmin: false }; }
  }, [token]);

  const canView   = auth.isAdmin || auth.perms.includes("PROJECT_VIEW");
  const isManager = auth.isAdmin || auth.perms.includes("PROJECT_CREATE") || auth.perms.includes("PROJECT_MANAGE");

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
      toast.error("Data Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, [canView]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isManager) return toast.error("Unauthorized Action");
    try {
      if (editingId) {
        // Only status is allowed to change logic-wise here as per UI restriction
        await updateProject(editingId, formData);
        toast.success("Status Updated");
      } else {
        await createProject(formData);
        toast.success("Project Created");
      }
      resetForm();
      loadAllData();
    } catch (err) {
      toast.error("Process Failed");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ projectName: "", duration: "", status: "Active", managerId: "", departmentId: "" });
  };

  const handleEdit = (p) => {
    setEditingId(p.projectId);
    // Find department ID by name to map back to the dropdown ID
    const dept = departments.find(d => d.departmentName === p.departmentName);
    setFormData({
      projectName: p.projectName,
      duration: p.duration,
      status: p.status || "Active",
      managerId: p.managerId,
      departmentId: dept?.departmentId || p.departmentId
    });
  };

  const handleDelete = async (id) => {
    if (!isManager) return toast.error("Unauthorized Action");
    if (!window.confirm("Permanent Delete?")) return;
    try {
      await deleteProject(id);
      toast.success("Deleted");
      loadAllData();
    } catch (err) {
      toast.error("Delete Failed");
    }
  };

  const getDeptInfo = (deptName) => {
    const dept = departments.find(d => d.departmentName === deptName);
    if (!dept) return { name: deptName || "N/A", location: "HQ" };
    const branch = branches.find(b => String(b.branchId) === String(dept.branchId));
    return {
      name: dept.departmentName,
      location: branch?.location || branch?.branchName || "HQ"
    };
  };

  if (!canView) return <div className="h-[520px] flex items-center justify-center opacity-30 font-black uppercase text-[10px]">Access Denied</div>;

  return (
    <div className="flex h-[520px] w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm font-sans mt-1 transition-colors duration-300">
      <Toaster position="top-right" />

      {isManager && (
        <div className="w-80 border-r border-[var(--border-color)] flex flex-col shrink-0 bg-[var(--bg-card)]">
          <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-body)]/50">
            <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
              {editingId ? <CheckCircle2 size={14} /> : <Plus size={14} />} 
              {editingId ? "Update Project Status" : "Add Project"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Title</label>
                 <input disabled={!!editingId} type="text" name="projectName" value={formData.projectName} onChange={handleChange} required placeholder="PROJECT NAME" className={`w-full text-[10px] font-black uppercase border border-[var(--border-color)] p-2 rounded-lg outline-none ${editingId ? 'bg-slate-100 text-slate-400' : 'bg-[var(--bg-body)] text-[var(--text-main)]'}`} />
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Duration</label>
                 <input disabled={!!editingId} type="text" name="duration" value={formData.duration} onChange={handleChange} required placeholder="e.g. 1 YEAR" className={`w-full text-[10px] font-bold border border-[var(--border-color)] p-2 rounded-lg outline-none ${editingId ? 'bg-slate-100 text-slate-400' : 'bg-[var(--bg-body)] text-[var(--text-main)]'}`} />
              </div>

              {/* Status remains ENABLED during update */}
              <div className="space-y-1">
                <label className="text-[8px] font-black text-indigo-500 uppercase ml-1">Current Protocol (Status)</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] p-2 rounded-lg uppercase outline-none text-[var(--text-main)] cursor-pointer">
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="InProgress">InProgress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Manager</label>
                <select disabled={!!editingId} required name="managerId" value={formData.managerId} onChange={handleChange} className={`w-full text-[10px] font-bold border border-[var(--border-color)] p-2 rounded-lg outline-none ${editingId ? 'bg-slate-100 text-slate-400' : 'bg-[var(--bg-body)] text-[var(--text-main)]'}`}>
                  <option value="">SELECT MANAGER...</option>
                  {managers.map(m => <option key={m.userId} value={m.userId}>{m.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Department</label>
                <select disabled={!!editingId} required name="departmentId" value={formData.departmentId} onChange={handleChange} className={`w-full text-[10px] font-bold border border-[var(--border-color)] p-2 rounded-lg outline-none ${editingId ? 'bg-slate-100 text-slate-400' : 'bg-[var(--bg-body)] text-[var(--text-main)]'}`}>
                  <option value="">SELECT DEPT...</option>
                  {departments.map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg hover:bg-indigo-700 transition active:scale-95">
                {editingId ? "Update Status" : "Confirm Project"}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="w-full py-2 bg-[var(--bg-body)] text-slate-400 text-[9px] font-black uppercase rounded-lg border border-[var(--border-color)]">Cancel</button>
              )}
            </form>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-card)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><Briefcase size={18} /></div>
            <h2 className="text-xs font-black text-[var(--text-main)] uppercase tracking-tight">Project Hub</h2>
          </div>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input type="text" placeholder="Filter..." className="w-full text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg pl-8 py-1.5 outline-none text-[var(--text-main)]" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
          ) : (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Project</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Meta Resources</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                    {isManager && <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/30">
                  {projects.filter(p => p.projectName?.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => {
                    const deptInfo = getDeptInfo(p.departmentName);
                    return (
                      <tr key={p.projectId} className="hover:bg-indigo-500/[0.01] transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-[10px] font-black text-[var(--text-main)] uppercase mb-1">{p.projectName}</p>
                          <div className="flex items-center gap-1 opacity-70">
                            <Clock size={8} className="text-indigo-500"/><span className="text-[8px] font-bold text-slate-400 uppercase">{p.duration}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                  <User size={10} className="text-slate-400"/>
                                  <span className="text-[9px] font-bold text-[var(--text-main)] opacity-80 uppercase">{managers.find(m => m.userId === p.managerId)?.name || "N/A"}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                  <MapPin size={10} className="text-slate-400"/>
                                  <span className="text-[8px] font-medium text-slate-400 uppercase">
                                    {deptInfo.name} • <span className="text-indigo-500 font-black">{deptInfo.location}</span>
                                  </span>
                              </div>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${
                               p.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                               p.status === 'InProgress' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' : 
                               p.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                               p.status === 'Completed' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>{p.status || 'Active'}</span>
                        </td>
                        {isManager && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-all"><Edit3 size={13}/></button>
                              <button onClick={() => handleDelete(p.projectId)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={13}/></button>
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
    </div>
  );
}