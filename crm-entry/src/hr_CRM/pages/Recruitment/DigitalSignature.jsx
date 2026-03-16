import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
  getAllSignatures, 
  requestSignature, 
  deleteSignature,
  getSignatureHistory
} from "../../api/recruitment/hr.digitalSignature";
import { getAdminUsers } from "../../../api/admin/users.api";
import { onboardingApi } from "../../api/onboarding.api";
import { useRole } from "../../hooks/useRole";
import { jwtDecode } from "jwt-decode";
import { 
  Plus, Loader2, X, User, Search, 
  Trash2, FileText, Upload, Fingerprint, 
  ChevronRight, Check, FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function DigitalSignature() {
  const { isManager } = useRole();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // ✅ empsel Standardized States
  const [empSearchQuery, setEmpSearchQuery] = useState(""); 
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    employeeId: "", documentName: "", 
    documentType: "", remarks: "", documentFile: null
  });

  const auth = useMemo(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return { id: null, name: "User" };
      const decoded = jwtDecode(token);
      return { 
        id: Number(decoded.sub || decoded.id), 
        name: decoded.username || decoded.unique_name || "User" 
      };
    } catch { return { id: null, name: "User" }; }
  }, []);

  // ✅ empsel Hydration Logic (Combines Active + Onboarding)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, onboardRes] = await Promise.all([
        getAdminUsers({ page: 1, pageSize: 200 }),
        onboardingApi.getOnboardingList()
      ]);

      const activeUsers = (empRes?.users || empRes || []).map(u => ({
        userId: u.userId || u.id,
        username: u.username || u.name,
        type: 'Active'
      }));

      const onboardingUsers = (onboardRes?.data || onboardRes || []).map(u => ({
        userId: u.id,
        username: u.fullName,
        type: 'Onboarding'
      }));

      setEmployees([...activeUsers, ...onboardingUsers]);

      if (isManager) {
        const sigRes = await getAllSignatures();
        setRecords(Array.isArray(sigRes) ? sigRes : sigRes?.data || []);
      } else {
        const sigRes = await getSignatureHistory(auth.id);
        setRecords(Array.isArray(sigRes) ? sigRes : sigRes?.data || []);
      }
    } catch (err) {
      toast.error("Registry Sync Failure");
    } finally {
      setLoading(false);
    }
  }, [isManager, auth.id]);

  useEffect(() => { if(auth.id) fetchData(); }, [fetchData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ FIXED SEARCH LOGIC (Matches your Attendance/Personnel logic)
  const searchableEmployees = useMemo(() => {
    const query = empSearchQuery.toLowerCase().trim();
    if (!query) return []; // Removed the formData.employeeId check so search works after clearing

    return employees.filter(emp => {
      const nameMatch = (emp.username || "").toLowerCase().includes(query);
      const idMatch = (emp.userId || "").toString().includes(query);
      return nameMatch || idMatch;
    }).slice(0, 5);
  }, [employees, empSearchQuery]);

  const filteredRecords = useMemo(() => {
    return records.filter(item => {
      const emp = employees.find(e => e.userId === item.employeeId);
      const name = isManager ? (emp?.username || "Personnel") : auth.name;
      return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             item.documentName?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [records, employees, searchTerm, isManager, auth.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) return toast.error("Select signee first");
    if (!formData.documentFile) return toast.error("File required");

    const tid = toast.loading("Processing...");
    try {
      const data = new FormData();
      data.append("EmployeeId", formData.employeeId);
      data.append("RequestedBy", auth.id); 
      data.append("DocumentName", formData.documentName);
      data.append("DocumentType", formData.documentType);
      data.append("DocumentFile", formData.documentFile);
      data.append("Remarks", formData.remarks);

      await requestSignature(data);
      toast.success("Request Dispatched", { id: tid });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch { toast.error("Request Failed", { id: tid }); }
  };

  const resetForm = () => {
    setFormData({ employeeId: "", documentName: "", documentType: "", remarks: "", documentFile: null });
    setEmpSearchQuery("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Purge request?")) return;
    try { await deleteSignature(id); toast.success("Removed"); fetchData(); } 
    catch { toast.error("Failed"); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-slate-900 transition-all duration-300">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase">
            <Fingerprint size={22} className="text-blue-600" /> Signature Registry
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
            {isManager ? `Admin Registry | ${employees.length} Loaded` : "My Authentications"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isManager && (
            <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-lg hover:bg-blue-700 active:scale-95 flex items-center gap-2 transition-all">
              <Plus size={14} strokeWidth={3} /> New Request
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-auto">Document & Signee</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-48">Reference</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32">Date</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-28">Status</th>
              {isManager && <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-24">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map((item) => {
              const emp = employees.find(e => e.userId === item.employeeId);
              const staffName = isManager ? (emp?.username || "Personnel") : auth.name;
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-all">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 font-black text-[10px] uppercase">{staffName.charAt(0)}</div>
                      <div>
                        <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-1">{staffName}</p>
                        <p className="text-[9px] font-bold text-slate-400 tracking-tighter">ID: #{item.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <p className="text-[10px] font-black text-blue-500 uppercase">{item.documentName}</p>
                    <p className="text-[9px] text-slate-400 truncate italic">"{item.remarks || '---'}"</p>
                  </td>
                  <td className="px-5 py-4 text-center text-[10px] font-bold text-slate-600">{new Date(item.requestedDate || Date.now()).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-md border font-black uppercase text-[8px] ${item.status === 'Signed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{item.status || 'Pending'}</span>
                  </td>
                  {isManager && (
                    <td className="px-5 py-4 text-right">
                       <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-300 hover:text-rose-500"><Trash2 size={15}/></button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}
      </div>

      {/* empsel MODAL */}
      <AnimatePresence>
        {showModal && isManager && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
               <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center shrink-0">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Plus size={16} className="text-blue-600" /> Create Request</h3>
                  <button onClick={() => { setShowModal(false); resetForm(); }}><X size={18} className="text-slate-400 hover:text-rose-500"/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                  {/* ✅ empsel SEARCH INPUT */}
                  <div className="space-y-1 relative" ref={dropdownRef}>
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Assign to Personnel</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search Name or ID..." 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-50 transition-all" 
                        value={empSearchQuery} 
                        onFocus={() => setShowDropdown(true)}
                        onChange={(e) => { 
                          setEmpSearchQuery(e.target.value); 
                          setFormData(prev => ({...prev, employeeId: ""})); // Reset ID so user has to click dropdown
                          setShowDropdown(true); 
                        }} 
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                    </div>

                    <AnimatePresence>
                      {showDropdown && searchableEmployees.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="absolute z-[120] w-full mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                          {searchableEmployees.map(emp => (
                            <button key={`${emp.type}-${emp.userId}`} type="button" onClick={() => { 
                              setFormData({...formData, employeeId: emp.userId}); 
                              setEmpSearchQuery(emp.username); 
                              setShowDropdown(false); 
                            }} className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center justify-between border-b last:border-0 border-slate-50 transition-colors">
                              <div className="flex flex-col text-left">
                                <span className="text-[11px] font-black text-slate-700 uppercase">{emp.username}</span>
                                <span className={`text-[8px] font-bold uppercase tracking-tighter ${emp.type === 'Onboarding' ? 'text-indigo-500' : 'text-slate-400'}`}>
                                  {emp.type === 'Onboarding' ? 'New Hire (Onboarding)' : `Employee ID: #${emp.userId}`}
                                </span>
                              </div>
                              <ChevronRight size={12} className="text-slate-300" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {formData.employeeId && (
                      <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <Check size={14} className="text-emerald-500 font-bold"/>
                           <p className="text-[10px] font-black text-emerald-700 uppercase leading-none">Target Locked</p>
                         </div>
                         <span className="text-[10px] font-bold text-emerald-600">UID: {formData.employeeId}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Document Name</label><input required type="text" className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold" value={formData.documentName} onChange={e => setFormData({...formData, documentName: e.target.value})} /></div>
                    <div><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Doc Type</label><input required type="text" className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-[10px] font-bold" value={formData.documentType} onChange={e => setFormData({...formData, documentType: e.target.value})} /></div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Document Source</label>
                    <div className="relative group">
                       <input required type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={e => setFormData({...formData, documentFile: e.target.files[0]})} />
                       <div className="w-full px-4 py-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50 group-hover:bg-blue-50 transition-all">
                          <Upload size={24} className="text-slate-300 mb-2" />
                          <p className="text-[9px] font-black text-slate-400 uppercase">{formData.documentFile ? formData.documentFile.name : "Select Document"}</p>
                       </div>
                    </div>
                  </div>

                  <button type="submit" disabled={!formData.employeeId} className="w-full py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-2xl shadow-lg active:scale-95 disabled:opacity-30 transition-all">
                    Initiate Request
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}