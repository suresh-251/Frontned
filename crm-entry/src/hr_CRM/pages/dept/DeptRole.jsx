import React, { useState, useEffect } from "react";
import { getDepartmentRoles, createDepartmentRole, deleteDepartmentRole } from "../../api/dept/deptRole.api";
import { getDepartments } from "../../api/hr.dept";
import { ShieldCheck, Plus, Search, Trash2, Loader2, X, Star, MapPin } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function DeptRole() {
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    roleName: "", requiredSkillLevel: "", performanceLevel: "", departmentId: ""
  });

  const fetchData = async () => {
    try {
      const [roleRes, deptRes] = await Promise.all([getDepartmentRoles(), getDepartments()]);
      setRoles(roleRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) { toast.error("Sync failed"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = toast.loading("Saving...");
    try {
      await createDepartmentRole({ ...formData, departmentId: parseInt(formData.departmentId) });
      toast.success("Role Created", { id: tid });
      setShowModal(false);
      setFormData({ roleName: "", requiredSkillLevel: "", performanceLevel: "", departmentId: "" });
      fetchData();
    } catch (err) { toast.error("Submission failed", { id: tid }); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this role?")) return;
    try {
      await deleteDepartmentRole(id);
      toast.success("Deleted");
      fetchData();
    } catch (err) { toast.error("Error deleting"); }
  };

  const filteredRoles = roles.filter(r => 
    r.roleName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // Max-width restricted to 800px to keep columns tight
    <div className="p-4 max-w-[850px] mx-auto">
      <Toaster />

      {/* TIGHT HEADER */}
      <div className="flex justify-between items-end mb-4 px-1">
        <div>
          <h1 className="text-sm font-black text-slate-800 uppercase tracking-tighter">Designations</h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Skill & Performance Matrix</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input 
              type="text" 
              placeholder="Filter..." 
              className="pl-7 pr-2 py-1 bg-slate-100 border-none rounded-md text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none w-32" 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase flex items-center gap-1 hover:bg-indigo-700 transition-all">
            <Plus size={12} /> New Role
          </button>
        </div>
      </div>

      {/* COMPACT TABLE - Snap-to-column layout */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full table-fixed text-left text-[11px]">
          <thead className="bg-slate-50 border-b font-bold text-slate-500 uppercase tracking-tighter">
            <tr>
              <th className="px-3 py-2 w-[40%]">Role Title & Branch</th>
              <th className="px-3 py-2 w-[25%]">Skill Level</th>
              <th className="px-3 py-2 w-[25%]">Performance</th>
              <th className="px-3 py-2 w-[10%] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="4" className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={16} /></td></tr>
            ) : filteredRoles.map((role) => {
              const dept = departments.find(d => d.id === role.departmentId);
              return (
                <tr key={role.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-2">
                    <div className="font-black text-slate-800 truncate">{role.roleName}</div>
                    <div className="text-[9px] text-slate-400 font-bold flex items-center gap-0.5 truncate uppercase">
                      <MapPin size={8}/> {dept?.departmentName || "General"}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <Star size={10} className="fill-amber-500 text-amber-500" /> {role.requiredSkillLevel}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500 font-medium truncate italic">
                    {role.performanceLevel || "Standard"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => handleDelete(role.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                      <Trash2 size={13}/>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* SLIM DIALOG MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-[1px] p-4">
          <div className="bg-white w-full max-w-[280px] rounded-xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-3 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-[10px] font-black text-slate-700 uppercase">Role Details</h2>
              <button onClick={() => setShowModal(false)}><X size={14}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 ml-0.5">Title</label>
                <input required className="w-full mt-0.5 p-2 bg-slate-50 border rounded text-[11px] font-bold outline-none" 
                  value={formData.roleName} onChange={(e) => setFormData({...formData, roleName: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 ml-0.5">Dept (Location)</label>
                <select required className="w-full mt-0.5 p-2 bg-slate-50 border rounded text-[11px] font-bold outline-none"
                  value={formData.departmentId} onChange={(e) => setFormData({...formData, departmentId: e.target.value})}>
                  <option value="">Select...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.departmentName} — {d.location || 'Branch'}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400">Skill</label>
                  <input required className="w-full mt-0.5 p-2 bg-slate-50 border rounded text-[11px] font-bold" 
                    value={formData.requiredSkillLevel} onChange={(e) => setFormData({...formData, requiredSkillLevel: e.target.value})} />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400">Perf.</label>
                  <input className="w-full mt-0.5 p-2 bg-slate-50 border rounded text-[11px] font-bold" 
                    value={formData.performanceLevel} onChange={(e) => setFormData({...formData, performanceLevel: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-md">
                Confirm
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}