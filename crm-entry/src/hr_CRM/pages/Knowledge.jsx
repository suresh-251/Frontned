import { useEffect, useState, useMemo } from "react";
import { 
  BookOpen, Plus, Search, Trash2, 
  Tag, Loader2, Layers, MapPin, Hash, Building2
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useRole } from "../hooks/useRole"; 

// API IMPORTS
import { 
  getKnowledgeList, 
  createKnowledge, 
  deleteKnowledge, 
} from "../api/api.knowledge";
import { getBranches } from "../api/api.branch";
import { getManagers } from "../../api/users/users.api";

export default function Knowledge() {
  const { isManager, role: userRole } = useRole(); 
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
    try {
      setLoading(true);
      const [kData, bData, mData] = await Promise.all([
        getKnowledgeList(),
        getBranches(),
        getManagers("SOCIALMEDIA")
      ]);
      
      const list = kData || [];
      setKnowledgeList(list);
      setBranches(bData || []);
      setManagers(mData || []);

      const nextNum = (list.length + 1).toString().padStart(3, "0");
      setFormData(prev => ({ ...prev, code: `KNW-${nextNum}` }));

    } catch (err) {
      toast.error("Sync Error: Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
    const tid = toast.loading("Processing...");
    try {
      const payload = {
        ...formData,
        branchId: Number(formData.branchId),
        createdBy: Number(formData.createdBy),
      };
      await createKnowledge(payload);
      toast.success("Record Added", { id: tid });
      setFormData({
        branchId: "", recordType: "Knowledge", code: "", title: "",
        category: "", subCategory: "", summary: "",
        approvalStatus: "Pending", approvedBy: "",
        visibility: "Internal", status: "Active", createdBy: "",
      });
      fetchData();
    } catch (err) {
      toast.error("Failed to add record", { id: tid });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this record?")) return;
    const tid = toast.loading("Deactivating...");
    try {
      await deleteKnowledge(id);
      toast.success("Record Deactivated", { id: tid });
      fetchData();
    } catch (err) {
      toast.error("Deactivation failed", { id: tid });
    }
  };

  const filteredKnowledge = knowledgeList.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[520px] w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm font-sans mt-0 transition-colors duration-300 text-[var(--text-main)]">
      <Toaster position="top-right" />

      {/* LEFT SIDEBAR */}
      {(isManager || userRole === "ADMIN") && (
        <div className="w-80 border-r border-[var(--border-color)] flex flex-col shrink-0 bg-[var(--bg-card)]">
          <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-body)]/50 flex justify-between items-center">
            <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
              <Plus size={14} /> New Knowledge Base
            </h2>
            <span className="text-[9px] font-black bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded border border-indigo-500/20">{formData.code}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Branch & Manager</label>
                 <div className="grid grid-cols-2 gap-2">
                    <select name="branchId" value={formData.branchId} onChange={handleChange} required className="text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500/20 text-[var(--text-main)] uppercase">
                      <option value="">Branch</option>
                      {branches.map(b => <option key={b.branchId || b.id} value={b.branchId || b.id}>{b.branchName || b.name}</option>)}
                    </select>
                    <select name="managerSelection" value={formData.createdBy} onChange={handleChange} required className="text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500/20 text-[var(--text-main)] uppercase">
                      <option value="">Manager</option>
                      {managers.map(m => <option key={m.userId} value={m.userId}>{m.name}</option>)}
                    </select>
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="RECORD TITLE" className="w-full text-[10px] font-black uppercase bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg text-[var(--text-main)] outline-none" required />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} required className="w-full text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg outline-none text-[var(--text-main)]">
                    <option value="">Select...</option>
                    {Object.keys(categoryMap).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Sub-Category</label>
                  <select name="subCategory" value={formData.subCategory} onChange={handleChange} required disabled={!formData.category} className="w-full text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg outline-none text-[var(--text-main)] disabled:opacity-50">
                    <option value="">Select...</option>
                    {formData.category && categoryMap[formData.category].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
              </div>

              <textarea name="summary" value={formData.summary} onChange={handleChange} placeholder="BRIEF SUMMARY..." className="w-full text-[10px] bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg h-16 outline-none text-[var(--text-main)] resize-none" required />

              <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Visibility</label>
                    <select name="visibility" value={formData.visibility} onChange={handleChange} className="w-full text-[9px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg uppercase text-[var(--text-main)]">
                      <option value="Internal">Internal</option>
                      <option value="Public">Public</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full text-[9px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] p-1.5 rounded-lg uppercase text-[var(--text-main)]">
                      <option value="Active">Active</option>
                      <option value="InProgress">InProgress</option>
                      <option value="Completed">Completed</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
              </div>

              <button type="submit" className="w-full py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition transform active:scale-95">
                Submit Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MAIN TABLE */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-card)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500">
                <BookOpen size={16} />
            </div>
            <div>
                <h2 className="text-xs font-black text-[var(--text-main)] uppercase tracking-tight">Knowledge Management</h2>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0">Total: {knowledgeList.length}</p>
            </div>
          </div>

          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input 
              type="text" placeholder="Search Repo..."
              className="w-full text-[10px] font-bold bg-[var(--bg-body)] border border-[var(--border-color)] rounded-lg pl-8 py-1 outline-none focus:ring-1 focus:ring-indigo-500/20 text-[var(--text-main)]"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-[var(--bg-body)]/20 p-2 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
          ) : (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm transition-colors">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-body)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-wider">Reference</th>
                    <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-wider">Classification</th>
                    <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-wider">Control</th>
                    {(isManager || userRole === "ADMIN") && <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/30">
                  {filteredKnowledge.length > 0 ? (
                    filteredKnowledge.map((item) => (
                      <tr key={item.id} className="hover:bg-indigo-500/[0.02] transition-colors group">
                        <td className="px-3 py-2">
                          <p className="text-[10px] font-black text-[var(--text-main)] uppercase leading-none mb-1">{item.title}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-[8px] font-black px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 rounded uppercase border border-indigo-500/10">{item.code || 'NO-CODE'}</span>
                             <span className="text-[8px] font-bold text-slate-400 uppercase">ID: {item.id}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                  <Tag size={10} className="text-slate-400"/>
                                  <span className="text-[9px] font-bold text-[var(--text-main)] opacity-80 uppercase">{item.category}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                  <Layers size={10} className="text-slate-400"/>
                                  <span className="text-[8px] font-medium text-slate-400 uppercase">{item.subCategory}</span>
                              </div>
                            </div>
                        </td>
                        <td className="px-3 py-2">
                            <div className="flex flex-col gap-1">
                               <span className={`w-fit px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase border ${
                                 item.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                               }`}>{item.status}</span>
                               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">By: {item.approvedBy || 'Admin'}</span>
                            </div>
                        </td>
                        {(isManager || userRole === "ADMIN") && (
                          <td className="px-3 py-2 text-right">
                            {/* Buttons are now directly visible, turn red on hover */}
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-16 text-center text-[9px] font-black text-slate-400 uppercase italic tracking-widest">Repository Empty</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}