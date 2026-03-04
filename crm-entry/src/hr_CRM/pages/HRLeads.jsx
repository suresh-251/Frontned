import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import useFacebookLeads from "../../socialCRM/hooks/useFacebookLeads";
import * as XLSX from "xlsx";
import { 
  Users, Download, CheckSquare, Eye, FileText, X, 
  MessageSquare, Layers, MousePointer2, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HRLeads() {
  const { user } = useAuth();
  const { leads, loading, reload, assignLead } = useFacebookLeads();

  const [remarkMap, setRemarkMap] = useState({});
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    reload({});
  }, []);

  const assignedLeads = leads.filter((l) => l.assignedToUserId && l.assignedToUserName);

  const filteredLeads = assignedLeads.filter(l => 
    l.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone?.includes(searchTerm)
  );

  const toggleLeadSelection = (id) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const exportToExcel = (mode) => {
    if (!assignedLeads.length) return;
    let exportLeads = mode === "selected" 
        ? assignedLeads.filter((l) => selectedLeadIds.includes(l.id)) 
        : assignedLeads;

    const rows = exportLeads.map((l) => ({
      Name: l.name || "",
      Email: l.email || "",
      Phone: l.phone || "",
      Status: l.status || "",
      AssignedTo: l.assignedToUserName || "",
      CreatedAt: new Date(l.createdAt).toLocaleString(),
      ...(l.fields || {}),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, `leads-${mode}.xlsx`);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white overflow-hidden relative">
      
      {/* COMPACT TOP-LEFT PAGE HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Users size={18} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-none">
                Leads Registry
              </h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Personnel Management
              </p>
            </div>
          </div>

          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={12} />
            <input 
              type="text" 
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-50 transition-all w-48"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
             <Layers size={12} className="text-slate-400" />
             <span className="text-[10px] font-black text-slate-700">{assignedLeads.length}</span>
          </div>

          <button 
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              if (isSelectMode) setSelectedLeadIds([]);
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
              isSelectMode 
              ? 'bg-rose-50 text-rose-600 border border-rose-200' 
              : 'bg-indigo-600 text-white shadow-md hover:bg-slate-900'
            }`}
          >
            {isSelectMode ? <X size={12} /> : <MousePointer2 size={12} />}
            {isSelectMode ? "Cancel" : "Select Mode"}
          </button>
        </div>
      </div>

      {/* ULTRA-SLIM TABLE SECTION */}
      <div className="flex-1 overflow-auto px-6 py-5 pb-24">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <AnimatePresence>
                  {isSelectMode && (
                    <motion.th 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 50, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="px-4 py-3 text-center overflow-hidden"
                    >
                      <CheckSquare size={12} className="mx-auto text-slate-300" />
                    </motion.th>
                  )}
                </AnimatePresence>
                <th className="w-[35%] px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Lead Identity</th>
                <th className="w-[30%] px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Contact Access</th>
                <th className="w-[25%] px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="w-[70px] px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">View</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-50">
              {filteredLeads.map((l) => (
                <tr key={l.id} className={`transition-colors group ${selectedLeadIds.includes(l.id) ? 'bg-indigo-50/40' : 'hover:bg-slate-50/30'}`}>
                  <AnimatePresence>
                    {isSelectMode && (
                      <motion.td 
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 50, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="px-4 py-2.5 text-center overflow-hidden"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.includes(l.id)}
                          onChange={() => toggleLeadSelection(l.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </motion.td>
                    )}
                  </AnimatePresence>
                  
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-[9px] uppercase">
                        {l.name?.charAt(0) || "L"}
                      </div>
                      <div className="truncate">
                        <p className="text-[11px] font-black text-slate-700 uppercase leading-none truncate">{l.name || "Unknown"}</p>
                        <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">REF: {String(l.id).slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-5 py-2.5 text-center">
                    <p className="text-[10px] font-bold text-slate-600 leading-none mb-0.5">{l.email || "---"}</p>
                    <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{l.phone || "---"}</p>
                  </td>

                  <td className="px-5 py-2.5">
                    <div className="flex items-center justify-between px-2 py-1 border border-slate-200 rounded bg-white w-24 mx-auto shadow-sm">
                      <span className="text-[8px] font-black text-slate-700 uppercase">{l.status || "New"}</span>
                      <div className={`w-1 h-1 rounded-full ${l.status === 'Qualified' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-blue-400'}`} />
                    </div>
                  </td>

                  <td className="px-5 py-2.5 text-right">
                    <button 
                      onClick={() => setSelectedLead(l)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 bg-white rounded-lg text-slate-300 hover:text-indigo-600 border border-slate-200 transition-all shadow-sm"
                    >
                      <Eye size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FLOATING ACTION BAR */}
      <AnimatePresence>
        {isSelectMode && selectedLeadIds.length > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 border border-slate-700 z-40"
          >
            <div className="border-r border-slate-700 pr-6">
                <span className="text-[9px] font-black text-white uppercase tracking-widest">{selectedLeadIds.length} Selected</span>
            </div>
            <button 
              onClick={() => exportToExcel("selected")}
              className="px-4 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-500 transition-all flex items-center gap-2"
            >
              <Download size={12} /> Export
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ULTRA COMPACT LEAD CARD MODAL */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]" onClick={() => setSelectedLead(null)}>
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} 
              className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-indigo-600" />
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Lead Profile</h3>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-1 hover:bg-white rounded text-slate-400 hover:text-rose-500 border border-transparent hover:border-slate-100 transition-all">
                  <X size={16}/>
                </button>
              </div>

              <div className="p-5">
                {/* 2-COLUMN GRID FOR COMPACTNESS */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {selectedLead.fields && Object.entries(selectedLead.fields).map(([k, v]) => (
                    <div key={k} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">{k.replace(/_/g, " ")}</p>
                      <p className="text-[10px] font-bold text-slate-700 uppercase truncate">{v || "---"}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-50">
                  <label className="text-[8px] font-black text-indigo-500 uppercase ml-1 tracking-widest flex items-center gap-1">
                    <MessageSquare size={10} /> Internal Remark
                  </label>
                  <input
                    type="text"
                    placeholder="Enter notes..."
                    value={remarkMap[selectedLead.id] ?? selectedLead.remark ?? ""}
                    onChange={(e) => setRemarkMap((prev) => ({ ...prev, [selectedLead.id]: e.target.value }))}
                    onBlur={() => assignLead(selectedLead.id, selectedLead.assignedToUserId, selectedLead.assignedToUserName, remarkMap[selectedLead.id])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-300 transition-all"
                  />
                </div>

                <button onClick={() => setSelectedLead(null)} className="w-full mt-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase rounded-lg hover:bg-indigo-600 transition-all tracking-widest">
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}