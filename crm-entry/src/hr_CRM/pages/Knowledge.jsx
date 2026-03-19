import { useEffect, useState, useMemo } from "react";
import {
  BookOpen, Plus, Search, Trash2,
  Tag, Loader2, Layers, Lock
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// ✅ CONFIG & AUTH IMPORTS
import { hasPermission } from "../configs/auth.utils";
import PermissionGate from "../configs/Gaurd/PermissionsGate";

// API IMPORTS
import {
  getKnowledgeList,
  createKnowledge,
  deleteKnowledge,
} from "../api/api.knowledge";
import { getBranches } from "../api/api.branch";
import { getManagers } from "../../api/users/users.api";

export default function Knowledge() {
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    branchId: "",
    recordType: "Knowledge",
    code: "",
    title: "",
    category: "",
    subCategory: "",
    summary: "",
    approvalStatus: "Pending",
    approvedBy: "",
    visibility: "Internal",
    status: "Active",
    createdBy: "",
  });

  // ✅ PERMISSION LOGIC
  const canView   = hasPermission("KNOWLEDGE_VIEW");
  const canCreate = hasPermission("KNOWLEDGE_CREATE");
  const canDelete = hasPermission("KNOWLEDGE_DELETE");

  const categoryMap = {
    "IT Infrastructure": ["Database", "Networking", "Cloud", "DevOps"],
    "Software Development": ["Frontend", "Backend", "APIs", "Testing"],
    "Security": ["Access Control", "Encryption", "Vulnerability Management"],
    "HR Systems": ["Payroll", "Onboarding", "Attendance"],
    "Finance Systems": ["Budgeting", "Auditing", "Taxation"],
    "Customer Support": ["Documentation", "Ticketing", "SLA"],
    "Marketing Tools": ["SEO", "Analytics", "Campaigns"],
    "Compliance": ["ISO", "GDPR", "Local Laws"]
  };

  const fetchData = async () => {
    if (!canView) return;
    try {
      setLoading(true);
      const [kData, bData, mData] = await Promise.all([
        getKnowledgeList(),
        canCreate ? getBranches()            : Promise.resolve([]),
        canCreate ? getManagers("SOCIALMEDIA") : Promise.resolve([])
      ]);
      const list = kData || [];
      setKnowledgeList(list);
      setBranches(bData || []);
      setManagers(mData || []);
      const nextNum = (list.length + 1).toString().padStart(3, "0");
      setFormData(prev => ({ ...prev, code: `KNW-${nextNum}` }));
    } catch (err) {
      if (err.response?.status !== 403) toast.error("Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [canView]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
        setFormData(prev => ({ ...prev, category: value, subCategory: "" }));
    } else if (name === "managerSelection") {
        const selectedMgr = managers.find(m => String(m.userId) === String(value));
        setFormData(prev => ({ ...prev, approvedBy: selectedMgr?.name || "", createdBy: value }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreate) return toast.error("Unauthorized");
    const tid = toast.loading("Processing...");
    try {
      const payload = { ...formData, branchId: Number(formData.branchId), createdBy: Number(formData.createdBy) };
      await createKnowledge(payload);
      toast.success("Added", { id: tid });
      setFormData({
        branchId: "", recordType: "Knowledge", code: "", title: "",
        category: "", subCategory: "", summary: "",
        approvalStatus: "Pending", approvedBy: "",
        visibility: "Internal", status: "Active", createdBy: "",
      });
      fetchData();
    } catch (err) { toast.error("Failed", { id: tid }); }
  };

  const handleDelete = async (id) => {
    if (!canDelete) return toast.error("Unauthorized");
    if (!window.confirm("Deactivate?")) return;
    const tid = toast.loading("Deactivating...");
    try {
      await deleteKnowledge(id);
      toast.success("Deactivated", { id: tid });
      fetchData();
    } catch (err) { toast.error("Failed", { id: tid }); }
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-[520px] w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
        <Lock size={40} className="text-slate-400 mb-4" />
        <h2 className="text-lg font-black text-[var(--text-main)] uppercase">Access Restricted</h2>
      </div>
    );
  }

  const filteredKnowledge = knowledgeList.filter(item =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[520px] w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm font-sans text-[var(--text-main)]">
      <Toaster position="top-right" />

      {/* LEFT SIDEBAR — only visible with KNOWLEDGE_CREATE */}
      <PermissionGate permission="KNOWLEDGE_CREATE">
        <div className="w-80 border-r border-[var(--border-color)] flex flex-col shrink-0 bg-[var(--bg-card)]">
          <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-body)]/50 flex justify-between items-center">
            <h2 className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-2"><Plus size={14} /> New Knowledge</h2>
            <span className="text-[9px] font-black bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded border border-indigo-500/20">{formData.code}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <select name="branchId" value={formData.branchId} onChange={handleChange} required className="text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg outline-none text-[var(--text-main)] uppercase">
                  <option value="">Branch</option>
                  {branches.map(b => <option key={b.branchId || b.id} value={b.branchId || b.id}>{b.branchName || b.name}</option>)}
                </select>
                <select name="managerSelection" value={formData.createdBy} onChange={handleChange} required className="text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg outline-none text-[var(--text-main)] uppercase">
                  <option value="">Manager</option>
                  {managers.map(m => <option key={m.userId} value={m.userId}>{m.name}</option>)}
                </select>
              </div>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="TITLE" className="w-full text-[10px] font-black uppercase bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg outline-none" required />
              <div className="grid grid-cols-2 gap-2">
                <select name="category" value={formData.category} onChange={handleChange} required className="w-full text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg outline-none">
                  <option value="">Category</option>
                  {Object.keys(categoryMap).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select name="subCategory" value={formData.subCategory} onChange={handleChange} required disabled={!formData.category} className="w-full text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg outline-none disabled:opacity-50">
                  <option value="">Sub-Category</option>
                  {formData.category && categoryMap[formData.category].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
              <textarea name="summary" value={formData.summary} onChange={handleChange} placeholder="SUMMARY..." className="w-full text-[10px] bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg h-16 outline-none resize-none" required />
              <div className="grid grid-cols-2 gap-2">
                <select name="visibility" value={formData.visibility} onChange={handleChange} className="w-full text-[9px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg uppercase">
                  <option value="Internal">Internal</option>
                  <option value="Public">Public</option>
                </select>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full text-[9px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg uppercase">
                  <option value="Active">Active</option>
                  <option value="InProgress">InProgress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 transition active:scale-95">Submit Record</button>
            </form>
          </div>
        </div>
      </PermissionGate>

      {/* MAIN TABLE */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-card)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500"><BookOpen size={16} /></div>
            <h2 className="text-xs font-black uppercase tracking-tight">Knowledge Base</h2>
          </div>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input type="text" placeholder="Search..." className="w-full text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg pl-8 py-1 outline-none" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2 custom-scrollbar">
          {loading ? <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div> : (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase">Reference</th>
                    <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase text-center">Classification</th>
                    <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase text-center">Control</th>
                    {canDelete && <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/30">
                  {filteredKnowledge.map((item) => (
                    <tr key={item.id} className="hover:bg-indigo-500/[0.02]">
                      <td className="px-3 py-2">
                        <p className="text-[10px] font-black uppercase mb-1">{item.title}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-[8px] font-black px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 rounded uppercase border border-indigo-500/10">{item.code}</span>
                           <span className="text-[8px] font-bold text-slate-400 uppercase">ID: {item.id ?? item.knowledgeId ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[8px] font-black uppercase text-slate-500">
                            {item.category || 'N/A'}
                          </span>
                          <span className="text-[7px] font-bold text-slate-400 uppercase">{item.subCategory}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex flex-col items-center gap-1">
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                             item.status === 'Active' || item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                             item.status === 'InProgress' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                             'bg-slate-100 text-slate-400 border-transparent'
                           }`}>{item.status}</span>
                           <span className="text-[7px] font-bold text-slate-400 uppercase italic">By: {item.approvedBy || 'Admin'}</span>
                        </div>
                      </td>
                      {canDelete && (
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 border border-[var(--border-color)] rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"><Trash2 size={13} /></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
