import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
  getAllTrainings, 
  assignTraining, 
  updateTrainingStatus, 
  deleteTraining,
  getTrainingByEmployee
} from "../../api/recruitment/hr.employeeTraining";
import { getAdminUsers } from "../../../api/admin/users.api";
import { onboardingApi } from "../../api/onboarding.api";
import { useRole } from "../../hooks/useRole";
import { jwtDecode } from "jwt-decode";
import { 
  ShieldCheck, Plus, Loader2, X, User, Search, 
  Trash2, BookOpen, CheckCircle2, Award, 
  ShieldAlert, ChevronRight, Check, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function EmployeeTraining() {
  const { isManager } = useRole();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]); // Combined Selection Pool
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  
  // empsel Logic States
  const [empSearchQuery, setEmpSearchQuery] = useState(""); 
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    employeeId: "", trainingName: "", description: "", isMandatory: false
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

  // empsel: Data Hydration (Combining Active + Onboarding)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch both data sources
      const [empRes, onboardRes] = await Promise.all([
        getAdminUsers({ page: 1, pageSize: 200 }),
        onboardingApi.getOnboardingList()
      ]);

      // 2. Format Active Employees
      const activeUsers = (empRes?.users || empRes || []).map(u => ({
        userId: u.userId || u.id,
        username: u.username || u.name,
        type: 'Active'
      }));

      // 3. Format Onboarding Hires
      const onboardingUsers = (onboardRes?.data || onboardRes || []).map(u => ({
        userId: u.id, // Maps onboarding ID to employeeId for the POST
        username: u.fullName,
        type: 'Onboarding'
      }));

      // 4. Combine for selection
      setEmployees([...activeUsers, ...onboardingUsers]);

      // 5. Load Registry Records
      if (isManager) {
        const trainRes = await getAllTrainings();
        setRecords(Array.isArray(trainRes) ? trainRes : trainRes?.data || []);
      } else {
        const trainRes = await getTrainingByEmployee(auth.id);
        setRecords(Array.isArray(trainRes) ? trainRes : trainRes?.data || []);
      }
    } catch (err) {
      toast.error("Registry Sync Error");
    } finally {
      setLoading(false);
    }
  }, [isManager, auth.id]);

  useEffect(() => { if(auth.id) fetchData(); }, [fetchData]);

  // empsel: Dropdown Click-Outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // empsel: Filter Selection Pool
  const searchableEmployees = useMemo(() => {
    const query = empSearchQuery.toLowerCase().trim();
    if (!query || formData.employeeId) return [];
    return employees.filter(emp => 
      (emp.username || "").toLowerCase().includes(query) || 
      (emp.userId || "").toString().includes(query)
    ).slice(0, 5);
  }, [employees, empSearchQuery, formData.employeeId]);

  const filteredRecords = useMemo(() => {
    return records.filter(item => {
      const emp = employees.find(e => e.userId === item.employeeId);
      const name = isManager ? (emp?.username || "Personnel") : auth.name;
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.trainingName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      if (filter === "Mandatory") return item.isMandatory;
      if (filter === "Completed") return item.status === "Completed";
      return true;
    });
  }, [records, employees, searchTerm, filter, isManager, auth.name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) return toast.error("Select personnel first");
    const tid = toast.loading("Processing...");
    try {
      await assignTraining({
        ...formData,
        employeeId: Number(formData.employeeId)
      });
      toast.success("Training Assigned", { id: tid });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error("Assignment Failed", { id: tid });
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateTrainingStatus(id, status);
      toast.success(`Updated to ${status}`);
      fetchData();
    } catch { toast.error("Update Blocked"); }
  };

  const resetForm = () => {
    setFormData({ employeeId: "", trainingName: "", description: "", isMandatory: false });
    setEmpSearchQuery("");
  };

  const getSelectedEmployeeName = () => {
    const emp = employees.find(e => e.userId == formData.employeeId);
    return emp?.username || 'Selected User';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans text-slate-900 transition-all duration-300">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 uppercase">
            <ShieldCheck size={22} className="text-emerald-600" /> Compliance Training
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
            {isManager ? "Administrative Oversight" : "Personal Training Registry"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isManager && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="text" placeholder="Filter List..." onChange={(e) => setSearchTerm(e.target.value)} className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-44 outline-none focus:ring-2 focus:ring-emerald-50" />
              </div>
              <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95">
                <Plus size={14} strokeWidth={3} /> Assign New
              </button>
            </>
          )}
        </div>
      </div>

      {/* REGISTRY TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-auto">Personnel & Module</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-72 text-center">Overview</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32">Priority</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-28">Status</th>
              {isManager && <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-24">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map((item) => {
              const emp = employees.find(e => e.userId === item.employeeId);
              const staffName = isManager ? (emp?.username || "Personnel") : auth.name;
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 font-black text-[10px] uppercase">
                        {staffName.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="text-[12px] font-black text-slate-700 uppercase leading-none mb-1">{item.trainingName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                           <User size={10}/> {staffName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center text-[11px] font-medium text-slate-500 italic truncate">"{item.description}"</td>
                  <td className="px-5 py-4 text-center">
                    {item.isMandatory ? (
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[8px] font-black uppercase tracking-tighter"><ShieldAlert size={10}/> Mandatory</span>
                    ) : (
                       <span className="text-[8px] font-black text-slate-300 uppercase">Elective</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-md border font-black uppercase text-[8px] ${item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{item.status || 'Pending'}</span>
                  </td>
                  {isManager && (
                    <td className="px-5 py-4 text-right">
                       <button onClick={async () => { if(confirm("Purge?")) { await deleteTraining(item.id); fetchData(); } }} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={15}/></button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>}
      </div>

      {/* empsel MODAL */}
      <AnimatePresence>
        {showModal && isManager && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
               <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-emerald-600" />
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Assign Training Module</h3>
                  </div>
                  <button onClick={() => { setShowModal(false); resetForm(); }}><X size={18} className="text-slate-400 hover:text-rose-500"/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                  {/* Selection logic including Onboarding hires */}
                  <div className="space-y-1 relative" ref={dropdownRef}>
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Search Active or New Hires</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Name or ID..." 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-emerald-50 transition-all" 
                        value={empSearchQuery} 
                        onFocus={() => setShowDropdown(true)}
                        onChange={(e) => { 
                          setEmpSearchQuery(e.target.value); 
                          setFormData(prev => ({...prev, employeeId: ""}));
                          setShowDropdown(true); 
                        }} 
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
                    </div>

                    <AnimatePresence>
                      {showDropdown && searchableEmployees.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute z-[120] w-full mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                          {searchableEmployees.map(emp => (
                            <button key={`${emp.type}-${emp.userId}`} type="button" onClick={() => { 
                              setFormData({...formData, employeeId: emp.userId}); 
                              setEmpSearchQuery(emp.username); 
                              setShowDropdown(false); 
                            }} className="w-full px-4 py-3 text-left hover:bg-emerald-50 flex items-center justify-between border-b last:border-0 border-slate-50 transition-colors">
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
                           <p className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter leading-none">Target Locked</p>
                         </div>
                         <span className="text-[10px] font-bold text-emerald-600">UID: {formData.employeeId}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Training Module Title</label>
                    <input required type="text" placeholder="e.g. Data Protection Act 2026" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-emerald-50" value={formData.trainingName} onChange={e => setFormData({...formData, trainingName: e.target.value})} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Requirement Description</label>
                    <textarea required rows="2" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none resize-none focus:ring-2 focus:ring-emerald-50" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={14} className="text-rose-500" />
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">Required Certification</span>
                    </div>
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-600 accent-emerald-500 cursor-pointer" checked={formData.isMandatory} onChange={e => setFormData({...formData, isMandatory: e.target.checked})} />
                  </div>

                  <button type="submit" disabled={!formData.employeeId} className="w-full py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl shadow-lg active:scale-95 disabled:opacity-30 transition-all shrink-0">
                    Assign Training Track
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}