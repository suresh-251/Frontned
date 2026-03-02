import React, { useState, useEffect } from "react";
import { getDepartmentRoles, createDepartmentRole, deleteDepartmentRole } from "../../api/dept/deptRole.api";
import { getDepartments } from "../../api/hr.dept";
import { ShieldCheck, Plus, Search, Trash2, Edit2, Loader2, X, Star, Briefcase } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function DeptRole() {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    roleName: "",
    requiredSkillLevel: "",
    performanceLevel: "",
    departmentId: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roleRes, deptRes] = await Promise.all([
        getDepartmentRoles(),
        getDepartments()
      ]);
      setRoles(roleRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      toast.error("Failed to sync role data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = toast.loading("Saving role...");
    try {
      const payload = { ...formData, departmentId: parseInt(formData.departmentId) };
      await createDepartmentRole(payload);
      toast.success("Role created successfully", { id: tid });
      setShowModal(false);
      setFormData({ roleName: "", requiredSkillLevel: "", performanceLevel: "", departmentId: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating role", { id: tid });
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure?")) return;
    try {
      await deleteDepartmentRole(id);
      toast.success("Role deleted");
      fetchData();
    } catch (err) {
      toast.error("Could not delete role");
    }
  };

  const filteredRoles = roles.filter(r => 
    r.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.departmentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Department Roles</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Designations & Skills</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus size={18} /> Create New Role
        </button>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search roles or departments..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Skill Level</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-24 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={32} />
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading Roles...</span>
                  </td>
                </tr>
              ) : filteredRoles.map((role) => (
                <tr key={role.departmentRoleId} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
                        <ShieldCheck size={20} />
                      </div>
                      <span className="font-black text-slate-700">{role.roleName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                      {role.departmentName || `ID: ${role.departmentId}`}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      {role.requiredSkillLevel}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete(role.departmentRoleId)} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 pt-8 pb-4 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Create Designation</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Role Title</label>
                <input 
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700"
                  placeholder="e.g. Senior Developer"
                  value={formData.roleName}
                  onChange={(e) => setFormData({...formData, roleName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Department</label>
                <select 
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 appearance-none"
                  value={formData.departmentId}
                  onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                >
                  <option value="">Select Dept</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.departmentName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Skill Level</label>
                <input 
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700"
                  placeholder="e.g. Expert"
                  value={formData.requiredSkillLevel}
                  onChange={(e) => setFormData({...formData, requiredSkillLevel: e.target.value})}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Performance Criteria</label>
                <input 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700"
                  placeholder="e.g. High Performance"
                  value={formData.performanceLevel}
                  onChange={(e) => setFormData({...formData, performanceLevel: e.target.value})}
                />
              </div>

              <div className="col-span-2 flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100">Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}