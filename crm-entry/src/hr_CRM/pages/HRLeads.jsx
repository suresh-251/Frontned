import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import useFacebookLeads from "../../socialCRM/hooks/useFacebookLeads";
import * as XLSX from "xlsx";
import { 
  Users, Download, CheckSquare, Eye, FileText, X, 
  MessageSquare, Layers, MousePointer2, Search, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

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

  /**
   * UPDATED LOGIC: 
   * Strict filter to show only leads where assignedToUserId matches the logged-in user.
   * Checks for user.id, user.userId, or user.sub (standard JWT claim)
   */
  const myUserId = user?.id || user?.userId || user?.sub || user?.uid;
  
  const assignedToMe = leads.filter((l) => 
    l.assignedToUserId && String(l.assignedToUserId) === String(myUserId)
  );

  const filteredLeads = assignedToMe.filter(l => 
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
    if (!assignedToMe.length) return;
    let exportLeads = mode === "selected" 
        ? assignedToMe.filter((l) => selectedLeadIds.includes(l.id)) 
        : assignedToMe;

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
    XLSX.writeFile(workbook, `my-leads-${mode}.xlsx`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
      <Toaster position="top-right" />
      
      {/* TOPLOOK HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Users size={22} className="text-indigo-600" /> My Pipeline
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Assigned Lead Management</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search my leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-56 outline-none focus:ring-2 focus:ring-indigo-50"
            />
          </div>

          <button 
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              if (isSelectMode) setSelectedLeadIds([]);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              isSelectMode 
              ? 'bg-rose-50 text-rose-600 border border-rose-200' 
              : 'bg-slate-900 text-white shadow-sm hover:bg-slate-800'
            }`}
          >
            {isSelectMode ? <X size={14} /> : <MousePointer2 size={14} />}
            {isSelectMode ? "Cancel" : "Select Mode"}
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <AnimatePresence>
                {isSelectMode && (
                  <motion.th 
                    initial={{ width: 0 }} animate={{ width: 50 }} exit={{ width: 0 }}
                    className="px-4 py-3 text-center overflow-hidden"
                  >
                    <CheckSquare size={12} className="mx-auto text-slate-400" />
                  </motion.th>
                )}
              </AnimatePresence>
              <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead / Source</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Contact Info</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">View</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100">
            {filteredLeads.map((l) => (
              <tr key={l.id} className={`transition-all ${selectedLeadIds.includes(l.id) ? 'bg-indigo-50/40' : 'hover:bg-slate-50/50'}`}>
                <AnimatePresence>
                  {isSelectMode && (
                    <motion.td initial={{ width: 0 }} animate={{ width: 50 }} exit={{ width: 0 }} className="px-4 py-4 text-center overflow-hidden border-r border-slate-100">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(l.id)}
                        onChange={() => toggleLeadSelection(l.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </motion.td>
                  )}
                </AnimatePresence>
                
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-[10px] border border-indigo-100 uppercase">
                      {l.name?.charAt(0) || "L"}
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-slate-800 uppercase leading-tight mb-0.5">{l.name || "Unknown"}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-slate-400">REF: {String(l.id).slice(-6)}</span>
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-5 py-3.5 text-center">
                  <p className="text-[11px] font-bold text-slate-600 mb-0.5">{l.email || "---"}</p>
                  <p className="text-[9px] font-black text-indigo-500 tracking-widest uppercase">{l.phone || "---"}</p>
                </td>

                <td className="px-5 py-3.5 text-center">
                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md border ${
                    l.status === 'Qualified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {l.status || "Lead"}
                  </span>
                </td>

                <td className="px-5 py-3.5 text-right">
                  <button 
                    onClick={() => setSelectedLead(l)}
                    className="p-1.5 bg-slate-50 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-200"
                  >
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FLOATING ACTION BAR */}
      <AnimatePresence>
        {isSelectMode && selectedLeadIds.length > 0 && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-6 border border-slate-700 z-40"
          >
            <span className="text-[10px] font-black text-white uppercase tracking-widest border-r border-slate-700 pr-6">{selectedLeadIds.length} Selected</span>
            <button 
              onClick={() => exportToExcel("selected")}
              className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-500 transition-all flex items-center gap-2"
            >
              <Download size={12} /> Export Excel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL VIEW */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-indigo-600" />
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Lead Profile</h3>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-all">
                  <X size={16}/>
                </button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {selectedLead.fields && Object.entries(selectedLead.fields).map(([k, v]) => (
                    <div key={k} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">{k.replace(/_/g, " ")}</p>
                      <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight truncate">{v || "---"}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100">
                  <label className="text-[9px] font-black text-indigo-600 uppercase ml-1 tracking-widest flex items-center gap-1">
                    <MessageSquare size={12} /> Internal Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="Type notes and press enter..."
                    value={remarkMap[selectedLead.id] ?? selectedLead.remark ?? ""}
                    onChange={(e) => setRemarkMap((prev) => ({ ...prev, [selectedLead.id]: e.target.value }))}
                    onBlur={() => assignLead(selectedLead.id, selectedLead.assignedToUserId, selectedLead.assignedToUserName, remarkMap[selectedLead.id])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
                  />
                </div>

                <button onClick={() => setSelectedLead(null)} className="w-full mt-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-600 transition-all tracking-widest shadow-md">
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