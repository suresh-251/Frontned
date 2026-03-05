
import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  getAllOvertimeApprovals, 
  createOvertimeApproval, 
  updateOvertimeApproval 
} from "../../api/overtimeApproval.api";
import { getAdminUsers } from "../../../api/admin/users.api";
import { 
  Clock, Plus, Loader2, X, CheckCircle2, XCircle, 
  User, Search, ArrowRight, Check, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

export default function OvertimeApproval() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Set initial filter to "pending" as requested
  const [filter, setFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [empSearch, setEmpSearch] = useState("");
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    userId: "",
    validFrom: "",
    validTo: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [otRes, empRes] = await Promise.all([
        getAllOvertimeApprovals(),
        getAdminUsers({ page: 1, pageSize: 500 })
      ]);
      setRecords(Array.isArray(otRes) ? otRes : []);
      setEmployees(empRes?.users || []);
    } catch (err) {
      toast.error("Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowEmpDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEmployees = useMemo(() => {
    if (!empSearch) return [];
    return employees.filter(emp => 
      emp.username?.toLowerCase().includes(empSearch.toLowerCase()) || 
      emp.userId?.toString().includes(empSearch)
    ).slice(0, 5);
  }, [empSearch, employees]);

  const selectedEmployee = useMemo(() => {
    return employees.find(emp => emp.userId.toString() === formData.userId.toString());
  }, [formData.userId, employees]);

  // Combined Filter Logic: Search + Status Filter
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const empData = employees.find(e => e.userId?.toString() === r.userId?.toString());
      const name = r.userName || empData?.username || "";
      
      const matchesSearch = r.userId?.toString().includes(searchTerm) || 
                            name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      // Status Filter Logic
      if (filter === "pending") return !r.isApproved;
      if (filter === "approved") return r.isApproved;
      if (filter === "rejected") return r.status === "Rejected"; // Assuming API has a status string for rejection
      return true; // "all"
    });
  }, [records, employees, searchTerm, filter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) {
      toast.error("Please select a valid employee");
      return;
    }
    const tid = toast.loading("Submitting...");
    try {
      await createOvertimeApproval({
        ...formData,
        validFrom: new Date(formData.validFrom).toISOString(),
        validTo: new Date(formData.validTo).toISOString()
      });
      toast.success("Request Logged", { id: tid });
      closeModal();
      fetchData();
    } catch (err) {
      toast.error("Submission failed", { id: tid });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ userId: "", validFrom: "", validTo: "" });
    setEmpSearch("");
  };

  const handleStatusUpdate = async (record, isApproved) => {
    const tid = toast.loading("Updating...");
    try {
      await updateOvertimeApproval(record.overtimeApprovalId || record.id, {
        validFrom: record.validFrom,
        validTo: record.validTo,
        isApproved: isApproved
      });
      toast.success(isApproved ? "Approved" : "Rejected", { id: tid });
      fetchData();
    } catch (err) {
      toast.error("Update failed", { id: tid });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-2 font-sans">
      <Toaster position="top-right" />

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Clock size={22} className="text-indigo-600" /> Overtime Registry
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Employee Authorizations</p>
        </div>

        <div className="flex items-center gap-2">
          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" placeholder="Search..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 w-40 outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
            />
          </div>

          {/* STATUS FILTERS (Budget Registry Style) */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {["pending", "approved", "rejected", "all"].map((t) => (
              <button
                key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${
                  filter === t ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus size={14} strokeWidth={3} /> Log Request
          </button>
        </div>
      </div>

      {/* TABLE SECTION */}
      {loading && records.length === 0 ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={24} /></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-24">ID</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-auto">Employee</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-64">Timeframe</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-28">Status</th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => {
                const empData = employees.find(e => e.userId?.toString() === record.userId?.toString());
                const displayName = record.userName || empData?.username || "Unknown User";

                return (
                  <tr key={record.overtimeApprovalId || record.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 uppercase">
                        #{record.userId}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black ${record.isApproved ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col truncate">
                          <p className="text-[12px] font-black text-slate-700 uppercase leading-none truncate">{displayName}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Authorized Log</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                        <div className="flex flex-col min-w-[80px]">
                           <span className="text-[8px] font-black text-slate-300 uppercase leading-none mb-0.5">From</span>
                           <span>{new Date(record.validFrom).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <ArrowRight size={10} className="text-indigo-400 shrink-0" />
                        <div className="flex flex-col min-w-[80px]">
                           <span className="text-[8px] font-black text-slate-300 uppercase leading-none mb-0.5">To</span>
                           <span>{new Date(record.validTo).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md border font-black uppercase text-[9px] ${
                        record.isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {record.isApproved ? "Approved" : "Pending"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                       {/* Icons are now directly visible (no opacity-0) */}
                       <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => handleStatusUpdate(record, true)} 
                          disabled={record.isApproved} 
                          className={`p-1.5 rounded-md border transition-all ${record.isApproved ? 'bg-slate-50 text-slate-100 border-slate-50 cursor-not-allowed' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'}`}
                        >
                          <CheckCircle2 size={14}/>
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(record, false)} 
                          className="p-1.5 bg-rose-50 text-rose-400 border border-rose-100 hover:bg-rose-500 hover:text-white rounded-md transition-all"
                        >
                          <XCircle size={14}/>
                        </button>
                        <button 
                          onClick={() => {/* Add delete logic if API exists */}}
                          className="p-1.5 bg-slate-50 text-slate-400 border border-slate-100 hover:bg-red-500 hover:text-white rounded-md transition-all"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL - SAME LOGIC AS BEFORE */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
               <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-indigo-600" />
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Log Overtime</h3>
                  </div>
                  <button onClick={closeModal} className="p-1.5 hover:bg-white rounded-full text-slate-400 hover:text-red-500 transition-colors"><X size={16}/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div className="space-y-1 relative" ref={dropdownRef}>
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Search Employee</label>
                    <div className="relative">
                      <input 
                        type="text" placeholder="Type name or ID..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-50 transition-all"
                        value={empSearch}
                        onFocus={() => setShowEmpDropdown(true)}
                        onChange={(e) => {
                          setEmpSearch(e.target.value);
                          setShowEmpDropdown(true);
                          if(formData.userId) setFormData({...formData, userId: ""});
                        }}
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={12}/>
                    </div>

                    <AnimatePresence>
                      {showEmpDropdown && filteredEmployees.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-50 w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                          {filteredEmployees.map(emp => (
                            <button key={emp.userId} type="button"
                              onClick={() => {
                                setFormData({...formData, userId: emp.userId.toString()});
                                setEmpSearch(emp.username);
                                setShowEmpDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-indigo-50 flex items-center justify-between transition-colors"
                            >
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-700 uppercase">{emp.username}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase">ID: {emp.userId}</span>
                              </div>
                              {formData.userId === emp.userId.toString() && <Check size={12} className="text-indigo-600" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Starts</label>
                      <input required type="datetime-local" className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-50" value={formData.validFrom} onChange={(e) => setFormData({...formData, validFrom: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Ends</label>
                      <input required type="datetime-local" className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-50" value={formData.validTo} onChange={(e) => setFormData({...formData, validTo: e.target.value})} />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button type="submit" disabled={!selectedEmployee} className="w-full py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50">Confirm Log</button>
                    <button type="button" onClick={closeModal} className="w-full py-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Discard</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}