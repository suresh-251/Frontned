import React, { useEffect, useState } from "react";
import { 
  Briefcase, Plus, Search, Trash2, 
  Calendar, User, Building, Loader2, 
  Edit3, Clock, MapPin, 
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

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

  const loadAllData = async () => {
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

  useEffect(() => { loadAllData(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProject(editingId, formData);
        toast.success("Project Updated");
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
    setFormData({
      projectName: p.projectName,
      duration: p.duration,
      status: p.status || "Active",
      managerId: p.managerId,
      departmentId: p.departmentId
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanent Delete?")) return;
    try {
      await deleteProject(id);
      toast.success("Deleted");
      loadAllData();
    } catch (err) {
      toast.error("Delete Failed");
    }
  };

  const getDeptInfo = (deptId) => {
    const dept = departments.find(d => String(d.departmentId) === String(deptId));
    if (!dept) return { name: "N/A", location: "Global" };
    const branch = branches.find(b => String(b.branchId) === String(dept.branchId));
    return {
      name: dept.departmentName,
      location: branch?.location || branch?.branchLocation || branch?.branchName || "HQ"
    };
  };

  const filteredProjects = projects.filter(p => 
    p.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[520px] w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm font-sans mt-1">
      <Toaster position="top-right" />

      {/* FORM SIDEBAR */}
      <div className="w-80 border-r border-slate-100 flex flex-col shrink-0 bg-white">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50">
          <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            {editingId ? <Edit3 size={14} /> : <Plus size={14} />} 
            {editingId ? "Update Project" : "Add Project"}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Title</label>
               <input type="text" name="projectName" value={formData.projectName} onChange={handleChange} required placeholder="PROJECT NAME" className="w-full text-[10px] font-black uppercase bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none" />
            </div>

            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Duration</label>
               <input type="text" name="duration" value={formData.duration} onChange={handleChange} required placeholder="e.g. 1 YEAR" className="w-full text-[10px] font-bold bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Lifecycle Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full text-[10px] font-bold bg-slate-50 border border-slate-200 p-2 rounded-lg uppercase outline-none">
                <option value="Active">Operational</option>
                <option value="Pending">In Pipeline</option>
                <option value="Completed">Closed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Manager</label>
              <select required name="managerId" value={formData.managerId} onChange={handleChange} className="w-full text-[10px] font-bold bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none">
                <option value="">SELECT MANAGER...</option>
                {managers.map(m => <option key={m.userId} value={m.userId}>{m.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Department Slot</label>
              <select required name="departmentId" value={formData.departmentId} onChange={handleChange} className="w-full text-[10px] font-bold bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none">
                <option value="">SELECT DEPT...</option>
                {departments.map(d => {
                  const branch = branches.find(b => String(b.branchId) === String(d.branchId));
                  return (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.departmentName} — {branch?.location || branch?.branchName || 'HQ'}
                    </option>
                  );
                })}
              </select>
            </div>

            <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition">
              {editingId ? "Save Changes" : "Confirm Project"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="w-full py-2 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-lg">Cancel</button>
            )}
          </form>
        </div>
      </div>

      {/* MAIN TABLE AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Briefcase size={18} /></div>
            <div>
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight">Project Hub</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control Panel</p>
            </div>
          </div>

          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
            <input 
              type="text" placeholder="Filter..."
              className="w-full text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg pl-8 py-1.5 outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50/20 p-4">
          {loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider w-1/3">Project</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider w-1/3">Meta Resources</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProjects.map((p) => {
                    const deptInfo = getDeptInfo(p.departmentId);
                    return (
                      <tr key={p.projectId} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-3">
                          <p className="text-[10px] font-black text-slate-800 uppercase leading-none mb-1">{p.projectName}</p>
                          <div className="flex items-center gap-1">
                            <Clock size={8} className="text-indigo-400"/>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{p.duration}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                 <User size={10} className="text-slate-300"/>
                                 <span className="text-[9px] font-bold text-slate-600 uppercase">
                                   {managers.find(m => String(m.userId) === String(p.managerId))?.name || "N/A"}
                                 </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                 <MapPin size={10} className="text-slate-300"/>
                                 <span className="text-[8px] font-medium text-slate-400 uppercase">
                                   {deptInfo.name} • <span className="text-indigo-600 font-bold">{deptInfo.location}</span>
                                 </span>
                              </div>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                           <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${
                             p.status === 'Active' ? 'bg-green-50 text-green-600 border-green-100' : 
                             p.status === 'Completed' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                           }`}>{p.status || 'Active'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"><Edit3 size={14}/></button>
                            <button onClick={() => handleDelete(p.projectId)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md"><Trash2 size={14}/></button>
                          </div>
                        </td>
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