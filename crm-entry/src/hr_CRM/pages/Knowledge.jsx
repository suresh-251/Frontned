import { useEffect, useState } from "react";
import { 
  BookOpen, Plus, Search, Trash2, 
  ShieldCheck, Globe, Tag, Hash, 
  Loader2, Layers, Info, MapPin
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// API IMPORTS
import { 
  getKnowledgeList, 
  createKnowledge, 
  deleteKnowledge, 
  // Using your specific API function
} from "../api/api.knowledge";
import { getBranches } from "../api/api.branch";

export default function Knowledge() {
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [branches, setBranches] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    branchId: "",
    recordType: "",
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

  const fetchData = async () => {
    try {
      setLoading(true);
      // Execute both calls in parallel for efficiency
      const [kData, bData] = await Promise.all([
        getKnowledgeList(),
        getBranches() 
      ]);
      setKnowledgeList(kData || []);
      setBranches(bData || []);
    } catch (err) {
      toast.error("Sync Error: Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Logic to find the location based on selected branchId
  const selectedBranch = branches.find(b => b.id === Number(formData.branchId));
  const selectedBranchLocation = selectedBranch ? selectedBranch.location : "Location";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tid = toast.loading("Processing...");
    try {
      await createKnowledge({
        ...formData,
        branchId: Number(formData.branchId),
        createdBy: Number(formData.createdBy),
      });
      toast.success("Record Added", { id: tid });
      setFormData({
        branchId: "", recordType: "", code: "", title: "",
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
    <div className="flex h-[520px] w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm font-sans mt-1">
      <Toaster position="top-right" />

      {/* LEFT SIDEBAR: ADD KNOWLEDGE FORM */}
      <div className="w-80 border-r border-slate-100 flex flex-col shrink-0 bg-white">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50">
          <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            <Plus size={14} /> New Knowledge Base
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* BRANCH DROPDOWN & LOCATION DISPLAY */}
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Branch Assignment</label>
               <div className="flex items-center gap-2">
                  <select 
                    name="branchId" 
                    value={formData.branchId} 
                    onChange={handleChange} 
                    required 
                    className="flex-1 text-[10px] font-bold bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-100 uppercase"
                  >
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branchName || branch.name || `Branch ${branch.id}`}
                      </option>
                    ))}
                  </select>
                  
                  {/* Dynamic Location Badge */}
                  <div className="flex items-center gap-1 px-2 py-2 bg-indigo-50 border border-indigo-100 rounded-lg shrink-0 max-w-[110px] overflow-hidden">
                    <MapPin size={10} className="text-indigo-500 shrink-0" />
                    <span className="text-[8px] font-black text-indigo-600 uppercase truncate">
                      {selectedBranchLocation}
                    </span>
                  </div>
               </div>
            </div>

            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Creator ID</label>
               <input type="number" name="createdBy" value={formData.createdBy} onChange={handleChange} required placeholder="00" className="w-full text-[10px] font-bold bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-100" />
            </div>

            <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="RECORD TITLE" className="w-full text-[10px] font-black uppercase bg-slate-50 border border-slate-200 p-2 rounded-lg" required />
            
            <div className="grid grid-cols-2 gap-2">
               <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="CODE" className="w-full text-[10px] bg-slate-50 border border-slate-200 p-2 rounded-lg" />
               <input type="text" name="recordType" value={formData.recordType} onChange={handleChange} placeholder="TYPE" className="w-full text-[10px] bg-slate-50 border border-slate-200 p-2 rounded-lg" />
            </div>

            <div className="grid grid-cols-2 gap-2">
               <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="CATEGORY" className="w-full text-[10px] bg-slate-50 border border-slate-200 p-2 rounded-lg" />
               <input type="text" name="subCategory" value={formData.subCategory} onChange={handleChange} placeholder="SUB-CAT" className="w-full text-[10px] bg-slate-50 border border-slate-200 p-2 rounded-lg" />
            </div>

            <textarea name="summary" value={formData.summary} onChange={handleChange} placeholder="BRIEF SUMMARY..." className="w-full text-[10px] bg-slate-50 border border-slate-200 p-2 rounded-lg h-16 outline-none" />

            <div className="grid grid-cols-2 gap-2">
               <select name="visibility" value={formData.visibility} onChange={handleChange} className="text-[9px] font-bold bg-slate-50 border border-slate-200 p-2 rounded-lg uppercase">
                  <option value="Internal">Internal</option>
                  <option value="Public">Public</option>
               </select>
               <select name="status" value={formData.status} onChange={handleChange} className="text-[9px] font-bold bg-slate-50 border border-slate-200 p-2 rounded-lg uppercase">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
               </select>
            </div>

            <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition transform active:scale-95">
              Submit Record
            </button>
          </form>
        </div>
      </div>

      {/* MAIN CONTENT: KNOWLEDGE LIST */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <BookOpen size={18} />
            </div>
            <div>
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight">Knowledge Management</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Central Intelligence Repository</p>
            </div>
          </div>

          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
            <input 
              type="text" placeholder="Search Repo..."
              className="w-full text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg pl-8 py-1.5 outline-none focus:ring-1 focus:ring-indigo-100"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-50/20 p-4">
          {loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Reference</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Classification</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">Control</th>
                    <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredKnowledge.length > 0 ? (
                    filteredKnowledge.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-[10px] font-black text-slate-800 uppercase leading-none mb-1">{item.title}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-[8px] font-bold text-indigo-500 bg-indigo-50 px-1.5 rounded uppercase">{item.code || 'NO-CODE'}</span>
                             <span className="text-[8px] font-bold text-slate-400 uppercase">ID: {item.id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                           <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-1.5">
                                <Tag size={10} className="text-slate-300"/>
                                <span className="text-[9px] font-bold text-slate-600 uppercase">{item.category}</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                <Layers size={10} className="text-slate-300"/>
                                <span className="text-[8px] font-medium text-slate-400 uppercase">{item.subCategory}</span>
                             </div>
                           </div>
                        </td>
                        <td className="px-4 py-3">
                           <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${
                                item.status === 'Active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}>{item.status}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${
                                item.approvalStatus === 'Active' || item.approvalStatus === 'Approved' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                              }`}>{item.approvalStatus}</span>
                           </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-20 text-center text-[9px] font-black text-slate-300 uppercase italic tracking-widest">Repository Empty</td>
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